export type PaymentMethodFamily = "MOBILE_MONEY" | "CARD" | "BANK_TRANSFER" | "INVOICE";

export interface PaymentMethod {
  id: string;
  name: string;
  family: PaymentMethodFamily;
  countries: string[];
  minAmount: number | null;
  maxAmount: number | null;
  feePercent: number;
  instant: boolean;
  status: string;
  createdAt: string;
}
