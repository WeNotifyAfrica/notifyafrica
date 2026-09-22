import { prisma } from "./db";
import { logger } from "@notifyafrica/observability";
import type { NotifyAfricaEvent } from "@notifyafrica/types";

/**
 * Event & Notification Engine (00_Contexte_Global §16, 02_Specifications
 * Backoffice §26). Recipients/channels/templates live in NotificationRule
 * rows, never hardcoded (04_Prompt §13).
 *
 * A Notification row is always created for the in-app Admin center, even if
 * no NotificationRule has been configured yet — this is the same
 * "safe empty fallback" principle as config resolution, applied to
 * notifications: the acceptance criterion in 04_Prompt §27 ("un register
 * crée une notification Admin") must hold on day one, before an Admin has
 * configured anything.
 *
 * Email/SMS/webhook delivery is intentionally not wired to a real provider
 * here (no provider credentials yet, per design_handoff README §9 point 4);
 * matched rules are logged as an intended delivery instead. Swap
 * deliverIntendedChannel for a real adapter once a provider is chosen —
 * callers of recordEvent do not change.
 */
export async function recordEvent(
  event: NotifyAfricaEvent,
  data: {
    organizationId?: string | null;
    userId?: string | null;
    payload: Record<string, unknown>;
  },
) {
  const notification = await prisma.notification.create({
    data: {
      event,
      organizationId: data.organizationId ?? null,
      userId: data.userId ?? null,
      payload: data.payload as object,
    },
  });

  const rules = await prisma.notificationRule.findMany({
    where: { event, active: true },
    orderBy: { priority: "desc" },
  });

  for (const rule of rules) {
    deliverIntendedChannel(rule, data.payload);
  }

  return notification;
}

function deliverIntendedChannel(
  rule: { channel: string; recipientEmails: string[]; template: string | null },
  payload: Record<string, unknown>,
) {
  logger.info("notification.intended_delivery", {
    channel: rule.channel,
    recipients: rule.recipientEmails,
    template: rule.template,
    payload,
  });
}
