import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { getCurrentEnvironment } from "@/lib/environment";
import { SESSION_COOKIE } from "@/lib/env";
import { createWhatsAppNumberAction, createWhatsAppTemplateAction, sendWhatsAppAction } from "./actions";
import { Button, Card, CardTitle, CardBody, Field, Input, Textarea, Table, Tag } from "@notifyafrica/ui";
import { whatsAppTemplateCategorySchema } from "@notifyafrica/validation";

const ERROR_LABELS: Record<string, string> = {
  template_not_approved: "Ce modèle n'est pas encore approuvé.",
  insufficient_balance: "Solde insuffisant pour cet envoi.",
  quote_required: "Ce volume nécessite un devis — contactez le support.",
  send_failed: "L'envoi a échoué. Réessayez.",
};

const TEMPLATE_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  PENDING_REVIEW: "En attente de revue",
  APPROVED: "Approuvé",
  REJECTED: "Refusé",
};

const NUMBER_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  VERIFIED: "Vérifié",
  REJECTED: "Refusé",
};

const MESSAGE_STATUS_LABEL: Record<string, string> = {
  SENT: "Envoyé",
  QUEUED: "En file",
  FAILED: "Échoué",
};

/**
 * WhatsApp Business (03_Specifications_Console §16): numéros, modèles,
 * envoi, journal. Seuls les modèles APPROVED (revus par Admin) peuvent être
 * utilisés pour un envoi.
 */
export default async function WhatsAppPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; free?: string; sandbox?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const api = coreApi(token, await getCurrentEnvironment());

  const [{ numbers }, { templates }, { messages }] = await Promise.all([
    api.listWhatsAppNumbers(),
    api.listWhatsAppTemplates(),
    api.listWhatsAppHistory(),
  ]);
  const approvedTemplates = templates.filter((t) => t.status === "APPROVED");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
      <div>
        <h1>WhatsApp Business</h1>

        {params.sent ? (
          <Card elevation="sm" accentBorder style={{ marginBottom: 16 }}>
            <CardBody>
              Message envoyé.{" "}
              {params.sandbox
                ? "Environnement Test — envoi gratuit, aucun solde débité."
                : params.free
                  ? "Gratuit — une conversation était déjà ouverte avec ce destinataire (fenêtre de 24 h)."
                  : "Facturé au tarif de la catégorie — ouvre une fenêtre de 24 h : les prochains envois à ce destinataire seront gratuits."}
            </CardBody>
          </Card>
        ) : null}
        {params.error ? (
          <Card elevation="sm" accentBorder style={{ marginBottom: 16 }}>
            <CardBody>{ERROR_LABELS[params.error] ?? "Une erreur est survenue."}</CardBody>
          </Card>
        ) : null}

        <Card elevation="md" style={{ marginBottom: 16, overflow: "auto" }}>
          <CardTitle>Numéros</CardTitle>
          <Table>
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Nom affiché</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {numbers.map((n) => (
                <tr key={n.id}>
                  <td>{n.phoneNumber}</td>
                  <td>{n.displayName}</td>
                  <td>
                    <Tag variant={n.status === "VERIFIED" ? "accent" : "neutral"}>
                      {NUMBER_STATUS_LABEL[n.status] ?? n.status}
                    </Tag>
                  </td>
                </tr>
              ))}
              {numbers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-muted">
                    Aucun numéro pour l&apos;instant.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </Card>

        <Card elevation="md" style={{ marginBottom: 16, overflow: "auto" }}>
          <CardTitle>Modèles</CardTitle>
          <Table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Catégorie</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>
                    <Tag variant="neutral">{t.category}</Tag>
                  </td>
                  <td>
                    <Tag variant={t.status === "APPROVED" ? "accent" : "outline"}>
                      {TEMPLATE_STATUS_LABEL[t.status] ?? t.status}
                    </Tag>
                  </td>
                </tr>
              ))}
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-muted">
                    Aucun modèle pour l&apos;instant.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </Card>

        <Card elevation="md" style={{ overflow: "auto" }}>
          <CardTitle>Journal</CardTitle>
          <Table>
            <thead>
              <tr>
                <th>Destination</th>
                <th>Statut</th>
                <th>Facturation</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id}>
                  <td>{m.destination}</td>
                  <td>
                    <Tag variant={m.status === "SENT" ? "accent" : "neutral"}>
                      {MESSAGE_STATUS_LABEL[m.status] ?? m.status}
                    </Tag>
                  </td>
                  <td>
                    {m.pricingSnapshot?.freeWithinConversation ? (
                      <Tag variant="outline">Gratuit · fenêtre ouverte</Tag>
                    ) : (
                      <Tag variant="neutral">Facturé</Tag>
                    )}
                  </td>
                  <td className="num">{new Date(m.createdAt).toLocaleString("fr-FR")}</td>
                </tr>
              ))}
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted">
                    Aucun envoi pour l&apos;instant.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </Card>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card elevation="sm">
          <CardTitle>Envoyer</CardTitle>
          <CardBody>Seuls les modèles approuvés peuvent être utilisés.</CardBody>
          <form action={sendWhatsAppAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Modèle">
              <select name="templateId" className="input" required>
                {approvedTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Destination">
              <Input name="destination" placeholder="+22890000000" required />
            </Field>
            <Button type="submit" variant="primary" disabled={approvedTemplates.length === 0}>
              Envoyer
            </Button>
            {approvedTemplates.length === 0 ? (
              <p className="text-muted" style={{ fontSize: 12 }}>
                Aucun modèle approuvé pour l&apos;instant.
              </p>
            ) : null}
          </form>
        </Card>

        <Card elevation="sm">
          <CardTitle>Ajouter un numéro</CardTitle>
          <form action={createWhatsAppNumberAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Numéro">
              <Input name="phoneNumber" placeholder="+22890000000" required />
            </Field>
            <Field label="Nom affiché">
              <Input name="displayName" required />
            </Field>
            <Button type="submit" variant="secondary">
              Ajouter
            </Button>
          </form>
        </Card>

        <Card elevation="sm">
          <CardTitle>Soumettre un modèle</CardTitle>
          <CardBody>Envoyé à Admin pour revue avant de pouvoir être utilisé.</CardBody>
          <form
            action={createWhatsAppTemplateAction}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <Field label="Nom">
              <Input name="name" required />
            </Field>
            <Field label="Catégorie">
              <select name="category" className="input" defaultValue="UTILITY">
                {whatsAppTemplateCategorySchema.options.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Langue">
              <Input name="language" defaultValue="fr" />
            </Field>
            <Field label="Texte du message">
              <Textarea name="bodyText" rows={3} required />
            </Field>
            <Button type="submit" variant="secondary">
              Soumettre pour revue
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
