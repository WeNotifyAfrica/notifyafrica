import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  registerSchema,
  loginSchema,
  walletCreditSchema,
  walletTopupSchema,
  pricingEstimateRequestSchema,
  smsSendSchema,
  createOtpConfigSchema,
  generateOtpSchema,
  verifyOtpSchema,
  createWhatsAppNumberSchema,
  createWhatsAppTemplateSchema,
  reviewWhatsAppTemplateSchema,
  sendWhatsAppSchema,
  createCampaignSchema,
  createQuoteSchema,
  updateQuoteStatusSchema,
  createApiKeySchema,
  inviteMemberSchema,
  acceptInvitationSchema,
  createOperatorSchema,
  createProviderSchema,
  createProviderEndpointSchema,
  createRouteSchema,
  createDiscountRuleSchema,
  createPaymentMethodSchema,
  publishConfigSchema,
} from "@notifyafrica/validation";

/**
 * Single source of truth for the Core API's OpenAPI spec, generated from
 * the same Zod schemas the route handlers validate against — never a
 * hand-maintained YAML/JSON that could drift from the real validators
 * (00_Contexte_Global's "no hardcoded/duplicated business data" principle,
 * applied to API docs). Served at /api/openapi.json, rendered at /docs.
 */
export const registry = new OpenAPIRegistry();

// ─────────────────────────── shared response shapes ───────────────────────────
// Mirrors packages/types — these are what the route handlers actually
// serialize, so the spec stays true to the wire format (BigInt amounts as
// strings, etc.) rather than the internal Prisma model shape.

const errorSchema = z.object({ error: z.string() }).openapi("ErrorResponse");

const sessionSchema = z
  .object({
    sub: z.string(),
    email: z.string(),
    organizationId: z.string().nullable(),
    role: z.string().nullable(),
    internalRole: z.string().nullable(),
  })
  .openapi("Session");

const walletSchema = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    currency: z.string(),
    availableMinor: z.string().openapi({ description: "Minor units, as a string (BigInt over the wire)." }),
    reservedMinor: z.string(),
  })
  .openapi("Wallet");

const transactionSchema = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    type: z.string(),
    amountMinor: z.string(),
    currency: z.string(),
    status: z.string(),
    createdAt: z.string(),
  })
  .openapi("Transaction");

const messageSchema = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    projectId: z.string(),
    product: z.string(),
    senderId: z.string().nullable(),
    destination: z.string(),
    content: z.string(),
    status: z.enum(["QUEUED", "SENT", "FAILED"]),
    createdAt: z.string(),
  })
  .openapi("Message");

const catalogProductSchema = z
  .object({
    id: z.string(),
    key: z.string(),
    name: z.string(),
    slug: z.string(),
    category: z.string(),
    summary: z.string().nullable(),
    description: z.string().nullable(),
    icon: z.string().nullable(),
    features: z.array(z.string()),
    billingUnit: z.string().nullable(),
    countries: z.array(z.string()),
    status: z.enum(["ACTIVE", "BETA", "COMING_SOON", "PRIVATE", "DISABLED"]),
    publicPageEnabled: z.boolean(),
    order: z.number(),
  })
  .openapi("CatalogProduct");

const pricingTierSchema = z
  .object({
    volumeMin: z.number(),
    volumeMax: z.number().nullable(),
    unitPrice: z.number(),
    currency: z.string(),
    quoteRequired: z.boolean(),
  })
  .openapi("PricingTier");

const pricingEstimateResultSchema = z
  .object({
    unitPrice: z.number(),
    subtotal: z.number(),
    discounts: z.array(z.unknown()),
    taxes: z.array(z.unknown()),
    total: z.number(),
    currency: z.string(),
    ruleVersion: z.string(),
    quoteRequired: z.boolean(),
  })
  .openapi("PricingEstimateResult");

const otpConfigSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    length: z.number(),
    expirySeconds: z.number(),
    maxAttempts: z.number(),
    resendCooldownSeconds: z.number(),
    channel: z.string(),
    fallbackChannel: z.string().nullable(),
    template: z.string(),
    createdAt: z.string(),
  })
  .openapi("OtpConfig");

const otpCodeSummarySchema = z
  .object({
    id: z.string(),
    destination: z.string(),
    status: z.enum(["PENDING", "VERIFIED", "EXPIRED", "FAILED"]),
    attempts: z.number(),
    expiresAt: z.string(),
    createdAt: z.string(),
  })
  .openapi("OtpCodeSummary");

const whatsAppNumberSchema = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    phoneNumber: z.string(),
    displayName: z.string(),
    status: z.enum(["PENDING", "VERIFIED", "REJECTED"]),
    createdAt: z.string(),
  })
  .openapi("WhatsAppNumber");

