import { prisma } from "@/lib/db";
import { seedPricingRules } from "@notifyafrica/config-seed";

/**
 * Public pricing tiers for the Website Tarifs page (01_Specifications
 * Website §10-11): the whole point is that publishing new tiers in Admin
 * changes this response with zero Website code change. Only publicVisible
 * rows are returned, and provider cost fields never leave the Core API
 * (01_Specifications_Website §23).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const product = url.searchParams.get("product");
  const currency = url.searchParams.get("currency") ?? "XOF";

  if (!product) {
    return Response.json({ error: "product_required" }, { status: 400 });
  }

  const published = await prisma.pricingRule.findMany({
    where: { productKey: product, currency, status: "ACTIVE", publicVisible: true },
    orderBy: { volumeMin: "asc" },
  });

  if (published.length > 0) {
    return Response.json({
      source: "admin",
      tiers: published.map((r) => ({
        volumeMin: r.volumeMin,
        volumeMax: r.volumeMax,
        unitPrice: Number(r.basePrice),
        currency: r.currency,
        quoteRequired: r.quoteRequired,
      })),
    });
  }

  const seedTiers = seedPricingRules.filter((r) => r.productKey === product && r.currency === currency);
  return Response.json({
    source: "seed",
    tiers: seedTiers.map((r) => ({
      volumeMin: r.volumeMin,
      volumeMax: r.volumeMax ?? null,
      unitPrice: r.basePrice,
      currency: r.currency,
      quoteRequired: r.quoteRequired,
    })),
  });
}
