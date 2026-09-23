// Moved to packages/domain so the Worker can share the same Prisma client
// (and the wallet/mock-provider logic that depends on it) instead of
// duplicating it — see packages/domain/src/db.ts.
export { prisma } from "@notifyafrica/domain";
