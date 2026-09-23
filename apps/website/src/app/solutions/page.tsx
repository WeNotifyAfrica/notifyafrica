import { coreApi } from "@/lib/api";
import { ctaHref } from "@/lib/env";
import { Button, Card } from "@notifyafrica/ui";
import type { WebsiteContent } from "@notifyafrica/types";

export const metadata = {
  title: "Solutions — NotifyAfrica",
  description: "Les mêmes canaux, configurés différemment selon votre métier.",
};

export default async function SolutionsPage() {
  const content = await coreApi.getConfig<WebsiteContent>("website.content");
  const solutions = content.value?.solutions ?? [];

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "calc(var(--space-8) * 1.5) var(--space-8)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "calc(var(--space-8) * 1.5)" }}>
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", alignItems: "flex-start" }}>
          <h6 style={{ color: "var(--color-accent)" }}>Solutions</h6>
          <h1 style={{ margin: 0, maxWidth: "24ch" }}>Par secteur, par besoin</h1>
          <p className="text-muted" style={{ maxWidth: "62ch", margin: 0 }}>
            Les mêmes canaux, configurés différemment selon votre métier : volumes, exigences de
            sécurité, horaires d&apos;envoi et contraintes réglementaires.
          </p>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: "var(--space-4)" }}>
          {solutions.map((s) => (
            <Card key={s.title} elevation="sm" style={{ gap: "var(--space-3)" }}>
              <div className="card-title" style={{ fontSize: 16 }}>
                {s.title}
              </div>
              <p className="card-body">{s.desc}</p>
            </Card>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "var(--space-4)" }}>
          <Card elevation="sm">
            <div className="card-kicker">Pour les équipes métier</div>
            <div className="card-title">Envoyer sans écrire une ligne de code</div>
            <p className="card-body">
              Importez vos contacts, choisissez un modèle, vérifiez le coût, envoyez. Le rapport de
              campagne est disponible immédiatement.
            </p>
          </Card>
          <Card elevation="sm">
            <div className="card-kicker">Pour les équipes techniques</div>
            <div className="card-title">Intégrer en quelques heures</div>
            <p className="card-body">
              Une interface de programmation unique pour les quatre canaux, un environnement de test
              gratuit, des notifications de statut en temps réel.
            </p>
            <a href="/developpeurs" style={{ alignSelf: "flex-start" }}>
              <Button variant="ghost">Espace développeurs →</Button>
            </a>
          </Card>
          <Card elevation="sm">
            <div className="card-kicker">Pour la direction</div>
            <div className="card-title">Maîtriser la dépense</div>
            <p className="card-body">
              Compte prépayé : impossible de dépasser votre solde. Coût affiché avant chaque envoi,
              suivi de la consommation par projet et par canal.
            </p>
          </Card>
        </section>

        <section className="card elev-lg" style={{ alignItems: "flex-start", gap: "var(--space-4)", padding: "calc(var(--space-8) * 1.5)" }}>
          <h2 style={{ margin: 0, maxWidth: "26ch" }}>Un besoin spécifique à votre secteur ?</h2>
          <p className="text-muted" style={{ margin: 0, maxWidth: "52ch" }}>
            Décrivez votre cas d&apos;usage, nous revenons vers vous avec une proposition chiffrée.
          </p>
          <a href={ctaHref("quote", "solutions")}>
            <Button variant="primary">Demander un devis</Button>
          </a>
        </section>
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
