import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return Response.json({ notifications });
}

export async function PATCH(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await req.json();
  const notification = await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });
  return Response.json({ notification });
}
