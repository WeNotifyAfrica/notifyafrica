import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";

/**
 * Journal d'audit (design handoff Lot 27 "Journal d'audit"). The data has
 * existed since Phase A — every sensitive action already calls
 * recordAudit() (wallet credits, pricing publishes, WhatsApp/sender-name
 * reviews, config publishes...) — this is the first screen that actually
 * lists it. Optional filters keep it usable once the table grows past a
 * handful of rows.
 */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const resource = url.searchParams.get("resource");
  const actorEmail = url.searchParams.get("actorEmail");

  const entries = await prisma.auditLog.findMany({
    where: {
      action: action ? { contains: action, mode: "insensitive" } : undefined,
      resource: resource ? { equals: resource } : undefined,
      actor: actorEmail ? { email: { contains: actorEmail, mode: "insensitive" } } : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { email: true } } },
  });

  const resources = await prisma.auditLog.findMany({
    distinct: ["resource"],
    select: { resource: true },
    orderBy: { resource: "asc" },
  });

  return Response.json({
    entries: entries.map((e) => ({
      id: e.id,
      action: e.action,
      resource: e.resource,
      resourceId: e.resourceId,
      actorEmail: e.actor?.email ?? null,
      before: e.before,
      after: e.after,
      reason: e.reason,
      createdAt: e.createdAt,
    })),
    resources: resources.map((r) => r.resource),
  });
}
