import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { estimatePricing } from "@/lib/pricing-engine";
import { holdFunds, InsufficientBalanceError, releaseFunds, toMinorUnits } from "@/lib/wallet";
import { generateOtpCode, hashOtpCode } from "@/lib/otp";
import { sendOtpViaMockChannel } from "@/lib/providers/mock-otp";
import { getEnvironmentFromRequest, resolveProject } from "@/lib/project";
import { consoleRoleHasPermission } from "@notifyafrica/auth";
import type { ConsoleRole } from "@notifyafrica/design-system";
import { generateOtpSchema } from "@notifyafrica/validation";

/**
 * OTP generation estimates and HOLDS funds but never captures them here —
 * design handoff Lot 9's own stated invariant: "Facturation au code
 * vérifié : un code envoyé mais non vérifié n'est pas facturé." Unlike
 * SMS/WhatsApp send (which captures immediately on successful delivery),
 * OTP only captures in /api/otp/verify on a successful match. A code that
 * expires or exhausts its attempts releases the hold instead — see
 * apps/core-api/src/app/api/otp/verify/route.ts and
 * apps/core-api/src/app/api/otp/history/route.ts (lazy release for codes
 * that expire without the caller ever calling verify again).
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

  const project = await resolveProject(session.organizationId, getEnvironmentFromRequest(req));
  const [organization, config] = await Promise.all([
    prisma.organization.findUnique({ where: { id: session.organizationId } }),
    prisma.otpConfig.findFirst({
      where: { id: input.configId, organizationId: session.organizationId, projectId: project?.id },
      include: { project: true },
    }),
  ]);
  if (!organization || !config) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  // Test project (design handoff Lots 5-6 env toggle): no pricing, no
  // hold — the code still has to be generated and verified for real so
  // integration testing works, it just never touches the wallet.
  if (config.project.environment === "sandbox") {
    const code = generateOtpCode(config.length);
    const content = config.template.replace("{code}", code);
    await sendOtpViaMockChannel({ destination: input.destination, channel: config.channel, content });
    const otpCode = await prisma.otpCode.create({
      data: {
        configId: config.id,
        organizationId: organization.id,
        destination: input.destination,
        codeHash: hashOtpCode(code),
        expiresAt: new Date(Date.now() + config.expirySeconds * 1000),
      },
    });
    return Response.json({ otpId: otpCode.id, destination: otpCode.destination, expiresAt: otpCode.expiresAt, sandbox: true });
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

  // PENDING, not CAPTURED — the hold is only realized as spend on a
  // successful verify. This is the "code envoyé, pas encore facturé" state.
  const transaction = await prisma.transaction.create({
    data: {
      organizationId: organization.id,
      projectId: config.projectId,
      type: "OTP_SEND",
      amountMinor,
      currency: estimate.currency,
      pricingSnapshot,
      status: "PENDING",
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
