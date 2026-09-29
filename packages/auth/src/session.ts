import { SignJWT, jwtVerify } from "jose";
import type { ConsoleRole, InternalRole } from "@notifyafrica/design-system";

/**
 * Session tokens across app boundaries.
 *
 * The Core API is the single source of truth for credentials (04_Prompt
 * §18: no auth duplication across frontends). Because Website, Console and
 * Admin are deployed on separate domains, a browser cookie set by the Core
 * API's domain is not visible to app.notifyafrica.com or
 * admin.notifyafrica.com — so instead of a shared-cookie session (the usual
 * single-app Auth.js/NextAuth setup), the Core API issues a signed JWT after
 * validating credentials, and each app's own Route Handler sets it as an
 * httpOnly cookie scoped to *its own* domain, then forwards it as a Bearer
 * token on subsequent Core API calls. This is the pragmatic deviation from
 * a literal Auth.js install called out to the user as a documented decision
 * (04_Prompt §28) — the session primitive (jose, the same JWT library
 * Auth.js uses internally) and the credential/MFA logic it wraps are the
 * part that was meant to be accelerated by a library, not the cookie model.
 */

export interface SessionPayload {
  sub: string; // user id
  email: string;
  organizationId: string | null;
  role: ConsoleRole | null;
  internalRole: InternalRole | null;
}

const alg = "HS256";

function getSecretKey(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signSession(
  payload: SessionPayload,
  secret: string,
  expiresIn: string = "12h",
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretKey(secret));
}

export async function verifySession(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(secret));
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
