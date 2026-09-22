import { prisma } from "./db";
import { seedCatalog } from "@notifyafrica/config-seed";
import type { CatalogProduct } from "@notifyafrica/types";

export async function listCatalog(): Promise<{ products: CatalogProduct[]; source: "admin" | "seed" }> {
  const published = await prisma.catalogProduct.findMany({
    orderBy: { order: "asc" },
  });

  if (published.length > 0) {
    return {
      source: "admin",
      products: published.map((p) => ({
        id: p.id,
        key: p.key,
        name: p.name,
        slug: p.slug,
        category: p.category,
        summary: p.summary,
        description: p.description,
        icon: p.icon,
        countries: p.countries,
        status: p.status,
        publicPageEnabled: p.publicPageEnabled,
        order: p.order,
      })),
    };
  }

  return {
    source: "seed",
    products: seedCatalog.map((p, i) => ({
      id: `seed-${p.key}`,
      key: p.key,
      name: p.name,
      slug: p.slug,
      category: p.category,
      summary: p.summary,
      description: null,
      icon: p.icon,
      countries: p.countries,
      status: p.status,
      publicPageEnabled: p.publicPageEnabled,
      order: p.order ?? i,
    })),
  };
}
