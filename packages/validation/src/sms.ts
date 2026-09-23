import { z } from "zod";

export const smsSendSchema = z.object({
  destination: z.string().min(6),
  content: z.string().min(1).max(1600),
  senderId: z.string().nullable().default(null),
});
export type SmsSendInput = z.infer<typeof smsSendSchema>;
