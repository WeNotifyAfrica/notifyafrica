import { prisma } from "@/lib/db";
import { signSession, verifyPassword } from "@notifyafrica/auth";
import { loginSchema } from "@notifyafrica/validation";

const AUTH_SECRET = process.env.AUTH_SECRET ?? "";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || user.status !== "ACTIVE") {
    return Response.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return Response.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const membership = await prisma.membership.findFirst({ where: { userId: user.id } });

  const token = await signSession(
    {
      sub: user.id,
      email: user.email,
      organizationId: membership?.organizationId ?? null,
      role: membership?.role ?? null,
      internalRole: user.internalRole ?? null,
    },
    AUTH_SECRET,
  );

  return Response.json({ token });
}
