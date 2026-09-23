import type {
  CatalogProduct,
  Message,
  PricingEstimateRequest,
  PricingEstimateResult,
  ResolvedConfig,
  Transaction,
  Wallet,
} from "@notifyafrica/types";

export interface CoreApiClientOptions {
  baseUrl: string;
  /** Bearer session token, when the calling app has an authenticated user. */
  sessionToken?: string;
}

/**
 * Thin typed wrapper around the Core API. Every frontend (Website, Console,
 * Admin) goes through this instead of hand-rolling fetch calls, so the
 * request/response shapes stay in one place (04_Prompt §20).
 */
export function createCoreApiClient({ baseUrl, sessionToken }: CoreApiClientOptions) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(sessionToken ? { authorization: `Bearer ${sessionToken}` } : {}),
        ...init?.headers,
      },
      cache: init?.cache ?? "no-store",
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Core API ${path} -> ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  return {
    getConfig: <T>(key: string, params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
      return request<ResolvedConfig<T>>(`/api/config/${encodeURIComponent(key)}${qs}`);
    },
    listCatalog: () => request<{ products: CatalogProduct[]; source: "admin" | "seed" }>("/api/catalog"),
    listPricingTiers: (product: string, currency = "XOF") =>
      request<{
        source: "admin" | "seed";
        tiers: { volumeMin: number; volumeMax: number | null; unitPrice: number; currency: string; quoteRequired: boolean }[];
      }>(`/api/pricing/rules?product=${encodeURIComponent(product)}&currency=${currency}`),
    estimatePricing: (payload: PricingEstimateRequest) =>
      request<PricingEstimateResult>("/api/pricing/estimate", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    register: (payload: unknown) =>
      request<{ userId: string; organizationId: string; token: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    login: (payload: unknown) =>
      request<{ token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    getSession: () =>
      request<{
        session: {
          sub: string;
          email: string;
          organizationId: string | null;
          role: string | null;
          internalRole: string | null;
        };
      }>("/api/auth/session"),

    // --- Console endpoints (require an authenticated org session) ---
    getWallet: () => request<{ wallet: Wallet }>("/api/wallet"),
    sendSms: (payload: unknown) =>
      request<{ message: Message; transaction: Transaction; estimate: PricingEstimateResult }>(
        "/api/sms/send",
        { method: "POST", body: JSON.stringify(payload) },
      ),
    listSmsHistory: () => request<{ messages: Message[] }>("/api/sms/history"),

    // --- Admin-only endpoints (require a session with internalRole) ---
    publishConfig: (payload: unknown) =>
      request<{ entry: unknown }>("/api/admin/config", { method: "POST", body: JSON.stringify(payload) }),
    publishCatalogProduct: (payload: unknown) =>
      request<{ product: CatalogProduct }>("/api/admin/catalog", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    publishPricingRule: (payload: unknown) =>
      request<{ rule: unknown }>("/api/admin/pricing-rules", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    listNotifications: () => request<{ notifications: unknown[] }>("/api/admin/notifications"),
    markNotificationRead: (id: string) =>
      request<{ notification: unknown }>("/api/admin/notifications", {
        method: "PATCH",
        body: JSON.stringify({ id }),
      }),
    triggerSeedImport: () =>
      request<{ skipped: boolean; version: number }>("/api/admin/seed-import", { method: "POST" }),
    listOrganizations: () =>
      request<{
        organizations: {
          id: string;
          name: string;
          country: string;
          currency: string;
          createdAt: string;
          memberCount: number;
          projectCount: number;
          wallet: Wallet | null;
        }[];
      }>("/api/admin/organizations"),
    listUsers: () =>
      request<{
        users: {
          id: string;
          email: string;
          status: string;
          emailVerifiedAt: string | null;
          createdAt: string;
          organizations: { id: string; name: string; role: string }[];
        }[];
      }>("/api/admin/users"),
    creditWallet: (payload: unknown) =>
      request<{ wallet: Wallet }>("/api/admin/wallet/credit", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    listTransactions: () => request<{ transactions: Transaction[] }>("/api/admin/transactions"),
  };
}

export type CoreApiClient = ReturnType<typeof createCoreApiClient>;
