"use client";

import { SUPPORTED_CURRENCIES } from "@notifyafrica/design-system";

const COUNTRIES = [
  { code: "TG", name: "Togo" },
  { code: "BJ", name: "Bénin" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "SN", name: "Sénégal" },
  { code: "BF", name: "Burkina Faso" },
  { code: "ML", name: "Mali" },
];

/**
 * Submits a plain GET form so the server component re-fetches tiers in the
 * chosen currency (real effect). The country field is passed through too,
 * but current pricing rules are country-agnostic (`countryCode: null`) —
 * it's wired for when country-specific rules exist, not decorative-only.
 */
export function PricingFilters({ country, currency }: { country: string; currency: string }) {
  return (
    <form method="GET" style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap", alignItems: "flex-end" }}>
      <div className="field" style={{ minWidth: 190 }}>
        <label>Pays de destination</label>
        <select
          name="country"
          className="input"
          defaultValue={country}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field" style={{ minWidth: 160 }}>
        <label>Devise d&apos;affichage</label>
        <select
          name="currency"
          className="input"
          defaultValue={currency}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}
