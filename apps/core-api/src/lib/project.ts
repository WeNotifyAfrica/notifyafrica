import { prisma } from "@/lib/db";
import type { Environment } from "@prisma/client";

/**
 * Live/Test environment switch (design handoff Lots 5-6 shell: "sélecteurs
 * org/projet, environnement test/live"). Every org gets two Projects —
 * Live (production) and Test (sandbox) — and the Console's environment
 * toggle (a cookie, see apps/console/src/lib/env.ts) is forwarded to the
 * Core API as an `X-Environment` header on every request, since a bearer
 * token alone doesn't carry which one is "current".
 *
 * Defaults to sandbox when the header is missing (API keys, older
 * clients) — deliberately the safe choice: it matches every org's single
 * pre-existing Project (all created "sandbox" before this feature
 * existed — see the backfill in prisma/), and a request nobody explicitly
 * marked "live" should never touch real money by accident.
 */
export function getEnvironmentFromRequest(req: Request): Environment {
  const header = req.headers.get("x-environment");
  return header === "production" ? "production" : "sandbox";
}

/** Resolves the org's Project for the given environment. Falls back to
 * *any* project for the org if the specific environment one doesn't
 * exist yet — covers orgs created between this feature landing and its
 * backfill finishing, or any edge case the backfill missed, rather than
 * hard-failing a send. */
export async function resolveProject(organizationId: string, environment: Environment) {
  return (
    (await prisma.project.findFirst({ where: { organizationId, environment } })) ??
    (await prisma.project.findFirst({ where: { organizationId } }))
  );
}
