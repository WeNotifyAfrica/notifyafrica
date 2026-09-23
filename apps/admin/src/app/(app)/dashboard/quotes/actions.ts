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

/**
 * One action drives the whole workflow (03_Specifications_Console §20):
 * moving to OFFER_AVAILABLE with a price attaches it to the quote; moving
 * to ACCEPTED with that price present converts it into a binding
 * organization-scoped PricingRule server-side (see the status route).
 */
export async function updateQuoteStatusAction(formData: FormData) {
  const token = await tokenOrThrow();
  const id = String(formData.get("id"));
  const unitPrice = formData.get("unitPrice") ? Number(formData.get("unitPrice")) : null;
  const quantity = Number(formData.get("quantity"));
  const currency = String(formData.get("currency"));

  await coreApi(token).updateQuoteStatus(id, {
    status: String(formData.get("status")),
    offer:
      unitPrice !== null
        ? { unitPrice, total: unitPrice * quantity, currency, notes: null }
        : null,
    reason: String(formData.get("reason")),
  });
  revalidatePath("/dashboard/quotes");
}
