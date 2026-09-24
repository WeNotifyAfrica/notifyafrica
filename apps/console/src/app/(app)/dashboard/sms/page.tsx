import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { sendSmsAction } from "../../actions";
import { SmsSubNav } from "./SmsSubNav";
import { Button, Card, CardTitle, CardBody, Field, Input, Textarea, Table, Tag, formatMoney } from "@notifyafrica/ui";

const ERROR_LABELS: Record<string, string> = {
  insufficient_balance: "Solde insuffisant pour cet envoi.",
  quote_required: "Ce volume nécessite un devis — contactez le support.",
  send_failed: "L'envoi a échoué. Réessayez.",
};

const STATUS_LABELS: Record<string, string> = {
  SENT: "Envoyé",
  QUEUED: "En file",
  FAILED: "Échoué",
};

export default async function SmsPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; template?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const api = coreApi(token);

  const [{ wallet }, { messages }, currenciesConfig, { senderNames }, { templates }] = await Promise.all([
    api.getWallet(),
    api.listSmsHistory(),
    api.listCurrencies(),
    api.listSenderNames(),
    api.listSmsTemplates(),
  ]);
  const currencies = currenciesConfig.value ?? [];
  const validatedSenders = senderNames.filter((s) => s.status === "VALIDATED");
  const selectedTemplate = params.template ? templates.find((t) => t.id === params.template) : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <h1>SMS</h1>
        <SmsSubNav active="send" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
        <div>
          {params.sent ? (
            <Card elevation="sm" accentBorder style={{ marginBottom: 16 }}>
              <CardBody>SMS envoyé.</CardBody>
            </Card>
          ) : null}
          {params.error ? (
            <Card elevation="sm" accentBorder style={{ marginBottom: 16 }}>
              <CardBody>{ERROR_LABELS[params.error] ?? "Une erreur est survenue."}</CardBody>
            </Card>
          ) : null}

          <Card elevation="md" style={{ overflow: "auto" }}>
            <CardTitle>Historique</CardTitle>
            <Table>
              <thead>
                <tr>
                  <th>Destination</th>
                  <th>Message</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <a href={`/dashboard/sms/${m.id}`}>{m.destination}</a>
                    </td>
                    <td>{m.content.slice(0, 40)}</td>
                    <td>
                      <Tag variant={m.status === "SENT" ? "accent" : "neutral"}>{STATUS_LABELS[m.status] ?? m.status}</Tag>
                    </td>
                    <td className="num">{new Date(m.createdAt).toLocaleString("fr-FR")}</td>
                  </tr>
                ))}
                {messages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-muted">
                      Aucun SMS envoyé pour l&apos;instant.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card elevation="sm">
            <CardTitle>Solde disponible</CardTitle>
            <CardBody>
              <span className="num" style={{ fontSize: 22, color: "var(--color-accent-300)" }}>
                {formatMoney(wallet.availableMinor, wallet.currency, currencies)}
              </span>
            </CardBody>
          </Card>

          <Card elevation="sm">
            <CardTitle>Envoyer un SMS</CardTitle>
            <CardBody>
              L&apos;estimation (prix unitaire, solde après envoi) est calculée par le moteur de prix au moment de
              l&apos;envoi — aucun prix n&apos;est codé ici.
            </CardBody>
            <form action={sendSmsAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Destinataire (E.164)">
                <Input name="destination" placeholder="+22890000000" required />
              </Field>
              <Field label="Expéditeur">
                {validatedSenders.length > 0 ? (
                  <select name="senderId" className="input" defaultValue="">
                    <option value="">Partagé par défaut</option>
                    {validatedSenders.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.country})
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    <Input name="senderId" placeholder="Partagé par défaut" />
                    <p className="text-muted" style={{ fontSize: 11, margin: "4px 0 0" }}>
                      Aucun nom validé — <a href="/dashboard/sms/senders">en demander un</a>.
                    </p>
                  </>
                )}
              </Field>
              <Field label="Message">
                <input type="hidden" name="smsTemplateId" value={selectedTemplate?.id ?? ""} />
                <Textarea name="content" rows={4} defaultValue={selectedTemplate?.bodyText} required />
              </Field>
              {selectedTemplate ? (
                <p className="text-muted" style={{ fontSize: 11, margin: 0 }}>
                  Pré-rempli depuis le modèle « {selectedTemplate.name} ».
                </p>
              ) : null}
              <Button type="submit" variant="primary" block>
                Envoyer
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
