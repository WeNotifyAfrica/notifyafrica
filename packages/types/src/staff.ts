import type { InternalRole } from "@notifyafrica/design-system";

export interface StaffMember {
  id: string;
  email: string;
  internalRole: InternalRole | null;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
}
