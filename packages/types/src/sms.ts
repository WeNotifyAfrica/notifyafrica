export type SmsMessageUsage = "TRANSACTIONAL" | "MARKETING" | "OTP";
export type SenderNameStatus = "PENDING" | "VALIDATED" | "REJECTED";

export interface SenderName {
  id: string;
  organizationId: string;
  name: string;
  country: string;
  usage: SmsMessageUsage;
  status: SenderNameStatus;
  rejectionReason: string | null;
  createdAt: string;
  organization?: { id: string; name: string };
}

export interface SmsTemplate {
  id: string;
  organizationId: string;
  name: string;
  usage: SmsMessageUsage;
  bodyText: string;
  usageCount: number;
  createdAt: string;
}
