import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { estimatePricing } from "@/lib/pricing-engine";
import { captureFunds, holdFunds, InsufficientBalanceError, releaseFunds, toMinorUnits } from "@/lib/wallet";
import { recordEvent } from "@/lib/notify";
import { transactionJson } from "@/lib/serialize";
import { sendViaMockProvider } from "@/lib/providers/mock-sms";
import { getEnvironmentFromRequest, resolveProject } from "@/lib/project";
import { smsSendSchema } from "@notifyafrica/validation";

/**
 * SMS - envoi simple (03_Specifications_Console §10). Follows the mandatory
 * sequence from 04_Prompt §15: estimate -> balance check -> hold -> execute
 * -> capture/release. No provider is wired yet (design handoff README §9
 * point 4 — no sandbox credentials), so "execute" is a mock adapter that
 * always succeeds; everything upstream/downstream of it (pricing, wallet,
 * the Message/Transaction records, FIRST_MESSAGE_SENT) is real — except
 * under the Test project (design handoff Lots 5-6 env toggle), where
 * pricing/wallet are skipped entirely: sandbox never spends real money.
 */
export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = smsSendSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const [organization, project] = await Promise.all([
    prisma.organization.findUnique({ where: { id: session.organizationId } }),
    resolveProject(session.organizationId, getEnvironmentFromRequest(req)),
  ]);
  if (!organization || !project) {
    return Response.json({ error: "organization_not_found" }, { status: 404 });
  }

  if (project.environment === "sandbox") {
    const providerStatus = await sendViaMockProvider({ destination: input.destination, content: input.content });
    if (providerStatus === "FAILED") {
      return Response.json({ error: "provider_failed" }, { status: 502 });
    }
    const message = await prisma.message.create({
      data: {
        organizationId: organization.id,
        projectId: project.id,
        product: "SMS",
        senderId: input.senderId,
        destination: input.destination,
        content: input.content,
        status: "SENT",
        pricingSnapshot: { sandbox: true },
        smsTemplateId: input.smsTemplateId,
      },
    });
    if (input.smsTemplateId) {
      await prisma.smsTemplate.updateMany({
        where: { id: input.smsTemplateId, organizationId: organization.id },
        data: { usageCount: { increment: 1 } },
      });
    }
    return Response.json({
      message,
      transaction: null,
      estimate: { unitPrice: 0, subtotal: 0, discounts: [], taxes: [], total: 0, currency: organization.currency, ruleVersion: "sandbox", quoteRequired: false },
      sandbox: true,
    });
  }

  const estimate = await estimatePricing({
    organizationId: organization.id,
    projectId: project.id,
    product: "SMS",
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
    await holdFunds(organization.id, amountMinor, "SMS send");
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      return Response.json({ error: "insufficient_balance" }, { status: 402 });
    }
    throw err;
  }

  const providerStatus = await sendViaMockProvider({
    destination: input.destination,
    content: input.content,
  });

  const pricingSnapshot = {
    ruleId: estimate.ruleVersion,
    ruleVersion: estimate.ruleVersion,
    unitPrice: estimate.unitPrice,
    tax: 0,
    currency: estimate.currency,
    capturedAt: new Date().toISOString(),
  };

  if (providerStatus === "FAILED") {
    await releaseFunds(organization.id, amountMinor, "SMS send failed");
    return Response.json({ error: "provider_failed" }, { status: 502 });
  }

  await captureFunds(organization.id, amountMinor, "SMS send");

  const isFirstMessage = (await prisma.message.count({ where: { organizationId: organization.id } })) === 0;

  const transaction = await prisma.transaction.create({
    data: {
      organizationId: organization.id,
      projectId: project.id,
      type: "SMS_SEND",
      amountMinor,
      currency: estimate.currency,
      pricingSnapshot,
      status: "CAPTURED",
      idempotencyKey: randomUUID(),
    },
  });

  const message = await prisma.message.create({
    data: {
      organizationId: organization.id,
      projectId: project.id,
      product: "SMS",
      senderId: input.senderId,
      destination: input.destination,
      content: input.content,
      status: "SENT",
      pricingSnapshot,
      transactionId: transaction.id,
      smsTemplateId: input.smsTemplateId,
    },
  });

  if (input.smsTemplateId) {
    await prisma.smsTemplate.updateMany({
      where: { id: input.smsTemplateId, organizationId: organization.id },
      data: { usageCount: { increment: 1 } },
    });
  }

  if (isFirstMessage) {
    await recordEvent("FIRST_MESSAGE_SENT", {
      organizationId: organization.id,
      userId: session.sub,
      payload: { destination: input.destination },
    });
  }

  return Response.json({ message, transaction: transactionJson(transaction), estimate, sandbox: false });
}
