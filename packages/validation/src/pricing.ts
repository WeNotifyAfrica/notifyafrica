import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "@notifyafrica/design-system";

export const pricingEstimateRequestSchema = z.object({
  organizationId: z.string().nullable().default(null),
  projectId: z.string().nullable().default(null),
  product: z.string(),
  country: z.string().length(2),
  operator: z.string().nullable().default(null),
  category: z.string().nullable().default(null),
  quantity: z.number().int().positive(),
  currency: z.enum(SUPPORTED_CURRENCIES),
});
export type PricingEstimateRequestInput = z.infer<typeof pricingEstimateRequestSchema>;
