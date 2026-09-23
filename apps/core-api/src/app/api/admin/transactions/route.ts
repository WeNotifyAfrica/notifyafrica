import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";
import { transactionJson } from "@/lib/serialize";

/** Financial transactions view (02_Specifications_Backoffice §16). */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { organization: { select: { id: true, name: true } } },
  });

  return Response.json({ transactions: transactions.map(transactionJson) });
}
