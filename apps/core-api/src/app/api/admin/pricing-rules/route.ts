import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { z } from "zod";

const createRuleSchema = z.object({
  productKey: z.string().min(1),
  countryCode: z.string().length(2).nullable().default(null),
  category: z.string().nullable().default(null),
  volumeMin: z.number().int().default(0),
  volumeMax: z.number().int().nullable().default(null),
  currency: z.string().length(3),
  baseCost: z.number().nullable().default(null),
  basePrice: z.number(),
  markupType: z.enum(["PERCENT", "FIXED_AMOUNT"]).default("PERCENT"),
  markupValue: z.number().default(0),
  publicVisible: z.boolean().default(true),
  quoteRequired: z.boolean().default(false),
  priority: z.number().int().default(0),
  reason: z.string().min(3),
});

/**
 * Publishing a pricing rule never edits an existing one in place — a new
 * versioned row is created (00_Contexte_Global §9, design handoff invariant
 * #3: "on ne modifie pas une règle, on crée une version"). Prior rules for
 * the same productKey/country/category are archived so the pricing engine
 * resolves to exactly one ACTIVE tier per bracket.
 */
export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createRuleSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const overlapping = await prisma.pricingRule.findMany({
    where: {
      productKey: input.productKey,
      countryCode: input.countryCode,
      // WhatsApp's three categories (utility/authentication/marketing) each
      // have their own rule at the same volume range — without matching on
      // category too, publishing one would wrongly archive another.
      category: input.category,
      currency: input.currency,
      status: "ACTIVE",
      volumeMin: input.volumeMin,
      volumeMax: input.volumeMax,
    },
  });

  const nextVersion = 1 + Math.max(0, ...overlapping.map((r) => r.version));

  const rule = await prisma.pricingRule.create({
    data: { ...input, status: "ACTIVE", version: nextVersion },
  });

  if (overlapping.length > 0) {
    await prisma.pricingRule.updateMany({
      where: { id: { in: overlapping.map((r) => r.id) } },
      data: { status: "ARCHIVED" },
    });
  }

  await recordAudit({
    actorUserId: session.sub,
    action: "pricing.publish",
    resource: "pricing_rule",
    resourceId: rule.id,
    before: overlapping,
    after: rule,
    reason: input.reason,
  });

  return Response.json({ rule });
}
