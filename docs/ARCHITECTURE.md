# NotifyAfrica — Architecture (Phase A: Foundation)

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

## What's built vs. what's next

Built (Phase A slice, per 04_Prompt §25-27):
- Monorepo, pnpm + Turborepo, shared packages.
- Nocturne design system wired into all three frontends (dark for
  Console/Admin, light override for Website).
- Prisma schema covering Phase A entities plus schema-only stubs for
  Wallet/Ledger/Transaction/Quote/Provider/Route (no engine logic yet —
  04_Prompt §16 "prepare the models").
- Config Registry + resolver + seed + idempotent Admin-triggered import.
- Catalog + minimal Pricing Engine (base price / tier / provider-cost+markup;
  discounts/taxes wired as empty arrays, pending Discount Engine).
- Console register/login → `USER_REGISTERED` → Admin notification.
- Admin: seed import trigger, catalog publish form, pricing rule publish form,
  notification center list.
- Website: catalog + SMS tarifs pages reading straight from the Core API
  (no hardcoded price, per 04_Prompt §5).
- docker-compose (dev deps + full stack), per-app Dockerfiles, Caddy proxy.
- CI/CD (`.github/workflows/deploy.yml`): push to `main` builds and pushes
  images to GHCR, then deploys to a VPS over SSH — see `docs/DEPLOYMENT.md`
  for the one-time server setup this depends on. Not yet exercised against a
  real server in this session (no VPS access here) — only the compose/CI
  file syntax and the Dockerfile logic have been validated locally.

Not built yet (tracked so it isn't silently dropped):
- The other 23 design lots (Campaigns, OTP, WhatsApp, Email, Developers,
  Billing/Wallet UI, Team, Settings, Support, and all Back-office lots
  20-25) — Phase B onward per 04_Prompt §3.
- Discount Engine, tax rules, Quote workflow logic.
- Wallet ledger engine (estimate → hold → capture/release), real provider
  adapters (SMPP/Meta WhatsApp/Mobile Money) — no sandbox credentials yet
  (design handoff README §9 point 4).
- Cross-app cache invalidation on publish (Website currently always fetches
  `no-store`, so it's correct but not optimized — 01_Specifications_Website §21).
- Lots 26/27 (not designed yet) — see `docs/DECISIONS.md`.
