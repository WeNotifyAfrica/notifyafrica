import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { Card, Table, Tag } from "@notifyafrica/ui";

/** Financial transactions (02_Specifications_Backoffice §16). */
export default async function TransactionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const { transactions } = await coreApi(token).listTransactions();

  return (
    <div>
      <h1>Transactions</h1>
      <Card elevation="md" style={{ overflow: "auto" }}>
        <Table>
          <thead>
            <tr>
              <th>Organisation</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.organization?.name ?? t.organizationId}</td>
                <td>{t.type}</td>
                <td className="num">
                  {t.amountMinor} {t.currency}
                </td>
                <td>
                  <Tag variant="neutral">{t.status}</Tag>
                </td>
                <td className="num">{new Date(t.createdAt).toLocaleString("fr-FR")}</td>
              </tr>
            ))}
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  Aucune transaction pour l&apos;instant.
                </td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

export const dynamic = "force-dynamic";
