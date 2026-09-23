import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { updateQuoteStatusSchema } from "@notifyafrica/validation";
import type { QuotePayload } from "@notifyafrica/types";

/**
 * Quote status transitions (03_Specifications_Console §20 workflow: Draft
 * -> Submitted -> Under Review -> Info Required -> Offer Available ->
 * Accepted/Rejected/Expired). Accepting a quote with an offer attached
 * converts it into an organization-scoped PricingRule — "Une acceptation
 * peut activer automatiquement une règle tarifaire spécifique" — so the
 * customer's next estimate/send for that product actually uses the
 * negotiated price (see pricing-engine.ts for the read side).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const before = await prisma.quote.findUnique({ where: { id } });
  if (!before) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateQuoteStatusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const beforePayload = before.payload as unknown as QuotePayload;
  const nextPayload: QuotePayload = input.offer ? { ...beforePayload, offer: input.offer } : beforePayload;

  const quote = await prisma.quote.update({
    where: { id },
    data: { status: input.status, payload: nextPayload as object },
  });

  let createdRule: { id: string } | null = null;
  if (input.status === "ACCEPTED" && nextPayload.offer) {
    const rule = await prisma.pricingRule.create({
      data: {
        productKey: quote.productKey,
        countryCode: nextPayload.country,
        currency: nextPayload.offer.currency,
        basePrice: nextPayload.offer.unitPrice,
        markupType: "PERCENT",
        markupValue: 0,
        customerScope: "ORGANIZATION",
        organizationId: quote.organizationId,
        volumeMin: 0,
        volumeMax: null,
        priority: 100,
        publicVisible: false,
        quoteRequired: false,
        status: "ACTIVE",
        version: 1,
        reason: `Quote ${quote.id} accepted`,
      },
    });
    createdRule = { id: rule.id };
  }

  await recordAudit({
    actorUserId: session.sub,
    action: "quote.status_update",
    resource: "quote",
    resourceId: quote.id,
    before: { status: before.status, payload: before.payload },
    after: { status: quote.status, payload: quote.payload, pricingRuleId: createdRule?.id ?? null },
    reason: input.reason,
  });

  return Response.json({ quote, pricingRuleId: createdRule?.id ?? null });
}
