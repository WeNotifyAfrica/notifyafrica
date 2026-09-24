import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { Card, CardTitle, CardBody, Tag, formatMoney } from "@notifyafrica/ui";

const STATUS_LABELS: Record<string, string> = {
  SENT: "Livré",
  QUEUED: "En file",
  FAILED: "Échoué",
};

/**
 * Détail du message (design handoff Lot 7). The mockup's 5-step delivery
 * timeline (accepted -> debited -> transmitted -> operator ack ->
 * delivered) assumes provider-level delivery receipts that don't exist
 * yet (no real SMPP/HTTP provider wired — design handoff README §9 point
 * 4). Shows the 3 steps that are real: created, debited (if a Transaction
 * exists), and the final status — rather than fabricating intermediate
 * events no system here actually observed.
 */
export default async function MessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const api = coreApi(token);
  const [{ message, transaction }, currenciesConfig] = await Promise.all([
    api.getSmsMessage(id),
    api.listCurrencies(),
  ]);
  const currencies = currenciesConfig.value ?? [];
  const snapshot = message.pricingSnapshot ?? {};

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "var(--space-6)", alignItems: "start" }}>
      <Card elevation="md" style={{ padding: "var(--space-8)", gap: "var(--space-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <div>
            <span className="card-kicker">Message</span>
            <div className="card-title num" style={{ fontSize: 17 }}>
              {message.id}
            </div>
          </div>
          <Tag variant={message.status === "SENT" ? "accent" : message.status === "FAILED" ? "neutral" : "outline"}>
            {STATUS_LABELS[message.status] ?? message.status}
          </Tag>
        </div>

        <div className="card" style={{ background: "var(--color-neutral-900)" }}>
          <p className="card-body" style={{ margin: 0 }}>
            {message.content}
          </p>
        </div>

        <div>
          <span className="card-kicker">Suivi</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
            <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "baseline" }}>
              <span className="num text-muted" style={{ fontSize: 12, minWidth: 62 }}>
                {new Date(message.createdAt).toLocaleTimeString("fr-FR")}
              </span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 13.5 }}>Accepté par NotifyAfrica</span>
                {snapshot.ruleVersion ? (
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    Prix figé · règle v{snapshot.ruleVersion}
                  </span>
                ) : null}
              </div>
            </div>
            {transaction ? (
              <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "baseline" }}>
                <span className="num text-muted" style={{ fontSize: 12, minWidth: 62 }}>
                  {new Date(transaction.createdAt).toLocaleTimeString("fr-FR")}
                </span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 13.5 }}>Fonds débités</span>
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    {formatMoney(transaction.amountMinor, transaction.currency, currencies)}
                  </span>
                </div>
              </div>
            ) : null}
            <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "baseline" }}>
              <span className="num text-muted" style={{ fontSize: 12, minWidth: 62 }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 13.5 }}>{STATUS_LABELS[message.status] ?? message.status}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <Card elevation="md" style={{ padding: "var(--space-8)", gap: "var(--space-3)" }}>
          <span className="card-kicker">Acheminement</span>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
            <span className="text-muted" style={{ fontSize: 13 }}>
              Destinataire
            </span>
            <span className="num" style={{ fontSize: 13 }}>
              {message.destination}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
            <span className="text-muted" style={{ fontSize: 13 }}>
              Expéditeur
            </span>
            <span style={{ fontSize: 13 }}>{message.senderId ?? "Partagé par défaut"}</span>
          </div>
          {transaction ? (
            <>
              <hr className="hr" style={{ margin: "var(--space-2) 0" }} />
              <span className="card-kicker">Facturation</span>
              {snapshot.unitPrice !== undefined ? (
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <span className="text-muted" style={{ fontSize: 13 }}>
                    Prix unitaire appliqué
                  </span>
                  <span className="num" style={{ fontSize: 13 }}>
                    {formatMoney(snapshot.unitPrice, snapshot.currency ?? transaction.currency, currencies)}
                  </span>
                </div>
              ) : null}
              {snapshot.ruleVersion ? (
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <span className="text-muted" style={{ fontSize: 13 }}>
                    Règle de prix
                  </span>
                  <span className="num" style={{ fontSize: 13 }}>
                    v{snapshot.ruleVersion}
                  </span>
                </div>
              ) : null}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-3)" }}>
                <span style={{ fontSize: 14 }}>Débité</span>
                <span className="num" style={{ fontSize: 17, color: "var(--color-accent-300)" }}>
                  {formatMoney(transaction.amountMinor, transaction.currency, currencies)}
                </span>
              </div>
              <p className="text-muted" style={{ margin: 0, fontSize: 11 }}>
                Le prix est figé au moment de l&apos;envoi : une modification tarifaire ultérieure ne change pas ce
                montant.
              </p>
            </>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
