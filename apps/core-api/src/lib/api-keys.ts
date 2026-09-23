import { createHash, randomBytes } from "node:crypto";

/**
 * API keys (03_Specifications_Console §22). Only the SHA-256 digest is ever
 * stored — the full key is returned once, at creation, and never again
 * ("Secret affiché une seule fois"). Unlike password hashing, API keys are
 * already high-entropy random values, so a fast cryptographic hash (not
 * bcrypt) is the right tool here — bcrypt is for low-entropy human input.
 */
export function generateApiKey(environment: "sandbox" | "production") {
  const secret = randomBytes(24).toString("hex");
  const fullKey = `na_${environment}_${secret}`;
  return { fullKey, hashedKey: hashApiKey(fullKey), prefix: fullKey.slice(0, 16) };
}

export function hashApiKey(fullKey: string): string {
  return createHash("sha256").update(fullKey).digest("hex");
}
