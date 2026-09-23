import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { reviewWhatsAppTemplateAction } from "./actions";
import { Button, Card, CardTitle, CardBody, Input, Tag } from "@notifyafrica/ui";

/**
 * Template review queue (03_Specifications_Console §16 "modèles approuvés").
 * Stands in for the not-yet-designed Lot 26 "revue des modèles WhatsApp
 * avant soumission à Meta" — only an APPROVED template can be used to send.
 */
export default async function WhatsAppTemplatesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const { templates } = await coreApi(token).listAdminWhatsAppTemplates();
  const pending = templates.filter((t) => t.status === "PENDING_REVIEW");
  const reviewed = templates.filter((t) => t.status !== "PENDING_REVIEW");

  return (
    <div>
      <h1>Modèles WhatsApp</h1>

      <h2>En attente de revue</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        {pending.map((t) => (
          <Card key={t.id} elevation="sm">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <CardTitle>
                {t.organization?.name ?? t.id} — {t.name}
              </CardTitle>
              <Tag variant="neutral">{t.category}</Tag>
            </div>
            <CardBody>{t.bodyText}</CardBody>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
              <form action={reviewWhatsAppTemplateAction}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="status" value="APPROVED" />
                <Button type="submit" variant="primary">
                  Approuver
                </Button>
              </form>
              <form
                action={reviewWhatsAppTemplateAction}
                style={{ display: "flex", gap: 8, alignItems: "flex-end" }}
              >
                <input type="hidden" name="id" value={t.id} />
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
            <CardBody>Aucun modèle en attente de revue.</CardBody>
          </Card>
        ) : null}
      </div>

      <h2>Historique</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {reviewed.map((t) => (
          <Card key={t.id} elevation="sm">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <CardTitle>
                {t.organization?.name ?? t.id} — {t.name}
              </CardTitle>
              <Tag variant={t.status === "APPROVED" ? "accent" : "neutral"}>{t.status}</Tag>
            </div>
            {t.rejectionReason ? <CardBody>Motif : {t.rejectionReason}</CardBody> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
