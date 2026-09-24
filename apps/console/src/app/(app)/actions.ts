"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { coreApi } from "@/lib/api";
import { getCurrentEnvironment } from "@/lib/environment";
import { SESSION_COOKIE, ENV_COOKIE } from "@/lib/env";
import { CoreApiError } from "@notifyafrica/api-client";

async function tokenOrRedirect() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");
  return token;
}

/** Live/Test switch (design handoff Lots 5-6 shell). Sets the cookie every
 * project-scoped page/action reads via getCurrentEnvironment(), then
 * revalidates the whole app shell so the current page re-renders with
 * the new environment's data — no redirect needed, stays on the same
 * screen. */
export async function setEnvironmentAction(formData: FormData) {
  const environment = formData.get("environment") === "production" ? "production" : "sandbox";
  const cookieStore = await cookies();
  cookieStore.set(ENV_COOKIE, environment, { path: "/", httpOnly: false, sameSite: "lax" });
  revalidatePath("/", "layout");
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
  const environment = await getCurrentEnvironment();

  try {
    await coreApi(token, environment).sendSms({
      destination: String(formData.get("destination") ?? ""),
      content: String(formData.get("content") ?? ""),
      senderId: formData.get("senderId") ? String(formData.get("senderId")) : null,
      smsTemplateId: formData.get("smsTemplateId") ? String(formData.get("smsTemplateId")) : null,
    });
  } catch (err) {
    const code = err instanceof CoreApiError ? (err.body?.error ?? "send_failed") : "send_failed";
    redirect(`/dashboard/sms?error=${code}`);
  }

  redirect("/dashboard/sms?sent=1");
}

/** Noms d'expéditeur (design handoff Lot 7) — created PENDING, Admin
 * approves/rejects before it's offered as a validated option. */
export async function requestSenderNameAction(formData: FormData) {
  const token = await tokenOrRedirect();
  const environment = await getCurrentEnvironment();

  try {
    await coreApi(token, environment).createSenderName({
      name: String(formData.get("name") ?? ""),
      country: String(formData.get("country") ?? ""),
      usage: String(formData.get("usage") ?? "TRANSACTIONAL"),
    });
  } catch (err) {
    const code = err instanceof CoreApiError ? (err.body?.error ?? "request_failed") : "request_failed";
    redirect(`/dashboard/sms/senders?error=${code}`);
  }

  redirect("/dashboard/sms/senders?requested=1");
}

/** Modèles SMS (design handoff Lot 7) — no approval gate, an org's own
 * reusable drafts. */
export async function createSmsTemplateAction(formData: FormData) {
  const token = await tokenOrRedirect();
  const environment = await getCurrentEnvironment();

  try {
    await coreApi(token, environment).createSmsTemplate({
      name: String(formData.get("name") ?? ""),
      usage: String(formData.get("usage") ?? "TRANSACTIONAL"),
      bodyText: String(formData.get("bodyText") ?? ""),
    });
  } catch (err) {
    const code = err instanceof CoreApiError ? (err.body?.error ?? "create_failed") : "create_failed";
    redirect(`/dashboard/sms/templates?error=${code}`);
  }

  redirect("/dashboard/sms/templates?created=1");
}
