import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const messages = await prisma.message.findMany({
    where: { organizationId: session.organizationId, product: "WHATSAPP" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return Response.json({ messages });
}
