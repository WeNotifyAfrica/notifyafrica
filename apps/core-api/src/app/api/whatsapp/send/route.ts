import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { estimatePricing } from "@/lib/pricing-engine";
import { captureFunds, holdFunds, InsufficientBalanceError, releaseFunds, toMinorUnits } from "@/lib/wallet";
import { sendViaMockProvider } from "@/lib/providers/mock-sms";
import { consoleRoleHasPermission } from "@notifyafrica/auth";
import type { ConsoleRole } from "@notifyafrica/design-system";
import { sendWhatsAppSchema } from "@notifyafrica/validation";

/**
 * WhatsApp send (03_Specifications_Console §16) — same estimate -> hold ->
 * deliver -> capture/release sequence as SMS (04_Prompt §15), except the
 * Pricing Engine is called with `category` set from the template
 * (UTILITY/AUTHENTICATION/MARKETING each have their own official Meta
 * rate — see pricing-engine.ts's category matching). Only an APPROVED
 * template can be used; the mock adapter is the same one single SMS uses,
 * since no real WhatsApp Business API integration exists yet.
 */
export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!session.role || !consoleRoleHasPermission(session.role as ConsoleRole, "whatsapp.manage")) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = sendWhatsAppSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const [organization, project, template] = await Promise.all([
    prisma.organization.findUnique({ where: { id: session.organizationId } }),
    prisma.project.findFirst({ where: { organizationId: session.organizationId } }),
    prisma.whatsAppTemplate.findFirst({
      where: { id: input.templateId, organizationId: session.organizationId },
    }),
  ]);
  if (!organization || !project || !template) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  if (template.status !== "APPROVED") {
    return Response.json({ error: "template_not_approved" }, { status: 422 });
  }

  const estimate = await estimatePricing({
    organizationId: organization.id,
    projectId: project.id,
    product: "WHATSAPP",
    country: organization.country,
    operator: null,
    category: template.category.toLowerCase(),
    quantity: 1,
    currency: organization.currency as "XOF",
  });

  if (estimate.quoteRequired) {
    return Response.json({ error: "quote_required" }, { status: 422 });
  }

  const amountMinor = await toMinorUnits(estimate.total, estimate.currency);

  try {
    await holdFunds(organization.id, amountMinor, "WhatsApp send");
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      return Response.json({ error: "insufficient_balance" }, { status: 402 });
    }
    throw err;
  }

  const deliveryStatus = await sendViaMockProvider({
    destination: input.destination,
    content: template.bodyText,
  });

  const pricingSnapshot = {
    ruleId: estimate.ruleVersion,
    ruleVersion: estimate.ruleVersion,
    unitPrice: estimate.unitPrice,
    tax: 0,
    currency: estimate.currency,
    category: template.category,
    capturedAt: new Date().toISOString(),
  };

  if (deliveryStatus === "FAILED") {
    await releaseFunds(organization.id, amountMinor, "WhatsApp send failed");
    return Response.json({ error: "provider_failed" }, { status: 502 });
  }

  await captureFunds(organization.id, amountMinor, "WhatsApp send");

  const transaction = await prisma.transaction.create({
    data: {
      organizationId: organization.id,
      projectId: project.id,
      type: "WHATSAPP_SEND",
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
      product: "WHATSAPP",
      destination: input.destination,
      content: template.bodyText,
      status: "SENT",
      pricingSnapshot,
      transactionId: transaction.id,
      whatsappTemplateId: template.id,
    },
  });

  return Response.json({ message, estimate });
}
