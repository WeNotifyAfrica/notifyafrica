import { z } from "zod";

export const createOperatorSchema = z.object({
  name: z.string().min(1),
  countryCode: z.string().length(2),
  code: z.string().min(1),
  status: z.enum(["ACTIVE", "DISABLED"]).default("ACTIVE"),
});
export type CreateOperatorInput = z.infer<typeof createOperatorSchema>;

export const createProviderSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  countryCode: z.string().length(2).nullable().default(null),
  status: z.enum(["ACTIVE", "DISABLED"]).default("ACTIVE"),
});
export type CreateProviderInput = z.infer<typeof createProviderSchema>;

export const createProviderEndpointSchema = z.object({
  environment: z.enum(["sandbox", "production"]).default("sandbox"),
  baseUrl: z.string().url(),
  path: z.string().min(1),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("POST"),
  authType: z.enum(["API_KEY", "BASIC", "BEARER", "OAUTH2", "HMAC", "CUSTOM_HEADERS", "NONE"]),
  timeoutMs: z.number().int().min(1000).max(60000).default(10000),
});
export type CreateProviderEndpointInput = z.infer<typeof createProviderEndpointSchema>;

export const createRouteSchema = z.object({
  productKey: z.string().min(1),
  countryCode: z.string().length(2).nullable().default(null),
  operatorId: z.string().nullable().default(null),
  providerId: z.string().min(1),
  priority: z.number().int().default(0),
  strategy: z.enum(["priority", "weighted", "failover", "cheapest", "best_quality"]).default("priority"),
  status: z.enum(["ACTIVE", "DISABLED"]).default("ACTIVE"),
});
export type CreateRouteInput = z.infer<typeof createRouteSchema>;
