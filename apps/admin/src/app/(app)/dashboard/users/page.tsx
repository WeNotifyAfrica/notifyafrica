import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { Card, Table, Tag } from "@notifyafrica/ui";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
};

/** User management list (02_Specifications_Backoffice §6). Suspend/reactivate
 * actions are a later increment — this is the read slice. */
export default async function UsersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const { users } = await coreApi(token).listUsers();

  return (
    <div>
      <h1>Utilisateurs</h1>
      <Card elevation="md" style={{ overflow: "auto" }}>
        <Table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Statut</th>
              <th>Vérifié</th>
              <th>Organisations</th>
              <th>Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>
                  <Tag variant={u.status === "ACTIVE" ? "accent" : "neutral"}>
                    {STATUS_LABELS[u.status] ?? u.status}
                  </Tag>
                </td>
                <td>{u.emailVerifiedAt ? "Oui" : "Non"}</td>
                <td>{u.organizations.map((o) => `${o.name} (${o.role})`).join(", ")}</td>
                <td className="num">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  Aucun utilisateur pour l&apos;instant.
                </td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

export const dynamic = "force-dynamic";
