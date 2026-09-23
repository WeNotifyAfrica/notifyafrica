import { prisma } from "./db";
import { notifyAfricaSeed } from "@notifyafrica/config-seed";
import type { ConfigEnvironment, ConfigScope, ResolvedConfig } from "@notifyafrica/types";

/**
 * The one place the fallback chain from 04_Prompt §6 is implemented:
 *   Published Admin Config -> Scoped Override -> Design Seed -> Safe Empty Fallback
 * Every frontend calls the Core API and receives a value that is already
 * resolved plus its `source` — no app implements its own fallback
 * (01_Specifications_Website §3, 03_Specifications_Console §33).
 */

const SEED_LOOKUP: Record<string, unknown> = {
  "website.navigation": notifyAfricaSeed.navigation,
  "website.homepageSections": notifyAfricaSeed.homepageSections,
  "website.content": notifyAfricaSeed.websiteContent,
  "catalog.countries": notifyAfricaSeed.countries,
  "catalog.currencies": notifyAfricaSeed.currencies,
};

export interface ResolveOptions {
  scope?: ConfigScope;
  scopeId?: string | null;
  environment?: ConfigEnvironment;
}

/** Scope specificity, most specific first — a PROJECT override always wins
 * over an ORGANIZATION one, which wins over COUNTRY, which wins over GLOBAL. */
const SCOPE_PRECEDENCE: ConfigScope[] = ["PROJECT", "ORGANIZATION", "COUNTRY", "GLOBAL"];

export async function resolveConfig<T = unknown>(
  key: string,
  options: ResolveOptions = {},
): Promise<ResolvedConfig<T>> {
  const environment = options.environment ?? "sandbox";
  const now = new Date();

  const scopesToTry = options.scope
    ? [options.scope, "GLOBAL" as ConfigScope].filter((s, i, arr) => arr.indexOf(s) === i)
    : SCOPE_PRECEDENCE;

  for (const scope of scopesToTry) {
    const scopeId = scope === "GLOBAL" ? null : options.scopeId ?? null;
    if (scope !== "GLOBAL" && !scopeId) continue;

    const entry = await prisma.configEntry.findFirst({
      where: {
        key,
        scope,
        scopeId,
        environment,
        status: "ACTIVE",
        AND: [
          { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }] },
          { OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] },
        ],
      },
      orderBy: { version: "desc" },
    });

    if (entry) {
      return { key, value: entry.value as T, source: "admin", version: entry.version };
    }
  }

  if (key in SEED_LOOKUP) {
    return { key, value: SEED_LOOKUP[key] as T, source: "seed", version: notifyAfricaSeed.version };
  }

  return { key, value: null as T, source: "fallback", version: null };
}
