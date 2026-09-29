"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { CoreApiError } from "@notifyafrica/api-client";
import { SUPPORTED_COUNTRIES } from "@notifyafrica/design-system";

export type AuthFormState = { status: "idle" } | { status: "error"; message: string };

/**
 * Console owns the auth logic (00_Contexte_Global §6): these Server Actions
 * are the only place that talks to the Core API's /api/auth/*; the Core API
 * stays the source of truth for credentials, this app just holds the
 * resulting session as an httpOnly cookie scoped to app.notifyafrica.com.
 *
 * Both actions use useActionState (see login/register pages) instead of a
 * plain form-action, so a wrong password or a taken email shows a message
 * inline instead of crashing to Next's generic error page — the previous
 * behavior, since coreApi().login() throwing was never caught anywhere.
 */
export async function registerAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const country = String(formData.get("country") ?? "");
  // The register form only asks for a country (a friendlier choice than
  // making a new signup pick a currency code by hand) — the currency the
  // Organization/Wallet get created with follows from that.
  const currency = SUPPORTED_COUNTRIES.find((c) => c.code === country)?.currency ?? "XOF";

  const payload = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    organizationName: String(formData.get("organizationName") ?? ""),
    country,
    currency,
    source: formData.get("source") ? String(formData.get("source")) : undefined,
    campaign: formData.get("campaign") ? String(formData.get("campaign")) : undefined,
  };

  let token: string;
  try {
    const result = await coreApi().register(payload);
    token = result.token;
  } catch (err) {
    if (err instanceof CoreApiError && err.body?.error === "email_already_registered") {
      return { status: "error", message: "Un compte existe déjà avec cet email." };
    }
    return { status: "error", message: "La création du compte a échoué. Réessayez." };
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
    // Same message whether the email doesn't exist or the password is
    // wrong — the design handoff (Lot 3, Auth) is explicit that no error
    // may reveal whether an account exists.
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
