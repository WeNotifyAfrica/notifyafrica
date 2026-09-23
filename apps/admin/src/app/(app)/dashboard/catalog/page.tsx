import { coreApi } from "@/lib/api";
import { publishCatalogProductAction } from "../../actions";
import { Button, Card, CardTitle, CardBody, Field, Input, Table, Tag } from "@notifyafrica/ui";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  BETA: "Bêta",
  COMING_SOON: "Bientôt disponible",
  PRIVATE: "Privé",
  DISABLED: "Désactivé",
};

export default async function CatalogPage() {
  const { products, source } = await coreApi().listCatalog();

  return (
    <div>
      <h1>Catalogue produits</h1>
      <p className="text-muted">Source actuelle : {source === "admin" ? "publiée" : "seed design"}</p>

      <Card elevation="md" style={{ marginBottom: 24, overflow: "auto" }}>
        <Table>
          <thead>
            <tr>
              <th>Clé</th>
              <th>Nom</th>
              <th>Statut</th>
              <th>Page publique</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.key}</td>
                <td>{p.name}</td>
                <td>
                  <Tag variant={p.status === "ACTIVE" ? "accent" : "neutral"}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </Tag>
                </td>
                <td>{p.publicPageEnabled ? "Oui" : "Non"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card elevation="sm">
        <CardTitle>Publier / mettre à jour un produit</CardTitle>
        <CardBody>Crée le produit s&apos;il n&apos;existe pas, sinon met à jour la fiche existante.</CardBody>
        <form
          action={publishCatalogProductAction}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <Field label="Clé (immuable)">
            <Input name="key" required />
          </Field>
          <Field label="Nom">
            <Input name="name" required />
          </Field>
          <Field label="Slug">
            <Input name="slug" required />
          </Field>
          <Field label="Catégorie">
            <Input name="category" required />
          </Field>
          <Field label="Résumé">
            <Input name="summary" />
          </Field>
          <Field label="Statut">
            <select name="status" className="input" defaultValue="ACTIVE">
              <option value="ACTIVE">Actif</option>
              <option value="BETA">Bêta</option>
              <option value="COMING_SOON">Bientôt disponible</option>
              <option value="PRIVATE">Privé</option>
              <option value="DISABLED">Désactivé</option>
            </select>
          </Field>
          <Field label="Ordre">
            <Input name="order" type="number" defaultValue={0} />
          </Field>
          <label className="radio">
            <input type="checkbox" name="publicPageEnabled" />
            Page publique activée
          </label>
          <div />
          <Button type="submit" variant="primary">
            Publier
          </Button>
        </form>
      </Card>
    </div>
  );
}


export const dynamic = "force-dynamic";