const whatsAppTemplateSchema = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    name: z.string(),
    category: z.enum(["UTILITY", "AUTHENTICATION", "MARKETING"]),
    language: z.string(),
    bodyText: z.string(),
    status: z.enum(["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED"]),
    rejectionReason: z.string().nullable(),
    createdAt: z.string(),
    organization: z.object({ id: z.string(), name: z.string() }).optional().openapi({ description: "Admin list only." }),
  })
  .openapi("WhatsAppTemplate");

const campaignSchema = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    projectId: z.string(),
    name: z.string(),
    product: z.string(),
    senderId: z.string().nullable(),
    content: z.string(),
    destinations: z.array(z.string()),
    status: z.enum(["DRAFT", "SCHEDULED", "QUEUED", "RUNNING", "PAUSED", "COMPLETED", "PARTIAL", "FAILED", "CANCELLED"]),
    unitPrice: z.number().nullable(),
    currency: z.string().nullable(),
    estimatedTotal: z.number().nullable(),
    heldAmountMinor: z.string().nullable().openapi({ description: "Minor units, as a string." }),
    sentCount: z.number(),
    failedCount: z.number(),
    totalCount: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("Campaign");

const quoteSchema = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    productKey: z.string(),
    status: z.enum(["DRAFT", "SUBMITTED", "UNDER_REVIEW", "INFO_REQUIRED", "OFFER_AVAILABLE", "ACCEPTED", "REJECTED", "EXPIRED"]),
    payload: z.object({
      country: z.string(),
      quantity: z.number(),
      currency: z.string(),
      notes: z.string().nullable(),
      offer: z.object({ unitPrice: z.number(), total: z.number(), currency: z.string(), notes: z.string().nullable() }).optional(),
    }),
    createdAt: z.string(),
    updatedAt: z.string(),
    organization: z.object({ id: z.string(), name: z.string() }).optional().openapi({ description: "Admin list only." }),
  })
  .openapi("Quote");

const apiKeySummarySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    environment: z.enum(["sandbox", "production"]),
    prefix: z.string(),
    scopes: z.array(z.string()),
    expiresAt: z.string().nullable(),
    revokedAt: z.string().nullable(),
    createdAt: z.string(),
  })
  .openapi("ApiKeySummary");

const teamMemberSchema = z
  .object({
    userId: z.string(),
    email: z.string(),
    status: z.string(),
    role: z.string(),
    memberSince: z.string(),
  })
  .openapi("TeamMember");

const invitationSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    role: z.string(),
    status: z.enum(["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"]),
    expiresAt: z.string(),
    createdAt: z.string(),
  })
  .openapi("Invitation");

const operatorSchema = z
  .object({ id: z.string(), name: z.string(), countryCode: z.string(), code: z.string(), status: z.string() })
  .openapi("Operator");

const providerEndpointSchema = z
  .object({
    id: z.string(),
    environment: z.enum(["sandbox", "production"]),
    baseUrl: z.string(),
    path: z.string(),
    method: z.string(),
    authType: z.string(),
    timeoutMs: z.number(),
  })
  .openapi("ProviderEndpoint");

const providerSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    countryCode: z.string().nullable(),
    status: z.string(),
    healthState: z.string(),
    endpoints: z.array(providerEndpointSchema).optional(),
  })
  .openapi("Provider");

const routeSummarySchema = z
  .object({
    id: z.string(),
    productKey: z.string(),
    countryCode: z.string().nullable(),
    operatorId: z.string().nullable(),
    priority: z.number(),
    strategy: z.string(),
    status: z.string(),
    provider: z.object({ id: z.string(), name: z.string() }),
  })
  .openapi("RouteSummary");

const discountRuleSchema = z
  .object({
    id: z.string(),
    type: z.enum(["PERCENT", "FIXED_AMOUNT", "UNIT_DISCOUNT", "FIXED_PRICE", "PROMO", "BONUS"]),
    productKey: z.string().nullable(),
    scope: z.enum(["GLOBAL", "COUNTRY", "ORGANIZATION", "PROJECT"]),
    scopeId: z.string().nullable(),
    value: z.number(),
    priority: z.number(),
    stackable: z.boolean(),
    maxDiscount: z.number().nullable(),
    startAt: z.string().nullable(),
    endAt: z.string().nullable(),
    status: z.string(),
    createdAt: z.string(),
  })
  .openapi("DiscountRule");

const paymentMethodSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    family: z.enum(["MOBILE_MONEY", "CARD", "BANK_TRANSFER", "INVOICE"]),
    countries: z.array(z.string()),
    minAmount: z.number().nullable(),
    maxAmount: z.number().nullable(),
    feePercent: z.number(),
    instant: z.boolean(),
    status: z.string(),
    createdAt: z.string(),
  })
  .openapi("PaymentMethod");

const organizationSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    country: z.string(),
    currency: z.string(),
    createdAt: z.string(),
    memberCount: z.number(),
    projectCount: z.number(),
    wallet: walletSchema.nullable(),
  })
  .openapi("AdminOrganization");

const userSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    status: z.enum(["ACTIVE", "SUSPENDED"]),
    emailVerifiedAt: z.string().nullable(),
    createdAt: z.string(),
    organizations: z.array(z.object({ id: z.string(), name: z.string(), role: z.string() })),
  })
  .openapi("AdminUser");

const notificationSchema = z
  .object({ id: z.string(), event: z.string(), organizationId: z.string().nullable(), payload: z.unknown(), readAt: z.string().nullable(), createdAt: z.string() })
  .openapi("Notification");

const resolvedConfigSchema = z
  .object({
    key: z.string(),
    value: z.unknown(),
    source: z.enum(["admin", "seed", "fallback"]),
    version: z.number().nullable(),
  })
  .openapi("ResolvedConfig");

const dashboardSummarySchema = z
  .object({
    wallet: walletSchema.nullable(),
    messagesByProductThisMonth: z.array(z.object({ product: z.string(), count: z.number() })),
    activeCampaigns: z.number(),
    pendingQuotes: z.number(),
    activity: z.array(
      z.object({ id: z.string(), kind: z.enum(["message", "transaction"]), label: z.string(), status: z.string(), createdAt: z.string() }),
    ),
  })
  .openapi("DashboardSummary");

const adminDashboardSummarySchema = z
  .object({
    organizationCount: z.number(),
    revenueThisMonth: z.array(z.object({ currency: z.string(), totalMinor: z.string() })),
    pendingQuotes: z.number(),
    pendingWhatsappTemplates: z.number(),
    pendingTransactions: z.number(),
    recentNotifications: z.array(z.object({ id: z.string(), event: z.string(), createdAt: z.string() })),
    recentAuditLog: z.array(
      z.object({ id: z.string(), action: z.string(), resource: z.string(), actorEmail: z.string().nullable(), reason: z.string().nullable(), createdAt: z.string() }),
    ),
  })
  .openapi("AdminDashboardSummary");

const bearerAuth = [{ bearerAuth: [] }];

function jsonResponse(description: string, schema: z.ZodTypeAny) {
  return { description, content: { "application/json": { schema } } };
}
function errorResponse(description: string) {
  return jsonResponse(description, errorSchema);
}

// ──────────────────────────────────── Auth ────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/auth/register",
  summary: "Create an organization, its owner user, a default project and wallet",
  tags: ["Auth"],
  request: { body: { content: { "application/json": { schema: registerSchema } } } },
  responses: {
    200: jsonResponse("Registered — a bearer session token is returned", z.object({ userId: z.string(), organizationId: z.string(), token: z.string() })),
    409: errorResponse("Email already registered"),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/login",
  summary: "Exchange credentials for a bearer session token",
  tags: ["Auth"],
  request: { body: { content: { "application/json": { schema: loginSchema } } } },
  responses: {
    200: jsonResponse("OK", z.object({ token: z.string() })),
    401: errorResponse("Invalid credentials"),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/auth/session",
  summary: "Resolve the current session from the bearer token",
  tags: ["Auth"],
  security: bearerAuth,
  responses: {
    200: jsonResponse("OK", z.object({ session: sessionSchema })),
    401: errorResponse("Unauthorized"),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/invitations/{token}",
  summary: "Public lookup of a pending invitation (who's inviting, for which org/role)",
  tags: ["Auth"],
  request: { params: z.object({ token: z.string() }) },
  responses: {
    200: jsonResponse("OK", z.object({ email: z.string(), role: z.string(), organizationName: z.string() })),
    404: errorResponse("Invalid or expired"),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/invitations/accept",
  summary: "Accept an invitation — creates the user and membership, no prior session needed",
  tags: ["Auth"],
  request: { body: { content: { "application/json": { schema: acceptInvitationSchema } } } },
  responses: {
    200: jsonResponse("OK", z.object({ token: z.string() })),
    409: errorResponse("Account already exists for this email"),
    410: errorResponse("Invitation expired or already used"),
  },
});

// ───────────────────────────────── Catalog / Config ────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/health",
  summary: "Liveness check",
  tags: ["Catalog"],
  responses: { 200: jsonResponse("OK", z.object({ status: z.literal("ok") })) },
});

