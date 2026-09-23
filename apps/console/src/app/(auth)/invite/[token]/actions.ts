"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";

export async function acceptInvitationAction(formData: FormData) {
  const tokenValue = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");

  let result;
  try {
    result = await coreApi().acceptInvitation({ token: tokenValue, password });
  } catch {
    redirect(`/invite/${tokenValue}?error=1`);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect("/dashboard");
}
