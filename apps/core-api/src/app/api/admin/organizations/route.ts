import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";
import { walletJson } from "@/lib/serialize";

/**
 * Organizations / Customer 360 — a minimal read slice for now
 * (02_Specifications_Backoffice §7): identity, wallet balance, member and
 * project counts. Full 360 (discounts, quotes, tickets, risk notes) is a
 * later Phase C+ increment.
 */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      wallet: true,
      _count: { select: { memberships: true, projects: true } },
    },
  });

  return Response.json({
    organizations: organizations.map((org) => ({
      id: org.id,
      name: org.name,
      country: org.country,
      currency: org.currency,
      createdAt: org.createdAt,
      memberCount: org._count.memberships,
      projectCount: org._count.projects,
      wallet: org.wallet ? walletJson(org.wallet) : null,
    })),
  });
}