registry.registerPath({
  method: "get",
  path: "/api/catalog",
  summary: "List published products (Website/Console/Admin all read the same catalog)",
  tags: ["Catalog"],
  responses: { 200: jsonResponse("OK", z.object({ source: z.enum(["admin", "seed"]), products: z.array(catalogProductSchema) })) },
});

registry.registerPath({
  method: "get",
  path: "/api/config/{key}",
  summary: "Resolve a config key through the fallback chain (Admin -> Scoped -> Seed -> Empty)",
  tags: ["Catalog"],
  request: {
    params: z.object({ key: z.string().openapi({ example: "catalog.currencies" }) }),
    query: z.object({
      scope: z.enum(["GLOBAL", "COUNTRY", "ORGANIZATION", "PROJECT"]).optional(),
      scopeId: z.string().optional(),
      environment: z.enum(["sandbox", "production"]).optional(),
    }),
  },
  responses: { 200: jsonResponse("OK", resolvedConfigSchema) },
});

registry.registerPath({
  method: "get",
  path: "/api/pricing/rules",
  summary: "Public pricing tiers for a product/currency (Website Tarifs page)",
  tags: ["Catalog"],
  request: { query: z.object({ product: z.string(), currency: z.string().default("XOF") }) },
  responses: {
    200: jsonResponse("OK", z.object({ source: z.enum(["admin", "seed"]), tiers: z.array(pricingTierSchema) })),
    400: errorResponse("Missing product"),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/pricing/estimate",
  summary: "Estimate the price for a quantity of a product (the single source of truth every send flow calls)",
  tags: ["Catalog"],
  request: { body: { content: { "application/json": { schema: pricingEstimateRequestSchema } } } },
  responses: { 200: jsonResponse("OK", pricingEstimateResultSchema) },
});

// ──────────────────────────────────── Wallet ───────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/wallet",
  summary: "Get the current organization's wallet balance",
  tags: ["Wallet"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ wallet: walletSchema })), 401: errorResponse("Unauthorized"), 404: errorResponse("Wallet not found") },
});

registry.registerPath({
  method: "post",
  path: "/api/wallet/topup",
  summary: "Self-service recharge via a payment method (instant or pending confirmation)",
  tags: ["Wallet"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: walletTopupSchema } } } },
  responses: {
    200: jsonResponse("Instant methods credit immediately; others leave the transaction PENDING", z.object({ transaction: transactionSchema, wallet: walletSchema.nullable() })),
    401: errorResponse("Unauthorized"),
    422: errorResponse("Ineligible payment method or amount out of bounds"),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/wallet/transactions",
  summary: "List the current organization's wallet transactions (statement)",
  tags: ["Wallet"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ transactions: z.array(transactionSchema) })), 401: errorResponse("Unauthorized") },
});

registry.registerPath({
  method: "get",
  path: "/api/payment-methods",
  summary: "List payment methods eligible for the current organization's country",
  tags: ["Wallet"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ methods: z.array(paymentMethodSchema) })), 401: errorResponse("Unauthorized"), 404: errorResponse("Organization not found") },
});

// ────────────────────────────────────── SMS ────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/sms/send",
  summary: "Send a single SMS (estimate -> hold -> send -> capture/release)",
  tags: ["SMS"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: smsSendSchema } } } },
  responses: {
    200: jsonResponse("OK", z.object({ message: messageSchema, transaction: transactionSchema, estimate: pricingEstimateResultSchema })),
    401: errorResponse("Unauthorized"),
    402: errorResponse("Insufficient balance"),
    422: errorResponse("This volume requires a quote"),
    502: errorResponse("Provider failed"),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/sms/history",
  summary: "List the current organization's sent SMS (last 50)",
  tags: ["SMS"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ messages: z.array(messageSchema) })), 401: errorResponse("Unauthorized") },
});

// ────────────────────────────────────── OTP ────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/otp/configs",
  summary: "List the current organization's OTP configurations",
  tags: ["OTP"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ configs: z.array(otpConfigSchema) })), 401: errorResponse("Unauthorized") },
});

registry.registerPath({
  method: "post",
  path: "/api/otp/configs",
  summary: "Create an OTP configuration (length, expiry, attempts, channel, template)",
  tags: ["OTP"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: createOtpConfigSchema } } } },
  responses: { 200: jsonResponse("OK", z.object({ config: otpConfigSchema })), 401: errorResponse("Unauthorized"), 403: errorResponse("Forbidden — otp.manage required") },
});

