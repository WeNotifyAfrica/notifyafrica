import { z } from "zod";

export const whatsAppTemplateCategorySchema = z.enum(["UTILITY", "AUTHENTICATION", "MARKETING"]);

export const createWhatsAppNumberSchema = z.object({
  phoneNumber: z.string().min(6),
  displayName: z.string().min(1),
});
export type CreateWhatsAppNumberInput = z.infer<typeof createWhatsAppNumberSchema>;

export const createWhatsAppTemplateSchema = z.object({
  name: z.string().min(2),
  category: whatsAppTemplateCategorySchema,
  language: z.string().min(2).default("fr"),
  bodyText: z.string().min(1).max(1024),
});
export type CreateWhatsAppTemplateInput = z.infer<typeof createWhatsAppTemplateSchema>;

export const reviewWhatsAppTemplateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().nullable().default(null),
});
export type ReviewWhatsAppTemplateInput = z.infer<typeof reviewWhatsAppTemplateSchema>;

export const sendWhatsAppSchema = z.object({
  templateId: z.string().min(1),
  destination: z.string().min(6),
});
export type SendWhatsAppInput = z.infer<typeof sendWhatsAppSchema>;
