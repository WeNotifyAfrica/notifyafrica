import type { ConsoleRole } from "@notifyafrica/design-system";

export interface TeamMember {
  userId: string;
  email: string;
  status: string;
  role: ConsoleRole;
  memberSince: string;
}

export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

export interface Invitation {
  id: string;
  email: string;
  role: ConsoleRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

export interface ApiKeySummary {
  id: string;
  name: string;
  environment: "sandbox" | "production";
  prefix: string;
  scopes: string[];
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}
