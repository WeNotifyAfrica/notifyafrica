export type DiscountType = "PERCENT" | "FIXED_AMOUNT" | "UNIT_DISCOUNT" | "FIXED_PRICE" | "PROMO" | "BONUS";
export type DiscountScope = "GLOBAL" | "COUNTRY" | "ORGANIZATION" | "PROJECT";

export interface DiscountRule {
  id: string;
  type: DiscountType;
  productKey: string | null;
  scope: DiscountScope;
  scopeId: string | null;
  value: number;
  priority: number;
  stackable: boolean;
  maxDiscount: number | null;
  startAt: string | null;
  endAt: string | null;
  status: string;
  createdAt: string;
}
