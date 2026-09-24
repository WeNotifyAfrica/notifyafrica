import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { getEnvironmentFromRequest, resolveProject } from "@/lib/project";
import { consoleRoleHasPermission } from "@notifyafrica/auth";
import type { ConsoleRole } from "@notifyafrica/design-system";
import { createSmsTemplateSchema } from "@notifyafrica/validation";

/**
 * SMS templates (design handoff Lot 7 "Modèles") — reusable message bodies
 * with `{variable}` placeholders. No approval gate, unlike sender names:
 * these are an org's own internal drafts. `usageCount` is bumped for real
 * in /api/sms/send when a send references one. Scoped to the caller's
 * current Live/Test project, same as every other resource.
 */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const project = await resolveProject(session.organizationId, getEnvironmentFromRequest(req));
  const templates = await prisma.smsTemplate.findMany({
    where: { organizationId: session.organizationId, projectId: project?.id },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ templates });
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
  const parsed = createSmsTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }

  const project = await resolveProject(session.organizationId, getEnvironmentFromRequest(req));
  if (!project) {
    return Response.json({ error: "project_not_found" }, { status: 404 });
  }

  const template = await prisma.smsTemplate.create({
    data: {
      organizationId: session.organizationId,
      projectId: project.id,
      name: parsed.data.name,
      usage: parsed.data.usage,
      bodyText: parsed.data.bodyText,
    },
  });

  return Response.json({ template });
}
