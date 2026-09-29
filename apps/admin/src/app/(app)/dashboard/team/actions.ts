"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import type { InternalRole } from "@notifyafrica/design-system";

async function tokenOrRedirect() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");
  return token;
}

export type CreateStaffState =
  | { status: "idle" }
  | { status: "success"; tempPassword: string; email: string }
  | { status: "error"; message: string };

/**
 * Uses useActionState instead of form-action + redirect, same reasoning as
 * Console's createApiKeyAction: the temp password is shown exactly once and
 * must never end up in a URL.
 */
export async function createStaffAction(
  _prevState: CreateStaffState,
  formData: FormData,
): Promise<CreateStaffState> {
  const token = await tokenOrRedirect();
  const email = String(formData.get("email") ?? "");
  const role = String(formData.get("role") ?? "") as InternalRole;

  try {
    const { tempPassword } = await coreApi(token).createStaff({ email, role });
    revalidatePath("/dashboard/team");
    return { status: "success", tempPassword, email };
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes("email_taken")
        ? "Cet email est déjà utilisé."
        : "La création du compte a échoué.";
    return { status: "error", message };
  }
}

export async function updateStaffAction(formData: FormData) {
  const token = await tokenOrRedirect();
  const id = String(formData.get("id"));
  const role = formData.get("role") ? (String(formData.get("role")) as InternalRole) : undefined;
  const status = formData.get("status") ? (String(formData.get("status")) as "ACTIVE" | "SUSPENDED") : undefined;
  await coreApi(token).updateStaff(id, { role, status });
  revalidatePath("/dashboard/team");
}
