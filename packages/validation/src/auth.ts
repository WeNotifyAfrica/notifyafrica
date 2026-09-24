import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().email().openapi({ example: "awa@example.com" }),
    password: z.string().min(10).openapi({ example: "SuperSecret123" }),
    organizationName: z.string().min(2).openapi({ example: "MaBanque SA" }),
    country: z.string().length(2).openapi({ example: "TG" }),
    currency: z.string().length(3).openapi({ example: "XOF" }),
    source: z.string().optional(),
    campaign: z.string().optional(),
  })
  .openapi("RegisterRequest");
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: z.string().email().openapi({ example: "awa@example.com" }),
    password: z.string().min(1).openapi({ example: "SuperSecret123" }),
  })
  .openapi("LoginRequest");
export type LoginInput = z.infer<typeof loginSchema>;
