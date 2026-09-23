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

export async function createOtpConfigAction(formData: FormData) {
  const token = await tokenOrRedirect();
  await coreApi(token).createOtpConfig({
    name: String(formData.get("name") ?? ""),
    length: Number(formData.get("length") ?? 6),
    expirySeconds: Number(formData.get("expirySeconds") ?? 300),
    maxAttempts: Number(formData.get("maxAttempts") ?? 3),
    resendCooldownSeconds: 60,
    channel: String(formData.get("channel") ?? "SMS"),
    fallbackChannel: null,
    template: String(formData.get("template") ?? "Votre code NotifyAfrica est {code}"),
  });
  revalidatePath("/dashboard/otp");
}

export async function generateOtpAction(formData: FormData) {
  const token = await tokenOrRedirect();
  try {
    const result = await coreApi(token).generateOtp({
      configId: String(formData.get("configId") ?? ""),
      destination: String(formData.get("destination") ?? ""),
    });
    revalidatePath("/dashboard/otp");
    redirect(`/dashboard/otp?generated=${result.otpId}`);
  } catch (err) {
    if (err instanceof CoreApiError) {
      redirect(`/dashboard/otp?error=${err.body?.error ?? "generate_failed"}`);
    }
    throw err;
  }
}

export async function verifyOtpAction(formData: FormData) {
  const token = await tokenOrRedirect();
  const otpId = String(formData.get("otpId") ?? "");
  try {
    const result = await coreApi(token).verifyOtp({ otpId, code: String(formData.get("code") ?? "") });
    revalidatePath("/dashboard/otp");
    redirect(`/dashboard/otp?verifyStatus=${result.status}`);
  } catch (err) {
    if (err instanceof CoreApiError) {
      revalidatePath("/dashboard/otp");
      redirect(`/dashboard/otp?verifyStatus=${err.body?.status ?? "FAILED"}`);
    }
    throw err;
  }
}
