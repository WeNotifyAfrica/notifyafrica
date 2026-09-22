"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";

/**
 * Internal accounts are provisioned out-of-band (prisma/seed.ts creates a
 * dev super-admin) — there is no public registration for Admin, unlike the
 * Console (00_Contexte_Global §17 keeps internal/customer roles separate).
 */
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
