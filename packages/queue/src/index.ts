/**
 * Queue names shared between Core API (producer) and Worker (consumer).
 * Campaigns/callbacks must not block an HTTP request (04_Prompt §21) — the
 * Core API enqueues here instead of running them inline.
 *
 * BullMQ builds its Redis keys as `<prefix>:<queueName>:<suffix>` and
 * rejects a `:` inside the queue name itself for that reason — hyphens
 * only. Both sides import from this one package so the string can never
 * drift between producer and consumer.
 */
export const QUEUE_CAMPAIGNS = "notifyafrica-campaigns";
export const QUEUE_PROVIDER_CALLBACKS = "notifyafrica-provider-callbacks";

export interface CampaignJobData {
  campaignId: string;
}
