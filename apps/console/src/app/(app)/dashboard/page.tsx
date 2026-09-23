import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { Card, CardKicker, CardTitle, CardBody, Table, Tag, formatMoney } from "@notifyafrica/ui";

const PRODUCT_LABELS: Record<string, string> = {
  SMS: "SMS",
  OTP: "OTP",
  WHATSAPP: "WhatsApp",
};

const STATUS_LABELS: Record<string, string> = {
  SENT: "Envoyé",
  QUEUED: "En file",
  FAILED: "Échoué",
  CAPTURED: "Confirmé",
  PENDING: "En attente",
};

const QUICK_ACTIONS = [
  { title: "Envoyer un SMS", body: "Un message ou un envoi en masse.", href: "/dashboard/sms" },
  { title: "Créer une campagne", body: "Audience, contenu, coût estimé.", href: "/dashboard/campaigns" },
  { title: "Envoyer un WhatsApp", body: "À partir d'un modèle approuvé.", href: "/dashboard/whatsapp" },
  { title: "Inviter un collègue", body: "Attribuez-lui un rôle.", href: "/dashboard/team" },
];

/**
 * Console overview (design handoff Lots 5-6). Real aggregates from
 * /api/dashboard/summary — no fixture data. See that route for what's
 * intentionally simplified vs. the mockup (14-day volume chart -> a
 * per-product breakdown; both answer "where is spend going").
 */
export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const api = coreApi(token);

  const [summary, { session }, currenciesConfig] = await Promise.all([
    api.getDashboardSummary(),
    api.getSession(),
    api.listCurrencies(),
  ]);
  const currencies = currenciesConfig.value ?? [];
  const totalMessagesThisMonth = summary.messagesByProductThisMonth.reduce((sum, row) => sum + row.count, 0);
  const maxProductCount = Math.max(1, ...summary.messagesByProductThisMonth.map((r) => r.count));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <div>
        <h3 style={{ margin: 0 }}>Bonjour</h3>
        <p className="text-muted" style={{ margin: 0, fontSize: 13.5 }}>
          Voici l&apos;activité de votre organisation ce mois-ci.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "var(--space-4)" }}>
        <Card elevation="sm" style={{ gap: "var(--space-2)" }}>
          <CardKicker>Solde disponible</CardKicker>
          <span className="num" style={{ fontSize: 25, lineHeight: 1.1 }}>
            {summary.wallet ? formatMoney(summary.wallet.availableMinor, summary.wallet.currency, currencies) : "—"}
          </span>
        </Card>
        <Card elevation="sm" style={{ gap: "var(--space-2)" }}>
          <CardKicker>Messages ce mois-ci</CardKicker>
          <span className="num" style={{ fontSize: 25, lineHeight: 1.1 }}>
            {totalMessagesThisMonth.toLocaleString("fr-FR")}
          </span>
        </Card>
        <Card elevation="sm" style={{ gap: "var(--space-2)" }}>
          <CardKicker>Campagnes actives</CardKicker>
          <span className="num" style={{ fontSize: 25, lineHeight: 1.1 }}>
            {summary.activeCampaigns}
          </span>
        </Card>
        <Card elevation="sm" style={{ gap: "var(--space-2)" }}>
          <CardKicker>Devis en attente</CardKicker>
          <span className="num" style={{ fontSize: 25, lineHeight: 1.1 }}>
            {summary.pendingQuotes}
          </span>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)", gap: "var(--space-6)", alignItems: "start" }}>
        <Card elevation="md" style={{ overflow: "auto" }}>
          <CardTitle>Activité récente</CardTitle>
          <Table>
            <thead>
              <tr>
                <th>Heure</th>
                <th>Événement</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {summary.activity.map((a) => (
                <tr key={`${a.kind}-${a.id}`}>
                  <td className="num text-muted">{new Date(a.createdAt).toLocaleString("fr-FR")}</td>
                  <td>{a.label}</td>
                  <td>
                    <Tag variant={a.status === "SENT" || a.status === "CAPTURED" ? "accent" : "neutral"}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </Tag>
                  </td>
                </tr>
              ))}
              {summary.activity.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-muted">
                    Aucune activité pour l&apos;instant.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </Card>

        <Card elevation="md" style={{ gap: "var(--space-4)", padding: "var(--space-8)" }}>
          <CardTitle>Consommation par produit</CardTitle>
          <span className="text-muted" style={{ fontSize: 12 }}>
            Ce mois-ci
          </span>
          {summary.messagesByProductThisMonth.map((row) => (
            <div key={row.product} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                <span style={{ fontSize: 13.5 }}>{PRODUCT_LABELS[row.product] ?? row.product}</span>
                <span className="num text-muted" style={{ fontSize: 13 }}>
                  {row.count.toLocaleString("fr-FR")}
                </span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: "var(--color-neutral-800)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.round((row.count / maxProductCount) * 100)}%`,
                    background: "var(--color-accent)",
                  }}
                />
              </div>
            </div>
          ))}
          {summary.messagesByProductThisMonth.length === 0 ? (
            <CardBody>Aucun envoi ce mois-ci.</CardBody>
          ) : null}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "var(--space-4)" }}>
        {QUICK_ACTIONS.map((action) => (
          <a key={action.href} href={action.href} style={{ textDecoration: "none", color: "inherit" }}>
            <Card style={{ gap: "var(--space-2)", height: "100%" }}>
              <CardTitle>{action.title}</CardTitle>
              <CardBody>{action.body}</CardBody>
            </Card>
          </a>
        ))}
      </div>

      <p className="text-muted" style={{ fontSize: 12 }}>
        Connecté en tant que {session.email}.
      </p>
    </div>
  );
}

export const dynamic = "force-dynamic";
