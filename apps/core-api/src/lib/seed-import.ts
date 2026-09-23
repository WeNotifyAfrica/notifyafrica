import { prisma } from "./db";
import { recordAudit } from "./audit";
import {
  SEED_VERSION,
  seedCatalog,
  seedCountries,
  seedCurrencies,
  seedPricingRules,
} from "@notifyafrica/config-seed";

const MARKER_KEY = "seed.import";

/**
 * Admin's "Importer la configuration initiale du design" action
 * (04_Prompt §7, 02_Specifications_Backoffice §32). Must be:
 *  - idempotent: re-running with the same SEED_VERSION is a no-op:
 *  - audited: one AuditLog row per run;
 *  - versioned: gated on SEED_VERSION, so bumping the seed re-triggers it;
 *  - non-destructive: only fills gaps, never overwrites rows an Admin
 *    already published (a `count > 0` guard per table, not a delete+recreate).
 */
export async function importConfigSeed(actorUserId: string | null) {
  const marker = await prisma.configEntry.findFirst({
    where: { key: MARKER_KEY, scope: "GLOBAL", scopeId: null, version: SEED_VERSION },
  });

  if (marker) {
    return { skipped: true, reason: "already imported at this seed version", version: SEED_VERSION };
  }

  const results = { countries: 0, currencies: 0, catalog: 0, pricingRules: 0 };

  for (const country of seedCountries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: { ...country, status: "ACTIVE" },
    });
    results.countries += 1;
  }

  for (const currency of seedCurrencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: {},
      create: { ...currency, status: "ACTIVE" },
    });
    results.currencies += 1;
  }

  for (const product of seedCatalog) {
    const existing = await prisma.catalogProduct.findUnique({ where: { key: product.key } });
    if (existing) continue;
    await prisma.catalogProduct.create({
      data: {
        key: product.key,
        name: product.name,
        slug: product.slug,
        category: product.category,
        summary: product.summary,
        description: product.description,
        icon: product.icon,
        features: product.features,
        billingUnit: product.billingUnit,
        countries: product.countries,
        status: product.status,
        publicPageEnabled: product.publicPageEnabled,
        order: product.order,
      },
    });
    results.catalog += 1;
  }

  const existingRuleCount = await prisma.pricingRule.count();
  if (existingRuleCount === 0) {
    for (const rule of seedPricingRules) {
      await prisma.pricingRule.create({
        data: {
          productKey: rule.productKey,
          countryCode: rule.countryCode,
          category: rule.category,
          volumeMin: rule.volumeMin,
          volumeMax: rule.volumeMax ?? null,
          currency: rule.currency,
          baseCost: "baseCost" in rule ? rule.baseCost : null,
          basePrice: rule.basePrice,
          markupType: rule.markupType,
          markupValue: rule.markupValue,
          publicVisible: rule.publicVisible,
          quoteRequired: rule.quoteRequired,
          priority: rule.priority,
          status: "ACTIVE",
          version: 1,
          reason: "initial design seed import",
        },
      });
      results.pricingRules += 1;
    }
  }

  await prisma.configEntry.create({
    data: {
      key: MARKER_KEY,
      value: { version: SEED_VERSION, importedAt: new Date().toISOString(), results },
      type: "seed-marker",
      scope: "GLOBAL",
      scopeId: null,
      environment: "sandbox",
      version: SEED_VERSION,
      status: "ACTIVE",
      reason: "seed import",
      authorId: actorUserId,
    },
  });

  await recordAudit({
    actorUserId,
    action: "seed.import",
    resource: "config-seed",
    after: { version: SEED_VERSION, results },
    reason: "Admin-triggered initial design seed import",
  });

  return { skipped: false, version: SEED_VERSION, results };
}
