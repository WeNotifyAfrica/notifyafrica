import { coreApi } from "@/lib/api";
import { ctaHref } from "@/lib/env";
import { Button, Card, Table, Tag } from "@notifyafrica/ui";
import type { HeroSection, FinalCtaSection, HomepageSection, WebsiteContent } from "@notifyafrica/types";

/**
 * Homepage — recreates design_handoff_notifyafrica/designs/
 * "NotifyAfrica - Site web (présentation).dc.html" (home state) against the
 * real Core API: hero/hero-preview/stats/how-it-works/use-cases/trust
 * copy comes from `website.homepageSections` + `website.content` (seeded,
 * Admin-editable — 04_Prompt §6), while every price shown (hero preview,
 * products, pricing table) comes from the Catalog/Pricing Engine, never a
 * local constant.
 */
export default async function HomePage() {
  const [{ products }, sections, content] = await Promise.all([
    coreApi.listCatalog(),
    coreApi.getConfig<HomepageSection[]>("website.homepageSections"),
    coreApi.getConfig<WebsiteContent>("website.content"),
  ]);

  const hero = sections.value?.find((s): s is HeroSection => s.key === "hero");
  const finalCta = sections.value?.find((s): s is FinalCtaSection => s.key === "cta_final");
  const publicProducts = products.filter((p) => p.publicPageEnabled).slice(0, 4);

  const heroPreview = content.value?.heroPreview;
  const heroEstimate = heroPreview
    ? await coreApi.estimatePricing({
        organizationId: null,
        projectId: null,
        product: "SMS",
        country: "TG",
        operator: null,
        category: null,
        quantity: heroPreview.recipients,
        currency: "XOF",
      })
    : null;

  // Fetched once per product and reused by both the product cards and the
  // pricing table below — avoids a duplicate /api/pricing/rules call per
  // product per render.
  const pricingByProduct = await Promise.all(
    publicProducts.map(async (p) => {
      const { tiers } = await coreApi.listPricingTiers(p.key, "XOF");
      const first = tiers[0];
      return {
        product: p,
        firstTier: first ?? null,
        fromPrice: first ? (first.quoteRequired ? "Sur devis" : `${first.unitPrice} ${first.currency}`) : "—",
        tierNote: tiers.length > 1 ? "Dégressif par volume" : "Tarif unique",
      };
    }),
  );

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "0 var(--space-8) calc(var(--space-8) * 3)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "calc(var(--space-8) * 2)" }}>
        {/* Hero */}
        {hero ? (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.15fr) minmax(0,1fr)",
              gap: "calc(var(--space-8) * 1.5)",
              alignItems: "center",
              padding: "calc(var(--space-8) * 1.5) 0",
              background:
                "radial-gradient(120% 80% at 8% 0%, color-mix(in srgb, var(--color-accent) 13%, transparent) 0%, transparent 62%)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <span style={{ display: "block", width: 36, height: 2, background: "var(--color-accent)" }} />
                <span className="text-muted" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  {hero.kicker}
                </span>
              </div>
              <h1 style={{ fontSize: "clamp(38px,5.4vw,64px)", lineHeight: 1.02, maxWidth: "17ch", margin: 0 }}>
                {hero.title.replace(hero.accentSpan, "")}
                <span style={{ color: "var(--color-accent-300)" }}>{hero.accentSpan}</span>
              </h1>
              <p className="text-muted" style={{ maxWidth: "46ch", fontSize: 17, margin: 0 }}>
                {hero.subtitle}
              </p>
              <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <a href={ctaHref(hero.cta.target, "homepage-hero")}>
                  <Button variant="primary">{hero.cta.label}</Button>
                </a>
                <a href={ctaHref(hero.secondaryCta.target, "homepage-hero")}>
                  <Button variant="secondary">{hero.secondaryCta.label}</Button>
                </a>
              </div>
              <p className="text-muted" style={{ margin: 0, fontSize: 12 }}>
                {hero.badge}
              </p>
            </div>

            {heroPreview && heroEstimate ? (
              <Card elevation="md" style={{ gap: "var(--space-4)" }}>
                <div className="card-kicker">Envoi en cours</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 15 }}>Campagne « {heroPreview.campaignLabel} »</span>
                  <Tag variant="accent">{heroPreview.statusLabel}</Tag>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  <Row label="Destinataires" value={heroPreview.recipients.toLocaleString("fr-FR")} />
                  <Row label="Livrés" value={heroPreview.delivered.toLocaleString("fr-FR")} />
                  <Row label="Prix unitaire" value={`${heroEstimate.unitPrice} ${heroEstimate.currency}`} />
                  <div
                    style={{
                      height: 4,
                      borderRadius: 2,
                      background: "var(--color-neutral-200)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.round((heroPreview.delivered / heroPreview.recipients) * 100)}%`,
                        height: "100%",
                        background: "var(--color-accent)",
                      }}
                    />
                  </div>
                </div>
                <hr className="hr" style={{ margin: "var(--space-2) 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 14 }}>Coût total</span>
                  <span className="num" style={{ fontSize: 20, color: "var(--color-accent-300)" }}>
                    {heroEstimate.total.toLocaleString("fr-FR")} {heroEstimate.currency}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    Solde après envoi
                  </span>
                  <span className="num text-muted" style={{ fontSize: 12 }}>
                    {heroPreview.balanceAfterLabel}
                  </span>
                </div>
              </Card>
            ) : null}
          </section>
        ) : null}

        {/* Stats */}
        {content.value ? (
          <section
            style={{
              borderRadius: "var(--radius-lg)",
              background: "var(--color-section)",
              padding: "calc(var(--space-8) * 1.6) calc(var(--space-8) * 1.5)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: "var(--space-8)",
            }}
          >
            {content.value.stats.map((s) => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                <div className="num" style={{ fontSize: "clamp(30px,3.4vw,42px)", color: "#ffffff", lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: "#cfd3e5" }}>{s.label}</div>
              </div>
            ))}
          </section>
        ) : null}

        {/* Products */}
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "var(--space-6)", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <h6 style={{ margin: 0, color: "var(--color-accent)" }}>Produits</h6>
              <h2 style={{ margin: 0, maxWidth: "22ch" }}>Quatre canaux, un seul compte</h2>
            </div>
            <p className="text-muted" style={{ margin: 0, maxWidth: "34ch", fontSize: 13 }}>
              Activez ce dont vous avez besoin. Un solde unique, une seule facture.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "var(--space-6)" }}>
            {pricingByProduct.map(({ product: p, firstTier }) => (
              <div
                key={p.id}
                className="card"
                style={{
                  gap: "var(--space-4)",
                  padding: "var(--space-8)",
                  boxShadow:
                    p.key === "SMS"
                      ? "0 0 0 1.5px var(--color-accent), 0 16px 40px rgba(27,27,36,.12)"
                      : "var(--shadow-sm)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      flex: "none",
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "var(--radius-md)",
                      background: p.key === "SMS" ? "var(--color-accent)" : "var(--color-accent-200)",
                      color: p.key === "SMS" ? "#ffffff" : "var(--color-accent-700)",
                      fontSize: 13,
                    }}
                  >
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span className="card-kicker">{p.category}</span>
                    <span className="card-title" style={{ fontSize: 19 }}>
                      {p.name}
                    </span>
                  </div>
                  {p.key === "SMS" ? <Tag variant="accent" style={{ marginLeft: "auto" }}>Le plus choisi</Tag> : null}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)" }}>
                  <span className="num" style={{ fontSize: 34, lineHeight: 1, color: "var(--color-accent-300)" }}>
                    {firstTier ? (firstTier.quoteRequired ? "Sur devis" : firstTier.unitPrice) : "—"}
                  </span>
                  {firstTier && !firstTier.quoteRequired ? (
                    <span className="text-muted" style={{ fontSize: 12 }}>
                      {firstTier.currency} / {p.billingUnit ?? "unité"}
                    </span>
                  ) : null}
                </div>
                <span style={{ display: "block", width: 48, height: 2, background: "var(--color-accent)" }} />
                <p className="card-body" style={{ fontSize: 13.5 }}>
                  {p.description ?? p.summary}
                </p>
                <p className="text-muted" style={{ margin: 0, fontSize: 12 }}>
                  {p.features.join(" · ")}
                </p>
                <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", marginTop: "auto" }}>
                  <a href="/produits">
                    <Button variant="primary">En savoir plus</Button>
                  </a>
                  <a href="/tarifs">
                    <Button variant="ghost">Tarifs</Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Simple setup + how it works */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "var(--space-8)", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <h6 style={{ color: "var(--color-accent)" }}>Simple à mettre en place</h6>
            <h2 style={{ margin: 0 }}>Opérationnel en une après-midi</h2>
            <p className="text-muted" style={{ margin: 0 }}>
              Vos équipes techniques branchent NotifyAfrica en quelques heures : environnement de test
              gratuit, documentation complète, suivi des envois en temps réel. Vos équipes métier
              envoient depuis une interface, sans code.
            </p>
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              {["Environnement de test", "Interface sans code", "Suivi temps réel", "Support local"].map((tag) => (
                <Tag key={tag} variant="neutral">
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <h6 style={{ color: "var(--color-accent)" }}>Comment ça marche</h6>
            {content.value?.howItWorks.map((s) => (
              <div key={s.n} style={{ display: "flex", gap: "var(--space-4)", alignItems: "baseline" }}>
                <span className="num" style={{ minWidth: 28, color: "var(--color-accent-300)" }}>
                  {s.n}
                </span>
                <div>
                  <div style={{ fontSize: 15 }}>{s.title}</div>
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Use cases */}
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <div>
            <h6 style={{ color: "var(--color-accent)" }}>Cas d&apos;usage</h6>
            <h2 style={{ margin: 0 }}>Ce que nos clients envoient</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: "var(--space-4)" }}>
            {content.value?.useCases.map((u) => (
              <Card key={u.title}>
                <div className="card-title" style={{ fontSize: 15 }}>
                  {u.title}
                </div>
                <p className="card-body">{u.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Pricing preview */}
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "var(--space-6)", flexWrap: "wrap" }}>
            <div>
              <h6 style={{ color: "var(--color-accent)" }}>Tarifs</h6>
              <h2 style={{ margin: 0 }}>Payez à l&apos;usage, sans abonnement</h2>
            </div>
            <a href="/tarifs">
              <Button variant="secondary">Voir tous les tarifs</Button>
            </a>
          </div>
          <Card elevation="md" style={{ padding: "var(--space-8)", overflow: "auto" }}>
            <Table style={{ minWidth: 540 }}>
              <thead>
                <tr>
                  <th>Canal</th>
                  <th>À partir de</th>
                  <th>Unité</th>
                  <th>Dégressivité</th>
                </tr>
              </thead>
              <tbody>
                {pricingByProduct.map(({ product, fromPrice, tierNote }) => (
                  <tr key={product.id}>
                    <td style={{ fontSize: 15 }}>{product.name}</td>
                    <td className="num" style={{ fontSize: 17, color: "var(--color-accent-300)" }}>
                      {fromPrice}
                    </td>
                    <td className="text-muted">par {product.billingUnit ?? "unité"}</td>
                    <td className="text-muted">{tierNote}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </section>

        {/* Trust */}
        {content.value ? (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "var(--space-4)" }}>
            {content.value.trustCards.map((t) => (
              <Card key={t.title} elevation="sm">
                <div className="card-kicker">{t.kicker}</div>
                <div className="card-title">{t.title}</div>
                <p className="card-body">{t.desc}</p>
                {t.meta ? <div className="card-meta num">{t.meta}</div> : null}
              </Card>
            ))}
          </section>
        ) : null}

        {/* Final CTA */}
        {finalCta ? (
          <section className="card elev-lg" style={{ alignItems: "flex-start", gap: "var(--space-4)", padding: "calc(var(--space-8) * 1.5)" }}>
            <h2 style={{ margin: 0, maxWidth: "24ch" }}>{finalCta.title}</h2>
            <p className="text-muted" style={{ margin: 0, maxWidth: "52ch" }}>
              {finalCta.subtitle}
            </p>
            <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <a href={ctaHref(finalCta.cta.target, "homepage-final-cta")}>
                <Button variant="primary">{finalCta.cta.label}</Button>
              </a>
              <a href={ctaHref(finalCta.secondaryCta.target, "homepage-final-cta")}>
                <Button variant="secondary">{finalCta.secondaryCta.label}</Button>
              </a>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)" }}>
      <span className="text-muted" style={{ fontSize: 13 }}>
        {label}
      </span>
      <span className="num" style={{ fontSize: 13 }}>
        {value}
      </span>
    </div>
  );
}
