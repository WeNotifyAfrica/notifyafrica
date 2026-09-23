import { z } from "zod";

export const consoleRoleSchema = z.enum([
  "OWNER",
  "ADMIN",
  "BILLING_MANAGER",
  "DEVELOPER",
  "CAMPAIGN_MANAGER",
  "SUPPORT_AGENT",
  "VIEWER_AUDITOR",
]);

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: consoleRoleSchema,
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(10),
});
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