registry.registerPath({
  method: "post",
  path: "/api/otp/generate",
  summary: "Generate and deliver an OTP code (estimate -> hold -> deliver -> capture/release)",
  tags: ["OTP"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: generateOtpSchema } } } },
  responses: {
    200: jsonResponse("OK — the code itself is never returned, only the id to verify against", z.object({ otpId: z.string(), destination: z.string(), expiresAt: z.string() })),
    401: errorResponse("Unauthorized"),
    402: errorResponse("Insufficient balance"),
    404: errorResponse("Config not found"),
    422: errorResponse("This volume requires a quote"),
    502: errorResponse("Delivery failed"),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/otp/verify",
  summary: "Verify a code against its otpId — attempts and expiry enforced server-side",
  tags: ["OTP"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: verifyOtpSchema } } } },
  responses: {
    200: jsonResponse("Verified", z.object({ status: z.literal("VERIFIED") })),
    400: jsonResponse("Invalid code", z.object({ error: z.string(), status: z.string(), attemptsRemaining: z.number() })),
    401: errorResponse("Unauthorized"),
    404: errorResponse("Not found"),
    409: errorResponse("Not pending (already verified/failed)"),
    410: errorResponse("Expired"),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/otp/history",
  summary: "List the current organization's OTP codes (last 50)",
  tags: ["OTP"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ codes: z.array(otpCodeSummarySchema) })), 401: errorResponse("Unauthorized") },
});

// ─────────────────────────────────── WhatsApp ──────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/whatsapp/numbers",
  summary: "List the current organization's WhatsApp sender numbers",
  tags: ["WhatsApp"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ numbers: z.array(whatsAppNumberSchema) })), 401: errorResponse("Unauthorized") },
});

registry.registerPath({
  method: "post",
  path: "/api/whatsapp/numbers",
  summary: "Register a WhatsApp sender number (created directly VERIFIED — no real Meta flow wired yet)",
  tags: ["WhatsApp"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: createWhatsAppNumberSchema } } } },
  responses: { 200: jsonResponse("OK", z.object({ number: whatsAppNumberSchema })), 401: errorResponse("Unauthorized"), 404: errorResponse("Project not found") },
});

registry.registerPath({
  method: "get",
  path: "/api/whatsapp/templates",
  summary: "List the current organization's WhatsApp templates",
  tags: ["WhatsApp"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ templates: z.array(whatsAppTemplateSchema) })), 401: errorResponse("Unauthorized") },
});

registry.registerPath({
  method: "post",
  path: "/api/whatsapp/templates",
  summary: "Submit a WhatsApp template for review (always created PENDING_REVIEW)",
  tags: ["WhatsApp"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: createWhatsAppTemplateSchema } } } },
  responses: { 200: jsonResponse("OK", z.object({ template: whatsAppTemplateSchema })), 401: errorResponse("Unauthorized"), 403: errorResponse("Forbidden — whatsapp.manage required") },
});

registry.registerPath({
  method: "post",
  path: "/api/whatsapp/send",
  summary: "Send a WhatsApp message from an APPROVED template (priced by Meta category)",
  tags: ["WhatsApp"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: sendWhatsAppSchema } } } },
  responses: {
    200: jsonResponse("OK", z.object({ message: messageSchema, estimate: pricingEstimateResultSchema })),
    401: errorResponse("Unauthorized"),
    402: errorResponse("Insufficient balance"),
    404: errorResponse("Not found"),
    422: errorResponse("Template not approved, or this volume requires a quote"),
    502: errorResponse("Provider failed"),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/whatsapp/history",
  summary: "List the current organization's sent WhatsApp messages (last 50)",
  tags: ["WhatsApp"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ messages: z.array(messageSchema) })), 401: errorResponse("Unauthorized") },
});

// ─────────────────────────────────── Campaigns ─────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/campaigns",
  summary: "List the current organization's campaigns",
  tags: ["Campaigns"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ campaigns: z.array(campaignSchema) })), 401: errorResponse("Unauthorized") },
});

registry.registerPath({
  method: "post",
  path: "/api/campaigns",
  summary: "Draft a campaign (no pricing/funds touched yet)",
  tags: ["Campaigns"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: createCampaignSchema } } } },
  responses: { 200: jsonResponse("OK", z.object({ campaign: campaignSchema })), 401: errorResponse("Unauthorized"), 404: errorResponse("Project not found") },
});

registry.registerPath({
  method: "get",
  path: "/api/campaigns/{id}",
  summary: "Get a campaign",
  tags: ["Campaigns"],
  security: bearerAuth,
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: jsonResponse("OK", z.object({ campaign: campaignSchema })), 401: errorResponse("Unauthorized"), 404: errorResponse("Not found") },
});

