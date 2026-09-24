/** Design handoff Lot 7's tab bar, implemented as real sub-routes per the
 * handoff's own convention (README §3: "les onglets deviennent des
 * sous-routes"). Bulk send and scheduled sends aren't built (see
 * docs/ARCHITECTURE.md) — bulk mail already exists as Campaigns
 * (product=SMS), so this links there instead of duplicating the send
 * engine. */
export function SmsSubNav({ active }: { active: "send" | "senders" | "templates" }) {
  const items: { href: string; label: string; key: typeof active }[] = [
    { href: "/dashboard/sms", label: "Envoyer / Historique", key: "send" },
    { href: "/dashboard/sms/senders", label: "Noms d'expéditeur", key: "senders" },
    { href: "/dashboard/sms/templates", label: "Modèles", key: "templates" },
  ];
  return (
    <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="btn"
          style={{
            color: item.key === active ? "var(--color-accent)" : "var(--color-text)",
            borderColor: item.key === active ? "var(--color-accent)" : "var(--color-divider)",
            background: item.key === active ? "color-mix(in srgb, var(--color-accent) 12%, transparent)" : "transparent",
          }}
        >
          {item.label}
        </a>
      ))}
      <a href="/dashboard/campaigns" className="btn" style={{ color: "var(--color-text)", borderColor: "var(--color-divider)" }}>
        Envoi en masse → Campagnes
      </a>
    </div>
  );
}
