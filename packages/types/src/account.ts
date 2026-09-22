import type { ConsoleRole } from "@notifyafrica/design-system";

export interface User {
  id: string;
  email: string;
  phone: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  status: "ACTIVE" | "SUSPENDED";
}

export interface Organization {
  id: string;
  name: string;
  country: string;
  currency: string;
  createdAt: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  environment: "sandbox" | "production";
}

export interface Membership {
  userId: string;
  organizationId: string;
  role: ConsoleRole;
}
