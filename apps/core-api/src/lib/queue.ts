import { Queue } from "bullmq";
import IORedis from "ioredis";
import { QUEUE_CAMPAIGNS, type CampaignJobData } from "@notifyafrica/queue";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const campaignsQueue = new Queue<CampaignJobData>(QUEUE_CAMPAIGNS, { connection });

/** Enqueues a campaign for the Worker to send — the launch route returns as
 * soon as this resolves, never waiting for the send loop itself
 * (04_Prompt §21). */
export async function enqueueCampaignJob(campaignId: string): Promise<void> {
  await campaignsQueue.add("send", { campaignId });
}
