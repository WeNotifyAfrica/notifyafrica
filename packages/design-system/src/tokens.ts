/**
 * Programmatic mirror of the Nocturne CSS tokens (src/nocturne.css), for
 * contexts that can't read CSS variables directly: chart color scales,
 * server-rendered email templates, PDF generation (quotes/invoices).
 * Keep in sync with nocturne.css by hand — it changes rarely and is the
 * single source of truth; this file must never diverge from it silently.
 */

export const color = {
  bg: "#161826",
  surface: "#232532",
  text: "#e9e9ed",
  accent: "#9184d9",
  accent2: "#a7a1db",
  neutral: {
    100: "#f3f5fe",
    200: "#e4e7f5",
    300: "#cfd3e5",
    400: "#b2b6ca",
    500: "#9397ab",
    600: "#75798c",
    700: "#595d6c",
    800: "#3f424d",
    900: "#292b31",
  },
  accentRamp: {
    100: "#f5f4ff",
    200: "#e7e5fe",
    300: "#d2cefd",
    400: "#b5abfc",
    500: "#968ae0",
    600: "#796cbf",
    700: "#5d5294",
    800: "#423a6a",
    900: "#2b2741",
  },
} as const;

export const font = {
  heading: '"Inter", system-ui, sans-serif',
  headingWeight: 500,
  body: '"Inter", system-ui, sans-serif',
} as const;

export const space = {
  1: 2.8,
  2: 5.6,
  3: 8.4,
  4: 11.2,
  6: 16.8,
  8: 22.4,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 14,
} as const;

/** Currencies enumerated across the product per handoff §5 invariant 6. */
export const SUPPORTED_CURRENCIES = [
  "XOF",
  "XAF",
  "GHS",
  "NGN",
  "KES",
  "USD",
  "EUR",
  "ZAR",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/** Console-side RBAC roles (handoff §5 invariant 8). */
export const CONSOLE_ROLES = [
  "OWNER",
  "ADMIN",
  "BILLING_MANAGER",
  "DEVELOPER",
  "CAMPAIGN_MANAGER",
  "SUPPORT_AGENT",
  "VIEWER_AUDITOR",
] as const;

export type ConsoleRole = (typeof CONSOLE_ROLES)[number];

/** Admin-internal (back-office) RBAC roles (design_handoff lot 27, "Équipe
 * interne & rôles"). */
export const INTERNAL_ROLES = [
  "SUPER_ADMIN",
  "FINANCE",
  "COMMERCIAL",
  "CONFORMITE",
  "SUPPORT",
  "TECHNIQUE",
] as const;

export type InternalRole = (typeof INTERNAL_ROLES)[number];

export const INTERNAL_ROLE_LABELS: Record<InternalRole, string> = {
  SUPER_ADMIN: "Super-admin",
  FINANCE: "Finance",
  COMMERCIAL: "Commercial",
  CONFORMITE: "Conformité",
  SUPPORT: "Support",
  TECHNIQUE: "Technique",
};
