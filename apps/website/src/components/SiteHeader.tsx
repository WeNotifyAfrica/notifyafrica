import { Nav, NavLink, Button } from "@notifyafrica/ui";
import { consoleAuthUrl } from "@/lib/env";

/**
 * Navigation entries are seeded from Admin config (website.navigation),
 * per 01_Specifications_Website §4 — this shell renders whatever the Config
 * Client resolves; it doesn't hardcode the menu itself beyond the brand
 * mark and the two auth CTAs, which always target the Console
 * (00_Contexte_Global §6, 04_Prompt §9).
 */
export function SiteHeader() {
  return (
    <Nav brand="NotifyAfrica">
      <NavLink href="/produits">Produits</NavLink>
      <NavLink href="/tarifs">Tarifs</NavLink>
      <a href={consoleAuthUrl("login", { source: "website-nav" })}>
        <Button variant="ghost">Se connecter</Button>
      </a>
      <a href={consoleAuthUrl("register", { source: "website-nav" })}>
        <Button variant="primary">Créer un compte</Button>
      </a>
    </Nav>
  );
}
