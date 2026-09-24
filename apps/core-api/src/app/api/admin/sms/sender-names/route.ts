import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";

/** Sender name review queue (design handoff Lot 7, mirrors the WhatsApp
 * template review pattern). */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const senderNames = await prisma.senderName.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { organization: { select: { id: true, name: true } } },
  });
  return Response.json({ senderNames });
}
