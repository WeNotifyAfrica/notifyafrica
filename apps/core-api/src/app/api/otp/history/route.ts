import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const codes = await prisma.otpCode.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      destination: true,
      status: true,
      attempts: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return Response.json({ codes });
}
