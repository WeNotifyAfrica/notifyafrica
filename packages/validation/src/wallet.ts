import { z } from "zod";

export const walletCreditSchema = z.object({
  organizationId: z.string().min(1),
  amount: z.number().positive(),
  reason: z.string().min(3),
});
export type WalletCreditInput = z.infer<typeof walletCreditSchema>;
