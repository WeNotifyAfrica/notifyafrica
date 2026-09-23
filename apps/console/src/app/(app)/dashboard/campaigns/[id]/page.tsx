import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { estimateCampaignAction, launchCampaignAction, cancelCampaignAction } from "../actions";
import { Button, Card, CardTitle, CardBody, Tag } from "@notifyafrica/ui";

const ERROR_LABELS: Record<string, string> = {
  insufficient_balance: "Solde insuffisant pour réserver le montant estimé.",
  estimate_required: "Estimez la campagne avant de la lancer.",
  launch_failed: "Le lancement a échoué. Réessayez.",
};

/**
 * Campaign detail — Estimate -> Reserve Funds (launch) -> Run -> Report
 * (03_Specifications_Console §12). Once QUEUED/RUNNING, revisit this page
 * to see the report update as the Worker processes it in the background.
 */
export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ launched?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const { campaign } = await coreApi(token).getCampaign(id);

  const canEdit = campaign.status === "DRAFT";
  const canCancel = ["DRAFT", "SCHEDULED", "QUEUED"].includes(campaign.status);
  const isTerminal = ["COMPLETED", "PARTIAL", "FAILED", "CANCELLED"].includes(campaign.status);

  return (
    <div style={{ maxWidth: 720 }}>
      <h1>{campaign.name}</h1>

      {sp.launched ? (
        <Card elevation="sm" accentBorder style={{ marginBottom: 16 }}>
          <CardBody>
            Campagne lancée — l&apos;envoi se fait en tâche de fond, rafraîchissez cette page pour
            voir le rapport.
          </CardBody>
        </Card>
      ) : null}
      {sp.error ? (
        <Card elevation="sm" accentBorder style={{ marginBottom: 16 }}>
          <CardBody>{ERROR_LABELS[sp.error] ?? "Une erreur est survenue."}</CardBody>
        </Card>
      ) : null}

      <Card elevation="md" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <CardTitle>Statut</CardTitle>
          <Tag variant={isTerminal ? (campaign.status === "COMPLETED" ? "accent" : "neutral") : "outline"}>
            {campaign.status}
          </Tag>
        </div>
        <CardBody>{campaign.content}</CardBody>
        <p className="text-muted" style={{ fontSize: 13 }}>
          {campaign.totalCount.toLocaleString("fr-FR")} destinataire(s)
          {campaign.senderId ? ` · Expéditeur : ${campaign.senderId}` : ""}
        </p>
      </Card>

      {campaign.unitPrice !== null && campaign.estimatedTotal !== null ? (
        <Card elevation="sm" style={{ marginBottom: 16 }}>
          <CardTitle>Estimation</CardTitle>
          <CardBody>
            <span className="num">
              {campaign.unitPrice} {campaign.currency} / message
            </span>
          </CardBody>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="text-muted" style={{ fontSize: 13 }}>
              Coût total réservé
            </span>
            <span className="num" style={{ color: "var(--color-accent-300)" }}>
              {campaign.estimatedTotal} {campaign.currency}
            </span>
          </div>
        </Card>
      ) : null}

      {isTerminal ? (
        <Card elevation="sm" style={{ marginBottom: 16 }}>
          <CardTitle>Rapport</CardTitle>
          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <div className="num" style={{ fontSize: 22, color: "var(--color-accent-300)" }}>
                {campaign.sentCount}
              </div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Envoyés
              </div>
            </div>
            <div>
              <div className="num" style={{ fontSize: 22 }}>
                {campaign.failedCount}
              </div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Échecs
              </div>
            </div>
            <div>
              <div className="num" style={{ fontSize: 22 }}>
                {campaign.totalCount}
              </div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Total
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <div style={{ display: "flex", gap: 12 }}>
        {canEdit ? (
          <form action={estimateCampaignAction}>
            <input type="hidden" name="id" value={campaign.id} />
            <Button type="submit" variant="secondary">
              Estimer
            </Button>
          </form>
        ) : null}
        {canEdit && campaign.unitPrice !== null ? (
          <form action={launchCampaignAction}>
            <input type="hidden" name="id" value={campaign.id} />
            <Button type="submit" variant="primary">
              Réserver les fonds et lancer
            </Button>
          </form>
        ) : null}
        {canCancel ? (
          <form action={cancelCampaignAction}>
            <input type="hidden" name="id" value={campaign.id} />
            <Button type="submit" variant="ghost">
              Annuler
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
