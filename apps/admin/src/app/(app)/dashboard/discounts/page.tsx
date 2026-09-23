import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { createDiscountRuleAction } from "./actions";
import { Button, Card, CardTitle, CardBody, Field, Input, Table, Tag } from "@notifyafrica/ui";
import { discountTypeSchema, discountScopeSchema } from "@notifyafrica/validation";

/**
 * Discount Engine (02_Specifications_Backoffice §13). Exclusive by
 * default — the highest-priority matching rule wins — unless marked
 * `stackable` (design handoff invariant #1).
 */
export default async function DiscountsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const { rules } = await coreApi(token).listDiscountRules();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
      <div>
        <h1>Remises</h1>
        <Card elevation="md" style={{ overflow: "auto" }}>
          <Table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Produit</th>
                <th>Portée</th>
                <th>Valeur</th>
                <th>Priorité</th>
                <th>Cumulable</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Tag variant="outline">{r.type}</Tag>
                  </td>
                  <td>{r.productKey ?? "Tous"}</td>
                  <td>
                    {r.scope}
                    {r.scopeId ? ` (${r.scopeId})` : ""}
                  </td>
                  <td className="num">{r.value}</td>
                  <td className="num">{r.priority}</td>
                  <td>{r.stackable ? "Oui" : "Non"}</td>
                </tr>
              ))}
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted">
                    Aucune remise configurée pour l&apos;instant.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </Card>
      </div>

      <Card elevation="sm">
        <CardTitle>Nouvelle remise</CardTitle>
        <CardBody>
          Sans priorité plus haute qu&apos;une autre remise, la plus prioritaire l&apos;emporte
          seule — cochez &laquo; cumulable &raquo; pour qu&apos;elle s&apos;additionne aux autres
          remises également cumulables.
        </CardBody>
        <form
          action={createDiscountRuleAction}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <Field label="Type">
            <select name="type" className="input" defaultValue="PERCENT">
              {discountTypeSchema.options.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Produit (vide = tous)">
            <Input name="productKey" placeholder="SMS" />
          </Field>
          <Field label="Portée">
            <select name="scope" className="input" defaultValue="GLOBAL">
              {discountScopeSchema.options.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ID de portée (pays/organisation/projet, si applicable)">
            <Input name="scopeId" />
          </Field>
          <Field label="Valeur (%, montant, ou prix fixe selon le type)">
            <Input name="value" type="number" step="0.01" required />
          </Field>
          <Field label="Priorité">
            <Input name="priority" type="number" defaultValue={0} />
          </Field>
          <Field label="Plafond de remise (optionnel)">
            <Input name="maxDiscount" type="number" step="0.01" />
          </Field>
          <label className="radio">
            <input type="checkbox" name="stackable" />
            Cumulable avec d&apos;autres remises cumulables
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
