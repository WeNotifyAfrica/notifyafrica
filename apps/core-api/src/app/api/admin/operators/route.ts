import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { createOperatorSchema } from "@notifyafrica/validation";

/** Opérateurs (02_Specifications_Backoffice §19), distincts des providers
 * techniques. */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const operators = await prisma.operator.findMany({ orderBy: { name: "asc" } });
  return Response.json({ operators });
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = createOperatorSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const operator = await prisma.operator.create({ data: parsed.data });

  await recordAudit({
    actorUserId: session.sub,
    action: "operator.create",
    resource: "operator",
    resourceId: operator.id,
    after: operator,
  });

  return Response.json({ operator });
}
