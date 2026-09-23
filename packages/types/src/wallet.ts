/** Wallet balances are exact integer minor units, serialized as strings over
 * the wire (BigInt isn't JSON-native) — 00_Contexte_Global §19. */
export interface Wallet {
  id: string;
  organizationId: string;
  currency: string;
  availableMinor: string;
  reservedMinor: string;
}

export type MessageStatus = "QUEUED" | "SENT" | "FAILED";

export interface Message {
  id: string;
  organizationId: string;
  projectId: string;
  product: string;
  senderId: string | null;
  destination: string;
  content: string;
  status: MessageStatus;
  createdAt: string;
}

export interface Transaction {
  id: string;
  organizationId: string;
  projectId: string | null;
  type: string;
  amountMinor: string;
  currency: string;
  status: string;
  createdAt: string;
  /** Present only when the Core API included it (Admin's transactions list). */
  organization?: { id: string; name: string };
}
