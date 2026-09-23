import Image from "next/image";
import { env } from "@/lib/env";

/** Static site structure (internal routes + one mailto) — not seeded, since
 * unlike the marketing copy elsewhere this is navigation chrome, not
 * business content (04_Prompt §6 targets business/commercial data). */
export function SiteFooter() {
  return (
    <>
      <hr className="hr" />
      <footer
        style={{
          maxWidth: 1180,
          width: "100%",
          margin: "0 auto",
          padding: "var(--space-6) var(--space-8) calc(var(--space-8) * 2)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "var(--space-6)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <Image
            src="/notifyafrica-logo-lockup.png"
            alt="notifyAfrica"
            width={120}
            height={32}
            style={{ height: 32, width: "auto", borderRadius: "var(--radius-md)" }}
          />
          <span className="text-muted" style={{ fontSize: 12 }}>
            Plateforme de communication pour l&apos;Afrique
          </span>
        </div>
        <FooterColumn
          title="Produits"
          links={[
            { label: "SMS", href: "/produits" },
            { label: "Codes OTP", href: "/produits" },
            { label: "WhatsApp", href: "/produits" },
            { label: "Email", href: "/produits" },
            { label: "Tarifs", href: "/tarifs" },
          ]}
        />
        <FooterColumn
          title="Ressources"
          links={[
            { label: "Documentation", href: "/docs" },
            { label: "Espace développeurs", href: "/developpeurs" },
            { label: "Statut du service", href: env.statusUrl },
          ]}
        />
        <FooterColumn
          title="Entreprise"
          links={[
            { label: "Contact", href: `mailto:${env.contactEmail}` },
            { label: "Devis", href: `mailto:${env.contactEmail}?subject=Demande de devis` },
          ]}
        />
        <FooterColumn
          title="Légal"
          links={[
            { label: "CGU", href: "#" },
            { label: "Confidentialité", href: "#" },
            { label: "Mentions tarifaires", href: "#" },
          ]}
        />
      </footer>
    </>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: 13 }}>
      <span className="text-muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {title}
      </span>
      {links.map((link) => (
        <a key={link.label} href={link.href}>
          {link.label}
        </a>
      ))}
    </div>
  );
}
