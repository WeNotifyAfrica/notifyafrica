import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireOrgSession } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { logger } from "@notifyafrica/observability";
import { consoleRoleHasPermission } from "@notifyafrica/auth";
import type { ConsoleRole } from "@notifyafrica/design-system";
import { inviteMemberSchema } from "@notifyafrica/validation";

const INVITATION_TTL_DAYS = 7;

/** Équipe - invitations (03_Specifications_Console §29). */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const invitations = await prisma.invitation.findMany({
    where: { organizationId: session.organizationId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, status: true, expiresAt: true, createdAt: true },
  });

  return Response.json({ invitations });
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireOrgSession(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!session.role || !consoleRoleHasPermission(session.role as ConsoleRole, "team.manage")) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    const alreadyMember = await prisma.membership.findFirst({
      where: { userId: existingUser.id, organizationId: session.organizationId },
    });
    if (alreadyMember) {
      return Response.json({ error: "already_member" }, { status: 409 });
    }
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

  const invitation = await prisma.invitation.create({
    data: {
      organizationId: session.organizationId,
      email: input.email,
      role: input.role,
      token,
      expiresAt,
      invitedByUserId: session.sub,
    },
  });

  // No email provider wired yet (design handoff README §9 point 4) — logged
  // as an intended delivery, same pattern as notify.ts's deliverIntendedChannel.
  logger.info("invitation.intended_email", { email: input.email, token });

  await recordAudit({
    actorUserId: session.sub,
    action: "team.invite",
    resource: "invitation",
    resourceId: invitation.id,
    after: { email: input.email, role: input.role },
  });

  return Response.json({ invitation: { id: invitation.id, email: invitation.email, role: invitation.role } });
}
