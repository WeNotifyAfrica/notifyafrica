import type { ConsoleRole, InternalRole } from "@notifyafrica/design-system";

/**
 * Console RBAC (00_Contexte_Global §17). Permissions are granular strings;
 * roles are just named permission sets, so adding a permission never
 * requires touching every call site that checks roles today.
 */
const CONSOLE_PERMISSIONS: Record<ConsoleRole, string[]> = {
  OWNER: ["*"],
  ADMIN: [
    "project.manage",
    "team.manage",
    "wallet.read",
    "wallet.topup",
    "sms.send",
    "otp.manage",
    "whatsapp.manage",
    "campaign.manage",
    "settings.manage",
  ],
  BILLING_MANAGER: ["wallet.read", "wallet.topup", "billing.manage", "quote.manage"],
  DEVELOPER: ["sms.send", "otp.manage", "whatsapp.manage", "apikey.manage", "webhook.manage", "logs.read"],
  CAMPAIGN_MANAGER: ["campaign.manage", "sms.send", "whatsapp.manage"],
  SUPPORT_AGENT: ["support.manage", "logs.read"],
  VIEWER_AUDITOR: ["*.read"],
};

export function consoleRoleHasPermission(role: ConsoleRole, permission: string): boolean {
  const granted = CONSOLE_PERMISSIONS[role] ?? [];
  if (granted.includes("*")) return true;
  if (granted.includes(permission)) return true;
  return granted.some((g) => g.endsWith(".read") && permission.endsWith(".read") && g === "*.read");
}

/**
 * Internal (Admin back-office) RBAC per design lot 27's permission matrix —
 * "L" (lecture) below maps to `<domain>.read`, "É" (écriture) to
 * `<domain>.write`, "V" (validation / seconde signature) to
 * `<domain>.validate`. SUPER_ADMIN has every permission; the mockup's
 * "Direction" column has no corresponding back-office account today (it
 * shows up only as an audit-log approver), so it isn't modeled as a role.
 */
const INTERNAL_PERMISSIONS: Record<InternalRole, string[]> = {
  SUPER_ADMIN: ["*"],
  FINANCE: ["clients.read", "pricing.read", "quotes.read", "providers.read", "finance.read", "finance.write"],
  COMMERCIAL: ["clients.read", "pricing.read", "pricing.write", "quotes.read", "quotes.write"],
  CONFORMITE: ["clients.read", "clients.validate", "compliance.read", "compliance.write", "support.read"],
  SUPPORT: ["clients.read", "compliance.read", "support.read", "support.write"],
  TECHNIQUE: ["providers.read", "providers.write", "platform.read"],
};

export function internalRoleHasPermission(role: InternalRole, permission: string): boolean {
  const granted = INTERNAL_PERMISSIONS[role] ?? [];
  return granted.includes("*") || granted.includes(permission);
}
