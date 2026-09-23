import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { creditWalletAction } from "../../actions";
import { Button, Card, CardTitle, CardBody, Field, Input, Table, formatMoney } from "@notifyafrica/ui";

/**
 * Organizations / Customer 360 (minimal slice — 02_Specifications_Backoffice
 * §7): identity, wallet balance, and the manual credit action that stands
 * in for a real payment gateway topup (§15) until one is wired.
 */
export default async function OrganizationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const api = coreApi(token);
  const [{ organizations }, currenciesConfig] = await Promise.all([
    api.listOrganizations(),
    api.listCurrencies(),
  ]);
  const currencies = currenciesConfig.value ?? [];

  return (
    <div>
      <h1>Organisations</h1>

      <Card elevation="md" style={{ marginBottom: 24, overflow: "auto" }}>
        <Table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Pays</th>
              <th>Membres</th>
              <th>Projets</th>
              <th>Solde disponible</th>
              <th>Réservé</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => (
              <tr key={org.id}>
                <td>{org.name}</td>
                <td>{org.country}</td>
                <td>{org.memberCount}</td>
                <td>{org.projectCount}</td>
                <td className="num">
                  {org.wallet ? formatMoney(org.wallet.availableMinor, org.wallet.currency, currencies) : "—"}
                </td>
                <td className="num">
                  {org.wallet ? formatMoney(org.wallet.reservedMinor, org.wallet.currency, currencies) : "—"}
                </td>
              </tr>
            ))}
            {organizations.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted">
                  Aucune organisation pour l&apos;instant.
                </td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </Card>

      <Card elevation="sm">
        <CardTitle>Créditer un wallet manuellement</CardTitle>
        <CardBody>
          Remplace une intégration de paiement réelle en attendant qu&apos;un PSP soit
          branché. Motif obligatoire, action auditée (02_Specifications_Backoffice §15).
        </CardBody>
        <form
          action={creditWalletAction}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <Field label="ID organisation">
            <Input name="organizationId" required />
          </Field>
          <Field label="Montant">
            <Input name="amount" type="number" step="0.01" min="0" required />
          </Field>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Motif (obligatoire, audité)">
              <Input name="reason" required />
            </Field>
          </div>
          <Button type="submit" variant="primary">
            Créditer
          </Button>
        </form>
      </Card>
    </div>
  );
}

export const dynamic = "force-dynamic";
