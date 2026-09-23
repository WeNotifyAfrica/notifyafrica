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
  if (!session.role || !consoleRoleHasPermission(session.role as ConsoleRole, "team.manage")) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const invitation = await prisma.invitation.findFirst({ where: { id, organizationId: session.organizationId } });
  if (!invitation) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.invitation.update({ where: { id }, data: { status: "REVOKED" } });

  await recordAudit({
    actorUserId: session.sub,
    action: "team.invite_revoke",
    resource: "invitation",
    resourceId: id,
  });

  return Response.json({ ok: true });
}
