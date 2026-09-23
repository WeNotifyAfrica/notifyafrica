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

export type CreateApiKeyState =
  | { status: "idle" }
  | { status: "success"; secret: string; name: string }
  | { status: "error"; message: string };

/**
 * Uses useActionState (see CreateApiKeyForm) instead of the usual
 * form-action + redirect pattern, because the secret must be shown exactly
 * once (03_Specifications_Console §22) and must never end up in a URL —
 * redirecting with it as a query param would leave it in browser history.
 */
export async function createApiKeyAction(
  _prevState: CreateApiKeyState,
  formData: FormData,
): Promise<CreateApiKeyState> {
  const token = await tokenOrRedirect();

  try {
    const { secret, key } = await coreApi(token).createApiKey({
      name: String(formData.get("name") ?? ""),
      environment: String(formData.get("environment") ?? "sandbox"),
      scopes: [],
    });
    revalidatePath("/dashboard/developers");
    return { status: "success", secret, name: key.name };
  } catch {
    return { status: "error", message: "La création de la clé a échoué." };
  }
}

export async function revokeApiKeyAction(formData: FormData) {
  const token = await tokenOrRedirect();
  await coreApi(token).revokeApiKey(String(formData.get("id")));
  revalidatePath("/dashboard/developers");
}
