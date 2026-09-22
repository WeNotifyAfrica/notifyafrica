import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { triggerSeedImportAction } from "../actions";
import { Card, CardTitle, CardBody, Button } from "@notifyafrica/ui";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const { notifications } = await coreApi(token).listNotifications();

  return (
    <div>
      <h1>Pilotage</h1>

      <Card elevation="sm" style={{ marginBottom: 24 }}>
        <CardTitle>Configuration initiale</CardTitle>
        <CardBody>
          Importer la configuration seed issue du design (idempotent — sans effet si déjà importée).
        </CardBody>
        <form action={triggerSeedImportAction}>
          <Button type="submit" variant="secondary">
            Importer le seed
          </Button>
        </form>
      </Card>

      <h2>Notifications récentes</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(notifications as { id: string; event: string; createdAt: string }[]).map((n) => (
          <Card key={n.id} elevation="sm" accentBorder>
            <CardTitle>{n.event}</CardTitle>
            <CardBody>{new Date(n.createdAt).toLocaleString("fr-FR")}</CardBody>
          </Card>
        ))}
        {notifications.length === 0 ? <p className="text-muted">Aucune notification pour l&apos;instant.</p> : null}
      </div>
    </div>
  );
}
