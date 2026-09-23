export type QuoteStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "INFO_REQUIRED"
  | "OFFER_AVAILABLE"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

export interface QuoteOffer {
  unitPrice: number;
  total: number;
  currency: string;
  notes: string | null;
}

export interface QuotePayload {
  country: string;
  quantity: number;
  currency: string;
  notes: string | null;
  offer?: QuoteOffer;
}

export interface Quote {
  id: string;
  organizationId: string;
  productKey: string;
  status: QuoteStatus;
  payload: QuotePayload;
  createdAt: string;
  updatedAt: string;
  /** Present only on Admin's list (joins the requesting org's name). */
  organization?: { id: string; name: string };
}
