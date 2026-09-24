import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { requestSenderNameAction } from "../../../actions";
import { SmsSubNav } from "../SmsSubNav";
import { Button, Card, CardTitle, CardBody, Field, Input, Table, Tag } from "@notifyafrica/ui";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En validation",
  VALIDATED: "Validé",
  REJECTED: "Refusé",
};

const USAGE_LABELS: Record<string, string> = {
  TRANSACTIONAL: "Transactionnel",
  MARKETING: "Marketing",
  OTP: "OTP",
};

/**
 * Noms d'expéditeur (design handoff Lot 7). Un nom doit être validé par
 * opérateur/pays — modélisé comme la revue des modèles WhatsApp (Console
 * soumet, Admin approuve/refuse), faute d'un vrai canal de validation
 * opérateur à intégrer. Tant qu'aucun nom n'est validé, les envois
 * utilisent le nom partagé par défaut (règle du design handoff).
 */
export default async function SenderNamesPage({
  searchParams,
}: {
  searchParams: Promise<{ requested?: string; error?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const { senderNames } = await coreApi(token).listSenderNames();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <h1>SMS</h1>
        <SmsSubNav active="senders" />
      </div>

      {params.requested ? (
        <Card elevation="sm" accentBorder>
          <CardBody>Demande envoyée — en attente de validation.</CardBody>
        </Card>
      ) : null}
      {params.error ? (
        <Card elevation="sm" accentBorder>
          <CardBody>Une erreur est survenue.</CardBody>
        </Card>
      ) : null}

      <p className="text-muted" style={{ maxWidth: "60ch", fontSize: 13.5 }}>
        Un nom d&apos;expéditeur doit être validé par chaque opérateur du pays visé. Les délais sont ceux des
        opérateurs — prévoyez plusieurs jours ouvrés. Tant qu&apos;aucun nom n&apos;est validé pour un pays, les
        envois partent avec le nom partagé par défaut.
      </p>

      <Card elevation="md" style={{ overflow: "auto" }}>
        <Table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Pays</th>
              <th>Usage</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {senderNames.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.name}</strong>
                </td>
                <td className="text-muted">{s.country}</td>
                <td className="text-muted">{USAGE_LABELS[s.usage] ?? s.usage}</td>
                <td>
                  <Tag variant={s.status === "VALIDATED" ? "accent" : s.status === "REJECTED" ? "neutral" : "outline"}>
                    {STATUS_LABELS[s.status] ?? s.status}
                    {s.status === "REJECTED" && s.rejectionReason ? ` · ${s.rejectionReason}` : ""}
                  </Tag>
                </td>
              </tr>
            ))}
            {senderNames.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted">
                  Aucun nom d&apos;expéditeur demandé pour l&apos;instant — les envois utilisent le nom partagé.
                </td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </Card>

      <Card elevation="sm">
        <CardTitle>Demander un nom d&apos;expéditeur</CardTitle>
        <form action={requestSenderNameAction} style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
          <Field label="Nom (11 caractères max)">
            <Input name="name" maxLength={11} required />
          </Field>
          <Field label="Pays (code ISO)">
            <Input name="country" maxLength={2} placeholder="TG" required />
          </Field>
          <Field label="Usage">
            <select name="usage" className="input" defaultValue="TRANSACTIONAL">
              <option value="TRANSACTIONAL">Transactionnel</option>
              <option value="MARKETING">Marketing</option>
              <option value="OTP">OTP</option>
            </select>
          </Field>
          <div style={{ gridColumn: "1 / -1" }}>
            <Button type="submit" variant="primary">
              Envoyer la demande
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export const dynamic = "force-dynamic";
