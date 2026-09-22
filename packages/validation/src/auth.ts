import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  organizationName: z.string().min(2),
  country: z.string().length(2),
  currency: z.string().length(3),
  source: z.string().optional(),
  campaign: z.string().optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;
