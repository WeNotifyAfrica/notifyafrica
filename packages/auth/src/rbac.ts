import type { ConsoleRole } from "@notifyafrica/design-system";

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
    "campaign.manage",
    "settings.manage",
  ],
  BILLING_MANAGER: ["wallet.read", "wallet.topup", "billing.manage", "quote.manage"],
  DEVELOPER: ["sms.send", "apikey.manage", "webhook.manage", "logs.read"],
  CAMPAIGN_MANAGER: ["campaign.manage", "sms.send"],
  SUPPORT_AGENT: ["support.manage", "logs.read"],
  VIEWER_AUDITOR: ["*.read"],
};

export function consoleRoleHasPermission(role: ConsoleRole, permission: string): boolean {
  const granted = CONSOLE_PERMISSIONS[role] ?? [];
  if (granted.includes("*")) return true;
  if (granted.includes(permission)) return true;
  return granted.some((g) => g.endsWith(".read") && permission.endsWith(".read") && g === "*.read");
}
