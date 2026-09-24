import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { generateApiKey } from "@/lib/api-keys";
import { recordAudit } from "@/lib/audit";
import { getEnvironmentFromRequest, resolveProject } from "@/lib/project";
import { consoleRoleHasPermission } from "@notifyafrica/auth";
import type { ConsoleRole } from "@notifyafrica/design-system";
import { createApiKeySchema } from "@notifyafrica/validation";

/** Developers - API Keys (03_Specifications_Console §22). Scoped to the
 * caller's current Live/Test project — a key created under Test doesn't
 * show up (or authenticate as) Live. */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const project = await resolveProject(session.organizationId, getEnvironmentFromRequest(req));
  if (!project) return Response.json({ keys: [] });

  const keys = await prisma.apiKey.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      environment: true,
      prefix: true,
      scopes: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
    },
  });

  return Response.json({ keys });
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!session.role || !consoleRoleHasPermission(session.role as ConsoleRole, "apikey.manage")) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const project = await resolveProject(session.organizationId, getEnvironmentFromRequest(req));
  if (!project) {
    return Response.json({ error: "project_not_found" }, { status: 404 });
  }

  const { fullKey, hashedKey, prefix } = generateApiKey(input.environment);

  const key = await prisma.apiKey.create({
    data: {
      projectId: project.id,
      name: input.name,
      environment: input.environment,
      hashedKey,
      prefix,
      scopes: input.scopes,
    },
  });

  await recordAudit({
    actorUserId: session.sub,
    action: "apikey.create",
    resource: "api_key",
    resourceId: key.id,
    after: { name: key.name, environment: key.environment, prefix: key.prefix },
  });

  // fullKey is returned exactly once — the DB only ever stores its hash.
  return Response.json({
    key: {
      id: key.id,
      name: key.name,
      environment: key.environment,
      prefix: key.prefix,
      scopes: key.scopes,
      createdAt: key.createdAt,
    },
    secret: fullKey,
  });
}
