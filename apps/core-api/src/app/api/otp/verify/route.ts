import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { hashOtpCode } from "@/lib/otp";
import { verifyOtpSchema } from "@notifyafrica/validation";

/** OTP verification — attempts and expiry both enforced server-side
 * (03_Specifications_Console §15: "les limites viennent du backend"). */
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
    include: { config: { select: { maxAttempts: true } } },
  });
  if (!otpCode) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  if (otpCode.status !== "PENDING") {
    return Response.json({ error: "not_pending", status: otpCode.status }, { status: 409 });
  }

  if (otpCode.expiresAt < new Date()) {
    await prisma.otpCode.update({ where: { id: otpCode.id }, data: { status: "EXPIRED" } });
    return Response.json({ error: "expired" }, { status: 410 });
  }

  const matches = hashOtpCode(input.code) === otpCode.codeHash;

  if (matches) {
    await prisma.otpCode.update({ where: { id: otpCode.id }, data: { status: "VERIFIED" } });
    return Response.json({ status: "VERIFIED" });
  }

  const attempts = otpCode.attempts + 1;
  const exhausted = attempts >= otpCode.config.maxAttempts;
  await prisma.otpCode.update({
    where: { id: otpCode.id },
    data: { attempts, status: exhausted ? "FAILED" : "PENDING" },
  });

  return Response.json(
    { error: "invalid_code", status: exhausted ? "FAILED" : "PENDING", attemptsRemaining: Math.max(0, otpCode.config.maxAttempts - attempts) },
    { status: 400 },
  );
}
