import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";
import { creditWallet } from "@/lib/wallet";
import { recordAudit } from "@/lib/audit";
import { walletJson, transactionJson } from "@/lib/serialize";

/**
 * Confirms a non-instant payment method's transaction (bank transfer,
 * monthly invoicing) once the funds are actually seen — this is the step
 * that credits the wallet for those methods, since /api/wallet/topup
 * deliberately left it at PENDING.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  if (transaction.type !== "WALLET_TOPUP" || transaction.status !== "PENDING") {
    return Response.json({ error: "not_confirmable" }, { status: 409 });
  }

  const wallet = await creditWallet(
    transaction.organizationId,
    transaction.amountMinor,
    `Recharge confirmée (transaction ${transaction.id})`,
  );

  const updated = await prisma.transaction.update({
    where: { id },
    data: { status: "CAPTURED" },
  });

  await recordAudit({
    actorUserId: session.sub,
    action: "transaction.confirm",
    resource: "transaction",
    resourceId: id,
    before: { status: "PENDING" },
    after: { status: "CAPTURED" },
    reason: "Manual confirmation of a non-instant payment method",
  });

  return Response.json({ transaction: transactionJson(updated), wallet: walletJson(wallet) });
}
