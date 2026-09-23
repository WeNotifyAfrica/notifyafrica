import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";

/** Template review queue (03_Specifications_Console §16, stands in for the
 * not-yet-designed Lot 26 "revue des modèles WhatsApp avant soumission à
 * Meta"). */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const templates = await prisma.whatsAppTemplate.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { organization: { select: { id: true, name: true } } },
  });
  return Response.json({ templates });
}
