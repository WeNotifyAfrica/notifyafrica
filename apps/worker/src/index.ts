import { Worker } from "bullmq";
import IORedis from "ioredis";
import { logger } from "@notifyafrica/observability";
import { QUEUE_CAMPAIGNS, QUEUE_PROVIDER_CALLBACKS, type CampaignJobData } from "@notifyafrica/queue";
import { processCampaign } from "./processors/campaign";

/**
 * Worker (04_Prompt §21, 00_Contexte_Global §3.5): campaigns must not block
 * an HTTP request, so Core API only enqueues here — this process does the
 * actual sending. QUEUE_PROVIDER_CALLBACKS has no processor yet (no real
 * provider is wired to call back to — design handoff README §9 point 4).
 */
const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const campaignsWorker = new Worker<CampaignJobData>(
  QUEUE_CAMPAIGNS,
  async (job) => {
    logger.info("campaign.job.received", { jobId: job.id, campaignId: job.data.campaignId });
    await processCampaign(job.data.campaignId);
  },
  { connection },
);

const callbacksWorker = new Worker(
  QUEUE_PROVIDER_CALLBACKS,
  async (job) => {
    logger.info("provider_callback.job.received", { jobId: job.id, name: job.name });
  },
  { connection },
);

for (const worker of [campaignsWorker, callbacksWorker]) {
  worker.on("error", (err) => logger.error("worker.error", { message: err.message }));
  worker.on("failed", (job, err) =>
    logger.error("worker.job_failed", { jobId: job?.id, message: err.message }),
  );
}

logger.info("worker.started", { queues: [QUEUE_CAMPAIGNS, QUEUE_PROVIDER_CALLBACKS] });
