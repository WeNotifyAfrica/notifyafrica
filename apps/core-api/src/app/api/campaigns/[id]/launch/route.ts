import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { holdFunds, InsufficientBalanceError, toMinorUnits } from "@/lib/wallet";
import { enqueueCampaignJob } from "@/lib/queue";
import { campaignJson } from "@/lib/serialize";

/**
 * Campaign "Reserve Funds -> Run" step (03_Specifications_Console §12).
 * Holds funds for the ENTIRE estimated audience up front, creates a
 * PENDING Transaction representing that hold, flips the campaign to
 * QUEUED, and enqueues the Worker job — then returns immediately. The
 * actual sending happens in the background
 * (apps/worker/src/processors/campaign.ts), which is the whole point:
 * the frontend must never block on a long-running campaign (04_Prompt §21).
 */
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
  if (campaign.status !== "DRAFT") {
    return Response.json({ error: "not_launchable" }, { status: 409 });
  }
  if (campaign.unitPrice === null || campaign.currency === null || campaign.estimatedTotal === null) {
    return Response.json({ error: "estimate_required" }, { status: 422 });
  }

  const amountMinor = await toMinorUnits(Number(campaign.estimatedTotal), campaign.currency);

  try {
    await holdFunds(session.organizationId, amountMinor, `Campaign ${campaign.id} reserve`);
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      return Response.json({ error: "insufficient_balance" }, { status: 402 });
    }
    throw err;
  }

  const transaction = await prisma.transaction.create({
    data: {
      organizationId: session.organizationId,
      projectId: campaign.projectId,
      type: "CAMPAIGN_SEND",
      amountMinor,
      currency: campaign.currency,
      pricingSnapshot: {
        unitPrice: Number(campaign.unitPrice),
        quantity: campaign.destinations.length,
        estimatedTotal: Number(campaign.estimatedTotal),
        capturedAt: new Date().toISOString(),
      },
      status: "PENDING",
      idempotencyKey: randomUUID(),
    },
  });

  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      status: "QUEUED",
      heldAmountMinor: amountMinor,
      transactionId: transaction.id,
    },
  });

  await enqueueCampaignJob(campaign.id);

  return Response.json({ campaign: campaignJson(updated) });
}
