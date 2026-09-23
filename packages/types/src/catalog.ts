export type ProductStatus = "ACTIVE" | "BETA" | "COMING_SOON" | "PRIVATE" | "DISABLED";

export type ProductKey = "SMS" | "OTP" | "WHATSAPP" | "EMAIL" | "PAYMENT_COLLECTION" | "PAYOUT";

export interface CatalogProduct {
  id: string;
  key: ProductKey | string;
  name: string;
  slug: string;
  category: string;
  summary: string | null;
  description: string | null;
  icon: string | null;
  /** Short feature tags for the public product card. */
  features: string[];
  /** Billing unit label, e.g. "message" -> rendered as "par message". */
  billingUnit: string | null;
  countries: string[];
  status: ProductStatus;
  publicPageEnabled: boolean;
  order: number;
}
