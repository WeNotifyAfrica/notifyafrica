import { z } from "zod";

export const createApiKeySchema = z.object({
  name: z.string().min(2),
  environment: z.enum(["sandbox", "production"]),
  scopes: z.array(z.string()).default([]),
});
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
