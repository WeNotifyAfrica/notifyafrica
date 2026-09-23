import { z } from "zod";

export const createQuoteSchema = z.object({
  productKey: z.string().min(1),
  country: z.string().length(2),
  quantity: z.number().int().positive(),
  currency: z.string().length(3),
  notes: z.string().max(2000).nullable().default(null),
});
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

export const quoteStatusSchema = z.enum([
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "INFO_REQUIRED",
  "OFFER_AVAILABLE",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
]);

export const updateQuoteStatusSchema = z.object({
  status: quoteStatusSchema,
  offer: z
    .object({
      unitPrice: z.number().positive(),
      total: z.number().positive(),
      currency: z.string().length(3),
      notes: z.string().max(2000).nullable().default(null),
    })
    .nullable()
    .default(null),
  reason: z.string().min(3),
});
export type UpdateQuoteStatusInput = z.infer<typeof updateQuoteStatusSchema>;
