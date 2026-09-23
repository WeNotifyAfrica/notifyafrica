"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@notifyafrica/ui";
import { consoleAuthUrl } from "@/lib/env";
import type { NavItem } from "@notifyafrica/types";

/**
 * Nav entries come from the resolved `website.navigation` config
 * (01_Specifications_Website §4) — this component only owns the brand mark
 * and the two auth CTAs, which always target the Console
 * (00_Contexte_Global §6, 04_Prompt §9).
 */
export function SiteHeader({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <div
      className="nav"
      style={{
        maxWidth: 1180,
        width: "100%",
        margin: "0 auto",
        padding: "var(--space-6) var(--space-8)",
        gap: "var(--space-6)",
        flexWrap: "wrap",
      }}
    >
      <a href="/" className="nav-brand" style={{ display: "flex", alignItems: "center", marginRight: "auto" }}>
        <Image
          src="/notifyafrica-logo-lockup.png"
          alt="notifyAfrica"
          width={140}
          height={38}
          style={{ height: 38, width: "auto", borderRadius: "var(--radius-md)" }}
          priority
        />
      </a>
      {items
        .filter((item) => item.enabled)
        .sort((a, b) => a.order - b.order)
        .map((item) => (
          <a
            key={item.key}
            href={item.href}
            style={{ color: pathname === item.href ? "var(--color-accent)" : "inherit" }}
          >
            {item.label}
          </a>
        ))}
      <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
        <a href={consoleAuthUrl("login", { source: "website-nav" })}>
          <Button variant="secondary">Se connecter</Button>
        </a>
        <a href={consoleAuthUrl("register", { source: "website-nav" })}>
          <Button variant="primary">Créer un compte</Button>
        </a>
      </div>
    </div>
  );
}
