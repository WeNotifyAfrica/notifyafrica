import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { StaffTeamClient } from "./staff-team-client";

/**
 * Équipe interne & rôles (design handoff Lot 27). Roles are fixed sets of
 * permissions (internalRoleHasPermission in @notifyafrica/auth) — this
 * screen only manages who has which role, not the permissions themselves.
 * Scoped down from the mockup's email-invitation flow: no email provider
 * exists yet, so a new member gets a one-time-shown temp password instead
 * (same UX as an API key secret).
 */
export default async function TeamPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const { staff } = await coreApi(token).listStaff();

  return <StaffTeamClient initialStaff={staff} />;
}

export const dynamic = "force-dynamic";
