import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { reviewSenderNameSchema } from "@notifyafrica/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const before = await prisma.senderName.findUnique({ where: { id } });
  if (!before) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = reviewSenderNameSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }

  const senderName = await prisma.senderName.update({
    where: { id },
    data: {
      status: parsed.data.status,
      rejectionReason: parsed.data.status === "REJECTED" ? parsed.data.rejectionReason : null,
    },
  });

  await recordAudit({
    actorUserId: session.sub,
    action: "sender_name.review",
    resource: "sender_name",
    resourceId: id,
    before: { status: before.status },
    after: { status: senderName.status, rejectionReason: senderName.rejectionReason },
  });

  return Response.json({ senderName });
}
