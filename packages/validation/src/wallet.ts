import { z } from "zod";

export const walletCreditSchema = z
  .object({
    organizationId: z.string().min(1).openapi({ example: "cmue4oef0000a5ggdxq1s551h" }),
    amount: z.number().positive().openapi({ example: 1000, description: "Major currency units (e.g. XOF, not minor units)." }),
    reason: z.string().min(3).openapi({ example: "Recharge manuelle suite à support" }),
  })
  .openapi("AdminWalletCreditRequest");
export type WalletCreditInput = z.infer<typeof walletCreditSchema>;
