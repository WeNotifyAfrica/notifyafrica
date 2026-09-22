import { prisma } from "./db";
import { seedPricingRules } from "@notifyafrica/config-seed";
import type { PricingEstimateRequest, PricingEstimateResult } from "@notifyafrica/types";

/**
 * Central Pricing Engine (04_Prompt §14, design handoff invariant #1).
 * Immutable order: base cost -> tier -> discount -> markup -> tax. Discounts
 * and taxes are wired to Discount Engine / tax rules in a later phase; this
 * minimal version resolves the base tier + markup so no product hardcodes a
 * price (04_Prompt §5) while Phase B builds out the rest on the same shape.
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
    },
    orderBy: [{ priority: "desc" }, { version: "desc" }],
  });

  const source = published.length > 0 ? published : seedPricingRules.filter(
    (r) => r.productKey === input.product && r.currency === input.currency,
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

  const unitPrice =
    baseCost !== null && markupValue > 0
      ? markupType === "PERCENT"
        ? baseCost * (1 + markupValue / 100)
        : baseCost + markupValue
      : basePrice;

  const subtotal = unitPrice * input.quantity;
  const ruleVersion = "version" in tier ? String(tier.version) : "seed";
  const quoteRequired = Boolean(tier.quoteRequired);

  return {
    unitPrice,
    subtotal,
    discounts: [],
    taxes: [],
    total: subtotal,
    currency: input.currency,
    ruleVersion,
    quoteRequired,
  };
}
