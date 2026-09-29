"use client";

import { useActionState } from "react";
import { createStaffAction, updateStaffAction, type CreateStaffState } from "./actions";
import { Button, Card, CardTitle, CardBody, Field, Input, Table, Tag } from "@notifyafrica/ui";
import { INTERNAL_ROLES, INTERNAL_ROLE_LABELS, type InternalRole } from "@notifyafrica/design-system";
import type { StaffMember } from "@notifyafrica/types";

const initialState: CreateStaffState = { status: "idle" };

export function StaffTeamClient({ initialStaff }: { initialStaff: StaffMember[] }) {
  const [state, formAction] = useActionState(createStaffAction, initialState);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
      <div>
        <h1>Équipe interne &amp; rôles</h1>
        <p className="text-muted" style={{ margin: "0 0 16px", fontSize: 13.5, maxWidth: "62ch" }}>
          Chaque membre reçoit un rôle. Les droits d&apos;un rôle sont fixés dans le code (
          <code style={{ fontSize: 12 }}>internalRoleHasPermission</code>), pas personne par personne.
        </p>

        <Card elevation="md" style={{ overflow: "auto" }}>
          <Table>
            <thead>
              <tr>
                <th>Membre</th>
                <th>Rôle</th>
                <th>État</th>
                <th>Depuis</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {initialStaff.map((s) => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td>
                    <Tag variant="neutral">{s.internalRole ? INTERNAL_ROLE_LABELS[s.internalRole] : "—"}</Tag>
                  </td>
                  <td>
                    <Tag variant={s.status === "ACTIVE" ? "accent" : "outline"}>
                      {s.status === "ACTIVE" ? "Actif" : "Désactivé"}
                    </Tag>
                  </td>
                  <td className="num text-muted">{new Date(s.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td>
                    <form action={updateStaffAction} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input type="hidden" name="id" value={s.id} />
                      <select name="role" className="input" defaultValue={s.internalRole ?? ""} style={{ fontSize: 12 }}>
                        {INTERNAL_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {INTERNAL_ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" variant="ghost">
                        Changer le rôle
                      </Button>
                      <Button
                        type="submit"
                        variant="ghost"
                        name="status"
                        value={s.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"}
                      >
                        {s.status === "ACTIVE" ? "Désactiver" : "Réactiver"}
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
              {initialStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted">
                    Aucun membre interne pour l&apos;instant.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </Card>
      </div>

      <Card elevation="sm">
        <CardTitle>Inviter un membre interne</CardTitle>
        <CardBody>
          Aucune messagerie n&apos;est branchée : un mot de passe temporaire est affiché une seule
          fois — à transmettre au membre par un canal sûr, et à changer à la première connexion.
        </CardBody>

        {state.status === "success" ? (
          <Card elevation="sm" accentBorder>
            <CardBody>
              Compte <strong>{state.email}</strong> créé. Copiez ce mot de passe maintenant, il ne
              sera plus jamais affiché :
            </CardBody>
            <code
              style={{
                display: "block",
                padding: "var(--space-2)",
                background: "var(--color-bg)",
                borderRadius: "var(--radius-md)",
                wordBreak: "break-all",
                fontSize: 13,
              }}
            >
              {state.tempPassword}
            </code>
          </Card>
        ) : null}
        {state.status === "error" ? (
          <Card elevation="sm" accentBorder>
            <CardBody>{state.message}</CardBody>
          </Card>
        ) : null}

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Email">
            <Input type="email" name="email" required />
          </Field>
          <Field label="Rôle">
            <select name="role" className="input" defaultValue="SUPPORT">
              {INTERNAL_ROLES.map((role: InternalRole) => (
                <option key={role} value={role}>
                  {INTERNAL_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </Field>
          <Button type="submit" variant="primary">
            Créer le compte
          </Button>
        </form>
      </Card>
    </div>
  );
}
