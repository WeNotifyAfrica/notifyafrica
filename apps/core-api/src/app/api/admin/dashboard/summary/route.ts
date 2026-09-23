import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";

/**
 * Back-office pilotage (design handoff Lot 19). Real aggregates only.
 * Deliberately omits the mockup's revenue/supplier-cost/margin chart —
 * that needs a SupplierCost model (Lot 20/25 territory, not built yet), so
 * showing it here would be fabricated data. Everything shown is queryable
 * today: organizations, revenue captured this month (per currency, since
 * orgs bill in different ones), items needing action, and the audit trail.
 */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    organizationCount,
    revenueThisMonth,
    pendingQuotes,
    pendingWhatsappTemplates,
    pendingTransactions,
    recentNotifications,
    recentAuditLog,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.transaction.groupBy({
      by: ["currency"],
      where: { status: "CAPTURED", createdAt: { gte: startOfMonth } },
      _sum: { amountMinor: true },
    }),
    prisma.quote.count({
      where: { status: { in: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "INFO_REQUIRED", "OFFER_AVAILABLE"] } },
    }),
    prisma.whatsAppTemplate.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.transaction.count({ where: { status: "PENDING" } }),
    prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actor: { select: { email: true } } },
    }),
  ]);

  return Response.json({
    organizationCount,
    revenueThisMonth: revenueThisMonth.map((row) => ({
      currency: row.currency,
      totalMinor: row._sum.amountMinor?.toString() ?? "0",
    })),
    pendingQuotes,
    pendingWhatsappTemplates,
    pendingTransactions,
    recentNotifications: recentNotifications.map((n) => ({
      id: n.id,
      event: n.event,
      createdAt: n.createdAt,
    })),
    recentAuditLog: recentAuditLog.map((a) => ({
      id: a.id,
      action: a.action,
      resource: a.resource,
      actorEmail: a.actor?.email ?? null,
      reason: a.reason,
      createdAt: a.createdAt,
    })),
  });
}
