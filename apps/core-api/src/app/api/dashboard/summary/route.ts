import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { getWallet } from "@/lib/wallet";
import { walletJson } from "@/lib/serialize";

/**
 * Console overview (design handoff Lots 5-6). Real aggregates only — no
 * fixture data. Deliberately skips the mockup's 14-day volume bar chart
 * (would need a time-series aggregation query with little product value
 * yet at this data volume); "par produit ce mois-ci" gives the same
 * "where is spend going" answer with a single groupBy.
 */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const organizationId = session.organizationId;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    wallet,
    messagesByProduct,
    activeCampaigns,
    pendingQuotes,
    recentMessages,
    recentTransactions,
  ] = await Promise.all([
    getWallet(organizationId),
    prisma.message.groupBy({
      by: ["product"],
      where: { organizationId, createdAt: { gte: startOfMonth } },
      _count: { _all: true },
    }),
    prisma.campaign.count({
      where: { organizationId, status: { in: ["QUEUED", "RUNNING"] } },
    }),
    prisma.quote.count({
      where: {
        organizationId,
        status: { in: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "INFO_REQUIRED", "OFFER_AVAILABLE"] },
      },
    }),
    prisma.message.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, product: true, destination: true, status: true, createdAt: true },
    }),
    prisma.transaction.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, type: true, amountMinor: true, currency: true, status: true, createdAt: true },
    }),
  ]);

  const activity = [
    ...recentMessages.map((m) => ({
      id: m.id,
      kind: "message" as const,
      label: `${m.product} vers ${m.destination}`,
      status: m.status,
      createdAt: m.createdAt,
    })),
    ...recentTransactions.map((t) => ({
      id: t.id,
      kind: "transaction" as const,
      label: t.type,
      status: t.status,
      createdAt: t.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  return Response.json({
    wallet: wallet ? walletJson(wallet) : null,
    messagesByProductThisMonth: messagesByProduct.map((row) => ({
      product: row.product,
      count: row._count._all,
    })),
    activeCampaigns,
    pendingQuotes,
    activity,
  });
}
