import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { hashOtpCode } from "@/lib/otp";
import { captureFunds, releaseFunds } from "@/lib/wallet";
import { verifyOtpSchema } from "@notifyafrica/validation";

/**
 * OTP verification — attempts and expiry both enforced server-side
 * (03_Specifications_Console §15: "les limites viennent du backend").
 * Also where the held funds from /api/otp/generate actually settle
 * (design handoff Lot 9: "un code envoyé mais non vérifié n'est pas
 * facturé") — captured only on a real match, released on expiry or
 * attempts exhausted, so a code that's never verified never costs the
 * organization anything.
 */
export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const otpCode = await prisma.otpCode.findFirst({
    where: { id: input.otpId, organizationId: session.organizationId },
    include: { config: { select: { maxAttempts: true } }, transaction: true },
  });
  if (!otpCode) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  if (otpCode.status !== "PENDING") {
    return Response.json({ error: "not_pending", status: otpCode.status }, { status: 409 });
  }

  if (otpCode.expiresAt < new Date()) {
    await prisma.otpCode.update({ where: { id: otpCode.id }, data: { status: "EXPIRED" } });
    if (otpCode.transaction && otpCode.transaction.status === "PENDING") {
      await releaseFunds(session.organizationId, otpCode.transaction.amountMinor, "OTP expired, not verified");
      await prisma.transaction.update({ where: { id: otpCode.transaction.id }, data: { status: "CANCELLED" } });
    }
    return Response.json({ error: "expired" }, { status: 410 });
  }

  const matches = hashOtpCode(input.code) === otpCode.codeHash;

  if (matches) {
    await prisma.otpCode.update({ where: { id: otpCode.id }, data: { status: "VERIFIED" } });
    if (otpCode.transaction && otpCode.transaction.status === "PENDING") {
      await captureFunds(session.organizationId, otpCode.transaction.amountMinor, "OTP verified");
      await prisma.transaction.update({ where: { id: otpCode.transaction.id }, data: { status: "CAPTURED" } });
    }
    return Response.json({ status: "VERIFIED" });
  }

  const attempts = otpCode.attempts + 1;
  const exhausted = attempts >= otpCode.config.maxAttempts;
  await prisma.otpCode.update({
    where: { id: otpCode.id },
    data: { attempts, status: exhausted ? "FAILED" : "PENDING" },
  });

  if (exhausted && otpCode.transaction && otpCode.transaction.status === "PENDING") {
    await releaseFunds(session.organizationId, otpCode.transaction.amountMinor, "OTP attempts exhausted, not verified");
    await prisma.transaction.update({ where: { id: otpCode.transaction.id }, data: { status: "CANCELLED" } });
  }

  return Response.json(
    { error: "invalid_code", status: exhausted ? "FAILED" : "PENDING", attemptsRemaining: Math.max(0, otpCode.config.maxAttempts - attempts) },
    { status: 400 },
  );
}
