import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { publishConfigSchema } from "@notifyafrica/validation";

/**
 * Admin publishes a new config version (00_Contexte_Global §9). We never
 * mutate a previously published row — each publish inserts the next version
 * so Website/Console can keep serving the prior one until this row's
 * effectiveFrom/status make it current, and history falls out of the table.
 */
export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = publishConfigSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const last = await prisma.configEntry.findFirst({
    where: { key: input.key, scope: input.scope, scopeId: input.scopeId, environment: input.environment },
    orderBy: { version: "desc" },
  });
  const nextVersion = (last?.version ?? 0) + 1;

  const entry = await prisma.configEntry.create({
    data: {
      key: input.key,
      value: input.value as object,
      type: input.type,
      scope: input.scope,
      scopeId: input.scopeId,
      environment: input.environment,
      version: nextVersion,
      status: "ACTIVE",
      reason: input.reason,
      authorId: session.sub,
      effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null,
    },
  });

  await recordAudit({
    actorUserId: session.sub,
    action: "config.publish",
    resource: "config_entry",
    resourceId: entry.id,
    before: last?.value ?? null,
    after: entry.value,
    reason: input.reason,
  });

  return Response.json({ entry });
}
