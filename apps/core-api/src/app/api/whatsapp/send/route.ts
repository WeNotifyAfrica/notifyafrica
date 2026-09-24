import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { estimatePricing } from "@/lib/pricing-engine";
import { captureFunds, holdFunds, InsufficientBalanceError, releaseFunds, toMinorUnits } from "@/lib/wallet";
import { sendViaMockProvider } from "@/lib/providers/mock-sms";
import { getEnvironmentFromRequest, resolveProject } from "@/lib/project";
import { consoleRoleHasPermission } from "@notifyafrica/auth";
import type { ConsoleRole } from "@notifyafrica/design-system";
import { sendWhatsAppSchema } from "@notifyafrica/validation";

const CONVERSATION_WINDOW_HOURS = 24;

/**
 * WhatsApp send (03_Specifications_Console §16) — priced per **24h
 * conversation window with a contact, not per message** under the Live
 * project (design handoff Lot 10 §I: "La facturation est par conversation
 * de 24 h... les réponses dans la fenêtre sont gratuites."). Under Test
 * (design handoff Lots 5-6 env toggle), every send is free and no
 * conversation window is tracked at all — sandbox never spends real money
 * or needs the billing concept that exists to meter it.
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

  const [organization, project] = await Promise.all([
    prisma.organization.findUnique({ where: { id: session.organizationId } }),
    resolveProject(session.organizationId, getEnvironmentFromRequest(req)),
  ]);
  if (!organization || !project) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  const template = await prisma.whatsAppTemplate.findFirst({
    where: { id: input.templateId, organizationId: organization.id, projectId: project.id },
  });
  if (!template) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  if (template.status !== "APPROVED") {
    return Response.json({ error: "template_not_approved" }, { status: 422 });
  }

  if (project.environment === "sandbox") {
    const deliveryStatus = await sendViaMockProvider({ destination: input.destination, content: template.bodyText });
    if (deliveryStatus === "FAILED") {
      return Response.json({ error: "provider_failed" }, { status: 502 });
    }
    const message = await prisma.message.create({
      data: {
        organizationId: organization.id,
        projectId: project.id,
        product: "WHATSAPP",
        destination: input.destination,
        content: template.bodyText,
        status: "SENT",
        pricingSnapshot: { sandbox: true },
        whatsappTemplateId: template.id,
      },
    });
    return Response.json({
      message,
      estimate: { unitPrice: 0, subtotal: 0, discounts: [], taxes: [], total: 0, currency: organization.currency, ruleVersion: "sandbox", quoteRequired: false },
      sandbox: true,
      freeWithinConversation: false,
    });
  }

  const openConversation = await prisma.whatsAppConversation.findFirst({
    where: { organizationId: organization.id, destination: input.destination, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "desc" },
  });

  if (openConversation) {
    const deliveryStatus = await sendViaMockProvider({ destination: input.destination, content: template.bodyText });
    if (deliveryStatus === "FAILED") {
      return Response.json({ error: "provider_failed" }, { status: 502 });
    }
    const message = await prisma.message.create({
      data: {
        organizationId: organization.id,
        projectId: project.id,
        product: "WHATSAPP",
        destination: input.destination,
        content: template.bodyText,
        status: "SENT",
        pricingSnapshot: {
          freeWithinConversation: true,
          conversationCategory: openConversation.category,
          conversationExpiresAt: openConversation.expiresAt.toISOString(),
        },
        whatsappTemplateId: template.id,
      },
    });
    return Response.json({
      message,
      estimate: { unitPrice: 0, subtotal: 0, discounts: [], taxes: [], total: 0, currency: organization.currency, ruleVersion: "conversation-window", quoteRequired: false },
      freeWithinConversation: true,
    });
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

  const [message] = await Promise.all([
    prisma.message.create({
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
    }),
    prisma.whatsAppConversation.create({
      data: {
        organizationId: organization.id,
        projectId: project.id,
        destination: input.destination,
        category: template.category,
        expiresAt: new Date(Date.now() + CONVERSATION_WINDOW_HOURS * 60 * 60 * 1000),
      },
    }),
  ]);

  return Response.json({ message, estimate, freeWithinConversation: false });
}
