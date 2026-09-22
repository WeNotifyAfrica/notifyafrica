import { z } from "zod";

export const configScopeSchema = z.enum(["GLOBAL", "COUNTRY", "ORGANIZATION", "PROJECT"]);
export const configStatusSchema = z.enum([
  "DRAFT",
  "REVIEW",
  "APPROVED",
  "SCHEDULED",
  "ACTIVE",
  "ARCHIVED",
]);

export const publishConfigSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
  type: z.string().min(1),
  scope: configScopeSchema,
  scopeId: z.string().nullable().default(null),
  environment: z.enum(["sandbox", "production"]),
  reason: z.string().min(3),
  effectiveFrom: z.string().datetime().nullable().default(null),
});
export type PublishConfigInput = z.infer<typeof publishConfigSchema>;
