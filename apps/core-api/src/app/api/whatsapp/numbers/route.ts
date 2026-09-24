import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { getEnvironmentFromRequest, resolveProject } from "@/lib/project";
import { createWhatsAppNumberSchema } from "@notifyafrica/validation";

/** WhatsApp sender numbers (03_Specifications_Console §16 "numbers"). No
 * real Meta verification flow is wired yet — created directly as VERIFIED.
 * Scoped to the caller's current Live/Test project — matches Meta's own
 * real WhatsApp Business API, where test numbers are entirely separate
 * objects from production ones. */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const project = await resolveProject(session.organizationId, getEnvironmentFromRequest(req));
  const numbers = await prisma.whatsAppNumber.findMany({
    where: { organizationId: session.organizationId, projectId: project?.id },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ numbers });
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createWhatsAppNumberSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }

  const project = await resolveProject(session.organizationId, getEnvironmentFromRequest(req));
  if (!project) {
    return Response.json({ error: "project_not_found" }, { status: 404 });
  }

  const number = await prisma.whatsAppNumber.create({
    data: {
      organizationId: session.organizationId,
      projectId: project.id,
      phoneNumber: parsed.data.phoneNumber,
      displayName: parsed.data.displayName,
      status: "VERIFIED",
    },
  });

  await recordAudit({
    actorUserId: session.sub,
    action: "whatsapp_number.create",
    resource: "whatsapp_number",
    resourceId: number.id,
    after: number,
  });

  return Response.json({ number });
}
