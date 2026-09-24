import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  registerSchema,
  loginSchema,
  walletCreditSchema,
  walletTopupSchema,
} from "@notifyafrica/validation";

/**
 * Single source of truth for the Core API's OpenAPI spec, generated from
 * the same Zod schemas the route handlers validate against — never a
 * hand-maintained YAML/JSON that could drift from the real validators
 * (00_Contexte_Global's "no hardcoded/duplicated business data" principle,
 * applied to API docs). Served at /api/openapi.json, rendered at /docs.
 *
 * Registered lot by lot (see docs/ARCHITECTURE.md) — starting with
 * Auth + Wallet as the pattern to extend to the other ~50 routes.
 */
export const registry = new OpenAPIRegistry();

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

registry.registerPath({
  method: "post",
  path: "/api/auth/register",
  summary: "Create an organization, its owner user, a default project and wallet",
  tags: ["Auth"],
  request: { body: { content: { "application/json": { schema: registerSchema } } } },
  responses: {
    200: {
      description: "Registered — a bearer session token is returned",
      content: {
        "application/json": {
          schema: z.object({ userId: z.string(), organizationId: z.string(), token: z.string() }),
        },
      },
    },
    409: { description: "Email already registered", content: { "application/json": { schema: errorSchema } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/login",
  summary: "Exchange credentials for a bearer session token",
  tags: ["Auth"],
  request: { body: { content: { "application/json": { schema: loginSchema } } } },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: z.object({ token: z.string() }) } } },
    401: { description: "Invalid credentials", content: { "application/json": { schema: errorSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/auth/session",
  summary: "Resolve the current session from the bearer token",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "OK", content: { "application/json": { schema: z.object({ session: sessionSchema }) } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: errorSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/wallet",
  summary: "Get the current organization's wallet balance",
  tags: ["Wallet"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "OK", content: { "application/json": { schema: z.object({ wallet: walletSchema }) } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: errorSchema } } },
    404: { description: "Wallet not found", content: { "application/json": { schema: errorSchema } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/wallet/topup",
  summary: "Self-service recharge via a payment method (instant or pending confirmation)",
  tags: ["Wallet"],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: walletTopupSchema } } } },
  responses: {
    200: {
      description: "Instant methods credit immediately; others leave the transaction PENDING",
      content: {
        "application/json": {
          schema: z.object({ transaction: transactionSchema, wallet: walletSchema.nullable() }),
        },
      },
    },
    401: { description: "Unauthorized", content: { "application/json": { schema: errorSchema } } },
    422: { description: "Ineligible payment method or amount out of bounds", content: { "application/json": { schema: errorSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/wallet/transactions",
  summary: "List the current organization's wallet transactions (statement)",
  tags: ["Wallet"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "OK",
      content: { "application/json": { schema: z.object({ transactions: z.array(transactionSchema) }) } },
    },
    401: { description: "Unauthorized", content: { "application/json": { schema: errorSchema } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/wallet/credit",
  summary: "[Internal] Manually credit an organization's wallet (stands in for a real PSP integration)",
  tags: ["Admin"],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: walletCreditSchema } } } },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: z.object({ wallet: walletSchema }) } } },
    403: { description: "Forbidden — internal role required", content: { "application/json": { schema: errorSchema } } },
    404: { description: "Organization not found", content: { "application/json": { schema: errorSchema } } },
  },
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
