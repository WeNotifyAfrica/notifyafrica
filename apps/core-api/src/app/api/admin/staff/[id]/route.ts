import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { internalRoleHasPermission } from "@notifyafrica/auth";
import type { InternalRole } from "@notifyafrica/design-system";
import { updateStaffSchema } from "@notifyafrica/validation";

/** Demoting or suspending the last active Super-admin would lock the
 * platform's own admins out of it (design lot 27, "Cas limites"), so it's
 * refused rather than merely discouraged. */
async function wouldRemoveLastSuperAdmin(userId: string, nextRole?: string, nextStatus?: string) {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.internalRole !== "SUPER_ADMIN") return false;

  const losesSuperAdmin = (nextRole && nextRole !== "SUPER_ADMIN") || nextStatus === "SUSPENDED";
  if (!losesSuperAdmin) return false;

  const otherActiveSuperAdmins = await prisma.user.count({
    where: { id: { not: userId }, internalRole: "SUPER_ADMIN", status: "ACTIVE" },
  });
  return otherActiveSuperAdmins === 0;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!internalRoleHasPermission(session.internalRole as InternalRole, "platform.write")) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateStaffSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const before = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, internalRole: true, status: true },
  });
  if (!before || !before.internalRole) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  if (await wouldRemoveLastSuperAdmin(id, input.role, input.status)) {
    return Response.json({ error: "last_super_admin" }, { status: 409 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { internalRole: input.role, status: input.status },
    select: { id: true, email: true, internalRole: true, status: true, createdAt: true },
  });

  await recordAudit({
    actorUserId: session.sub,
    action: "staff.update",
    resource: "user",
    resourceId: user.id,
    before: { internalRole: before.internalRole, status: before.status },
    after: { internalRole: user.internalRole, status: user.status },
  });

  return Response.json({ staff: user });
}
