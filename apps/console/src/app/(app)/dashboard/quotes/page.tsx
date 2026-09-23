import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { requestQuoteAction } from "./actions";
import { Button, Card, CardTitle, CardBody, Field, Input, Table, Tag } from "@notifyafrica/ui";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SUBMITTED: "Envoyé",
  UNDER_REVIEW: "En cours d'examen",
  INFO_REQUIRED: "Information requise",
  OFFER_AVAILABLE: "Offre disponible",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  EXPIRED: "Expiré",
};

/** Devis (03_Specifications_Console §19-20). Requesting a quote fires
 * QUOTE_REQUESTED, which the Admin notification center picks up
 * (02_Specifications_Backoffice §26.3), same pattern as USER_REGISTERED. */
export default async function QuotesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const api = coreApi(token);

  const [{ quotes }, { products }] = await Promise.all([api.listQuotes(), api.listCatalog()]);
  const publicProducts = products.filter((p) => p.publicPageEnabled);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
      <div>
        <h1>Devis</h1>
        <Card elevation="md" style={{ overflow: "auto" }}>
          <Table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Volume</th>
                <th>Statut</th>
                <th>Offre</th>
                <th>Demandé le</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td>{q.productKey}</td>
                  <td className="num">{q.payload.quantity.toLocaleString("fr-FR")}</td>
                  <td>
                    <Tag variant={q.status === "ACCEPTED" ? "accent" : q.status === "REJECTED" ? "neutral" : "outline"}>
                      {STATUS_LABELS[q.status] ?? q.status}
                    </Tag>
                  </td>
                  <td className="num">
                    {q.payload.offer ? `${q.payload.offer.unitPrice} ${q.payload.offer.currency}` : "—"}
                  </td>
                  <td className="num">{new Date(q.createdAt).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted">
                    Aucun devis demandé pour l&apos;instant.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </Card>
      </div>

      <Card elevation="sm">
        <CardTitle>Demander un devis</CardTitle>
        <CardBody>
          Au-delà des paliers publiés, un devis vous permet d&apos;obtenir un tarif négocié pour un
          volume donné.
        </CardBody>
        <form action={requestQuoteAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Produit">
            <select name="productKey" className="input" required>
              {publicProducts.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Pays (code ISO)">
            <Input name="country" maxLength={2} defaultValue="TG" required />
          </Field>
          <Field label="Volume mensuel estimé">
            <Input name="quantity" type="number" min={1} defaultValue={150000} required />
          </Field>
          <Field label="Devise">
            <Input name="currency" defaultValue="XOF" required />
          </Field>
          <Field label="Notes (optionnel)">
            <Input name="notes" />
          </Field>
          <Button type="submit" variant="primary">
            Envoyer la demande
          </Button>
        </form>
      </Card>
    </div>
  );
}

export const dynamic = "force-dynamic";
