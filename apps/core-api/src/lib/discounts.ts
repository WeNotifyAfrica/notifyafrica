import { prisma } from "./db";
import type { PricingEstimateRequest, PricingDiscountApplied } from "@notifyafrica/types";

export interface DiscountResolution {
  discounts: PricingDiscountApplied[];
  discountAmount: number;
  /** Set only by a FIXED_PRICE rule — overrides the tier's unit price
   * entirely rather than subtracting from the subtotal. */
  overrideUnitPrice: number | null;
}

/**
 * Discount Engine (02_Specifications_Backoffice §13, design handoff
 * invariant #1: "remise (exclusive, la priorité la plus haute l'emporte)").
 * Exclusive by default — only the highest-priority matching rule applies —
 * unless that rule (and the ones below it) are marked `stackable`, in
 * which case all stackable matches combine.
 *
 * PROMO/BONUS types need a redeemed code as input, which the estimate
 * request doesn't carry yet — they're matched here like PERCENT/FIXED_AMOUNT
 * (scope-based, no code check) as a documented simplification, not silently
 * skipped.
 */
export async function resolveDiscounts(
  input: PricingEstimateRequest,
  subtotal: number,
  unitPrice: number,
  quantity: number,
): Promise<DiscountResolution> {
  const now = new Date();

  const candidates = await prisma.discountRule.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ productKey: null }, { productKey: input.product }],
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gt: now } }] },
      ],
    },
    orderBy: { priority: "desc" },
  });

  const applicable = candidates.filter((rule) => {
    switch (rule.scope) {
      case "GLOBAL":
        return true;
      case "COUNTRY":
        return rule.scopeId === input.country;
      case "ORGANIZATION":
        return Boolean(input.organizationId) && rule.scopeId === input.organizationId;
      case "PROJECT":
        return Boolean(input.projectId) && rule.scopeId === input.projectId;
      default:
        return false;
    }
  });

  if (applicable.length === 0) {
    return { discounts: [], discountAmount: 0, overrideUnitPrice: null };
  }

  const top = applicable[0]!;

  if (top.type === "FIXED_PRICE") {
    const fixedPrice = Number(top.value);
    const amount = Math.max(0, (unitPrice - fixedPrice) * quantity);
    return {
      discounts: [{ id: top.id, type: top.type, amount }],
      discountAmount: amount,
      overrideUnitPrice: fixedPrice,
    };
  }

  const applied = top.stackable ? applicable.filter((r) => r.stackable && r.type !== "FIXED_PRICE") : [top];

  const discounts: PricingDiscountApplied[] = applied.map((rule) => {
    const value = Number(rule.value);
    let amount: number;
    switch (rule.type) {
      case "UNIT_DISCOUNT":
        amount = value * quantity;
        break;
      case "FIXED_AMOUNT":
      case "PROMO":
      case "BONUS":
        amount = value;
        break;
      case "PERCENT":
      default:
        amount = subtotal * (value / 100);
        break;
    }
    if (rule.maxDiscount !== null) {
      amount = Math.min(amount, Number(rule.maxDiscount));
    }
    return { id: rule.id, type: rule.type, amount: Math.max(0, amount) };
  });

  const discountAmount = Math.min(subtotal, discounts.reduce((sum, d) => sum + d.amount, 0));

  return { discounts, discountAmount, overrideUnitPrice: null };
}
