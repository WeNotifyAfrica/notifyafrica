import { z } from "zod";

export const discountTypeSchema = z.enum([
  "PERCENT",
  "FIXED_AMOUNT",
  "UNIT_DISCOUNT",
  "FIXED_PRICE",
  "PROMO",
  "BONUS",
]);

export const discountScopeSchema = z.enum(["GLOBAL", "COUNTRY", "ORGANIZATION", "PROJECT"]);

export const createDiscountRuleSchema = z.object({
  type: discountTypeSchema,
  productKey: z.string().nullable().default(null),
  scope: discountScopeSchema.default("GLOBAL"),
  scopeId: z.string().nullable().default(null),
  value: z.number().positive(),
  priority: z.number().int().default(0),
  stackable: z.boolean().default(false),
  maxDiscount: z.number().positive().nullable().default(null),
  startAt: z.string().datetime().nullable().default(null),
  endAt: z.string().datetime().nullable().default(null),
});
export type CreateDiscountRuleInput = z.infer<typeof createDiscountRuleSchema>;
