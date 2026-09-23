import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { estimatePricing } from "@/lib/pricing-engine";
import { captureFunds, holdFunds, InsufficientBalanceError, releaseFunds, toMinorUnits } from "@/lib/wallet";
import { generateOtpCode, hashOtpCode } from "@/lib/otp";
import { sendOtpViaMockChannel } from "@/lib/providers/mock-otp";
import { consoleRoleHasPermission } from "@notifyafrica/auth";
import type { ConsoleRole } from "@notifyafrica/design-system";
import { generateOtpSchema } from "@notifyafrica/validation";

/**
 * OTP generation follows the same estimate -> hold -> deliver ->
 * capture/release sequence as SMS send (04_Prompt §15) — OTP is a billed
 * product in the Catalog like any other (00_Contexte_Global §2).
 */
export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!session.role || !consoleRoleHasPermission(session.role as ConsoleRole, "otp.manage")) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = generateOtpSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const [organization, config] = await Promise.all([
    prisma.organization.findUnique({ where: { id: session.organizationId } }),
    prisma.otpConfig.findFirst({ where: { id: input.configId, organizationId: session.organizationId } }),
  ]);
  if (!organization || !config) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const estimate = await estimatePricing({
    organizationId: organization.id,
    projectId: config.projectId,
    product: "OTP",
    country: organization.country,
    operator: null,
    category: null,
    quantity: 1,
    currency: organization.currency as "XOF",
  });

  if (estimate.quoteRequired) {
    return Response.json({ error: "quote_required" }, { status: 422 });
  }

  const amountMinor = await toMinorUnits(estimate.total, estimate.currency);

  try {
    await holdFunds(organization.id, amountMinor, "OTP generate");
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      return Response.json({ error: "insufficient_balance" }, { status: 402 });
    }
    throw err;
  }

  const code = generateOtpCode(config.length);
  const content = config.template.replace("{code}", code);

  const deliveryStatus = await sendOtpViaMockChannel({
    destination: input.destination,
    channel: config.channel,
    content,
  });

  const pricingSnapshot = {
    ruleId: estimate.ruleVersion,
    ruleVersion: estimate.ruleVersion,
    unitPrice: estimate.unitPrice,
    tax: 0,
    currency: estimate.currency,
    capturedAt: new Date().toISOString(),
  };

  if (deliveryStatus === "FAILED") {
    await releaseFunds(organization.id, amountMinor, "OTP generate failed");
    return Response.json({ error: "delivery_failed" }, { status: 502 });
  }

  await captureFunds(organization.id, amountMinor, "OTP generate");

  const transaction = await prisma.transaction.create({
    data: {
      organizationId: organization.id,
      projectId: config.projectId,
      type: "OTP_SEND",
      amountMinor,
      currency: estimate.currency,
      pricingSnapshot,
      status: "CAPTURED",
      idempotencyKey: randomUUID(),
    },
  });

  const otpCode = await prisma.otpCode.create({
    data: {
      configId: config.id,
      organizationId: organization.id,
      destination: input.destination,
      codeHash: hashOtpCode(code),
      expiresAt: new Date(Date.now() + config.expirySeconds * 1000),
      transactionId: transaction.id,
    },
  });

  return Response.json({
    otpId: otpCode.id,
    destination: otpCode.destination,
    expiresAt: otpCode.expiresAt,
  });
}
