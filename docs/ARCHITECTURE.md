# NotifyAfrica — Architecture (Phases A-D: Foundation through Wallet/SMS)

Source documents: `00_Contexte_Global_NotifyAfrica.md` through `03_Specifications_Console_NotifyAfrica.md`,
`04_Prompt_Claude_Initialisation_NotifyAfrica.md`, and `design_handoff_notifyafrica/README.md` (25/27 design lots).

## Monorepo layout

```text
apps/
  website/    Next.js, public site (light theme override of Nocturne)
  console/    Next.js, customer app (dark Nocturne)
  admin/      Next.js, internal backoffice (dark Nocturne)
  core-api/   Next.js Route Handlers only — no pages beyond a health landing
  worker/     BullMQ consumer skeleton (campaigns / provider callbacks)
packages/
  design-system/  Nocturne tokens/CSS (copied verbatim from the design handoff,
                   source of truth) + a light-theme override for the website
                   + a TS mirror of the tokens for non-CSS contexts
  ui/              React components mapped 1:1 onto the Nocturne CSS classes
  types/           Shared TS interfaces (config, catalog, pricing, account, events)
  validation/      zod schemas for the API contracts
  config-client/   The one place every frontend resolves config through
  config-seed/     Versioned seed data (SEED_VERSION), read only by the Core API
  auth/            Password hashing, JWT session sign/verify, Console RBAC
  api-client/      Typed fetch wrapper around the Core API
  observability/   Structured logger
infra/
  docker/     docker-compose.dev.yml (Postgres+Redis for local dev),
              docker-compose.yml (full stack, build-from-source),
              docker-compose.prod.yml (full stack, pulls prebuilt GHCR images —
              the one actually deployed to the VPS, see docs/DEPLOYMENT.md)
  proxy/      Caddyfile, domains from env, automatic HTTPS via Let's Encrypt
.github/workflows/
  deploy.yml  Push to main -> build+push images to GHCR -> SSH-deploy to the VPS
docs/
  ARCHITECTURE.md, DECISIONS.md, DEPLOYMENT.md (this trio)
```

## The fallback chain (04_Prompt §6)

`Published Admin Config -> Scoped Override -> Design Seed -> Safe Empty Fallback`

Implemented once, in `apps/core-api/src/lib/config-resolver.ts` (generic keys),
`catalog.ts` (products) and `pricing-engine.ts` (pricing). Every response carries
a `source: "admin" | "seed" | "fallback"` field for diagnostics only — no frontend
renders it, and no frontend implements its own fallback (01_Specifications_Website §3,
03_Specifications_Console §33).

`packages/config-seed` holds the actual seed values (SMS tiers, WhatsApp markup,
initial catalog, navigation, homepage sections, countries/currencies), sourced from
`00_Contexte_Global §12` and the design handoff fixtures. Nothing outside
`apps/core-api` imports it.

## Auth across three domains

Website, Console and Admin are meant to deploy on different domains
(04_Prompt §8), so a single shared session cookie (the default Auth.js/NextAuth
setup) doesn't work — a cookie set on one domain is invisible to the others.
Instead:

1. The Core API is the only place that touches `User`/`Membership`/password
   hashes (`packages/auth`: bcrypt + `jose` JWT, the same JWT library
   Auth.js uses internally).
2. `POST /api/auth/register` and `/login` validate credentials and return a
   signed JWT.
3. Console/Admin each have their **own** Server Action that calls the Core
   API, then sets that JWT as an httpOnly cookie scoped to their own domain
   (`na_session` / `na_admin_session`).
4. Subsequent Core API calls from Console/Admin forward that JWT as a
   `Bearer` header.

