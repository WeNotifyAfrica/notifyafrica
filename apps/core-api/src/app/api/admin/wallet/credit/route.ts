import { getSessionFromRequest, requireInternalRole } from "@/lib/session";
import { creditWallet, ensureWallet, getWallet, toMinorUnits } from "@/lib/wallet";
import { recordAudit } from "@/lib/audit";
import { walletJson } from "@/lib/serialize";
import { prisma } from "@/lib/db";
import { walletCreditSchema } from "@notifyafrica/validation";

/**
 * Manual wallet credit (02_Specifications_Backoffice §15) — stands in for a
 * real payment gateway topup until one is wired (04_Prompt §16). Requires a
 * reason and is fully audited, same as any other sensitive wallet action.
 */
export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = walletCreditSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const organization = await prisma.organization.findUnique({ where: { id: input.organizationId } });
  if (!organization) {
    return Response.json({ error: "organization_not_found" }, { status: 404 });
  }

  await ensureWallet(organization.id, organization.currency);
  const before = await getWallet(organization.id);
  const amountMinor = await toMinorUnits(input.amount, organization.currency);
  const wallet = await creditWallet(organization.id, amountMinor, input.reason);

  await recordAudit({
    actorUserId: session.sub,
    action: "wallet.credit_manual",
    resource: "wallet",
    resourceId: wallet.id,
    before: before ? walletJson(before) : null,
    after: walletJson(wallet),
    reason: input.reason,
  });

  return Response.json({ wallet: walletJson(wallet) });
}
