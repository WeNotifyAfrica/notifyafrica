"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";

export async function confirmTransactionAction(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) throw new Error("unauthorized");
  await coreApi(token).confirmTransaction(String(formData.get("id")));
  revalidatePath("/dashboard/transactions");
}
