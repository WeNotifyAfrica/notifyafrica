"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";

/**
 * Console owns the auth logic (00_Contexte_Global §6): these Server Actions
 * are the only place that talks to the Core API's /api/auth/*; the Core API
 * stays the source of truth for credentials, this app just holds the
 * resulting session as an httpOnly cookie scoped to app.notifyafrica.com.
 */
export async function registerAction(formData: FormData) {
  const payload = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    organizationName: String(formData.get("organizationName") ?? ""),
    country: String(formData.get("country") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    source: formData.get("source") ? String(formData.get("source")) : undefined,
    campaign: formData.get("campaign") ? String(formData.get("campaign")) : undefined,
  };

  const result = await coreApi().register(payload);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const payload = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const result = await coreApi().login(payload);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect("/dashboard");
}
