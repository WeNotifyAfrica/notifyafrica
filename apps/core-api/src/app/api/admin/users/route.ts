import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";

/** User management (02_Specifications_Backoffice §6) — list slice; suspend/
 * reactivate/audit actions are a later increment. */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { internalRole: null },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      memberships: { include: { organization: { select: { id: true, name: true } } } },
    },
  });

  return Response.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      status: u.status,
      emailVerifiedAt: u.emailVerifiedAt,
      createdAt: u.createdAt,
      organizations: u.memberships.map((m) => ({ id: m.organization.id, name: m.organization.name, role: m.role })),
    })),
  });
}
