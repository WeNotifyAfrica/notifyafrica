import { createCoreApiClient } from "@notifyafrica/api-client";
import type { ResolvedConfig } from "@notifyafrica/types";

/**
 * The single Config Client every frontend must go through (04_Prompt §6).
 * It never contains a fallback of its own — the Core API's resolver already
 * walked Published Admin Config -> Scoped Override -> Design Seed -> Safe
 * Empty Fallback and returns the resolved value plus its `source`. Website
 * and Console just render `value` and may use `source` for diagnostics
 * (never shown to end users, per 01_Specifications_Website §3).
 */
export function createConfigClient(coreApiUrl: string, sessionToken?: string) {
  const client = createCoreApiClient({ baseUrl: coreApiUrl, sessionToken });

  return {
    resolve: <T>(key: string, scopeParams?: Record<string, string>): Promise<ResolvedConfig<T>> =>
      client.getConfig<T>(key, scopeParams),
  };
}

export type ConfigClient = ReturnType<typeof createConfigClient>;
