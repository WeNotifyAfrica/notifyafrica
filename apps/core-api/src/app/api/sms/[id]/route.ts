import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { transactionJson } from "@/lib/serialize";

/** Message detail (design handoff Lot 7 "Détail du message"). Includes the
 * linked Transaction so the Console can show the same billing breakdown
 * the pricingSnapshot on the message already carries, plus its status. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const message = await prisma.message.findFirst({
    where: { id, organizationId: session.organizationId },
    include: { transaction: true },
  });
  if (!message) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  const { transaction, ...rest } = message;
  return Response.json({ message: rest, transaction: transaction ? transactionJson(transaction) : null });
}