registry.registerPath({
  method: "post",
  path: "/api/campaigns/{id}/estimate",
  summary: "Estimate a DRAFT campaign's cost (quantity = whole audience)",
  tags: ["Campaigns"],
  security: bearerAuth,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: jsonResponse("OK", z.object({ campaign: campaignSchema, estimate: pricingEstimateResultSchema })),
    401: errorResponse("Unauthorized"),
    404: errorResponse("Not found"),
    409: errorResponse("Not editable (not DRAFT)"),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/campaigns/{id}/launch",
  summary: "Reserve funds for the whole estimated audience and enqueue the send (returns immediately, Worker runs it)",
  tags: ["Campaigns"],
  security: bearerAuth,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: jsonResponse("Queued — the campaign is now QUEUED, the Worker will process it", z.object({ campaign: campaignSchema })),
    401: errorResponse("Unauthorized"),
    402: errorResponse("Insufficient balance"),
    404: errorResponse("Not found"),
    409: errorResponse("Not launchable (not DRAFT)"),
    422: errorResponse("Estimate required before launch"),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/campaigns/{id}/cancel",
  summary: "Cancel a campaign before it starts running (releases any held funds)",
  tags: ["Campaigns"],
  security: bearerAuth,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: jsonResponse("OK", z.object({ campaign: campaignSchema })),
    401: errorResponse("Unauthorized"),
    404: errorResponse("Not found"),
    409: errorResponse("Not cancellable (already RUNNING or terminal)"),
  },
});

// ───────────────────────────────────── Quotes ──────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/quotes",
  summary: "List the current organization's quote requests",
  tags: ["Quotes"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ quotes: z.array(quoteSchema) })), 401: errorResponse("Unauthorized") },
});

registry.registerPath({
  method: "post",
  path: "/api/quotes",
  summary: "Request a quote for a volume above the published tiers",
  tags: ["Quotes"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: createQuoteSchema } } } },
  responses: { 200: jsonResponse("OK — fires QUOTE_REQUESTED for Admin's notification center", z.object({ quote: quoteSchema })), 401: errorResponse("Unauthorized") },
});

// ─────────────────────────────── Developers / Team ─────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/keys",
  summary: "List the current organization's API keys",
  tags: ["Developers"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ keys: z.array(apiKeySummarySchema) })), 401: errorResponse("Unauthorized") },
});

registry.registerPath({
  method: "post",
  path: "/api/keys",
  summary: "Create an API key — the secret is returned exactly once, never again",
  tags: ["Developers"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: createApiKeySchema } } } },
  responses: {
    200: jsonResponse("OK", z.object({ key: apiKeySummarySchema, secret: z.string().openapi({ description: "Shown once — the DB only stores its hash." }) })),
    401: errorResponse("Unauthorized"),
    403: errorResponse("Forbidden — apikey.manage required"),
    404: errorResponse("Project not found"),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/keys/{id}/revoke",
  summary: "Revoke an API key",
  tags: ["Developers"],
  security: bearerAuth,
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: jsonResponse("OK", z.object({ ok: z.literal(true) })), 401: errorResponse("Unauthorized"), 403: errorResponse("Forbidden"), 404: errorResponse("Not found") },
});

registry.registerPath({
  method: "get",
  path: "/api/team/members",
  summary: "List the current organization's team members",
  tags: ["Team"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ members: z.array(teamMemberSchema) })), 401: errorResponse("Unauthorized") },
});

registry.registerPath({
  method: "get",
  path: "/api/team/invitations",
  summary: "List the current organization's pending invitations",
  tags: ["Team"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ invitations: z.array(invitationSchema) })), 401: errorResponse("Unauthorized") },
});

registry.registerPath({
  method: "post",
  path: "/api/team/invitations",
  summary: "Invite a team member by email with a role (7-day token, no email provider wired — logged as intended delivery)",
  tags: ["Team"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: inviteMemberSchema } } } },
  responses: {
    200: jsonResponse("OK", z.object({ invitation: z.object({ id: z.string(), email: z.string(), role: z.string() }) })),
    401: errorResponse("Unauthorized"),
    403: errorResponse("Forbidden — team.manage required"),
    409: errorResponse("Already a member"),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/team/invitations/{id}/revoke",
  summary: "Revoke a pending invitation",
  tags: ["Team"],
  security: bearerAuth,
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: jsonResponse("OK", z.object({ ok: z.literal(true) })), 401: errorResponse("Unauthorized"), 403: errorResponse("Forbidden"), 404: errorResponse("Not found") },
});

