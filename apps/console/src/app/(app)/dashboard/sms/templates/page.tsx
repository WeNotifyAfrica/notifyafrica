import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { createSmsTemplateAction } from "../../../actions";
import { SmsSubNav } from "../SmsSubNav";
import { Button, Card, CardTitle, CardBody, CardMeta, Field, Input, Textarea, Tag } from "@notifyafrica/ui";

const USAGE_LABELS: Record<string, string> = {
  TRANSACTIONAL: "Transactionnel",
  MARKETING: "Marketing",
  OTP: "OTP",
};

/**
 * Modèles SMS (design handoff Lot 7). Pas de validation nécessaire,
 * contrairement aux noms d'expéditeur — ce sont des brouillons internes à
 * l'organisation. "Utiliser" renvoie vers Envoyer avec le modèle
 * pré-rempli via `?template=`, pour rester en rendu serveur sans état
 * client (même convention que les bannières de succès/erreur ailleurs).
 */
export default async function SmsTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const { templates } = await coreApi(token).listSmsTemplates();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <h1>SMS</h1>
        <SmsSubNav active="templates" />
      </div>

      {params.created ? (
        <Card elevation="sm" accentBorder>
          <CardBody>Modèle créé.</CardBody>
        </Card>
      ) : null}
      {params.error ? (
        <Card elevation="sm" accentBorder>
          <CardBody>Une erreur est survenue.</CardBody>
        </Card>
      ) : null}

      <p className="text-muted" style={{ maxWidth: "60ch", fontSize: 13.5 }}>
        Les modèles évitent les erreurs de saisie et permettent de préparer des messages validés en interne.
        Utilisez <code>{"{variable}"}</code> pour les parties à personnaliser à l&apos;envoi.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-4)" }}>
        {templates.map((t) => (
          <Card key={t.id} elevation="sm" style={{ gap: "var(--space-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-3)" }}>
              <span className="card-title" style={{ fontSize: 15 }}>
                {t.name}
              </span>
              <Tag variant="neutral">{USAGE_LABELS[t.usage] ?? t.usage}</Tag>
            </div>
            <p className="card-body" style={{ margin: 0, fontSize: 13 }}>
              {t.bodyText}
            </p>
            <CardMeta>{t.usageCount === 0 ? "Jamais utilisé" : `Utilisé ${t.usageCount} fois`}</CardMeta>
            <a href={`/dashboard/sms?template=${t.id}`}>
              <Button variant="secondary">Utiliser</Button>
            </a>
          </Card>
        ))}
        {templates.length === 0 ? (
          <Card elevation="sm">
            <CardBody>Aucun modèle pour l&apos;instant.</CardBody>
          </Card>
        ) : null}
      </div>

      <Card elevation="sm">
        <CardTitle>Créer un modèle</CardTitle>
        <form action={createSmsTemplateAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Nom">
            <Input name="name" required />
          </Field>
          <Field label="Usage">
            <select name="usage" className="input" defaultValue="TRANSACTIONAL">
              <option value="TRANSACTIONAL">Transactionnel</option>
              <option value="MARKETING">Marketing</option>
              <option value="OTP">OTP</option>
            </select>
          </Field>
          <Field label="Texte du message">
            <Textarea name="bodyText" rows={3} placeholder="Bonjour {prenom}, ..." required />
          </Field>
          <Button type="submit" variant="primary">
            Créer
          </Button>
        </form>
      </Card>
    </div>
  );
}

export const dynamic = "force-dynamic";
