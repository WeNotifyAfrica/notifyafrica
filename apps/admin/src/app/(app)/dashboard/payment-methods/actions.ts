"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";

async function tokenOrThrow() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) throw new Error("unauthorized");
  return token;
}

export async function createPaymentMethodAction(formData: FormData) {
  const token = await tokenOrThrow();
  const countries = String(formData.get("countries") ?? "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  await coreApi(token).createPaymentMethod({
    name: String(formData.get("name")),
    family: String(formData.get("family")),
    countries,
    minAmount: formData.get("minAmount") ? Number(formData.get("minAmount")) : null,
    maxAmount: formData.get("maxAmount") ? Number(formData.get("maxAmount")) : null,
    feePercent: Number(formData.get("feePercent") ?? 0),
    instant: formData.get("instant") === "on",
  });
  revalidatePath("/dashboard/payment-methods");
}
