import type { Currency } from "@notifyafrica/types";

function currencyMeta(currencyCode: string, currencies: Currency[]) {
  const currency = currencies.find((c) => c.code === currencyCode);
  return { decimals: currency?.decimals ?? 0, symbol: currency?.symbol ?? currencyCode };
}

function formatNumber(amount: number, decimals: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/** Formats a *minor-unit* amount — Wallet.availableMinor/reservedMinor,
 * Transaction.amountMinor, Campaign.heldAmountMinor (string or number, as
 * returned over the wire — 00_Contexte_Global §19). Divides by the
 * currency's real `decimals` from `catalog.currencies` before formatting
 * (never a hardcoded assumption): 97600 minor units at 2 decimals is
 * 976.00, not 97600 — a currency with 0 decimals like XOF divides by 1, so
 * minor and major units are the same number there. Falls back to 0
 * decimals if the currency isn't in the list yet (still correct, just less
 * pretty). Never use this on a Pricing Engine result (unitPrice/subtotal/
 * total) — those are already major-unit decimals; use `formatPrice`. */
export function formatMoney(amountMinor: string | number, currencyCode: string, currencies: Currency[]): string {
  const { decimals, symbol } = currencyMeta(currencyCode, currencies);
  const minor = typeof amountMinor === "string" ? Number(amountMinor) : amountMinor;
  return `${formatNumber(minor / 10 ** decimals, decimals)} ${symbol}`;
}

/** Formats an already-major-unit *rate* — the Pricing Engine's
 * unitPrice/subtotal/total (e.g. 24 XOF, or 6.10 XOF/message). Deliberately
 * ignores the currency's official `decimals` (that's about the smallest
 * unit that changes hands in a real transaction — XOF has none): a
 * per-message *rate* still needs fractional precision to be meaningful
 * even in a currency with no minor unit, exactly as the design handoff's
 * own mockup shows ("6,10 FCFA / message"). Shows 2 decimals only when the
 * amount actually has a fractional part. */
export function formatPrice(amount: string | number, currencyCode: string, currencies: Currency[]): string {
  const { symbol } = currencyMeta(currencyCode, currencies);
  const major = typeof amount === "string" ? Number(amount) : amount;
  return `${formatNumber(major, Number.isInteger(major) ? 0 : 2)} ${symbol}`;
}
