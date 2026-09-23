import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { topupAction } from "./actions";
import { Button, Card, CardTitle, CardBody, Field, Input, Table, Tag } from "@notifyafrica/ui";

const ERROR_LABELS: Record<string, string> = {
  payment_method_not_eligible: "Ce moyen de paiement n'est pas disponible dans votre pays.",
  amount_below_minimum: "Montant inférieur au minimum autorisé pour ce moyen de paiement.",
  amount_above_maximum: "Montant supérieur au maximum autorisé pour ce moyen de paiement.",
  payment_failed: "Le paiement a échoué. Réessayez.",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CAPTURED: "Confirmé",
};

/**
 * Wallet + recharge (03_Specifications_Console §8-9, §28). Instant methods
 * (Mobile Money, carte) créditent immédiatement ; les méthodes non
 * instantanées (virement, facturation mensuelle) restent "En attente"
 * jusqu'à confirmation par Admin.
 */
export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ recharged?: string; error?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const api = coreApi(token);

  const [{ wallet }, { methods }, { transactions }] = await Promise.all([
    api.getWallet(),
    api.listPaymentMethods(),
    api.listWalletTransactions(),
  ]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
      <div>
        <h1>Facturation</h1>

        {params.recharged ? (
          <Card elevation="sm" accentBorder style={{ marginBottom: 16 }}>
            <CardBody>Demande de recharge enregistrée.</CardBody>
          </Card>
        ) : null}
        {params.error ? (
          <Card elevation="sm" accentBorder style={{ marginBottom: 16 }}>
            <CardBody>{ERROR_LABELS[params.error] ?? "Une erreur est survenue."}</CardBody>
          </Card>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 16 }}>
          <Card elevation="sm">
            <CardTitle>Disponible</CardTitle>
            <CardBody>
              <span className="num" style={{ fontSize: 22, color: "var(--color-accent-300)" }}>
                {wallet.availableMinor} {wallet.currency}
              </span>
            </CardBody>
          </Card>
          <Card elevation="sm">
            <CardTitle>Réservé</CardTitle>
            <CardBody>
              <span className="num">
                {wallet.reservedMinor} {wallet.currency}
              </span>
            </CardBody>
          </Card>
        </div>

        <Card elevation="md" style={{ overflow: "auto" }}>
          <CardTitle>Relevé</CardTitle>
          <Table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.type}</td>
                  <td className="num">
                    {t.amountMinor} {t.currency}
                  </td>
                  <td>
                    <Tag variant={t.status === "CAPTURED" ? "accent" : "neutral"}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </Tag>
                  </td>
                  <td className="num">{new Date(t.createdAt).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted">
                    Aucune transaction pour l&apos;instant.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </Card>
      </div>

      <Card elevation="sm">
        <CardTitle>Recharger</CardTitle>
        <CardBody>
          Les moyens disponibles dépendent de votre pays. Un virement ou une facturation mensuelle
          reste &laquo;&nbsp;En attente&nbsp;&raquo; jusqu&apos;à confirmation.
        </CardBody>
        <form action={topupAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Moyen de paiement">
            <select name="paymentMethodId" className="input" required>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.instant ? "" : "(24-48h)"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Montant">
            <Input name="amount" type="number" min={1} step="0.01" required />
          </Field>
          <Button type="submit" variant="primary" block disabled={methods.length === 0}>
            Recharger
          </Button>
          {methods.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 12 }}>
              Aucun moyen de paiement disponible pour votre pays pour l&apos;instant.
            </p>
          ) : null}
        </form>
      </Card>
    </div>
  );
}

export const dynamic = "force-dynamic";
