import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { getCurrentEnvironment } from "@/lib/environment";
import { SESSION_COOKIE } from "@/lib/env";
import { revokeApiKeyAction } from "./actions";
import { CreateApiKeyForm } from "./CreateApiKeyForm";
import { Button, Card, CardTitle, Table, Tag } from "@notifyafrica/ui";

const ENV_LABELS: Record<string, string> = {
  production: "Production",
  sandbox: "Test",
};

/** Développeurs - Clés API (03_Specifications_Console §21-22). */
export default async function DevelopersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const { keys } = await coreApi(token, await getCurrentEnvironment()).listApiKeys();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
      <div>
        <h1>Clés API</h1>
        <Card elevation="md" style={{ overflow: "auto" }}>
          <Table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Environnement</th>
                <th>Préfixe</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td>{k.name}</td>
                  <td>
                    <Tag variant={k.environment === "production" ? "accent" : "neutral"}>
                      {ENV_LABELS[k.environment] ?? k.environment}
                    </Tag>
                  </td>
                  <td className="num">{k.prefix}…</td>
                  <td>{k.revokedAt ? <Tag variant="neutral">Révoquée</Tag> : <Tag variant="accent">Active</Tag>}</td>
                  <td>
                    {!k.revokedAt ? (
                      <form action={revokeApiKeyAction}>
                        <input type="hidden" name="id" value={k.id} />
                        <Button type="submit" variant="ghost">
                          Révoquer
                        </Button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted">
                    Aucune clé API pour l&apos;instant.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </Card>
      </div>

      <CreateApiKeyForm />
    </div>
  );
}

export const dynamic = "force-dynamic";
