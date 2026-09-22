import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { Card, CardTitle, CardBody } from "@notifyafrica/ui";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const { session } = await coreApi(token).getSession();

  return (
    <div>
      <h1>Vue d&apos;ensemble</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        <Card elevation="sm">
          <CardTitle>Organisation</CardTitle>
          <CardBody>{session.organizationId}</CardBody>
        </Card>
        <Card elevation="sm">
          <CardTitle>Rôle</CardTitle>
          <CardBody>{session.role}</CardBody>
        </Card>
      </div>
    </div>
  );
}
