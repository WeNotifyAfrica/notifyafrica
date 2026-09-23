import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { transactionJson } from "@/lib/serialize";

/** Wallet statement (03_Specifications_Console §8 "last transactions",
 * §28 Billing "Transactions"). */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const transactions = await prisma.transaction.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return Response.json({ transactions: transactions.map(transactionJson) });
}
