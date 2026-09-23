export interface OtpConfig {
  id: string;
  name: string;
  length: number;
  expirySeconds: number;
  maxAttempts: number;
  resendCooldownSeconds: number;
  channel: string;
  fallbackChannel: string | null;
  template: string;
  createdAt: string;
}

export type OtpStatus = "PENDING" | "VERIFIED" | "EXPIRED" | "FAILED";

export interface OtpCodeSummary {
  id: string;
  destination: string;
  status: OtpStatus;
  attempts: number;
  expiresAt: string;
  createdAt: string;
}
