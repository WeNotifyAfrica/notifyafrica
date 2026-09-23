"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { CoreApiError } from "@notifyafrica/api-client";

async function tokenOrRedirect() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");
  return token;
}

/** Draft step: parses one destination per line/comma from the textarea
 * (03_Specifications_Console §11 "saisie" audience source). */
export async function createCampaignAction(formData: FormData) {
  const token = await tokenOrRedirect();
  const destinations = String(formData.get("destinations") ?? "")
    .split(/[\n,]/)
    .map((d) => d.trim())
    .filter(Boolean);

  const { campaign } = await coreApi(token).createCampaign({
    name: String(formData.get("name")),
    productKey: "SMS",
    senderId: formData.get("senderId") ? String(formData.get("senderId")) : null,
    content: String(formData.get("content")),
    destinations,
  });
  redirect(`/dashboard/campaigns/${campaign.id}`);
}

export async function estimateCampaignAction(formData: FormData) {
  const token = await tokenOrRedirect();
  const id = String(formData.get("id"));
  await coreApi(token).estimateCampaign(id);
  revalidatePath(`/dashboard/campaigns/${id}`);
}

export async function launchCampaignAction(formData: FormData) {
  const token = await tokenOrRedirect();
  const id = String(formData.get("id"));
  try {
    await coreApi(token).launchCampaign(id);
  } catch (err) {
    const code = err instanceof CoreApiError ? (err.body?.error ?? "launch_failed") : "launch_failed";
    redirect(`/dashboard/campaigns/${id}?error=${code}`);
  }
  revalidatePath(`/dashboard/campaigns/${id}`);
  redirect(`/dashboard/campaigns/${id}?launched=1`);
}

export async function cancelCampaignAction(formData: FormData) {
  const token = await tokenOrRedirect();
  const id = String(formData.get("id"));
  await coreApi(token).cancelCampaign(id);
  revalidatePath(`/dashboard/campaigns/${id}`);
}
