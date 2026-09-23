import { coreApi } from "@/lib/api";
import { ctaHref } from "@/lib/env";
import { Button, Card } from "@notifyafrica/ui";
import type { WebsiteContent } from "@notifyafrica/types";

export const metadata = {
  title: "Développeurs — NotifyAfrica",
  description: "Une intégration, quatre canaux. SMS, OTP, WhatsApp et Email sous une seule API.",
};

const CODE_EXAMPLE = `POST /v1/messages

{
  "channel": "sms",
  "to": "+228 90 00 00 00",
  "sender_id": "MABANQUE",
  "body": "Votre code est 4821"
}

Réponse
{
  "id": "msg_8f21c",
  "status": "en file",
  "price": { "unit_price": "<résolu par le moteur de prix>", "currency": "XOF" }
}`;

export default async function DevelopersPage() {
  const content = await coreApi.getConfig<WebsiteContent>("website.content");
  const stats = content.value?.developerStats ?? [];

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "calc(var(--space-8) * 1.5) var(--space-8)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "calc(var(--space-8) * 1.5)" }}>
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", alignItems: "flex-start" }}>
          <h6 style={{ color: "var(--color-accent)" }}>Développeurs</h6>
          <h1 style={{ margin: 0, maxWidth: "24ch" }}>Une intégration, quatre canaux</h1>
          <p className="text-muted" style={{ maxWidth: "62ch", margin: 0 }}>
            La même interface de programmation pour le SMS, l&apos;OTP, WhatsApp et l&apos;Email.
            Environnement de test gratuit, clés séparées test et production, notifications de statut
            signées.
          </p>
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <a href="/docs">
              <Button variant="primary">Lire la documentation</Button>
            </a>
            <a href={ctaHref("register", "developers")}>
              <Button variant="secondary">Créer une clé de test</Button>
            </a>
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "var(--space-8)", alignItems: "start" }}>
          <div className="card elev-md" style={{ gap: 0, padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-3) var(--space-4)" }}>
              <span className="tag tag-neutral">Envoyer un SMS</span>
              <span className="tag tag-outline" style={{ marginLeft: "auto" }}>
                Exemple
              </span>
            </div>
            <pre
              style={{
                margin: 0,
                padding: "var(--space-6)",
                fontSize: 12.5,
                lineHeight: 1.85,
                color: "var(--color-neutral-700)",
                background: "var(--color-neutral-100)",
                overflow: "auto",
              }}
            >
              {CODE_EXAMPLE}
            </pre>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <Card elevation="sm">
              <div className="card-title" style={{ fontSize: 15 }}>
                Environnement de test
              </div>
              <p className="card-body">
                Mêmes réponses qu&apos;en production, sans coût et sans envoi réel. 100 messages de
                test offerts.
              </p>
            </Card>
            <Card elevation="sm">
              <div className="card-title" style={{ fontSize: 15 }}>
                Notifications de statut
              </div>
              <p className="card-body">
                Recevez chaque changement de statut sur votre serveur, signé et réessayé en cas
                d&apos;échec.
              </p>
            </Card>
            <Card elevation="sm">
              <div className="card-title" style={{ fontSize: 15 }}>
                Bibliothèques
              </div>
              <p className="card-body">
                Node.js, PHP, Python, Java, et une collection prête à l&apos;emploi pour vos tests
                manuels.
              </p>
            </Card>
            <Card elevation="sm">
              <div className="card-title" style={{ fontSize: 15 }}>
                Sécurité des envois
              </div>
              <p className="card-body">
                Chaque envoi peut porter une référence unique : en cas de nouvelle tentative, le
                message n&apos;est jamais envoyé deux fois.
              </p>
            </Card>
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "var(--space-4)" }}>
          {stats.map((s) => (
            <Card key={s.kicker}>
              <div className="card-kicker">{s.kicker}</div>
              <div className="num card-title" style={{ fontSize: 22 }}>
                {s.value}
              </div>
              <p className="card-body">{s.desc}</p>
            </Card>
          ))}
          <Card>
            <div className="card-kicker">Page de statut</div>
            <div className="card-title" style={{ fontSize: 18 }}>
              Publique
            </div>
            <p className="card-body">incidents et maintenances en temps réel</p>
          </Card>
        </section>
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
