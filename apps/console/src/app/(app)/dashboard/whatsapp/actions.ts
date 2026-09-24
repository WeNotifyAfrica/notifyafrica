"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { coreApi } from "@/lib/api";
import { getCurrentEnvironment } from "@/lib/environment";
import { SESSION_COOKIE } from "@/lib/env";
import { CoreApiError } from "@notifyafrica/api-client";

async function tokenOrRedirect() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");
  return token;
}

export async function createWhatsAppNumberAction(formData: FormData) {
  const token = await tokenOrRedirect();
  const environment = await getCurrentEnvironment();
  await coreApi(token, environment).createWhatsAppNumber({
    phoneNumber: String(formData.get("phoneNumber")),
    displayName: String(formData.get("displayName")),
  });
  revalidatePath("/dashboard/whatsapp");
}

export async function createWhatsAppTemplateAction(formData: FormData) {
  const token = await tokenOrRedirect();
  const environment = await getCurrentEnvironment();
  await coreApi(token, environment).createWhatsAppTemplate({
    name: String(formData.get("name")),
    category: String(formData.get("category")),
    language: String(formData.get("language") ?? "fr"),
    bodyText: String(formData.get("bodyText")),
  });
  revalidatePath("/dashboard/whatsapp");
}

export async function sendWhatsAppAction(formData: FormData) {
  const token = await tokenOrRedirect();
  const environment = await getCurrentEnvironment();
  let freeWithinConversation = false;
  let sandbox = false;
  try {
    const result = await coreApi(token, environment).sendWhatsApp({
      templateId: String(formData.get("templateId")),
      destination: String(formData.get("destination")),
    });
    freeWithinConversation = result.freeWithinConversation ?? false;
    sandbox = result.sandbox ?? false;
  } catch (err) {
    const code = err instanceof CoreApiError ? (err.body?.error ?? "send_failed") : "send_failed";
    redirect(`/dashboard/whatsapp?error=${code}`);
  }
  revalidatePath("/dashboard/whatsapp");
  redirect(`/dashboard/whatsapp?sent=1${freeWithinConversation ? "&free=1" : ""}${sandbox ? "&sandbox=1" : ""}`);
}
