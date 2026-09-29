"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";

export type AuthFormState = { status: "idle" } | { status: "error"; message: string };

/**
 * Internal accounts are provisioned out-of-band (prisma/seed.ts creates a
 * dev super-admin, and /dashboard/team lets a Super-admin add more) —
 * there is no public registration for Admin, unlike the Console
 * (00_Contexte_Global §17 keeps internal/customer roles separate).
 *
 * Uses useActionState (see login/page.tsx) instead of a plain form-action,
 * so a wrong password shows a message inline instead of crashing to
 * Next's generic error page — the previous behavior, since coreApi().
 * login() throwing was never caught anywhere.
 */
export async function loginAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const payload = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  let token: string;
  try {
    const result = await coreApi().login(payload);
    token = result.token;
  } catch {
    return { status: "error", message: "Identifiants invalides." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect("/dashboard");
}
