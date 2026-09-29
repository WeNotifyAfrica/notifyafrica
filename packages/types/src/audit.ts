export interface AuditLogEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  actorEmail: string | null;
  before: unknown;
  after: unknown;
  reason: string | null;
  createdAt: string;
}
