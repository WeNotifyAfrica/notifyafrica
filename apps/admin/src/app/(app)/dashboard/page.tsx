import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { triggerSeedImportAction } from "../actions";
import { Card, CardKicker, CardTitle, CardBody, Button, formatMoney } from "@notifyafrica/ui";

/**
 * Back-office pilotage (design handoff Lot 19). Real aggregates from
 * /api/admin/dashboard/summary — see that route for what's intentionally
 * left out vs. the mockup (revenue/cost/margin chart needs a SupplierCost
 * model that doesn't exist yet).
 */
export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const api = coreApi(token);
  const [summary, currenciesConfig] = await Promise.all([api.getAdminDashboardSummary(), api.listCurrencies()]);
  const currencies = currenciesConfig.value ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <h2 style={{ margin: 0 }}>Back-office — pilotage</h2>
        <p className="text-muted" style={{ margin: 0, maxWidth: "72ch", fontSize: 14 }}>
          Vue d&apos;ensemble de l&apos;activité : organisations, revenu capturé ce mois-ci, et ce qui reste
          à traiter.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-4)" }}>
        <Card elevation="sm" style={{ gap: "var(--space-2)" }}>
          <CardKicker>Organisations</CardKicker>
          <span className="num" style={{ fontSize: 25, lineHeight: 1.1 }}>
            {summary.organizationCount}
          </span>
        </Card>
        {summary.revenueThisMonth.length > 0 ? (
          summary.revenueThisMonth.map((row) => (
            <Card elevation="sm" style={{ gap: "var(--space-2)" }} key={row.currency}>
              <CardKicker>Revenu capturé ce mois-ci</CardKicker>
              <span className="num" style={{ fontSize: 25, lineHeight: 1.1 }}>
                {formatMoney(row.totalMinor, row.currency, currencies)}
              </span>
            </Card>
          ))
        ) : (
          <Card elevation="sm" style={{ gap: "var(--space-2)" }}>
            <CardKicker>Revenu capturé ce mois-ci</CardKicker>
            <span className="num" style={{ fontSize: 25, lineHeight: 1.1 }}>
              —
            </span>
          </Card>
        )}
        <Card elevation="sm" style={{ gap: "var(--space-2)" }}>
          <CardKicker>Devis en attente</CardKicker>
          <span className="num" style={{ fontSize: 25, lineHeight: 1.1 }}>
            {summary.pendingQuotes}
          </span>
        </Card>
        <Card elevation="sm" style={{ gap: "var(--space-2)" }}>
          <CardKicker>Modèles WhatsApp à revoir</CardKicker>
          <span className="num" style={{ fontSize: 25, lineHeight: 1.1 }}>
            {summary.pendingWhatsappTemplates}
          </span>
        </Card>
        <Card elevation="sm" style={{ gap: "var(--space-2)" }}>
          <CardKicker>Transactions à rapprocher</CardKicker>
          <span className="num" style={{ fontSize: 25, lineHeight: 1.1 }}>
            {summary.pendingTransactions}
          </span>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)", gap: "var(--space-6)", alignItems: "start" }}>
        <Card elevation="md" style={{ padding: "var(--space-8)", gap: "var(--space-4)" }}>
          <CardTitle>Journal des actions internes</CardTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {summary.recentAuditLog.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", fontSize: 13 }}>
                <span>
                  {a.action} · {a.resource}
                  {a.actorEmail ? ` · ${a.actorEmail}` : ""}
                </span>
                <span className="text-muted num">{new Date(a.createdAt).toLocaleString("fr-FR")}</span>
              </div>
            ))}
            {summary.recentAuditLog.length === 0 ? <CardBody>Aucune action enregistrée.</CardBody> : null}
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Card elevation="sm" accentBorder>
            <CardKicker>Configuration initiale</CardKicker>
            <CardBody>Importer la configuration seed issue du design (idempotent).</CardBody>
            <form action={triggerSeedImportAction}>
              <Button type="submit" variant="secondary">
                Importer le seed
              </Button>
            </form>
          </Card>

          <Card elevation="sm">
            <CardKicker>Notifications récentes</CardKicker>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {summary.recentNotifications.map((n) => (
                <div key={n.id} style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 13 }}>{n.event}</span>
                  <span className="text-muted num" style={{ fontSize: 11 }}>
                    {new Date(n.createdAt).toLocaleString("fr-FR")}
                  </span>
                </div>
              ))}
              {summary.recentNotifications.length === 0 ? (
                <span className="text-muted" style={{ fontSize: 13 }}>
                  Aucune notification.
                </span>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
