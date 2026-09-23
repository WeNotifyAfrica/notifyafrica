"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";

async function tokenOrRedirect() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");
  return token;
}

export async function requestQuoteAction(formData: FormData) {
  const token = await tokenOrRedirect();
  await coreApi(token).createQuote({
    productKey: String(formData.get("productKey")),
    country: String(formData.get("country")),
    quantity: Number(formData.get("quantity")),
    currency: String(formData.get("currency")),
    notes: formData.get("notes") ? String(formData.get("notes")) : null,
  });
  revalidatePath("/dashboard/quotes");
}