// ──────────────────────────────────── Dashboard ────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/dashboard/summary",
  summary: "Console overview: wallet, messages by product this month, active campaigns, pending quotes, recent activity",
  tags: ["Dashboard"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", dashboardSummarySchema), 401: errorResponse("Unauthorized") },
});

// ───────────────────────────────────── Admin ───────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/admin/wallet/credit",
  summary: "[Internal] Manually credit an organization's wallet (stands in for a real PSP integration)",
  tags: ["Admin"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: walletCreditSchema } } } },
  responses: { 200: jsonResponse("OK", z.object({ wallet: walletSchema })), 403: errorResponse("Forbidden — internal role required"), 404: errorResponse("Organization not found") },
});

registry.registerPath({
  method: "get",
  path: "/api/admin/dashboard/summary",
  summary: "[Internal] Back-office pilotage: organizations, revenue this month, pending items, audit log",
  tags: ["Admin"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", adminDashboardSummarySchema), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/catalog",
  summary: "[Internal] Create or update a catalog product",
  tags: ["Admin"],
  security: bearerAuth,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            key: z.string(),
            name: z.string(),
            slug: z.string(),
            category: z.string(),
            summary: z.string().nullable().default(null),
            description: z.string().nullable().default(null),
            icon: z.string().nullable().default(null),
            features: z.array(z.string()).default([]),
            billingUnit: z.string().nullable().default(null),
            countries: z.array(z.string()).default([]),
            status: z.enum(["ACTIVE", "BETA", "COMING_SOON", "PRIVATE", "DISABLED"]),
            publicPageEnabled: z.boolean().default(false),
            order: z.number().int().default(0),
          }),
        },
      },
    },
  },
  responses: { 200: jsonResponse("OK", z.object({ product: catalogProductSchema })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/config",
  summary: "[Internal] Publish a new config version (never mutates a prior one — versioned insert)",
  tags: ["Admin"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: publishConfigSchema } } } },
  responses: { 200: jsonResponse("OK", z.object({ entry: z.unknown() })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/pricing-rules",
  summary: "[Internal] Publish a pricing rule (versioned — auto-archives the overlapping tier on the same bracket)",
  tags: ["Admin"],
  security: bearerAuth,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            productKey: z.string(),
            countryCode: z.string().length(2).nullable().default(null),
            category: z.string().nullable().default(null),
            volumeMin: z.number().int().default(0),
            volumeMax: z.number().int().nullable().default(null),
            currency: z.string().length(3),
            baseCost: z.number().nullable().default(null),
            basePrice: z.number(),
            markupType: z.enum(["PERCENT", "FIXED_AMOUNT"]).default("PERCENT"),
            markupValue: z.number().default(0),
            publicVisible: z.boolean().default(true),
            quoteRequired: z.boolean().default(false),
            priority: z.number().int().default(0),
            reason: z.string().min(3),
          }),
        },
      },
    },
  },
  responses: { 200: jsonResponse("OK", z.object({ rule: z.unknown() })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "get",
  path: "/api/admin/discounts",
  summary: "[Internal] List discount rules",
  tags: ["Admin"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ rules: z.array(discountRuleSchema) })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/discounts",
  summary: "[Internal] Create a discount rule (exclusive by priority unless stackable)",
  tags: ["Admin"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: createDiscountRuleSchema } } } },
  responses: { 200: jsonResponse("OK", z.object({ rule: discountRuleSchema })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "get",
  path: "/api/admin/notifications",
  summary: "[Internal] List the Admin notification center's recent entries",
  tags: ["Admin"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ notifications: z.array(notificationSchema) })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "patch",
  path: "/api/admin/notifications",
  summary: "[Internal] Mark a notification as read",
  tags: ["Admin"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: z.object({ id: z.string() }) } } } },
  responses: { 200: jsonResponse("OK", z.object({ notification: notificationSchema })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "get",
  path: "/api/admin/operators",
  summary: "[Internal] List operators",
  tags: ["Admin"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ operators: z.array(operatorSchema) })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/operators",
  summary: "[Internal] Create an operator",
  tags: ["Admin"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: createOperatorSchema } } } },
  responses: { 200: jsonResponse("OK", z.object({ operator: operatorSchema })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "get",
  path: "/api/admin/organizations",
  summary: "[Internal] Customer 360 (minimal slice): identity, wallet, member/project counts",
  tags: ["Admin"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ organizations: z.array(organizationSchema) })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "get",
  path: "/api/admin/payment-methods",
  summary: "[Internal] List the payment methods catalog",
  tags: ["Admin"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ methods: z.array(paymentMethodSchema) })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/payment-methods",
  summary: "[Internal] Add a payment method to the catalog (mobile money, card, transfer, invoice)",
  tags: ["Admin"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: createPaymentMethodSchema } } } },
  responses: { 200: jsonResponse("OK", z.object({ method: paymentMethodSchema })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "get",
  path: "/api/admin/providers",
  summary: "[Internal] List providers (configuration storage only — no live proxy)",
  tags: ["Admin"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ providers: z.array(providerSchema) })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/providers",
  summary: "[Internal] Declare a provider",
  tags: ["Admin"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: createProviderSchema } } } },
  responses: { 200: jsonResponse("OK", z.object({ provider: providerSchema })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/providers/{id}/endpoints",
  summary: "[Internal] Add a connection endpoint to a provider (shape only — no credentials stored)",
  tags: ["Admin"],
  security: bearerAuth,
  request: { params: z.object({ id: z.string() }), body: { content: { "application/json": { schema: createProviderEndpointSchema } } } },
  responses: { 200: jsonResponse("OK", z.object({ endpoint: providerEndpointSchema })), 403: errorResponse("Forbidden"), 404: errorResponse("Provider not found") },
});

