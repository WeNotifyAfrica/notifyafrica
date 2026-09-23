import { prisma } from "@/lib/db";
import { hashPassword, signSession } from "@notifyafrica/auth";
import { acceptInvitationSchema } from "@notifyafrica/validation";

const AUTH_SECRET = process.env.AUTH_SECRET ?? "";

/**
 * Invitation acceptance (03_Specifications_Console §3 "invitation" screen).
 * No session required — the token itself is the credential. Only handles
 * brand-new invitees (no prior account); an invitee who already has a
 * NotifyAfrica account is told to log in instead rather than silently
 * merging accounts.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const parsed = acceptInvitationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const invitation = await prisma.invitation.findUnique({ where: { token: input.token } });
  if (!invitation || invitation.status !== "PENDING") {
    return Response.json({ error: "invalid_or_used_invitation" }, { status: 410 });
  }
  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: "EXPIRED" } });
    return Response.json({ error: "invitation_expired" }, { status: 410 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });
  if (existingUser) {
    return Response.json({ error: "account_already_exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: { email: invitation.email, passwordHash, emailVerifiedAt: new Date() },
  });

  await prisma.membership.create({
    data: { userId: user.id, organizationId: invitation.organizationId, role: invitation.role },
  });

  await prisma.invitation.update({ where: { id: invitation.id }, data: { status: "ACCEPTED" } });

  const token = await signSession(
    {
      sub: user.id,
      email: user.email,
      organizationId: invitation.organizationId,
      role: invitation.role,
      internalRole: null,
    },
    AUTH_SECRET,
  );

  return Response.json({ token });
}
