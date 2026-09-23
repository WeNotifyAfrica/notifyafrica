"use client";

import { useState } from "react";
import { Card, Table } from "@notifyafrica/ui";
import type { CatalogProduct } from "@notifyafrica/types";

export interface ProductTiers {
  product: CatalogProduct;
  tiers: { volumeMin: number; volumeMax: number | null; unitPrice: number; currency: string; quoteRequired: boolean }[];
}

/**
 * Product tab switcher on /tarifs — all products' tiers are fetched
 * server-side up front (one request per product, done once per page load),
 * so switching tabs is pure client state with zero extra network calls.
 */
export function PricingTabs({ data }: { data: ProductTiers[] }) {
  const [activeKey, setActiveKey] = useState(data[0]?.product.key);
  const active = data.find((d) => d.product.key === activeKey) ?? data[0];

  if (!active) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        {data.map((d) => {
          const on = d.product.key === active.product.key;
          return (
            <button
              key={d.product.key}
              type="button"
              className="btn"
              onClick={() => setActiveKey(d.product.key)}
              style={{
                whiteSpace: "nowrap",
                color: on ? "var(--color-accent)" : "var(--color-text)",
                borderColor: on ? "var(--color-accent)" : "var(--color-divider)",
                background: on ? "color-mix(in srgb, var(--color-accent) 12%, transparent)" : "transparent",
              }}
            >
              {d.product.name}
            </button>
          );
        })}
      </div>

      <Card elevation="md" style={{ gap: "var(--space-4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <div>
            <div className="card-kicker">Paliers de volume</div>
            <div className="card-title" style={{ fontSize: 20 }}>
              {active.product.name}
            </div>
          </div>
          <span className="tag tag-neutral">par {active.product.billingUnit ?? "unité"}</span>
        </div>
        <div style={{ overflow: "auto" }}>
          <Table style={{ minWidth: 520 }}>
            <thead>
              <tr>
                <th>Volume mensuel</th>
                <th>Prix unitaire</th>
              </tr>
            </thead>
            <tbody>
              {active.tiers.map((t, i) => (
                <tr key={i}>
                  <td className="num">
                    {t.volumeMin.toLocaleString("fr-FR")}
                    {t.volumeMax ? ` – ${t.volumeMax.toLocaleString("fr-FR")}` : "+"}
                  </td>
                  <td className="num" style={{ color: "var(--color-accent-300)" }}>
                    {t.quoteRequired ? "Sur devis" : `${t.unitPrice} ${t.currency}`}
                  </td>
                </tr>
              ))}
              {active.tiers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-muted">
                    Tarification sur devis pour ce produit.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
