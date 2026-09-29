-- Internal (Admin) roles per design lot 27, "Équipe interne & rôles".
-- Replaces the SUPER_ADMIN/STAFF placeholder pair with the real role set.
BEGIN;

CREATE TYPE "InternalRole_new" AS ENUM ('SUPER_ADMIN', 'FINANCE', 'COMMERCIAL', 'CONFORMITE', 'SUPPORT', 'TECHNIQUE');

ALTER TABLE "users" ALTER COLUMN "internalRole" TYPE "InternalRole_new"
  USING ("internalRole"::text::"InternalRole_new");

DROP TYPE "InternalRole";
ALTER TYPE "InternalRole_new" RENAME TO "InternalRole";

COMMIT;
