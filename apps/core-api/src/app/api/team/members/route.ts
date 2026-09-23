import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";

/** Équipe - membres (03_Specifications_Console §29). */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.membership.findMany({
    where: { organizationId: session.organizationId },
    include: { user: { select: { id: true, email: true, status: true, createdAt: true } } },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({
    members: memberships.map((m) => ({
      userId: m.user.id,
      email: m.user.email,
      status: m.user.status,
      role: m.role,
      memberSince: m.createdAt,
    })),
  });
}
