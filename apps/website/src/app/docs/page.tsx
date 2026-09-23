import { coreApi } from "@/lib/api";
import { env } from "@/lib/env";
import { Button, Card, Field, Input } from "@notifyafrica/ui";
import type { WebsiteContent } from "@notifyafrica/types";

export const metadata = {
  title: "Documentation — NotifyAfrica",
  description: "Guides pas à pas et référence complète pour intégrer NotifyAfrica.",
};

export default async function DocsPage() {
  const content = await coreApi.getConfig<WebsiteContent>("website.content");
  const sections = content.value?.docsSections ?? [];

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "calc(var(--space-8) * 1.5) var(--space-8)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "calc(var(--space-8) * 1.5)" }}>
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", alignItems: "flex-start" }}>
          <h6 style={{ color: "var(--color-accent)" }}>Documentation</h6>
          <h1 style={{ margin: 0, maxWidth: "24ch" }}>Tout ce qu&apos;il faut pour démarrer</h1>
          <p className="text-muted" style={{ maxWidth: "62ch", margin: 0 }}>
            Guides pas à pas pour les équipes métier, référence complète pour les équipes techniques.
          </p>
          <Field label="Rechercher dans la documentation">
            <Input type="text" placeholder="ex. envoyer un SMS en masse" style={{ minWidth: 280, maxWidth: 420, width: "100%" }} />
          </Field>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "var(--space-4)" }}>
          {sections.map((d) => (
            <Card key={d.title} elevation="sm" style={{ gap: "var(--space-2)" }}>
              <div className="card-title" style={{ fontSize: 15 }}>
                {d.title}
              </div>
              <p className="card-body">{d.items}</p>
            </Card>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "var(--space-4)" }}>
          <Card elevation="sm">
            <div className="card-kicker">Guide</div>
            <div className="card-title">Envoyer votre première campagne</div>
            <p className="card-body">
              Préparer un fichier de contacts, choisir un modèle, vérifier le coût, planifier
              l&apos;envoi et lire le rapport.
            </p>
          </Card>
          <Card elevation="sm">
            <div className="card-kicker">Guide</div>
            <div className="card-title">Sécuriser vos connexions avec l&apos;OTP</div>
            <p className="card-body">
              Choisir une durée de validité, limiter les tentatives, gérer les renvois et mesurer le
              taux de vérification.
            </p>
          </Card>
          <Card elevation="sm">
            <div className="card-kicker">Aide</div>
            <div className="card-title">Une question sans réponse ?</div>
            <p className="card-body">Notre support répond en français, aux heures ouvrées d&apos;Afrique de l&apos;Ouest.</p>
            <a href={`mailto:${env.contactEmail}`} style={{ alignSelf: "flex-start" }}>
              <Button variant="primary">Contacter le support</Button>
            </a>
          </Card>
        </section>
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
