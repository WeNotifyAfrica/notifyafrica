import { coreApi } from "@/lib/api";
import { publishPricingRuleAction } from "../../actions";
import { Button, Card, CardTitle, CardBody, Field, Input, Table, formatPrice } from "@notifyafrica/ui";

/**
 * Pricing Engine admin (04_Prompt §14, design handoff Lot 21: "règles,
 * constructeur, paliers... versions et audit"). Publishing a rule here
 * changes what Website/Console/Core API return immediately — no redeploy
 * (04_Prompt §12 synchronization). The impact simulator and full version/
 * audit history the mockup shows aren't built yet (see docs/ARCHITECTURE.md);
 * this covers the rule builder and the currently-active tier table for any
 * product/currency, driven entirely by the real Catalog/Pricing APIs — no
 * hardcoded product or currency list.
 */
export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; currency?: string }>;
}) {
  const params = await searchParams;
  const api = coreApi();
  const [{ products }, currenciesConfig] = await Promise.all([api.listCatalog(), api.listCurrencies()]);
  const currencies = currenciesConfig.value ?? [];
  const product = params.product ?? products[0]?.key ?? "SMS";
  const currency = params.currency ?? currencies[0]?.code ?? "XOF";

  const { tiers, source } = await api.listPricingTiers(product, currency);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div>
        <h1>Moteur de prix</h1>
        <p className="text-muted">Source actuelle : {source === "admin" ? "publiée" : "seed design"}</p>
      </div>

      <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="seg">
          {products.map((p) => (
            <a
              key={p.key}
              href={`?product=${encodeURIComponent(p.key)}&currency=${encodeURIComponent(currency)}`}
              className="seg-opt"
              style={p.key === product ? { color: "var(--color-accent)", boxShadow: "inset 0 0 0 1px var(--color-accent)" } : undefined}
            >
              {p.name}
            </a>
          ))}
        </div>
        <form method="get" style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-end" }}>
          <input type="hidden" name="product" value={product} />
          <Field label="Devise">
            <select name="currency" defaultValue={currency} className="input">
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </Field>
          <Button type="submit" variant="secondary">
            Filtrer
          </Button>
        </form>
      </div>

      <Card elevation="md" style={{ overflow: "auto" }}>
        <CardTitle>
          {products.find((p) => p.key === product)?.name ?? product} — {currency}
        </CardTitle>
        <Table>
          <thead>
            <tr>
              <th>Volume</th>
              <th>Prix unitaire</th>
              <th>Devis requis</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t, i) => (
              <tr key={i}>
                <td>
                  {t.volumeMin.toLocaleString("fr-FR")}
                  {t.volumeMax ? ` - ${t.volumeMax.toLocaleString("fr-FR")}` : "+"}
                </td>
                <td className="num">{formatPrice(t.unitPrice, t.currency, currencies)}</td>
                <td>{t.quoteRequired ? "Oui" : "Non"}</td>
              </tr>
            ))}
            {tiers.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-muted">
                  Aucune tranche publiée pour {product} en {currency}.
                </td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </Card>

      <Card elevation="sm">
        <CardTitle>Publier une nouvelle tranche</CardTitle>
        <CardBody>Archive automatiquement toute tranche existante sur le même palier.</CardBody>
        <form
          action={publishPricingRuleAction}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <Field label="Produit">
            <select name="productKey" defaultValue={product} className="input" required>
              {products.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Devise">
            <select name="currency" defaultValue={currency} className="input" required>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prix unitaire">
            <Input name="basePrice" type="number" step="0.01" required />
          </Field>
          <Field label="Volume minimum">
            <Input name="volumeMin" type="number" defaultValue={0} required />
          </Field>
          <Field label="Volume maximum (vide = illimité)">
            <Input name="volumeMax" type="number" />
          </Field>
          <label className="radio">
            <input type="checkbox" name="quoteRequired" />
            Devis requis au-delà
          </label>
          <div />
          <Field label="Motif (obligatoire, audité)">
            <Input name="reason" required />
          </Field>
          <Button type="submit" variant="primary">
            Publier
          </Button>
        </form>
      </Card>
    </div>
  );
}

export const dynamic = "force-dynamic";
