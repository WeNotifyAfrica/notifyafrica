import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { Card, Table, Field, Input, Button } from "@notifyafrica/ui";

/**
 * Journal d'audit (design handoff Lot 27 "Journal d'audit"). The data has
 * existed since Phase A — every sensitive action already calls
 * recordAudit(); this is the first screen that surfaces it. `before`/
 * `after` are shown as compact JSON — a proper diff view is future work.
 */
export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; resource?: string; actorEmail?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const { entries, resources } = await coreApi(token).listAuditLog(params);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div>
        <h1>Journal d&apos;audit</h1>
        <p className="text-muted" style={{ margin: 0, fontSize: 13.5 }}>
          Toutes les actions sensibles effectuées côté Admin — crédits manuels, publications de
          tarifs, revues de modèles, changements de configuration.
        </p>
      </div>

      <Card elevation="sm">
        <form method="get" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, alignItems: "end" }}>
          <Field label="Action (contient)">
            <Input name="action" defaultValue={params.action} placeholder="pricing.publish" />
          </Field>
          <Field label="Ressource">
            <select name="resource" className="input" defaultValue={params.resource ?? ""}>
              <option value="">Toutes</option>
              {resources.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Auteur (email contient)">
            <Input name="actorEmail" defaultValue={params.actorEmail} placeholder="admin@" />
          </Field>
          <Button type="submit" variant="secondary">
            Filtrer
          </Button>
        </form>
      </Card>

      <Card elevation="md" style={{ overflow: "auto" }}>
        <Table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Auteur</th>
              <th>Action</th>
              <th>Ressource</th>
              <th>Motif</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="num text-muted">{new Date(e.createdAt).toLocaleString("fr-FR")}</td>
                <td>{e.actorEmail ?? "—"}</td>
                <td className="mono">{e.action}</td>
                <td className="text-muted">
                  {e.resource}
                  {e.resourceId ? ` · ${e.resourceId.slice(0, 12)}…` : ""}
                </td>
                <td className="text-muted" style={{ fontSize: 12 }}>
                  {e.reason ?? "—"}
                </td>
              </tr>
            ))}
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  Aucune entrée pour l&apos;instant.
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
