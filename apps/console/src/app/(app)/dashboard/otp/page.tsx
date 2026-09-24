import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { getCurrentEnvironment } from "@/lib/environment";
import { SESSION_COOKIE } from "@/lib/env";
import { createOtpConfigAction, generateOtpAction, verifyOtpAction } from "./actions";
import { Button, Card, CardTitle, CardBody, Field, Input, Table, Tag } from "@notifyafrica/ui";

const VERIFY_LABELS: Record<string, string> = {
  VERIFIED: "Code vérifié avec succès.",
  PENDING: "Code incorrect — réessayez.",
  FAILED: "Code incorrect — tentatives épuisées.",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  VERIFIED: "Vérifié",
  EXPIRED: "Expiré",
  FAILED: "Échoué",
};

/**
 * OTP (03_Specifications_Console §15, design handoff Lot 9). Billed on
 * the *verified* code, not the send attempt (Lot 9's own stated
 * invariant) — /api/otp/generate holds funds, /api/otp/verify captures
 * them on a match or releases them on expiry/exhausted attempts, so a
 * code sent but never verified costs nothing (see apps/core-api/src/app/
 * api/otp/verify/route.ts). No real channel is wired yet (design handoff
 * README §9 point 4) — generated codes are logged server-side
 * ("otp.intended_delivery") instead of actually sent, so this page's demo
 * mode note tells you where to find the value while testing.
 */
export default async function OtpPage({
  searchParams,
}: {
  searchParams: Promise<{ generated?: string; error?: string; verifyStatus?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const api = coreApi(token, await getCurrentEnvironment());

  const [{ configs }, { codes }] = await Promise.all([api.listOtpConfigs(), api.listOtpHistory()]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
      <div>
        <h1>OTP</h1>

        {params.generated ? (
          <Card elevation="sm" accentBorder style={{ marginBottom: 16 }}>
            <CardBody>
              Code généré (id <code>{params.generated}</code>) — mode démo : la valeur du code est
              journalisée côté serveur (<code>otp.intended_delivery</code>), aucun canal réel n&apos;est
              branché.
            </CardBody>
          </Card>
        ) : null}
        {params.error ? (
          <Card elevation="sm" accentBorder style={{ marginBottom: 16 }}>
            <CardBody>{params.error}</CardBody>
          </Card>
        ) : null}
        {params.verifyStatus ? (
          <Card elevation="sm" accentBorder style={{ marginBottom: 16 }}>
            <CardBody>{VERIFY_LABELS[params.verifyStatus] ?? params.verifyStatus}</CardBody>
          </Card>
        ) : null}

        <Card elevation="md" style={{ marginBottom: 16, overflow: "auto" }}>
          <CardTitle>Configurations</CardTitle>
          <Table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Longueur</th>
                <th>Expiration</th>
                <th>Tentatives max</th>
                <th>Canal</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td className="num">{c.length}</td>
                  <td className="num">{c.expirySeconds}s</td>
                  <td className="num">{c.maxAttempts}</td>
                  <td>
                    <Tag variant="neutral">{c.channel}</Tag>
                  </td>
                </tr>
              ))}
              {configs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted">
                    Aucune configuration — créez-en une pour générer des codes.
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
                <th>Tentatives</th>
                <th>Expire</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id}>
                  <td>{c.destination}</td>
                  <td>
                    <Tag variant={c.status === "VERIFIED" ? "accent" : "neutral"}>
                      {STATUS_LABELS[c.status] ?? c.status}
                    </Tag>
                  </td>
                  <td className="num">{c.attempts}</td>
                  <td className="num">{new Date(c.expiresAt).toLocaleTimeString("fr-FR")}</td>
                </tr>
              ))}
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted">
                    Aucun code généré pour l&apos;instant.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </Card>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card elevation="sm">
          <CardTitle>Nouvelle configuration</CardTitle>
          <form
            action={createOtpConfigAction}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <Field label="Nom">
              <Input name="name" required />
            </Field>
            <Field label="Longueur">
              <Input name="length" type="number" defaultValue={6} min={4} max={10} />
            </Field>
            <Field label="Expiration (secondes)">
              <Input name="expirySeconds" type="number" defaultValue={300} />
            </Field>
            <Field label="Tentatives max">
              <Input name="maxAttempts" type="number" defaultValue={3} />
            </Field>
            <Field label="Canal">
              <select name="channel" className="input" defaultValue="SMS">
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </Field>
            <Field label="Modèle (utilisez {code})">
              <Input name="template" defaultValue="Votre code NotifyAfrica est {code}" />
            </Field>
            <Button type="submit" variant="primary">
              Créer
            </Button>
          </form>
        </Card>

        <Card elevation="sm">
          <CardTitle>Générer un code</CardTitle>
          <CardBody>
            Facturé au code vérifié, pas à la tentative d&apos;envoi : le montant est réservé maintenant, débité
            seulement si le code est vérifié à temps.
          </CardBody>
          <form action={generateOtpAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Configuration">
              <select name="configId" className="input" required>
                {configs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Destination">
              <Input name="destination" placeholder="+22890000000" required />
            </Field>
            <Button type="submit" variant="primary" disabled={configs.length === 0}>
              Générer
            </Button>
          </form>
        </Card>

        <Card elevation="sm">
          <CardTitle>Vérifier un code</CardTitle>
          <form action={verifyOtpAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="ID du code (retourné par la génération)">
              <Input name="otpId" required />
            </Field>
            <Field label="Code saisi">
              <Input name="code" required />
            </Field>
            <Button type="submit" variant="secondary">
              Vérifier
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
