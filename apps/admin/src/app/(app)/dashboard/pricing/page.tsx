import { coreApi } from "@/lib/api";
import { publishPricingRuleAction } from "../../actions";
import { Button, Card, CardTitle, CardBody, Field, Input, Table } from "@notifyafrica/ui";

/**
 * Minimal Pricing Engine admin (04_Prompt §14, 02_Specifications_Backoffice
 * §10): publishing a rule here changes what Website/Console/Core API
 * return immediately — no redeploy (04_Prompt §12 synchronization).
 */
export default async function PricingPage() {
  const { tiers, source } = await coreApi().listPricingTiers("SMS", "XOF");

  return (
    <div>
      <h1>Moteur de prix — SMS (XOF)</h1>
      <p className="text-muted">Source actuelle : {source === "admin" ? "publiée" : "seed design"}</p>

      <Card elevation="md" style={{ marginBottom: 24, overflow: "auto" }}>
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
                <td className="num">{t.unitPrice} {t.currency}</td>
                <td>{t.quoteRequired ? "Oui" : "Non"}</td>
              </tr>
            ))}
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
          <input type="hidden" name="productKey" value="SMS" />
          <Field label="Devise">
            <Input name="currency" defaultValue="XOF" required />
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
