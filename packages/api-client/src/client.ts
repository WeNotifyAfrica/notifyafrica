import type {
  AdminDashboardSummary,
  ApiKeySummary,
  Campaign,
  CatalogProduct,
  Currency,
  DashboardSummary,
  DiscountRule,
  Invitation,
  Message,
  Operator,
  OtpCodeSummary,
  OtpConfig,
  PaymentMethod,
  PricingEstimateRequest,
  PricingEstimateResult,
  Provider,
  Quote,
  ResolvedConfig,
  RouteSummary,
  TeamMember,
  Transaction,
  Wallet,
  WhatsAppNumber,
  WhatsAppTemplate,
} from "@notifyafrica/types";

export interface CoreApiClientOptions {
  baseUrl: string;
  /** Bearer session token, when the calling app has an authenticated user. */
  sessionToken?: string;
}

/** Thrown on any non-2xx response, with the parsed JSON error body attached
 * (falls back to the raw text if the body isn't JSON) so callers can branch
 * on `err.body?.error` instead of string-matching `err.message`. */
export class CoreApiError extends Error {
  constructor(
    public readonly path: string,
    public readonly status: number,
    public readonly body: { error?: string; [key: string]: unknown } | null,
  ) {
    super(`Core API ${path} -> ${status}: ${JSON.stringify(body)}`);
    this.name = "CoreApiError";
  }
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
      const text = await res.text();
      let parsed: { error?: string; [key: string]: unknown } | null = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        // non-JSON error body — parsed stays null, raw text is still in the message
      }
      throw new CoreApiError(path, res.status, parsed);
    }
    return res.json() as Promise<T>;
  }

  return {
    getConfig: <T>(key: string, params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
      return request<ResolvedConfig<T>>(`/api/config/${encodeURIComponent(key)}${qs}`);
    },
    listCatalog: () => request<{ products: CatalogProduct[]; source: "admin" | "seed" }>("/api/catalog"),
    listCurrencies: () => request<ResolvedConfig<Currency[]>>("/api/config/catalog.currencies"),
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
    getDashboardSummary: () => request<DashboardSummary>("/api/dashboard/summary"),
    getWallet: () => request<{ wallet: Wallet }>("/api/wallet"),
    listPaymentMethods: () => request<{ methods: PaymentMethod[] }>("/api/payment-methods"),
    topupWallet: (payload: unknown) =>
      request<{ transaction: Transaction; wallet: Wallet | null }>("/api/wallet/topup", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    listWalletTransactions: () => request<{ transactions: Transaction[] }>("/api/wallet/transactions"),
    listCampaigns: () => request<{ campaigns: Campaign[] }>("/api/campaigns"),
    createCampaign: (payload: unknown) =>
      request<{ campaign: Campaign }>("/api/campaigns", { method: "POST", body: JSON.stringify(payload) }),
    getCampaign: (id: string) => request<{ campaign: Campaign }>(`/api/campaigns/${id}`),
    estimateCampaign: (id: string) =>
      request<{ campaign: Campaign; estimate: PricingEstimateResult }>(`/api/campaigns/${id}/estimate`, {
        method: "POST",
      }),
    launchCampaign: (id: string) =>
      request<{ campaign: Campaign }>(`/api/campaigns/${id}/launch`, { method: "POST" }),
    cancelCampaign: (id: string) =>
      request<{ campaign: Campaign }>(`/api/campaigns/${id}/cancel`, { method: "POST" }),
    listWhatsAppNumbers: () => request<{ numbers: WhatsAppNumber[] }>("/api/whatsapp/numbers"),
    createWhatsAppNumber: (payload: unknown) =>
      request<{ number: WhatsAppNumber }>("/api/whatsapp/numbers", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    listWhatsAppTemplates: () => request<{ templates: WhatsAppTemplate[] }>("/api/whatsapp/templates"),
    createWhatsAppTemplate: (payload: unknown) =>
      request<{ template: WhatsAppTemplate }>("/api/whatsapp/templates", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    sendWhatsApp: (payload: unknown) =>
      request<{ message: Message; estimate: PricingEstimateResult }>("/api/whatsapp/send", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    listWhatsAppHistory: () => request<{ messages: Message[] }>("/api/whatsapp/history"),
    sendSms: (payload: unknown) =>
      request<{ message: Message; transaction: Transaction; estimate: PricingEstimateResult }>(
        "/api/sms/send",
        { method: "POST", body: JSON.stringify(payload) },
      ),
    listSmsHistory: () => request<{ messages: Message[] }>("/api/sms/history"),
    listApiKeys: () => request<{ keys: ApiKeySummary[] }>("/api/keys"),
    createApiKey: (payload: unknown) =>
      request<{ key: ApiKeySummary; secret: string }>("/api/keys", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    revokeApiKey: (id: string) => request<{ ok: true }>(`/api/keys/${id}/revoke`, { method: "POST" }),
    listTeamMembers: () => request<{ members: TeamMember[] }>("/api/team/members"),
    listInvitations: () => request<{ invitations: Invitation[] }>("/api/team/invitations"),
    inviteMember: (payload: unknown) =>
      request<{ invitation: { id: string; email: string; role: string } }>("/api/team/invitations", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    revokeInvitation: (id: string) =>
      request<{ ok: true }>(`/api/team/invitations/${id}/revoke`, { method: "POST" }),
    acceptInvitation: (payload: unknown) =>
      request<{ token: string }>("/api/invitations/accept", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    getInvitation: (token: string) =>
      request<{ email: string; role: string; organizationName: string }>(
        `/api/invitations/${encodeURIComponent(token)}`,
      ),
    listOtpConfigs: () => request<{ configs: OtpConfig[] }>("/api/otp/configs"),
    createOtpConfig: (payload: unknown) =>
      request<{ config: OtpConfig }>("/api/otp/configs", { method: "POST", body: JSON.stringify(payload) }),
    generateOtp: (payload: unknown) =>
      request<{ otpId: string; destination: string; expiresAt: string }>("/api/otp/generate", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    verifyOtp: (payload: unknown) =>
      request<{ status: string }>("/api/otp/verify", { method: "POST", body: JSON.stringify(payload) }),
    listOtpHistory: () => request<{ codes: OtpCodeSummary[] }>("/api/otp/history"),
    listQuotes: () => request<{ quotes: Quote[] }>("/api/quotes"),
    createQuote: (payload: unknown) =>
      request<{ quote: Quote }>("/api/quotes", { method: "POST", body: JSON.stringify(payload) }),

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
    getAdminDashboardSummary: () => request<AdminDashboardSummary>("/api/admin/dashboard/summary"),
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
    confirmTransaction: (id: string) =>
      request<{ transaction: Transaction; wallet: Wallet }>(`/api/admin/transactions/${id}/confirm`, {
        method: "POST",
      }),
    listAdminPaymentMethods: () => request<{ methods: PaymentMethod[] }>("/api/admin/payment-methods"),
    createPaymentMethod: (payload: unknown) =>
      request<{ method: PaymentMethod }>("/api/admin/payment-methods", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    listOperators: () => request<{ operators: Operator[] }>("/api/admin/operators"),
    createOperator: (payload: unknown) =>
      request<{ operator: Operator }>("/api/admin/operators", { method: "POST", body: JSON.stringify(payload) }),
    listProviders: () => request<{ providers: Provider[] }>("/api/admin/providers"),
    createProvider: (payload: unknown) =>
      request<{ provider: Provider }>("/api/admin/providers", { method: "POST", body: JSON.stringify(payload) }),
    createProviderEndpoint: (providerId: string, payload: unknown) =>
      request<{ endpoint: unknown }>(`/api/admin/providers/${providerId}/endpoints`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    listRoutes: () => request<{ routes: RouteSummary[] }>("/api/admin/routes"),
    createRoute: (payload: unknown) =>
      request<{ route: unknown }>("/api/admin/routes", { method: "POST", body: JSON.stringify(payload) }),
    listAdminQuotes: () => request<{ quotes: Quote[] }>("/api/admin/quotes"),
    listAdminWhatsAppTemplates: () => request<{ templates: WhatsAppTemplate[] }>("/api/admin/whatsapp/templates"),
    reviewWhatsAppTemplate: (id: string, payload: unknown) =>
      request<{ template: WhatsAppTemplate }>(`/api/admin/whatsapp/templates/${id}/review`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    listDiscountRules: () => request<{ rules: DiscountRule[] }>("/api/admin/discounts"),
    createDiscountRule: (payload: unknown) =>
      request<{ rule: DiscountRule }>("/api/admin/discounts", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    updateQuoteStatus: (id: string, payload: unknown) =>
      request<{ quote: Quote; pricingRuleId: string | null }>(`/api/admin/quotes/${id}/status`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  };
}

export type CoreApiClient = ReturnType<typeof createCoreApiClient>;
