"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";

async function tokenOrRedirect() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");
  return token;
}

export async function inviteMemberAction(formData: FormData) {
  const token = await tokenOrRedirect();
  try {
    await coreApi(token).inviteMember({
      email: String(formData.get("email") ?? ""),
      role: String(formData.get("role") ?? ""),
    });
  } catch {
    redirect("/dashboard/team?error=invite_failed");
  }
  revalidatePath("/dashboard/team");
  redirect("/dashboard/team?invited=1");
}

export async function revokeInvitationAction(formData: FormData) {
  const token = await tokenOrRedirect();
  await coreApi(token).revokeInvitation(String(formData.get("id")));
  revalidatePath("/dashboard/team");
}
