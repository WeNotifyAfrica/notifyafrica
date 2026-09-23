import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { updateQuoteStatusAction } from "./actions";
import { Button, Card, CardTitle, CardBody, Field, Input, Tag } from "@notifyafrica/ui";
import { quoteStatusSchema } from "@notifyafrica/validation";

/**
 * Quotes pipeline (02_Specifications_Backoffice §14). Each card is one
 * quote with an inline status-transition form; setting a unit price while
 * moving to ACCEPTED converts the quote into a binding organization-scoped
 * pricing rule (apps/core-api/src/app/api/admin/quotes/[id]/status/route.ts).
 */
export default async function AdminQuotesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const { quotes } = await coreApi(token).listAdminQuotes();

  return (
    <div>
      <h1>Devis</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {quotes.map((q) => (
          <Card key={q.id} elevation="sm">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <div>
                <CardTitle>
                  {q.organization?.name ?? q.organizationId} — {q.productKey}
                </CardTitle>
                <CardBody>
                  {q.payload.quantity.toLocaleString("fr-FR")} / mois · {q.payload.country} ·{" "}
                  {q.payload.notes ?? "Aucune note"}
                </CardBody>
              </div>
              <Tag variant={q.status === "ACCEPTED" ? "accent" : "neutral"}>{q.status}</Tag>
            </div>
            {q.payload.offer ? (
              <p className="text-muted" style={{ fontSize: 13 }}>
                Offre actuelle : {q.payload.offer.unitPrice} {q.payload.offer.currency} / unité
              </p>
            ) : null}
            <form
              action={updateQuoteStatusAction}
              style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 8, alignItems: "end" }}
            >
              <input type="hidden" name="id" value={q.id} />
              <input type="hidden" name="quantity" value={q.payload.quantity} />
              <Field label="Nouveau statut">
                <select name="status" className="input" defaultValue={q.status}>
                  {quoteStatusSchema.options.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Prix unitaire (si offre)">
                <Input name="unitPrice" type="number" step="0.01" />
              </Field>
              <Field label="Devise">
                <Input name="currency" defaultValue={q.payload.currency} />
              </Field>
              <Field label="Motif (audité)">
                <Input name="reason" required />
              </Field>
              <Button type="submit" variant="primary">
                Mettre à jour
              </Button>
            </form>
          </Card>
        ))}
        {quotes.length === 0 ? (
          <Card elevation="sm">
            <CardBody>Aucune demande de devis pour l&apos;instant.</CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
