import { cookies } from "next/headers";
import Link from "next/link";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { createCampaignAction } from "./actions";
import { Button, Card, CardTitle, CardBody, Field, Input, Textarea, Table, Tag } from "@notifyafrica/ui";

const STATUS_VARIANT: Record<string, "accent" | "neutral" | "outline"> = {
  DRAFT: "neutral",
  QUEUED: "outline",
  RUNNING: "outline",
  COMPLETED: "accent",
  PARTIAL: "outline",
  FAILED: "neutral",
  CANCELLED: "neutral",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SCHEDULED: "Planifiée",
  QUEUED: "En file",
  RUNNING: "En cours",
  COMPLETED: "Terminée",
  PARTIAL: "Partielle",
  FAILED: "Échouée",
  CANCELLED: "Annulée",
};

/**
 * Campagnes (03_Specifications_Console §12). Creating one only drafts it —
 * estimate/launch happen on the detail page, matching the
 * Draft -> ... -> Reserve Funds -> Run -> Report flow.
 */
export default async function CampaignsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const { campaigns } = await coreApi(token).listCampaigns();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
      <div>
        <h1>Campagnes</h1>
        <Card elevation="md" style={{ overflow: "auto" }}>
          <Table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Destinataires</th>
                <th>Statut</th>
                <th>Envoyés</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td className="num">{c.totalCount.toLocaleString("fr-FR")}</td>
                  <td>
                    <Tag variant={STATUS_VARIANT[c.status] ?? "neutral"}>{STATUS_LABELS[c.status] ?? c.status}</Tag>
                  </td>
                  <td className="num">
                    {c.sentCount}/{c.totalCount}
                  </td>
                  <td>
                    <Link href={`/dashboard/campaigns/${c.id}`}>
                      <Button variant="ghost">Ouvrir</Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted">
                    Aucune campagne pour l&apos;instant.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </Card>
      </div>

      <Card elevation="sm">
        <CardTitle>Nouvelle campagne</CardTitle>
        <CardBody>Un destinataire par ligne (ou séparés par des virgules).</CardBody>
        <form action={createCampaignAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Nom de la campagne">
            <Input name="name" required />
          </Field>
          <Field label="Expéditeur (optionnel)">
            <Input name="senderId" />
          </Field>
          <Field label="Message">
            <Textarea name="content" rows={4} required />
          </Field>
          <Field label="Destinataires">
            <Textarea name="destinations" rows={6} placeholder={"+22890000001\n+22890000002"} required />
          </Field>
          <Button type="submit" variant="primary">
            Créer le brouillon
          </Button>
        </form>
      </Card>
    </div>
  );
}

export const dynamic = "force-dynamic";
