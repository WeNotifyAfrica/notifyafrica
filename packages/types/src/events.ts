/** Event catalog — 00_Contexte_Global §16. Recipients/channels/templates are
 * configured in Admin (NotificationRule), never hardcoded (04_Prompt §13). */
export type NotifyAfricaEvent =
  | "USER_REGISTERED"
  | "EMAIL_VERIFIED"
  | "ORGANIZATION_CREATED"
  | "PROJECT_CREATED"
  | "FIRST_TOPUP"
  | "FIRST_API_KEY_CREATED"
  | "FIRST_MESSAGE_SENT"
  | "QUOTE_REQUESTED"
  | "LOW_BALANCE"
  | "PAYMENT_FAILED"
  | "PROVIDER_DEGRADED";

export interface EventPayload {
  event: NotifyAfricaEvent;
  occurredAt: string;
  actorUserId: string | null;
  organizationId: string | null;
  data: Record<string, unknown>;
}
