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

export async function createDiscountRuleAction(formData: FormData) {
  const token = await tokenOrThrow();
  await coreApi(token).createDiscountRule({
    type: String(formData.get("type")),
    productKey: formData.get("productKey") ? String(formData.get("productKey")) : null,
    scope: String(formData.get("scope") ?? "GLOBAL"),
    scopeId: formData.get("scopeId") ? String(formData.get("scopeId")) : null,
    value: Number(formData.get("value")),
    priority: Number(formData.get("priority") ?? 0),
    stackable: formData.get("stackable") === "on",
    maxDiscount: formData.get("maxDiscount") ? Number(formData.get("maxDiscount")) : null,
    startAt: null,
    endAt: formData.get("endAt") ? new Date(String(formData.get("endAt"))).toISOString() : null,
  });
  revalidatePath("/dashboard/discounts");
}
