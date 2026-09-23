import { verifySession, type SessionPayload } from "@notifyafrica/auth";

const AUTH_SECRET = process.env.AUTH_SECRET ?? "";

export async function getSessionFromRequest(req: Request): Promise<SessionPayload | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  return verifySession(token, AUTH_SECRET);
}

export function requireInternalRole(session: SessionPayload | null): session is SessionPayload {
  return Boolean(session?.internalRole);
}

/** Any authenticated Console user attached to an organization (as opposed to
 * an internal Admin user, who has no organizationId). */
export function requireOrgSession(
  session: SessionPayload | null,
): session is SessionPayload & { organizationId: string } {
  return Boolean(session?.organizationId);
}
