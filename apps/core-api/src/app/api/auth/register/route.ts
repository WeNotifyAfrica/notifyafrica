import { prisma } from "@/lib/db";
import { recordEvent } from "@/lib/notify";
import { recordAudit } from "@/lib/audit";
import { ensureWallet } from "@/lib/wallet";
import { hashPassword, signSession } from "@notifyafrica/auth";
import { registerSchema } from "@notifyafrica/validation";

const AUTH_SECRET = process.env.AUTH_SECRET ?? "";

/**
 * Console registration (03_Specifications_Console §4). Creates the user,
 * organization, membership (OWNER), Live + Test projects (design handoff
 * Lots 5-6 shell: the env toggle needs one of each — see apps/core-api/
 * src/lib/project.ts), and the org's wallet, then fires USER_REGISTERED
 * so the Admin notification center picks it up (04_Prompt §13) without
 * Console knowing anything about Admin routing.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    return Response.json({ error: "email_already_registered" }, { status: 409 });
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: { email: input.email, passwordHash },
  });

  const organization = await prisma.organization.create({
    data: { name: input.organizationName, country: input.country, currency: input.currency },
  });

  await prisma.membership.create({
    data: { userId: user.id, organizationId: organization.id, role: "OWNER" },
  });

  await prisma.project.createMany({
    data: [
      { organizationId: organization.id, name: "Live", environment: "production" },
      { organizationId: organization.id, name: "Test", environment: "sandbox" },
    ],
  });

  await ensureWallet(organization.id, input.currency);

  await recordEvent("USER_REGISTERED", {
    organizationId: organization.id,
    userId: user.id,
    payload: {
      email: user.email,
      organizationName: organization.name,
      source: input.source ?? null,
      campaign: input.campaign ?? null,
    },
  });

  await recordAudit({
    actorUserId: user.id,
    action: "user.register",
    resource: "user",
    resourceId: user.id,
    after: { email: user.email, organizationId: organization.id },
  });

  const token = await signSession(
    {
      sub: user.id,
      email: user.email,
      organizationId: organization.id,
      role: "OWNER",
      internalRole: null,
    },
    AUTH_SECRET,
  );

  return Response.json({ userId: user.id, organizationId: organization.id, token });
}
