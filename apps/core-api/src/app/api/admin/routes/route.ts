import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { createRouteSchema } from "@notifyafrica/validation";

/** Routing Engine (02_Specifications_Backoffice §22): product + country +
 * operator + provider + priority/strategy. */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const routes = await prisma.route.findMany({
    orderBy: [{ productKey: "asc" }, { priority: "desc" }],
    include: { provider: { select: { id: true, name: true } } },
  });
  return Response.json({ routes });
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = createRouteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }

  const provider = await prisma.provider.findUnique({ where: { id: parsed.data.providerId } });
  if (!provider) {
    return Response.json({ error: "provider_not_found" }, { status: 404 });
  }

  const route = await prisma.route.create({ data: parsed.data });

  await recordAudit({
    actorUserId: session.sub,
    action: "route.create",
    resource: "route",
    resourceId: route.id,
    after: route,
  });

  return Response.json({ route });
}
