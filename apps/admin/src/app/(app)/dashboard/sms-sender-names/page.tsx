import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { reviewSenderNameAction } from "./actions";
import { Button, Card, CardTitle, CardBody, Input, Tag } from "@notifyafrica/ui";

const USAGE_LABELS: Record<string, string> = {
  TRANSACTIONAL: "Transactionnel",
  MARKETING: "Marketing",
  OTP: "OTP",
};

/**
 * Noms d'expéditeur — file de revue (design handoff Lot 7). Stands in for
 * the real per-operator validation channel (no integration exists yet) —
 * same pattern as the WhatsApp template review queue.
 */
export default async function SmsSenderNamesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const { senderNames } = await coreApi(token).listAdminSenderNames();
  const pending = senderNames.filter((s) => s.status === "PENDING");
  const reviewed = senderNames.filter((s) => s.status !== "PENDING");

  return (
    <div>
      <h1>Noms d&apos;expéditeur SMS</h1>

      <h2>En attente de revue</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        {pending.map((s) => (
          <Card key={s.id} elevation="sm">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <CardTitle>
                {s.organization?.name ?? s.organizationId} — {s.name} ({s.country})
              </CardTitle>
              <Tag variant="neutral">{USAGE_LABELS[s.usage] ?? s.usage}</Tag>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
              <form action={reviewSenderNameAction}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="status" value="VALIDATED" />
                <Button type="submit" variant="primary">
                  Valider
                </Button>
              </form>
              <form action={reviewSenderNameAction} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="status" value="REJECTED" />
                <Input name="rejectionReason" placeholder="Motif du refus" />
                <Button type="submit" variant="ghost">
                  Refuser
                </Button>
              </form>
            </div>
          </Card>
        ))}
        {pending.length === 0 ? (
          <Card elevation="sm">
            <CardBody>Aucune demande en attente de revue.</CardBody>
          </Card>
        ) : null}
      </div>

      <h2>Historique</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {reviewed.map((s) => (
          <Card key={s.id} elevation="sm">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <CardTitle>
                {s.organization?.name ?? s.organizationId} — {s.name} ({s.country})
              </CardTitle>
              <Tag variant={s.status === "VALIDATED" ? "accent" : "neutral"}>{s.status === "VALIDATED" ? "Validé" : "Refusé"}</Tag>
            </div>
            {s.rejectionReason ? <CardBody>Motif : {s.rejectionReason}</CardBody> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