registry.registerPath({
  method: "get",
  path: "/api/admin/routes",
  summary: "[Internal] List routing rules (product + country + operator -> provider, priority/strategy)",
  tags: ["Admin"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ routes: z.array(routeSummarySchema) })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/routes",
  summary: "[Internal] Create a routing rule",
  tags: ["Admin"],
  security: bearerAuth,
  request: { body: { content: { "application/json": { schema: createRouteSchema } } } },
  responses: { 200: jsonResponse("OK", z.object({ route: routeSummarySchema })), 403: errorResponse("Forbidden"), 404: errorResponse("Provider not found") },
});

registry.registerPath({
  method: "get",
  path: "/api/admin/quotes",
  summary: "[Internal] List all quote requests (pipeline)",
  tags: ["Admin"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ quotes: z.array(quoteSchema) })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/quotes/{id}/status",
  summary: "[Internal] Transition a quote's status; setting an offer while moving to ACCEPTED creates a binding org-scoped pricing rule",
  tags: ["Admin"],
  security: bearerAuth,
  request: { params: z.object({ id: z.string() }), body: { content: { "application/json": { schema: updateQuoteStatusSchema } } } },
  responses: { 200: jsonResponse("OK", z.object({ quote: quoteSchema })), 403: errorResponse("Forbidden"), 404: errorResponse("Not found") },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/seed-import",
  summary: "[Internal] Import the design handoff's seed configuration (idempotent — no-op if already imported)",
  tags: ["Admin"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ skipped: z.boolean(), version: z.number() })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "get",
  path: "/api/admin/transactions",
  summary: "[Internal] List all transactions across organizations",
  tags: ["Admin"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ transactions: z.array(transactionSchema.extend({ organization: z.object({ id: z.string(), name: z.string() }) })) })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/transactions/{id}/confirm",
  summary: "[Internal] Confirm a non-instant payment method's PENDING transaction (bank transfer, invoicing) — this is what credits the wallet",
  tags: ["Admin"],
  security: bearerAuth,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: jsonResponse("OK", z.object({ transaction: transactionSchema, wallet: walletSchema })),
    403: errorResponse("Forbidden"),
    404: errorResponse("Not found"),
    409: errorResponse("Not confirmable (not a PENDING WALLET_TOPUP)"),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/admin/users",
  summary: "[Internal] List platform users (client-side accounts only, not internal staff)",
  tags: ["Admin"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ users: z.array(userSchema) })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "get",
  path: "/api/admin/whatsapp/templates",
  summary: "[Internal] WhatsApp template review queue",
  tags: ["Admin"],
  security: bearerAuth,
  responses: { 200: jsonResponse("OK", z.object({ templates: z.array(whatsAppTemplateSchema) })), 403: errorResponse("Forbidden") },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/whatsapp/templates/{id}/review",
  summary: "[Internal] Approve or reject a WhatsApp template",
  tags: ["Admin"],
  security: bearerAuth,
  request: { params: z.object({ id: z.string() }), body: { content: { "application/json": { schema: reviewWhatsAppTemplateSchema } } } },
  responses: { 200: jsonResponse("OK", z.object({ template: whatsAppTemplateSchema })), 403: errorResponse("Forbidden"), 404: errorResponse("Not found") },
});

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "Token from POST /api/auth/login or /api/auth/register.",
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "NotifyAfrica Core API",
      version: "0.1.0",
      description:
        "CPaaS API for SMS, OTP, WhatsApp, campaigns, billing and back-office operations. " +
        "Generated from the same Zod schemas the route handlers validate against.",
    },
    servers: [{ url: "/", description: "Same origin as this docs page" }],
  });
}
