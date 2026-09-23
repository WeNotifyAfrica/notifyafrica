import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { inviteMemberAction, revokeInvitationAction } from "./actions";
import { Button, Card, CardTitle, CardBody, Field, Input, Table, Tag } from "@notifyafrica/ui";
import { CONSOLE_ROLES } from "@notifyafrica/design-system";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  BILLING_MANAGER: "Responsable facturation",
  DEVELOPER: "Développeur",
  CAMPAIGN_MANAGER: "Responsable campagnes",
  SUPPORT_AGENT: "Agent support",
  VIEWER_AUDITOR: "Lecteur / Audit",
};

/** Équipe (03_Specifications_Console §29): membres, invitations, rôles (7). */
export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ invited?: string; error?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const api = coreApi(token);

  const [{ members }, { invitations }] = await Promise.all([api.listTeamMembers(), api.listInvitations()]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
      <div>
        <h1>Équipe</h1>

        {params.invited ? (
          <Card elevation="sm" accentBorder style={{ marginBottom: 16 }}>
            <CardBody>Invitation envoyée.</CardBody>
          </Card>
        ) : null}
        {params.error ? (
          <Card elevation="sm" accentBorder style={{ marginBottom: 16 }}>
            <CardBody>L&apos;invitation a échoué.</CardBody>
          </Card>
        ) : null}

        <Card elevation="md" style={{ marginBottom: 16, overflow: "auto" }}>
          <CardTitle>Membres</CardTitle>
          <Table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Rôle</th>
                <th>Membre depuis</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.userId}>
                  <td>{m.email}</td>
                  <td>
                    <Tag variant="neutral">{ROLE_LABELS[m.role] ?? m.role}</Tag>
                  </td>
                  <td className="num">{new Date(m.memberSince).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card elevation="md" style={{ overflow: "auto" }}>
          <CardTitle>Invitations en attente</CardTitle>
          <Table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Rôle</th>
                <th>Expire le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.email}</td>
                  <td>
                    <Tag variant="outline">{ROLE_LABELS[inv.role] ?? inv.role}</Tag>
                  </td>
                  <td className="num">{new Date(inv.expiresAt).toLocaleDateString("fr-FR")}</td>
                  <td>
                    <form action={revokeInvitationAction}>
                      <input type="hidden" name="id" value={inv.id} />
                      <Button type="submit" variant="ghost">
                        Annuler
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted">
                    Aucune invitation en attente.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </Card>
      </div>

      <Card elevation="sm">
        <CardTitle>Inviter un membre</CardTitle>
        <form action={inviteMemberAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Email">
            <Input type="email" name="email" required />
          </Field>
          <Field label="Rôle">
            <select name="role" className="input" defaultValue="DEVELOPER">
              {CONSOLE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role] ?? role}
                </option>
              ))}
            </select>
          </Field>
          <Button type="submit" variant="primary" block>
            Envoyer l&apos;invitation
          </Button>
        </form>
      </Card>
    </div>
  );
}

export const dynamic = "force-dynamic";
