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

export async function topupAction(formData: FormData) {
  const token = await tokenOrRedirect();
  try {
    await coreApi(token).topupWallet({
      paymentMethodId: String(formData.get("paymentMethodId")),
      amount: Number(formData.get("amount")),
    });
  } catch (err) {
    const code = err instanceof CoreApiError ? (err.body?.error ?? "topup_failed") : "topup_failed";
    redirect(`/dashboard/billing?error=${code}`);
  }
  revalidatePath("/dashboard/billing");
  redirect("/dashboard/billing?recharged=1");
}
