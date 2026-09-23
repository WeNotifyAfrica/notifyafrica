import { prisma, captureFunds, releaseFunds, toMinorUnits, sendViaMockProvider } from "@notifyafrica/domain";
import { logger } from "@notifyafrica/observability";

/**
 * Campaign send loop (03_Specifications_Console §12: ... -> Reserve Funds
 * -> Run -> Report). Core API's launch route already held funds for the
 * whole estimated audience and left the Campaign at QUEUED with a PENDING
 * Transaction — this is the "Run -> Report" half: send each destination,
 * then true up the wallet to what was actually spent (capture the real
 * total, release whatever of the hold wasn't used) and finalize the
 * Transaction and Campaign status.
 */
export async function processCampaign(campaignId: string): Promise<void> {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) {
    logger.warn("campaign.not_found", { campaignId });
    return;
  }
  if (campaign.status === "CANCELLED") {
    logger.info("campaign.skipped_cancelled", { campaignId });
    return;
  }

  await prisma.campaign.update({ where: { id: campaignId }, data: { status: "RUNNING" } });

  let sentCount = 0;
  let failedCount = 0;

  for (const destination of campaign.destinations) {
    const result = await sendViaMockProvider({ destination, content: campaign.content });
    await prisma.message.create({
      data: {
        organizationId: campaign.organizationId,
        projectId: campaign.projectId,
        product: campaign.product,
        senderId: campaign.senderId,
        destination,
        content: campaign.content,
        status: result === "SENT" ? "SENT" : "FAILED",
        pricingSnapshot: {
          unitPrice: campaign.unitPrice ? Number(campaign.unitPrice) : 0,
          currency: campaign.currency,
          campaignId: campaign.id,
        },
        campaignId: campaign.id,
      },
    });
    if (result === "SENT") sentCount += 1;
    else failedCount += 1;
  }

  const unitPrice = campaign.unitPrice ? Number(campaign.unitPrice) : 0;
  const currency = campaign.currency ?? "XOF";
  const actualAmountMinor = await toMinorUnits(unitPrice * sentCount, currency);
  const heldAmountMinor = campaign.heldAmountMinor ?? 0n;

  if (actualAmountMinor > 0n) {
    await captureFunds(campaign.organizationId, actualAmountMinor, `Campaign ${campaign.id} capture`);
  }
  const unusedHold = heldAmountMinor - actualAmountMinor;
  if (unusedHold > 0n) {
    await releaseFunds(campaign.organizationId, unusedHold, `Campaign ${campaign.id} unused hold release`);
  }

  if (campaign.transactionId) {
    await prisma.transaction.update({
      where: { id: campaign.transactionId },
      data: {
        amountMinor: actualAmountMinor,
        status: sentCount > 0 ? "CAPTURED" : "FAILED",
      },
    });
  }

  const finalStatus = sentCount === 0 ? "FAILED" : failedCount === 0 ? "COMPLETED" : "PARTIAL";

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: finalStatus,
      sentCount,
      failedCount,
      totalCount: campaign.destinations.length,
    },
  });

  logger.info("campaign.completed", { campaignId, sentCount, failedCount, status: finalStatus });
}
