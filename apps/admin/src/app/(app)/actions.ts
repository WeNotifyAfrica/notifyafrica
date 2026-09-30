"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";

async function tokenOrThrow() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) throw new Error("unauthorized");
  return token;
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function triggerSeedImportAction() {
  const token = await tokenOrThrow();
  await coreApi(token).triggerSeedImport();
  revalidatePath("/dashboard");
}

export async function publishCatalogProductAction(formData: FormData) {
  const token = await tokenOrThrow();
  await coreApi(token).publishCatalogProduct({
    key: String(formData.get("key")),
    name: String(formData.get("name")),
    slug: String(formData.get("slug")),
    category: String(formData.get("category")),
    summary: String(formData.get("summary") ?? ""),
    status: String(formData.get("status")),
    publicPageEnabled: formData.get("publicPageEnabled") === "on",
    order: Number(formData.get("order") ?? 0),
    countries: [],
  });
  revalidatePath("/dashboard/catalog");
}

export async function publishPricingRuleAction(formData: FormData) {
  const token = await tokenOrThrow();
  await coreApi(token).publishPricingRule({
    productKey: String(formData.get("productKey")),
    currency: String(formData.get("currency")),
    volumeMin: Number(formData.get("volumeMin") ?? 0),
    volumeMax: formData.get("volumeMax") ? Number(formData.get("volumeMax")) : null,
    basePrice: Number(formData.get("basePrice")),
    quoteRequired: formData.get("quoteRequired") === "on",
    reason: String(formData.get("reason")),
  });
  revalidatePath("/dashboard/pricing");
}

export async function creditWalletAction(formData: FormData) {
  const token = await tokenOrThrow();
  await coreApi(token).creditWallet({
    organizationId: String(formData.get("organizationId")),
    amount: Number(formData.get("amount")),
    reason: String(formData.get("reason")),
  });
  revalidatePath("/dashboard/organizations");
}