This is a documented deviation from a literal Auth.js install (see
`docs/DECISIONS.md`), consistent with 04_Prompt §28 ("ambiguïté mineure →
décision cohérente, documentée").

## Wallet ledger and SMS send (Phase D)

`apps/core-api/src/lib/wallet.ts` implements the ledger primitives from
04_Prompt §15 as DB-transactional pairs (balance mutation + `LedgerEntry` row
in the same commit): `creditWallet`, `holdFunds`, `captureFunds`,
`releaseFunds`. A wallet is auto-provisioned at registration
(`ensureWallet`, 0 balance, org's currency).

`POST /api/sms/send` is the one place that exercises the mandatory sequence
end to end: `estimatePricing` (1 unit) → `holdFunds` (402 if insufficient) →
`sendViaMockProvider` (`apps/core-api/src/lib/providers/mock-sms.ts` — the
one file a real SMPP/aggregator adapter replaces later) → `captureFunds` on
success / `releaseFunds` on failure → a `Transaction` row (frozen
`pricingSnapshot`) + a `Message` row, plus a `FIRST_MESSAGE_SENT` event on an
org's first send. Amounts are converted from the Pricing Engine's decimal
output to integer minor units via `toMinorUnits` (rounds to the currency's
seeded `decimals`, so XOF — 0 decimals — rounds to the nearest whole unit).

Since no real payment gateway is wired, Admin's `POST
/api/admin/wallet/credit` (audited, reason required) stands in for a topup
— see `apps/admin/src/app/(app)/dashboard/organizations/page.tsx`.

## What's built vs. what's next

Built:
- **Phase A** — Monorepo, pnpm + Turborepo, shared packages, Nocturne design
  system wired into all three frontends, Prisma schema, Config Registry +
  resolver + seed + idempotent Admin import, Catalog + minimal Pricing
  Engine, Console register/login → `USER_REGISTERED` → Admin notification,
  Website catalog/tarifs pages.
- **Phase B** — Admin catalog publish/status form, Admin pricing rule
  publish (versioned, auto-archives the overlapping tier), Console Tarifs
  page (`/dashboard/pricing`) reading the same Catalog/Pricing API as
  Website and Admin, so a repricing shows up in all three at once.
- **Phase C** — Organization + default Project created at registration,
  wallet auto-provisioned, Admin Organizations list (Customer 360 slice:
  identity, wallet, member/project counts) and Admin Users list.
- **Phase D** — Wallet ledger engine (see above), Console SMS send
  (`/dashboard/sms`, estimate → hold → capture, wallet-gated) and history,
  Console Facturation page (`/dashboard/billing`), Admin manual wallet
  credit, Admin Transactions list.
- Infra: docker-compose (dev deps + full stack), per-app Dockerfiles, Caddy
  proxy, CI/CD (`.github/workflows/deploy.yml`) — push to `main` builds and
  pushes images to GHCR, then deploys to a VPS over SSH, see
  `docs/DEPLOYMENT.md`. Not yet exercised against a real server (no VPS
  access in this session) — only compose/CI YAML and the Dockerfile logic
  have been validated locally.

Verified end-to-end against local Postgres/Redis (register → 0 balance →
send blocked with `insufficient_balance` → Admin credits wallet → send
succeeds → wallet debited → Admin sees the Transaction, the credited
Organization, and both `USER_REGISTERED`/`FIRST_MESSAGE_SENT` notifications).

Not built yet (tracked so it isn't silently dropped):
- The other 23 design lots (Campaigns, OTP, WhatsApp, Email, Developers,
  Billing/Wallet UI beyond the balance view, Team, Settings, Support, and
  all Back-office lots 20-25).
- Bulk SMS / Campaigns (only single-message send exists), Discount Engine,
  tax rules, Quote workflow logic.
- Real provider adapters (SMPP/Meta WhatsApp/Mobile Money) — no sandbox
  credentials yet (design handoff README §9 point 4); `mock-sms.ts` is the
  swap point.
- Cross-app cache invalidation on publish (Website currently always fetches
  `no-store`, so it's correct but not optimized — 01_Specifications_Website §21).
- Lots 26/27 (not designed yet) — see `docs/DECISIONS.md`.
