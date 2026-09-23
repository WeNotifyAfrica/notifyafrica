import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { recordEvent } from "@/lib/notify";
import { createQuoteSchema } from "@notifyafrica/validation";

/**
 * Quote requests (03_Specifications_Console §19-20, 02_Specifications
 * Backoffice §14). Closes the loop the Pricing Engine already opens
 * everywhere: `estimatePricing` returns `quoteRequired: true` above a
 * product's top volume tier (apps/core-api/src/lib/pricing-engine.ts), the
 * Website shows "Sur devis" on /tarifs, and until this route existed there
 * was nowhere for that to actually go.
 */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const quotes = await prisma.quote.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ quotes });
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const quote = await prisma.quote.create({
    data: {
      organizationId: session.organizationId,
      productKey: input.productKey,
      status: "SUBMITTED",
      payload: {
        country: input.country,
        quantity: input.quantity,
        currency: input.currency,
        notes: input.notes,
      },
    },
  });

  // 02_Specifications_Backoffice §26.3: "devis demandé -> Commercial" — the
  // recipient/channel is a NotificationRule an Admin configures, not
  // hardcoded here (04_Prompt §13).
  await recordEvent("QUOTE_REQUESTED", {
    organizationId: session.organizationId,
    userId: session.sub,
    payload: { quoteId: quote.id, productKey: quote.productKey, quantity: input.quantity },
  });

  return Response.json({ quote });
}
