import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/db";
import { releaseFunds } from "@/lib/wallet";

/** Numeric OTP codes (03_Specifications_Console §15). Only the hash is ever
 * persisted — same principle as password/API-key storage. */
export function generateOtpCode(length: number): string {
  return Array.from({ length }, () => randomInt(0, 10)).join("");
}

export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * Lazily expires and releases the hold on any PENDING OtpCode past its
 * expiresAt — /api/otp/verify only settles a code's hold when the caller
 * calls it again, so a code the caller never re-checks after expiry would
 * otherwise sit as reserved balance forever. Called from read paths
 * (history, dashboard) rather than a cron job, since there's no background
 * scheduler for this yet — a bounded, documented gap (self-heals on next
 * read, not real-time, but correctly releases before the org would notice
 * a discrepancy in their available balance).
 */
export async function releaseExpiredOtpHolds(organizationId: string) {
  const expired = await prisma.otpCode.findMany({
    where: { organizationId, status: "PENDING", expiresAt: { lt: new Date() } },
    include: { transaction: true },
  });
  for (const code of expired) {
    await prisma.otpCode.update({ where: { id: code.id }, data: { status: "EXPIRED" } });
    if (code.transaction && code.transaction.status === "PENDING") {
      await releaseFunds(organizationId, code.transaction.amountMinor, "OTP expired, not verified");
      await prisma.transaction.update({ where: { id: code.transaction.id }, data: { status: "CANCELLED" } });
    }
  }
}
