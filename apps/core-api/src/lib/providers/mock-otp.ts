import { logger } from "@notifyafrica/observability";

/**
 * Mock OTP delivery — same role as mock-sms.ts: the one file a real
 * SMS/Email/WhatsApp channel adapter replaces later (design handoff README
 * §9 point 4). Logs what would have been sent instead of actually sending
 * it, so the code is still recoverable for local testing.
 */
export async function sendOtpViaMockChannel(input: {
  destination: string;
  channel: string;
  content: string;
}): Promise<"SENT" | "FAILED"> {
  logger.info("otp.intended_delivery", input);
  return "SENT";
}
