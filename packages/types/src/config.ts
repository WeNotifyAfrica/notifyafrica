/**
 * Config Registry — the generic key/value/scope object described in
 * 02_Specifications_Backoffice §31, and the resolution source of truth
 * behind the fallback chain in 04_Prompt §6:
 *   Published Admin Config -> Scoped Override -> Design Seed -> Safe Empty Fallback
 */

export type ConfigStatus = "DRAFT" | "REVIEW" | "APPROVED" | "SCHEDULED" | "ACTIVE" | "ARCHIVED";

export type ConfigScope = "GLOBAL" | "COUNTRY" | "ORGANIZATION" | "PROJECT";

export type ConfigEnvironment = "sandbox" | "production";

export interface ConfigEntry<TValue = unknown> {
  key: string;
  value: TValue;
  type: string;
  scope: ConfigScope;
  scopeId: string | null;
  environment: ConfigEnvironment;
  version: number;
  status: ConfigStatus;
  effectiveFrom: string | null;
  effectiveTo: string | null;
}

/** Where a resolved value actually came from — surfaced for diagnostics only,
 * never shown to end users (04_Prompt §6, 01_Specifications_Website §3). */
export type ConfigSource = "admin" | "seed" | "fallback";

export interface ResolvedConfig<TValue = unknown> {
  key: string;
  value: TValue;
  source: ConfigSource;
  version: number | null;
}
