export type WhatsAppTemplateCategory = "UTILITY" | "AUTHENTICATION" | "MARKETING";
export type WhatsAppTemplateStatus = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
export type WhatsAppNumberStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface WhatsAppNumber {
  id: string;
  phoneNumber: string;
  displayName: string;
  status: WhatsAppNumberStatus;
  createdAt: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: WhatsAppTemplateCategory;
  language: string;
  bodyText: string;
  status: WhatsAppTemplateStatus;
  rejectionReason: string | null;
  createdAt: string;
  /** Present only on Admin's list. */
  organization?: { id: string; name: string };
}
