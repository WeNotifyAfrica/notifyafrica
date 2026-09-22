import { prisma } from "./db";

export async function recordAudit(entry: {
  actorUserId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
  ip?: string | null;
}) {
  return prisma.auditLog.create({
    data: {
      actorUserId: entry.actorUserId ?? null,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId ?? null,
      before: entry.before === undefined ? undefined : (entry.before as object),
      after: entry.after === undefined ? undefined : (entry.after as object),
      reason: entry.reason ?? null,
      ip: entry.ip ?? null,
    },
  });
}
