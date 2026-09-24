import { z } from "zod";

export const smsSendSchema = z.object({
  destination: z.string().min(6),
  content: z.string().min(1).max(1600),
  senderId: z.string().nullable().default(null),
  smsTemplateId: z.string().nullable().default(null),
});
export type SmsSendInput = z.infer<typeof smsSendSchema>;

export const smsMessageUsageSchema = z.enum(["TRANSACTIONAL", "MARKETING", "OTP"]);

export const createSenderNameSchema = z.object({
  name: z.string().min(2).max(11),
  country: z.string().length(2),
  usage: smsMessageUsageSchema.default("TRANSACTIONAL"),
});
export type CreateSenderNameInput = z.infer<typeof createSenderNameSchema>;

export const reviewSenderNameSchema = z.object({
  status: z.enum(["VALIDATED", "REJECTED"]),
  rejectionReason: z.string().nullable().default(null),
});
export type ReviewSenderNameInput = z.infer<typeof reviewSenderNameSchema>;

export const createSmsTemplateSchema = z.object({
  name: z.string().min(2),
  usage: smsMessageUsageSchema.default("TRANSACTIONAL"),
  bodyText: z.string().min(1).max(1600),
});
export type CreateSmsTemplateInput = z.infer<typeof createSmsTemplateSchema>;
