import { Worker } from "bullmq";
import IORedis from "ioredis";
import { logger } from "@notifyafrica/observability";
import { QUEUE_CAMPAIGNS, QUEUE_PROVIDER_CALLBACKS } from "./queues";

/**
 * Worker skeleton (04_Prompt §21, 00_Contexte_Global §3.5). No campaign
 * logic is implemented yet (Phase D+ per 04_Prompt §3) — this just proves
 * the queue wiring works end-to-end so Phase D can add real processors
 * without touching the connection/bootstrap code.
 */
const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const campaignsWorker = new Worker(
  QUEUE_CAMPAIGNS,
  async (job) => {
    logger.info("campaign.job.received", { jobId: job.id, name: job.name });
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
}

logger.info("worker.started", { queues: [QUEUE_CAMPAIGNS, QUEUE_PROVIDER_CALLBACKS] });
