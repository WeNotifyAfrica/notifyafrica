import { z } from "zod";

export const createOtpConfigSchema = z.object({
  name: z.string().min(2),
  length: z.number().int().min(4).max(10).default(6),
  expirySeconds: z.number().int().min(30).max(3600).default(300),
  maxAttempts: z.number().int().min(1).max(10).default(3),
  resendCooldownSeconds: z.number().int().min(10).max(600).default(60),
  channel: z.enum(["SMS", "EMAIL", "WHATSAPP"]).default("SMS"),
  fallbackChannel: z.enum(["SMS", "EMAIL", "WHATSAPP"]).nullable().default(null),
  template: z.string().min(1).default("Votre code NotifyAfrica est {code}"),
});
export type CreateOtpConfigInput = z.infer<typeof createOtpConfigSchema>;

export const generateOtpSchema = z.object({
  configId: z.string().min(1),
  destination: z.string().min(4),
});
export type GenerateOtpInput = z.infer<typeof generateOtpSchema>;

export const verifyOtpSchema = z.object({
  otpId: z.string().min(1),
  code: z.string().min(4),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
