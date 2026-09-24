import { z } from "zod";

export const paymentMethodFamilySchema = z.enum(["MOBILE_MONEY", "CARD", "BANK_TRANSFER", "INVOICE"]);

export const createPaymentMethodSchema = z.object({
  name: z.string().min(1),
  family: paymentMethodFamilySchema,
  countries: z.array(z.string().length(2)).default([]),
  minAmount: z.number().positive().nullable().default(null),
  maxAmount: z.number().positive().nullable().default(null),
  feePercent: z.number().min(0).max(100).default(0),
  instant: z.boolean().default(true),
});
export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;

export const walletTopupSchema = z
  .object({
    paymentMethodId: z.string().min(1).openapi({ example: "cm...paymentmethodid" }),
    amount: z.number().positive().openapi({ example: 5000, description: "Major currency units." }),
  })
  .openapi("WalletTopupRequest");
export type WalletTopupInput = z.infer<typeof walletTopupSchema>;
