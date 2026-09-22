/**
 * Queue names shared between Core API (producer) and Worker (consumer).
 * Campaigns/callbacks must not block an HTTP request (04_Prompt §21) — the
 * Core API enqueues here instead of running them inline.
 */
export const QUEUE_CAMPAIGNS = "notifyafrica:campaigns";
export const QUEUE_PROVIDER_CALLBACKS = "notifyafrica:provider-callbacks";
