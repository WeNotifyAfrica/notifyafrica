import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { getEnvironmentFromRequest, resolveProject } from "@/lib/project";
import { consoleRoleHasPermission } from "@notifyafrica/auth";
import type { ConsoleRole } from "@notifyafrica/design-system";
import { createSenderNameSchema } from "@notifyafrica/validation";

/**
 * SMS sender names (design handoff Lot 7 "Noms d'expéditeur"). Created
 * directly at PENDING — Admin approves/rejects
 * (/api/admin/sms/sender-names/:id/review), mirroring the WhatsApp
 * template review gate since there's no real per-operator validation
 * channel to integrate with yet. Scoped to the caller's current Live/Test
 * project, same as WhatsApp numbers/templates — matches how Meta's real
 * WhatsApp Business API keeps test numbers entirely separate from
 * production ones, not a NotifyAfrica-only simplification.
 */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const project = await resolveProject(session.organizationId, getEnvironmentFromRequest(req));
  const senderNames = await prisma.senderName.findMany({
    where: { organizationId: session.organizationId, projectId: project?.id },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ senderNames });
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!session.role || !consoleRoleHasPermission(session.role as ConsoleRole, "sms.send")) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSenderNameSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }

  const project = await resolveProject(session.organizationId, getEnvironmentFromRequest(req));
  if (!project) {
    return Response.json({ error: "project_not_found" }, { status: 404 });
  }

  const senderName = await prisma.senderName.create({
    data: {
      organizationId: session.organizationId,
      projectId: project.id,
      name: parsed.data.name,
      country: parsed.data.country,
      usage: parsed.data.usage,
      status: "PENDING",
    },
  });

  await recordAudit({
    actorUserId: session.sub,
    action: "sender_name.request",
    resource: "sender_name",
    resourceId: senderName.id,
    after: senderName,
  });

  return Response.json({ senderName });
}
