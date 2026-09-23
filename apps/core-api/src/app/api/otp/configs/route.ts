import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { consoleRoleHasPermission } from "@notifyafrica/auth";
import type { ConsoleRole } from "@notifyafrica/design-system";
import { createOtpConfigSchema } from "@notifyafrica/validation";

/** OTP - configuration (03_Specifications_Console §15). */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const configs = await prisma.otpConfig.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ configs });
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!session.role || !consoleRoleHasPermission(session.role as ConsoleRole, "otp.manage")) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createOtpConfigSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const project = await prisma.project.findFirst({ where: { organizationId: session.organizationId } });
  if (!project) {
    return Response.json({ error: "project_not_found" }, { status: 404 });
  }

  const config = await prisma.otpConfig.create({
    data: { ...input, organizationId: session.organizationId, projectId: project.id },
  });

  await recordAudit({
    actorUserId: session.sub,
    action: "otp_config.create",
    resource: "otp_config",
    resourceId: config.id,
    after: { name: config.name, channel: config.channel },
  });

  return Response.json({ config });
}
