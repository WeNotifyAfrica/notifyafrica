import { coreApi } from "@/lib/api";
import { Card, CardTitle, CardBody, Tag } from "@notifyafrica/ui";

/**
 * Built from the Catalog API (01_Specifications_Website §9): a new product
 * published in Admin with publicPageEnabled=true appears here without a
 * Website code change.
 */
export default async function ProduitsPage() {
  const { products } = await coreApi.listCatalog();
  const publicProducts = products.filter((p) => p.publicPageEnabled);

  return (
    <main style={{ maxWidth: 1320, margin: "0 auto", padding: "48px 24px" }}>
      <h1>Produits</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {publicProducts.map((product) => (
          <Card key={product.id} elevation="sm">
            <CardTitle>{product.name}</CardTitle>
            <CardBody>{product.summary}</CardBody>
            <Tag variant="neutral">{product.category}</Tag>
          </Card>
        ))}
      </div>
    </main>
  );
}
