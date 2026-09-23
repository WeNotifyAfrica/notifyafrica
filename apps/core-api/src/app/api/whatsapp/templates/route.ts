import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { consoleRoleHasPermission } from "@notifyafrica/auth";
import type { ConsoleRole } from "@notifyafrica/design-system";
import { createWhatsAppTemplateSchema } from "@notifyafrica/validation";

/**
 * WhatsApp templates (03_Specifications_Console §16 "templates"). Created
 * directly at PENDING_REVIEW — Admin approves/rejects
 * (/api/admin/whatsapp/templates/:id/review) before a template can be used
 * to send (03_Specifications_Console §16 "modèles approuvés").
 */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const templates = await prisma.whatsAppTemplate.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ templates });
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!session.role || !consoleRoleHasPermission(session.role as ConsoleRole, "whatsapp.manage")) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createWhatsAppTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }

  const project = await prisma.project.findFirst({ where: { organizationId: session.organizationId } });
  if (!project) {
    return Response.json({ error: "project_not_found" }, { status: 404 });
  }

  const template = await prisma.whatsAppTemplate.create({
    data: {
      organizationId: session.organizationId,
      projectId: project.id,
      name: parsed.data.name,
      category: parsed.data.category,
      language: parsed.data.language,
      bodyText: parsed.data.bodyText,
      status: "PENDING_REVIEW",
    },
  });

  await recordAudit({
    actorUserId: session.sub,
    action: "whatsapp_template.submit",
    resource: "whatsapp_template",
    resourceId: template.id,
    after: template,
  });

  return Response.json({ template });
}
