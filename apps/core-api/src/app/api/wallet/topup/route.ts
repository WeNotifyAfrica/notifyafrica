import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { creditWallet, ensureWallet, toMinorUnits } from "@/lib/wallet";
import { chargeViaMockPaymentProvider } from "@/lib/providers/mock-payment";
import { recordAudit } from "@/lib/audit";
import { walletTopupSchema } from "@notifyafrica/validation";
import { walletJson, transactionJson } from "@/lib/serialize";

/**
 * Self-service recharge (03_Specifications_Console §9). Until now, only
 * Admin could credit a wallet (manual topup) — this is the actual customer
 * flow: `Recharge -> Wallet -> ...` from 00_Contexte_Global §10.
 *
 * Instant methods (Mobile Money, card) credit the wallet immediately.
 * Non-instant ones (bank transfer, monthly invoicing — "24 à 48 h" per the
 * design mockup) leave the Transaction at PENDING; Admin confirms receipt
 * via POST /api/admin/transactions/:id/confirm, which is what actually
 * credits the wallet.
 */
export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = walletTopupSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const [organization, method] = await Promise.all([
    prisma.organization.findUnique({ where: { id: session.organizationId } }),
    prisma.paymentMethod.findFirst({ where: { id: input.paymentMethodId, status: "ACTIVE" } }),
  ]);
  if (!organization || !method) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  if (method.countries.length > 0 && !method.countries.includes(organization.country)) {
    return Response.json({ error: "payment_method_not_eligible" }, { status: 422 });
  }
  if (method.minAmount !== null && input.amount < Number(method.minAmount)) {
    return Response.json({ error: "amount_below_minimum", minAmount: Number(method.minAmount) }, { status: 422 });
  }
  if (method.maxAmount !== null && input.amount > Number(method.maxAmount)) {
    return Response.json({ error: "amount_above_maximum", maxAmount: Number(method.maxAmount) }, { status: 422 });
  }

  await ensureWallet(organization.id, organization.currency);
  const amountMinor = await toMinorUnits(input.amount, organization.currency);
  const feeAmount = input.amount * (Number(method.feePercent) / 100);

  const chargeStatus = await chargeViaMockPaymentProvider({
    paymentMethodId: method.id,
    amount: input.amount,
    currency: organization.currency,
  });
  if (chargeStatus === "FAILED") {
    return Response.json({ error: "payment_failed" }, { status: 502 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      organizationId: organization.id,
      type: "WALLET_TOPUP",
      amountMinor,
      currency: organization.currency,
      // Reusing the generic `pricingSnapshot` field for topup context —
      // there's no pricing rule involved, just the payment method/fee
      // details worth freezing onto the record.
      pricingSnapshot: {
        paymentMethodId: method.id,
        paymentMethodName: method.name,
        family: method.family,
        feePercent: Number(method.feePercent),
        feeAmount,
        capturedAt: new Date().toISOString(),
      },
      status: method.instant ? "CAPTURED" : "PENDING",
      idempotencyKey: randomUUID(),
    },
  });

  let wallet = null;
  if (method.instant) {
    wallet = await creditWallet(organization.id, amountMinor, `Recharge via ${method.name}`);
  }

  await recordAudit({
    actorUserId: session.sub,
    action: "wallet.topup_request",
    resource: "transaction",
    resourceId: transaction.id,
    after: { amount: input.amount, method: method.name, status: transaction.status },
  });

  return Response.json({
    transaction: transactionJson(transaction),
    wallet: wallet ? walletJson(wallet) : null,
  });
}
