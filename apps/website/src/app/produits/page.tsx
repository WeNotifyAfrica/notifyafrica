import { coreApi } from "@/lib/api";
import { env } from "@/lib/env";
import { Button, Card, Tag } from "@notifyafrica/ui";

export const metadata = {
  title: "Produits — NotifyAfrica",
  description: "SMS, codes OTP, WhatsApp Business et Email — quatre canaux, une seule plateforme.",
};

/** Recreates the mockup's "isProducts" state: one full-width card per
 * public product, each with its from-price pulled live from the Pricing
 * Engine (01_Specifications_Website §9). */
export default async function ProduitsPage() {
  const { products } = await coreApi.listCatalog();
  const publicProducts = products.filter((p) => p.publicPageEnabled);

  const withPricing = await Promise.all(
    publicProducts.map(async (p) => {
      const { tiers } = await coreApi.listPricingTiers(p.key, "XOF");
      const first = tiers[0];
      return {
        product: p,
        fromLabel: first
          ? first.quoteRequired
            ? "Sur devis"
            : `à partir de ${first.unitPrice} ${first.currency} / ${p.billingUnit ?? "unité"}`
          : "Tarif à venir",
      };
    }),
  );

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "calc(var(--space-8) * 1.5) var(--space-8)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "calc(var(--space-8) * 1.5)" }}>
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", alignItems: "flex-start" }}>
          <h6 style={{ color: "var(--color-accent)" }}>Produits</h6>
          <h1 style={{ margin: 0, maxWidth: "24ch" }}>Quatre canaux, une seule plateforme</h1>
          <p className="text-muted" style={{ maxWidth: "62ch", margin: 0 }}>
            Chaque canal s&apos;active indépendamment sur votre compte. Vous payez uniquement ce que
            vous envoyez, au même endroit, avec le même solde.
          </p>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
          {withPricing.map(({ product: p, fromLabel }) => (
            <Card key={p.id} elevation="md" style={{ gap: "var(--space-4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-4)", flexWrap: "wrap" }}>
                <div>
                  <div className="card-kicker">{p.category}</div>
                  <h3 style={{ margin: 0 }}>{p.name}</h3>
                </div>
                <Tag variant="accent">{fromLabel}</Tag>
              </div>
              <p className="card-body" style={{ fontSize: 14 }}>
                {p.description ?? p.summary}
              </p>
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                {p.features.map((f) => (
                  <Tag key={f} variant="neutral">
                    {f}
                  </Tag>
                ))}
              </div>
              <a href="/tarifs" style={{ alignSelf: "flex-start" }}>
                <Button variant="ghost">Voir les tarifs {p.name} →</Button>
              </a>
            </Card>
          ))}
        </section>

        <section className="card elev-lg" style={{ alignItems: "flex-start", gap: "var(--space-4)", padding: "calc(var(--space-8) * 1.5)" }}>
          <h2 style={{ margin: 0, maxWidth: "26ch" }}>Vous ne savez pas quel canal choisir ?</h2>
          <p className="text-muted" style={{ margin: 0, maxWidth: "52ch" }}>
            Nos équipes analysent vos usages et vous recommandent la combinaison la moins coûteuse.
          </p>
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <a href={`mailto:${env.contactEmail}`}>
              <Button variant="primary">Parler à un expert</Button>
            </a>
            <a href="/tarifs">
              <Button variant="secondary">Comparer les tarifs</Button>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
