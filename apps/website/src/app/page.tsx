import { coreApi } from "@/lib/api";
import { consoleAuthUrl } from "@/lib/env";
import { Button, Card, CardTitle, CardBody, Tag } from "@notifyafrica/ui";

export default async function HomePage() {
  const [{ products, source }] = await Promise.all([coreApi.listCatalog()]);

  return (
    <main style={{ maxWidth: 1320, margin: "0 auto", padding: "48px 24px" }}>
      <section>
        <h1>Communiquez avec toute l&apos;Afrique de l&apos;Ouest et centrale</h1>
        <p className="text-muted">
          SMS, OTP, WhatsApp Business, Email et bientôt paiements — une seule plateforme, une
          seule facturation prépayée.
        </p>
        <a href={consoleAuthUrl("register", { source: "homepage-hero" })}>
          <Button variant="primary">Créer un compte</Button>
        </a>
      </section>

      <section style={{ marginTop: 48 }}>
        <h2>Produits</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {products.map((product) => (
            <Card key={product.id} elevation="sm">
              <CardTitle>{product.name}</CardTitle>
              <CardBody>{product.summary}</CardBody>
              <Tag variant={product.status === "ACTIVE" ? "accent" : "outline"}>{product.status}</Tag>
            </Card>
          ))}
        </div>
        {/* `source` (admin|seed) is a diagnostic aid only — never rendered to visitors. */}
        <p hidden data-catalog-source={source} />
      </section>
    </main>
  );
}
