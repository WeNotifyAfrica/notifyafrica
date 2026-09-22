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
