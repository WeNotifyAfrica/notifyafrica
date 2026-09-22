import type { SupportedCurrency } from "@notifyafrica/design-system";

/**
 * Pricing Engine contracts — 04_Prompt §14, mirrored by 02_Specifications
 * Backoffice §10 and the design handoff's invariant #1 (single pricing
 * engine, immutable order: base -> tier -> discount -> markup -> tax).
 */

export interface PricingEstimateRequest {
  organizationId: string | null;
  projectId: string | null;
  product: string;
  country: string;
  operator: string | null;
  category: string | null;
  quantity: number;
  currency: SupportedCurrency;
}

export interface PricingDiscountApplied {
  id: string;
  type: string;
  amount: number;
}

export interface PricingTaxApplied {
  code: string;
  rate: number;
  amount: number;
}

export interface PricingEstimateResult {
  unitPrice: number;
  subtotal: number;
  discounts: PricingDiscountApplied[];
  taxes: PricingTaxApplied[];
  total: number;
  currency: SupportedCurrency;
  ruleVersion: string;
  quoteRequired: boolean;
}

/** Frozen at send/purchase time onto the transaction — never recomputed
 * retroactively (design handoff invariant #2). */
export interface PricingSnapshot {
  ruleId: string;
  ruleVersion: string;
  unitPrice: number;
  tax: number;
  currency: SupportedCurrency;
  capturedAt: string;
}
