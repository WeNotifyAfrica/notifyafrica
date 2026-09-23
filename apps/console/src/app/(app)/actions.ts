"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";

async function tokenOrRedirect() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");
  return token;
}

/**
 * SMS - envoi simple (03_Specifications_Console §10). The estimate ->
 * balance check -> hold -> capture sequence (04_Prompt §15) happens
 * server-side in the Core API's /api/sms/send in one call; this action just
 * forwards the form and turns the result into a redirect + query param so
 * the page can render a plain success/error banner without client JS.
 */
export async function sendSmsAction(formData: FormData) {
  const token = await tokenOrRedirect();

  try {
    await coreApi(token).sendSms({
      destination: String(formData.get("destination") ?? ""),
      content: String(formData.get("content") ?? ""),
      senderId: formData.get("senderId") ? String(formData.get("senderId")) : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    const code = message.includes("402")
      ? "insufficient_balance"
      : message.includes("422")
        ? "quote_required"
        : "send_failed";
    redirect(`/dashboard/sms?error=${code}`);
  }

  redirect("/dashboard/sms?sent=1");
}
