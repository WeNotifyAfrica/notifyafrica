import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { releaseFunds } from "@/lib/wallet";
import { campaignJson } from "@/lib/serialize";

/** Cancelling before the Worker has started running releases any held
 * funds. Once RUNNING, cancellation isn't supported yet (the send loop
 * doesn't check for it mid-batch) — a documented gap, not silently
 * dropped. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!campaign) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  if (!["DRAFT", "SCHEDULED", "QUEUED"].includes(campaign.status)) {
    return Response.json({ error: "not_cancellable" }, { status: 409 });
  }

  if (campaign.heldAmountMinor && campaign.heldAmountMinor > 0n) {
    await releaseFunds(session.organizationId, campaign.heldAmountMinor, `Campaign ${campaign.id} cancelled`);
  }
  if (campaign.transactionId) {
    await prisma.transaction.update({
      where: { id: campaign.transactionId },
      data: { status: "CANCELLED" },
    });
  }

  const updated = await prisma.campaign.update({ where: { id }, data: { status: "CANCELLED" } });
  return Response.json({ campaign: campaignJson(updated) });
}
