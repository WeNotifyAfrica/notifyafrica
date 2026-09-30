import { prisma } from "../src/lib/db";
import { importConfigSeed } from "../src/lib/seed-import";
import { hashPassword } from "@notifyafrica/auth";

/**
 * Internal (Admin) accounts have no self-registration (00_Contexte_Global
 * §17 keeps internal/customer roles separate), so both local dev and a
 * fresh production deploy need one bootstrap super-admin to log into the
 * Admin app at all. Idempotent (no-ops if ADMIN_SEED_EMAIL already
 * exists), which is what makes it safe to also be the documented one-time
 * post-deploy step (docs/DEPLOYMENT.md step 8) — not just a dev
 * convenience. Always pass ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD explicitly
 * in production rather than relying on the placeholder defaults below.
 */
async function ensureDevSuperAdmin() {
  const email = process.env.ADMIN_SEED_EMAIL ?? "admin@notifyafrica.dev";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { created: false, email };

  const password = process.env.ADMIN_SEED_PASSWORD ?? "ChangeMe123!";
  await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      internalRole: "SUPER_ADMIN",
      emailVerifiedAt: new Date(),
    },
  });
  return { created: true, email, password };
}

async function main() {
  const seedResult = await importConfigSeed(null);
  const adminResult = await ensureDevSuperAdmin();
  // eslint-disable-next-line no-console
  console.log("Seed import result:", seedResult);
  // eslint-disable-next-line no-console
  console.log("Dev super-admin:", adminResult);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
