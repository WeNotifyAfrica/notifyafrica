# Decisions log

Per `04_Prompt §28`: minor ambiguities get a decision consistent with the specs,
documented here, instead of blocking implementation. Per the design handoff
README §7: open "N · À valider" questions are not resolved — the recommended
default is implemented behind a flag/parameter, and listed here.

## Resolved implementation decisions (this session)

- **Auth session model**: JWT (`jose`) issued by the Core API, held as a
  per-app httpOnly cookie, forwarded as `Bearer` — not a literal Auth.js
  cookie-session install, because Website/Console/Admin are separate
  deployables on separate domains. See `docs/ARCHITECTURE.md`. `bcryptjs` +
  `jose` are the accelerating libraries; the RBAC/org model on top is custom,
  as intended.
- **Design system delivery**: the Nocturne CSS from the handoff
  (`design_handoff_notifyafrica/designs/_ds/.../styles.css`) is reused
  verbatim as `packages/design-system/src/nocturne.css` — not reimplemented
  as a Tailwind theme. `packages/ui` React components map 1:1 onto its
  classes (`.btn`, `.card`, `.tag`, ...). This matches the handoff's own
  "reuse as source of truth" instruction (§2) and avoids a second token
  system that could drift from it.
- **Website light theme**: scoped via `[data-theme="website-light"]`
  overriding `--color-bg/--color-surface/--color-text/--color-divider` only;
  accent stays identical to Console/Admin, per handoff §3.
- **Dev super-admin**: `apps/core-api/prisma/seed.ts` creates one internal
  user (`ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`, defaults
  `admin@notifyafrica.dev` / `ChangeMe123!`) because internal accounts have
  no self-registration by design. **Dev-only** — do not reuse this path for
  staging/production provisioning.
- **No cross-app cache invalidation yet**: `packages/api-client` always
  fetches the Core API with `cache: "no-store"`, so a published change is
  visible immediately without a revalidation webhook. Correct for Phase A;
  revisit with ISR + on-publish revalidation once traffic makes `no-store`
  costly (01_Specifications_Website §21).

## Lots 26 & 27 — not designed (design handoff §8)

No UI was built for these; only the consigne from the handoff was followed
(routes/models later, no invented UI). Not yet created in this pass at all —
flagged here so they aren't silently forgotten for the next session:
- Lot 26 (Conformité & modération): sender-ID/template review, STOP lists,
  content filtering, abuse/suspension, data retention.
- Lot 27 (Administration plateforme): visible margins (cost vs. price),
  **internal RBAC role set** (Ops/Commercial/Finance/Support/Conformité/
  Direction — the Prisma `InternalRole` enum currently only has
  `SUPER_ADMIN`/`STAFF` as a placeholder), global audit UI, system settings
  (FX rates, countries, feature flags, system email templates).

## Open product questions (design handoff §8, "N · À valider") — not decided

Implement the stated default behind a flag; do not hardcode a resolution:
- Remises cumulables ou non (default assumed: **not stackable** — see
  `DiscountRule.stackable` default `false`).
- Palier par tranche ou palier "au volume total" for SMS pricing (current
  `PricingRule.volumeMin/volumeMax` model assumes tier-by-total, matching
  the seed; per-bracket accumulation is a Phase B decision).
- SSO SAML/OIDC for Console (not started).
- KYC interne ou prestataire externe (lot 24) — not started.
- Frais de paiement absorbés ou répercutés au client — not started.
- Intégration CRM externe pour le suivi commercial des inscriptions — not
  started; `NotificationRule` gives a generic hook (email channel) that a
  CRM webhook channel could extend later without a schema change.
- Référentiel comptable SYSCOHADA (lot 25 Finance) — not started.
- Taux de taxe (lot 25) — explicitly flagged in the handoff as needing
  validation by a tax advisor; `PricingEstimateResult.taxes` is wired as an
  empty array pending that.
