import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { consoleRoleHasPermission } from "@notifyafrica/auth";
import type { ConsoleRole } from "@notifyafrica/design-system";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!session.role || !consoleRoleHasPermission(session.role as ConsoleRole, "apikey.manage")) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const key = await prisma.apiKey.findFirst({
    where: { id },
    include: { project: { select: { organizationId: true } } },
  });
  if (!key || key.project.organizationId !== session.organizationId) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const updated = await prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  await recordAudit({
    actorUserId: session.sub,
    action: "apikey.revoke",
    resource: "api_key",
    resourceId: id,
    before: { revokedAt: null },
    after: { revokedAt: updated.revokedAt },
  });

  return Response.json({ ok: true });
}
