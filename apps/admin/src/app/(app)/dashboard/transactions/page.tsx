import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { confirmTransactionAction } from "./actions";
import { Button, Card, Table, Tag } from "@notifyafrica/ui";

/**
 * Financial transactions (02_Specifications_Backoffice §16). A PENDING
 * WALLET_TOPUP (non-instant payment method — bank transfer, monthly
 * invoicing) is confirmed here once the funds are actually seen; that's
 * what credits the wallet for those methods (§9 "24 à 48 h").
 */
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
              <th></th>
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
                  <Tag variant={t.status === "PENDING" ? "outline" : "neutral"}>{t.status}</Tag>
                </td>
                <td className="num">{new Date(t.createdAt).toLocaleString("fr-FR")}</td>
                <td>
                  {t.type === "WALLET_TOPUP" && t.status === "PENDING" ? (
                    <form action={confirmTransactionAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <Button type="submit" variant="ghost">
                        Confirmer
                      </Button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted">
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
