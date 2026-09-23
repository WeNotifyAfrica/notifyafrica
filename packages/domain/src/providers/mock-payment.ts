import { logger } from "@notifyafrica/observability";

/**
 * Mock payment provider — same role as mock-sms.ts/mock-otp.ts: the one
 * file a real Mobile Money/card PSP integration replaces later (design
 * handoff README §9 point 4, no sandbox credentials yet). Instant methods
 * "succeed" synchronously; the caller decides what PENDING vs CAPTURED
 * means based on `PaymentMethod.instant`, not this function.
 */
export async function chargeViaMockPaymentProvider(input: {
  paymentMethodId: string;
  amount: number;
  currency: string;
}): Promise<"SUCCEEDED" | "FAILED"> {
  logger.info("payment.intended_charge", input);
  return "SUCCEEDED";
}
