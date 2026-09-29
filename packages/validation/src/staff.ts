import { z } from "zod";

export const internalRoleSchema = z.enum([
  "SUPER_ADMIN",
  "FINANCE",
  "COMMERCIAL",
  "CONFORMITE",
  "SUPPORT",
  "TECHNIQUE",
]);

export const createStaffSchema = z.object({
  email: z.string().email(),
  role: internalRoleSchema,
});
export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffSchema = z.object({
  role: internalRoleSchema.optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
