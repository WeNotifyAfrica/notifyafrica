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

export async function createOperatorAction(formData: FormData) {
  const token = await tokenOrThrow();
  await coreApi(token).createOperator({
    name: String(formData.get("name")),
    countryCode: String(formData.get("countryCode")),
    code: String(formData.get("code")),
    status: "ACTIVE",
  });
  revalidatePath("/dashboard/providers");
}

export async function createProviderAction(formData: FormData) {
  const token = await tokenOrThrow();
  await coreApi(token).createProvider({
    name: String(formData.get("name")),
    type: String(formData.get("type")),
    countryCode: formData.get("countryCode") ? String(formData.get("countryCode")) : null,
    status: "ACTIVE",
  });
  revalidatePath("/dashboard/providers");
}

export async function createProviderEndpointAction(formData: FormData) {
  const token = await tokenOrThrow();
  const providerId = String(formData.get("providerId"));
  await coreApi(token).createProviderEndpoint(providerId, {
    environment: String(formData.get("environment") ?? "sandbox"),
    baseUrl: String(formData.get("baseUrl")),
    path: String(formData.get("path")),
    method: String(formData.get("method") ?? "POST"),
    authType: String(formData.get("authType")),
    timeoutMs: Number(formData.get("timeoutMs") ?? 10000),
  });
  revalidatePath("/dashboard/providers");
}

export async function createRouteAction(formData: FormData) {
  const token = await tokenOrThrow();
  await coreApi(token).createRoute({
    productKey: String(formData.get("productKey")),
    countryCode: formData.get("countryCode") ? String(formData.get("countryCode")) : null,
    operatorId: formData.get("operatorId") ? String(formData.get("operatorId")) : null,
    providerId: String(formData.get("providerId")),
    priority: Number(formData.get("priority") ?? 0),
    strategy: String(formData.get("strategy") ?? "priority"),
    status: "ACTIVE",
  });
  revalidatePath("/dashboard/providers");
}
