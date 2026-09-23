import { z } from "zod";

export const createCampaignSchema = z.object({
  name: z.string().min(2),
  productKey: z.string().min(1).default("SMS"),
  senderId: z.string().nullable().default(null),
  content: z.string().min(1).max(1600),
  destinations: z.array(z.string().min(6)).min(1).max(50000),
});
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
