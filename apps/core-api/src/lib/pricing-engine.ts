import { prisma } from "./db";
import { seedPricingRules } from "@notifyafrica/config-seed";
import { resolveDiscounts } from "./discounts";
import type { PricingEstimateRequest, PricingEstimateResult } from "@notifyafrica/types";

/**
 * Central Pricing Engine (04_Prompt §14, design handoff invariant #1).
 * Immutable order: base cost -> tier -> discount -> markup -> tax. Discounts
 * are now wired (see resolveDiscounts in ./discounts.ts); tax rules remain
 * for a later phase — no tax authority/rate has been validated yet
 * (design handoff README §8: "taux de taxe... à faire valider par un
 * conseil fiscal").
 *
 * Rule selection also implements the first two steps of
 * 00_Contexte_Global §11's priority order ("1. prix contractuel client;
 * 2. prix spécifique organisation; ... 6. prix public par défaut"): an
 * organization-scoped rule (created when Admin accepts a Quote — see
 * apps/core-api/src/app/api/admin/quotes/[id]/status/route.ts) is matched
 * alongside global (organizationId: null) rules, and naturally wins the
 * tier lookup below as long as it's given a higher `priority`.
 */
export async function estimatePricing(
  input: PricingEstimateRequest,
): Promise<PricingEstimateResult> {
  const published = await prisma.pricingRule.findMany({
    where: {
      productKey: input.product,
      status: "ACTIVE",
      currency: input.currency,
      OR: [{ countryCode: null }, { countryCode: input.country }],
      AND: [
        input.organizationId
          ? { OR: [{ organizationId: input.organizationId }, { organizationId: null }] }
          : { organizationId: null },
        // Category-scoped rules (e.g. WhatsApp utility/authentication/
        // marketing, each priced differently by Meta) only match a request
        // for that exact category; category-agnostic rules (category: null)
        // match any request, same null-means-wildcard pattern as country.
        input.category ? { OR: [{ category: input.category }, { category: null }] } : { category: null },
      ],
    },
    orderBy: [{ priority: "desc" }, { version: "desc" }],
  });

  const source = published.length > 0 ? published : seedPricingRules.filter(
    (r) =>
      r.productKey === input.product &&
      r.currency === input.currency &&
      (r.category === input.category || r.category === null),
  );

  const tier = source.find((r) => {
    const min = "volumeMin" in r ? Number(r.volumeMin) : 0;
    const max = "volumeMax" in r && r.volumeMax !== null ? Number(r.volumeMax) : null;
    return input.quantity >= min && (max === null || input.quantity <= max);
  });

  if (!tier) {
    return {
      unitPrice: 0,
      subtotal: 0,
      discounts: [],
      taxes: [],
      total: 0,
      currency: input.currency,
      ruleVersion: "none",
      quoteRequired: true,
    };
  }

  const baseCost = tier.baseCost !== null && tier.baseCost !== undefined ? Number(tier.baseCost) : null;
  const basePrice = Number(tier.basePrice);
  const markupValue = Number(tier.markupValue ?? 0);
  const markupType = tier.markupType ?? "PERCENT";

  const tierUnitPrice =
    baseCost !== null && markupValue > 0
      ? markupType === "PERCENT"
        ? baseCost * (1 + markupValue / 100)
        : baseCost + markupValue
      : basePrice;

  const subtotal = tierUnitPrice * input.quantity;
  const ruleVersion = "version" in tier ? String(tier.version) : "seed";
  const quoteRequired = Boolean(tier.quoteRequired);

  const { discounts, discountAmount, overrideUnitPrice } = await resolveDiscounts(
    input,
    subtotal,
    tierUnitPrice,
    input.quantity,
  );

  // discountAmount already equals (subtotal - overridden subtotal) when a
  // FIXED_PRICE rule fired (see resolveDiscounts), so `subtotal -
  // discountAmount` lands on the right total either way — no branching
  // needed between the two discount shapes.
  const unitPrice = overrideUnitPrice ?? tierUnitPrice;
  const total = Math.max(0, subtotal - discountAmount);

  return {
    unitPrice,
    subtotal,
    discounts,
    taxes: [],
    total,
    currency: input.currency,
    ruleVersion,
    quoteRequired,
  };
}
