import { prisma } from "../src/lib/db";
import { importConfigSeed } from "../src/lib/seed-import";
import { hashPassword } from "@notifyafrica/auth";

/**
 * Dev-only convenience: internal (Admin) accounts have no self-registration
 * (00_Contexte_Global §17 keeps internal/customer roles separate), so local
 * development needs one bootstrap super-admin to log into the Admin app.
 * DO NOT reuse this path for staging/production provisioning.
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
