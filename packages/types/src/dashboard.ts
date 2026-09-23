import type { Wallet } from "./wallet";

export interface DashboardActivityItem {
  id: string;
  kind: "message" | "transaction";
  label: string;
  status: string;
  createdAt: string;
}

export interface DashboardSummary {
  wallet: Wallet | null;
  messagesByProductThisMonth: { product: string; count: number }[];
  activeCampaigns: number;
  pendingQuotes: number;
  activity: DashboardActivityItem[];
}

export interface AdminDashboardSummary {
  organizationCount: number;
  revenueThisMonth: { currency: string; totalMinor: string }[];
  pendingQuotes: number;
  pendingWhatsappTemplates: number;
  pendingTransactions: number;
  recentNotifications: { id: string; event: string; createdAt: string }[];
  recentAuditLog: {
    id: string;
    action: string;
    resource: string;
    actorEmail: string | null;
    reason: string | null;
    createdAt: string;
  }[];
}
