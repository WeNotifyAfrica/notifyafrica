import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { createPaymentMethodSchema } from "@notifyafrica/validation";

/** Payment methods catalog (02_Specifications_Backoffice §23). */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const methods = await prisma.paymentMethod.findMany({ orderBy: { createdAt: "asc" } });
  return Response.json({ methods });
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createPaymentMethodSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const method = await prisma.paymentMethod.create({
    data: { ...input, status: "ACTIVE" },
  });

  await recordAudit({
    actorUserId: session.sub,
    action: "payment_method.create",
    resource: "payment_method",
    resourceId: method.id,
    after: method,
  });

  return Response.json({ method });
}
