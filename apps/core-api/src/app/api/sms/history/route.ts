import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { getEnvironmentFromRequest, resolveProject } from "@/lib/project";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const project = await resolveProject(session.organizationId, getEnvironmentFromRequest(req));
  const messages = await prisma.message.findMany({
    where: { organizationId: session.organizationId, projectId: project?.id, product: "SMS" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return Response.json({ messages });
}
