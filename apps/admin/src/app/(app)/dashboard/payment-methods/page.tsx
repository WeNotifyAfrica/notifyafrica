import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { createPaymentMethodAction } from "./actions";
import { Button, Card, CardTitle, CardBody, Field, Input, Table, Tag } from "@notifyafrica/ui";
import { paymentMethodFamilySchema } from "@notifyafrica/validation";

const FAMILY_LABELS: Record<string, string> = {
  MOBILE_MONEY: "Mobile Money",
  CARD: "Carte",
  BANK_TRANSFER: "Virement",
  INVOICE: "Facturation",
};

/** Moyens de paiement (02_Specifications_Backoffice §23). */
export default async function PaymentMethodsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const { methods } = await coreApi(token).listAdminPaymentMethods();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
      <div>
        <h1>Moyens de paiement</h1>
        <Card elevation="md" style={{ overflow: "auto" }}>
          <Table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Famille</th>
                <th>Pays</th>
                <th>Frais</th>
                <th>Délai</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>
                    <Tag variant="neutral">{FAMILY_LABELS[m.family] ?? m.family}</Tag>
                  </td>
                  <td>{m.countries.length === 0 ? "Tous" : m.countries.join(", ")}</td>
                  <td className="num">{m.feePercent}%</td>
                  <td>{m.instant ? "Immédiat" : "24-48h"}</td>
                </tr>
              ))}
              {methods.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted">
                    Aucun moyen de paiement configuré pour l&apos;instant.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </Card>
      </div>

      <Card elevation="sm">
        <CardTitle>Nouveau moyen de paiement</CardTitle>
        <CardBody>
          Un moyen non instantané (virement, facturation) laisse la transaction &laquo;&nbsp;En
          attente&nbsp;&raquo; jusqu&apos;à confirmation manuelle dans Transactions.
        </CardBody>
        <form
          action={createPaymentMethodAction}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <Field label="Nom">
            <Input name="name" placeholder="Mobile Money" required />
          </Field>
          <Field label="Famille">
            <select name="family" className="input" defaultValue="MOBILE_MONEY">
              {paymentMethodFamilySchema.options.map((f) => (
                <option key={f} value={f}>
                  {FAMILY_LABELS[f] ?? f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Pays éligibles (codes ISO séparés par des virgules, vide = tous)">
            <Input name="countries" placeholder="TG, CI, SN" />
          </Field>
          <Field label="Montant minimum (optionnel)">
            <Input name="minAmount" type="number" step="0.01" />
          </Field>
          <Field label="Montant maximum (optionnel)">
            <Input name="maxAmount" type="number" step="0.01" />
          </Field>
          <Field label="Frais (%)">
            <Input name="feePercent" type="number" step="0.01" defaultValue={0} />
          </Field>
          <label className="radio">
            <input type="checkbox" name="instant" defaultChecked />
            Crédit immédiat
          </label>
          <Button type="submit" variant="primary">
            Créer
          </Button>
        </form>
      </Card>
    </div>
  );
}

export const dynamic = "force-dynamic";
