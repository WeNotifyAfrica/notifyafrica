import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, requireInternalRole } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { internalRoleHasPermission, hashPassword } from "@notifyafrica/auth";
import type { InternalRole } from "@notifyafrica/design-system";
import { createStaffSchema } from "@notifyafrica/validation";

/** Lot 27, "Équipe interne & rôles" — only a Super-admin can add or edit
 * members of the internal back-office team. */
export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const staff = await prisma.user.findMany({
    where: { internalRole: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, internalRole: true, status: true, createdAt: true },
  });

  return Response.json({ staff });
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!requireInternalRole(session)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!internalRoleHasPermission(session.internalRole as InternalRole, "platform.write")) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createStaffSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    return Response.json({ error: "email_taken" }, { status: 409 });
  }

  // Shown exactly once in the API response — only its bcrypt hash is stored.
  const tempPassword = randomBytes(9).toString("base64url");
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, internalRole: input.role },
    select: { id: true, email: true, internalRole: true, status: true, createdAt: true },
  });

  await recordAudit({
    actorUserId: session.sub,
    action: "staff.create",
    resource: "user",
    resourceId: user.id,
    after: { email: user.email, internalRole: user.internalRole },
  });

  return Response.json({ staff: user, tempPassword });
}
