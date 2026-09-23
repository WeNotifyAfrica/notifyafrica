export type CampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "QUEUED"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export interface Campaign {
  id: string;
  organizationId: string;
  projectId: string;
  name: string;
  product: string;
  senderId: string | null;
  content: string;
  destinations: string[];
  status: CampaignStatus;
  unitPrice: number | null;
  currency: string | null;
  estimatedTotal: number | null;
  sentCount: number;
  failedCount: number;
  totalCount: number;
  createdAt: string;
  updatedAt: string;
}
