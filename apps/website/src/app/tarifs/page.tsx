import { coreApi } from "@/lib/api";
import { consoleAuthUrl, ctaHref } from "@/lib/env";
import { PricingTabs } from "@/components/PricingTabs";
import { PricingFilters } from "@/components/PricingFilters";
import { Button, Card } from "@notifyafrica/ui";
import type { WebsiteContent } from "@notifyafrica/types";

export const metadata = {
  title: "Tarifs — NotifyAfrica",
  description: "Un prix par message, dégressif par volume. Prépayé, sans engagement.",
};

/** Recreates the mockup's "isPricing" state. Every number here — tier
 * prices, the example invoice — comes from a live Pricing Engine call;
 * only the payment-methods copy and enterprise blurb are seeded content. */
export default async function TarifsPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; currency?: string }>;
}) {
  const params = await searchParams;
  const country = params.country ?? "TG";
  const currency = (params.currency ?? "XOF") as "XOF";

  const [{ products }, content] = await Promise.all([
    coreApi.listCatalog(),
    coreApi.getConfig<WebsiteContent>("website.content"),
  ]);
  const publicProducts = products.filter((p) => p.publicPageEnabled);

  const tabsData = await Promise.all(
    publicProducts.map(async (product) => ({
      product,
      tiers: (await coreApi.listPricingTiers(product.key, currency)).tiers,
    })),
  );

  const exampleQuantity = 50000;
  const exampleEstimate = await coreApi.estimatePricing({
    organizationId: null,
    projectId: null,
    product: "SMS",
    country,
    operator: null,
    category: null,
    quantity: exampleQuantity,
    currency,
  });

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "calc(var(--space-8) * 1.5) var(--space-8)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "calc(var(--space-8) * 1.5)" }}>
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", alignItems: "flex-start" }}>
          <h6 style={{ color: "var(--color-accent)" }}>Tarifs</h6>
          <h1 style={{ margin: 0, maxWidth: "22ch" }}>Un prix par message, dégressif par volume</h1>
          <p className="text-muted" style={{ maxWidth: "60ch", margin: 0 }}>
            Prépayé, sans engagement. Plus vous envoyez, moins le message coûte cher. Au-delà de
            100 000 messages, nous construisons une offre avec vous.
          </p>
          <PricingFilters country={country} currency={currency} />
        </section>

        {tabsData.length > 0 ? <PricingTabs data={tabsData} /> : null}

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: "var(--space-8)", alignItems: "start" }}>
          <Card elevation="sm">
            <div className="card-kicker">Exemple de facture</div>
            <div className="card-title" style={{ fontSize: 16 }}>
              {exampleQuantity.toLocaleString("fr-FR")} SMS vers le{" "}
              {country === "TG" ? "Togo" : country}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              <InvoiceRow label="Prix unitaire" value={`${exampleEstimate.unitPrice} ${exampleEstimate.currency}`} />
              <InvoiceRow label="Sous-total" value={`${exampleEstimate.subtotal.toLocaleString("fr-FR")} ${exampleEstimate.currency}`} />
              <InvoiceRow
                label="Remise"
                value={
                  exampleEstimate.discounts.length > 0
                    ? `${exampleEstimate.discounts.reduce((s, d) => s + d.amount, 0)} ${exampleEstimate.currency}`
                    : `0 ${exampleEstimate.currency}`
                }
              />
              <hr className="hr" style={{ margin: "var(--space-2) 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-3)" }}>
                <span style={{ fontSize: 14 }}>Total</span>
                <span className="num" style={{ fontSize: 20, color: "var(--color-accent-300)" }}>
                  {exampleEstimate.total.toLocaleString("fr-FR")} {exampleEstimate.currency}
                </span>
              </div>
            </div>
            <a href={consoleAuthUrl("register", { source: "tarifs-example-invoice" })}>
              <Button variant="primary" block>
                Créer un compte pour envoyer
              </Button>
            </a>
          </Card>

          <Card elevation="sm" accentBorder>
            <div className="card-kicker">Gros volumes</div>
            <p className="card-body">
              Au-delà de 100 000 messages par mois, le tarif est négocié : routes dédiées, engagement
              de qualité de service et prix construit avec votre équipe.
            </p>
            <a href={ctaHref("quote", "tarifs-high-volume")} style={{ alignSelf: "flex-start" }}>
              <Button variant="secondary">Demander un devis</Button>
            </a>
          </Card>
        </section>

        {content.value ? (
          <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <h4 style={{ margin: 0 }}>Moyens de paiement acceptés</h4>
            <p className="text-muted" style={{ margin: 0, maxWidth: "60ch" }}>
              Les méthodes disponibles dépendent de votre pays.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: "var(--space-3)" }}>
              {content.value.paymentMethods.map((m) => (
                <Card key={m.title}>
                  <div className="card-title" style={{ fontSize: 14 }}>
                    {m.title}
                  </div>
                  <p className="card-body">{m.desc}</p>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        <section className="card elev-lg" style={{ gap: "var(--space-4)", padding: "calc(var(--space-8) * 1.5)", alignItems: "flex-start" }}>
          <div className="card-kicker">Enterprise</div>
          <h2 style={{ margin: 0, maxWidth: "26ch" }}>Gros volumes, intégration dédiée, tarif négocié</h2>
          <p className="text-muted" style={{ margin: 0, maxWidth: "56ch" }}>
            Contrat sur mesure, routes dédiées, engagement de service, support prioritaire. Le devis
            accepté devient automatiquement votre grille tarifaire.
          </p>
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <a href={ctaHref("quote", "tarifs-enterprise")}>
              <Button variant="primary">Demander un devis</Button>
            </a>
            <a href={ctaHref("contact", "tarifs-enterprise")}>
              <Button variant="secondary">Parler à un commercial</Button>
            </a>
          </div>
        </section>

        <p className="text-muted" style={{ fontSize: 11, margin: 0, maxWidth: "70ch" }}>
          Prix hors taxes, par message envoyé, susceptibles d&apos;évoluer selon les tarifs
          opérateurs. Les montants présentés ici sont pilotés depuis l&apos;espace
          d&apos;administration NotifyAfrica.
        </p>
      </div>
    </main>
  );
}

function InvoiceRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
      <span className="text-muted" style={{ fontSize: 13 }}>
        {label}
      </span>
      <span className="num" style={{ fontSize: 13 }}>
        {value}
      </span>
    </div>
  );
}

export const dynamic = "force-dynamic";
