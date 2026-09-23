import type { Currency } from "@notifyafrica/types";

/** Formats a minor-unit amount (string or number, as returned over the wire —
 * see 00_Contexte_Global §19) using the real decimals/symbol from
 * `catalog.currencies`, never a hardcoded assumption per currency. Falls
 * back to the raw ISO code with 0 decimals if the currency isn't in the
 * list yet (still correct, just less pretty). */
export function formatMoney(amountMinor: string | number, currencyCode: string, currencies: Currency[]): string {
  const currency = currencies.find((c) => c.code === currencyCode);
  const decimals = currency?.decimals ?? 0;
  const symbol = currency?.symbol ?? currencyCode;
  const amount = typeof amountMinor === "string" ? Number(amountMinor) : amountMinor;
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  return `${formatted} ${symbol}`;
}
