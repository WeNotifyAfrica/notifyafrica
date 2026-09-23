import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";

/** Eligible payment methods for the caller's organization
 * (03_Specifications_Console §9: "Les moyens disponibles sont retournés
 * par l'API selon pays et organisation"). */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const organization = await prisma.organization.findUnique({ where: { id: session.organizationId } });
  if (!organization) {
    return Response.json({ error: "organization_not_found" }, { status: 404 });
  }

  const methods = await prisma.paymentMethod.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });

  const eligible = methods.filter((m) => m.countries.length === 0 || m.countries.includes(organization.country));

  return Response.json({ methods: eligible });
}
