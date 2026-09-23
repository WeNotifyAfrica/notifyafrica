import { createHash, randomInt } from "node:crypto";

/** Numeric OTP codes (03_Specifications_Console §15). Only the hash is ever
 * persisted — same principle as password/API-key storage. */
export function generateOtpCode(length: number): string {
  return Array.from({ length }, () => randomInt(0, 10)).join("");
}

export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}
