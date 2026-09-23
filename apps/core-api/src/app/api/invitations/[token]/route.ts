import { prisma } from "@/lib/db";

/** Public lookup so the Console invite-accept screen can show who's
 * inviting the visitor before asking them to set a password. No secrets
 * exposed — email/org name/role only. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });

  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    return Response.json({ error: "invalid_or_expired" }, { status: 404 });
  }

  return Response.json({
    email: invitation.email,
    role: invitation.role,
    organizationName: invitation.organization.name,
  });
}
