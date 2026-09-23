import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import { Card, CardTitle, CardBody, Table, Tag } from "@notifyafrica/ui";

/**
 * Tarifs (03_Specifications_Console §18) — reads the same Catalog/Pricing
 * API the Website and Admin use; a product published or repriced in Admin
 * shows up here immediately, same as on the Website (04_Prompt §12).
 */
export default async function ConsolePricingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const api = coreApi(token);

  const { products } = await api.listCatalog();
  const activeProducts = products.filter((p) => p.status === "ACTIVE" || p.status === "BETA");

  const tiersByProduct = await Promise.all(
    activeProducts.map(async (p) => ({
      product: p,
      tiers: (await api.listPricingTiers(p.key, "XOF")).tiers,
    })),
  );

  return (
    <div>
      <h1>Tarifs</h1>
      {tiersByProduct.map(({ product, tiers }) => (
        <Card key={product.id} elevation="md" style={{ marginBottom: 16, overflow: "auto" }}>
          <CardTitle>
            {product.name} <Tag variant="outline">{product.status}</Tag>
          </CardTitle>
          <CardBody>{product.summary}</CardBody>
          {tiers.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  <th>Volume</th>
                  <th>Prix unitaire</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((t, i) => (
                  <tr key={i}>
                    <td>
                      {t.volumeMin.toLocaleString("fr-FR")}
                      {t.volumeMax ? ` - ${t.volumeMax.toLocaleString("fr-FR")}` : "+"}
                    </td>
                    <td className="num">
                      {t.quoteRequired ? "Sur devis" : `${t.unitPrice} ${t.currency}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted">Tarification sur devis pour ce produit.</p>
          )}
        </Card>
      ))}
    </div>
  );
}

export const dynamic = "force-dynamic";
