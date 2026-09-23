import { PrismaClient } from "@prisma/client";

/**
 * Shared Prisma client — the single source of truth used by both the Core
 * API (HTTP request/response cycle) and the Worker (background jobs, e.g.
 * campaign sends) so neither maintains its own copy of this or the
 * business logic in ./wallet.ts and ./providers/*. The schema itself lives
 * in apps/core-api/prisma/schema.prisma; `@prisma/client` is a generic
 * generated package any workspace member can depend on.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
