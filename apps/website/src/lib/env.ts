/**
 * Every URL the Website links out to is an env var (04_Prompt §8) — never
 * a literal domain in a component.
 */
export const env = {
  publicSiteUrl: process.env.PUBLIC_SITE_URL ?? "http://localhost:3000",
  consoleUrl: process.env.CONSOLE_URL ?? "http://localhost:3001",
  coreApiUrl: process.env.CORE_API_URL ?? "http://localhost:3010",
  docsUrl: process.env.DOCS_URL ?? "http://localhost:3000/docs",
  statusUrl: process.env.STATUS_URL ?? "http://localhost:3000/status",
  contactEmail: process.env.CONTACT_EMAIL ?? "contact@notifyafrica.com",
};

/** Builds a Console signup/login link, preserving campaign attribution
 * (00_Contexte_Global §6, 01_Specifications_Website §5). */
export function consoleAuthUrl(
  action: "register" | "login",
  context: { source?: string; product?: string; campaign?: string } = {},
) {
  const url = new URL(`${env.consoleUrl}/${action}`);
  if (context.source) url.searchParams.set("source", context.source);
  if (context.product) url.searchParams.set("product", context.product);
  if (context.campaign) url.searchParams.set("campaign", context.campaign);
  return url.toString();
}

/** Resolves a seeded CTA's abstract `target` (e.g. "register", "quote")
 * into a real href — keeps the seed content provider-agnostic instead of
 * baking a Console/mailto URL into packages/config-seed.
 *
 * "quote" goes to Console registration rather than a mailto: link — the
 * Console has a real Quotes page (03_Specifications_Console §19-20) that
 * submits a `QUOTE_REQUESTED` request Admin can see and act on
 * (02_Specifications_Backoffice §14), so an anonymous visitor should land
 * in that flow (register first, per the "rediriger vers Console pour les
 * utilisateurs authentifiés" option in 01_Specifications_Website §15)
 * rather than a dead-end email. "contact" stays a mailto: — it's for
 * reaching a human, not for a priced, trackable quote request. */
export function ctaHref(target: string, source: string): string {
  switch (target) {
    case "register":
      return consoleAuthUrl("register", { source });
    case "login":
      return consoleAuthUrl("login", { source });
    case "quote":
      return consoleAuthUrl("register", { source, campaign: "quote" });
    case "contact":
    default:
      return `mailto:${env.contactEmail}`;
  }
}
