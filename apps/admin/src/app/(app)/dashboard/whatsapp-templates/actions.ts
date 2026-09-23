"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";

export async function reviewWhatsAppTemplateAction(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) throw new Error("unauthorized");

  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const rejectionReason = formData.get("rejectionReason") ? String(formData.get("rejectionReason")) : null;

  await coreApi(token).reviewWhatsAppTemplate(id, { status, rejectionReason });
  revalidatePath("/dashboard/whatsapp-templates");
}
