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
  worker/     BullMQ consumer — campaigns have a real processor now, provider
              callbacks still a logging-only placeholder (no real provider yet)
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
  domain/          Prisma client + wallet ledger + mock provider adapters —
                    shared by Core API (HTTP) and Worker (background jobs) so
                    neither duplicates this; Core API's apps/core-api/src/lib/
                    {db,wallet,providers/*}.ts are thin re-exports of it
  queue/           BullMQ queue name constants, imported by both the Core API
                    producer and the Worker consumer so they can't drift
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

## Developers (API keys) and Team (invitations)

`apps/core-api/src/lib/api-keys.ts` generates `na_<env>_<hex>` keys; only
the SHA-256 digest is stored (`ApiKey.hashedKey`), the full value is
returned once from `POST /api/keys` and never again — Console's
`/dashboard/developers` page renders that one-time value with a Client
Component (`CreateApiKeyForm.tsx`, `useActionState`) instead of the usual
form-action-then-redirect pattern, specifically so the secret never touches
a URL. Creating or revoking a key requires the `apikey.manage` permission
(`packages/auth`'s `consoleRoleHasPermission`).

Team invitations follow the same "no email provider yet" pattern as the
Notification Engine: `POST /api/team/invitations` (requires `team.manage`)
creates an `Invitation` row with a random token and logs the intended email
instead of sending one. `GET /api/invitations/:token` is a public read (no
session) so Console's `/invite/[token]` page can show who's inviting the
visitor before they set a password; `POST /api/invitations/accept` creates
the `User` + `Membership` and returns a session token, refusing if an
account with that email already exists rather than silently merging.

## OTP (Lot 9)

Same estimate → hold → deliver → capture/release sequence as SMS send, on
the `OTP` catalog product (`apps/core-api/src/app/api/otp/generate/route.ts`).
Per-"app" configuration (`OtpConfig`: length, expiry, max attempts, resend
cooldown, channel, fallback channel, template with a `{code}` placeholder)
lives on the organization, not hardcoded — 03_Specifications_Console §15.
Only `hashOtpCode` output is persisted on `OtpCode`, never the plaintext
code; `POST /api/otp/verify` enforces expiry and `maxAttempts` server-side
("les limites viennent du backend"), flipping to `EXPIRED`/`FAILED` as
appropriate. Delivery goes through the same mock-channel pattern as SMS
(`apps/core-api/src/lib/providers/mock-otp.ts`) — logs `otp.intended_delivery`
with the rendered message instead of actually sending it, since no
SMS/Email/WhatsApp provider is wired yet.

Fixed along the way: `packages/observability`'s logger let a meta object's
own `message` key silently overwrite the log line's event-name `message` —
harmless until a caller's payload happened to have a `message` field of its
own (OTP's `{destination, channel, message}` did). The logger now applies
`level`/`message`/`time` after spreading `meta`, so a caller's data can never
clobber them; the OTP payload field was also renamed to `content` to avoid
the collision in the first place.

## Providers & Routing (Lot 20)

Configuration storage for `Operator`, `Provider`, `ProviderEndpoint` and
`Route` — Prisma models that existed since Phase A (04_Prompt §16 "prepare
the models") but had no CRUD until now. Admin's `/dashboard/providers`
declares operators, providers (name/type/country), their endpoints
(base URL, path, method, a declared `authType`, timeout), and routes
(product + country + operator → provider, priority, strategy). This is
still just an approved-destination catalog, not a live gateway
(04_Prompt §17: "ne crée pas un proxy arbitraire non sécurisé") — no code
path actually calls out to any of these endpoints yet, and `authType` is a
label, not a stored credential (a Credentials Vault, 02_Specifications
Backoffice §24, isn't built).

## Website design-fidelity pass (Lot 2)

Rebuilt against `design_handoff_notifyafrica/designs/NotifyAfrica - Site web
(présentation).dc.html`, the reference mockup for the public site, instead
of the placeholder pages Phase A shipped. Three things changed:

1. **Light-theme tokens were wrong.** `packages/design-system/src/
   website-light.css` only remapped background/text/divider and left the
   dark theme's lavender accent (`#9184d9`) untouched — it doesn't have
   enough contrast on white. The mockup's own `<style>` block reaccords the
   accent too (`#5d5294`, with `--color-accent-300: #423a6a` for large price
   numbers) plus lighter shadow tokens; the override now matches exactly.
2. **Nav/footer/pages rebuilt to the mockup's actual structure**: logo
   asset (`apps/website/public/notifyafrica-logo-lockup.png`), 5-item nav
   with active-page highlighting (`SiteHeader.tsx`, a Client Component for
   `usePathname()`), a real footer (`SiteFooter.tsx`), and all 6 routes the
   nav links to: `/` (hero, stats, products, how-it-works, use cases,
   pricing preview, trust cards, final CTA), `/produits`, `/tarifs`
   (product-tab switcher + country/currency filters + example invoice +
   payment methods), `/solutions`, `/developpeurs`, `/docs`.
3. **Every price is still live, nothing new got hardcoded.** The mockup's
   example data (hero preview card, product descriptions/feature chips,
   stats bar, how-it-works steps, use cases, solutions, trust cards, payment
   methods, docs sections) went into `packages/config-seed` as
   `seedWebsiteContent` (new `website.content` config key, same
   admin-config → seed → fallback resolution as everything else) — not into
   component constants. `CatalogProduct` gained two columns to support this
   without inventing local arrays: `features: String[]` and `billingUnit:
   String?` (migration `20260923063229_add_catalog_features_billing_unit`).
   The hero's illustrative "campaign in progress" card seeds only its
   recipient/delivered counts and balance label — its unit price and total
   are a live `estimatePricing` call, so that card can never show a stale
   price. The Tarifs page's example invoice is a live estimate too; its
   "TVA" line from the mockup was dropped rather than faked, since no tax
   engine exists yet (see "not built yet" below).

Not yet done on the Website: the remaining `01_Specifications_Website`
sections (testimonials, FAQ), a real Contact form (§14 — the "contact"
target still resolves to a `mailto:` link via `ctaHref()`; "quote" now goes
to Console registration instead, see Quotes below), SEO beyond per-page
title/description, a Status page, and cross-app cache invalidation (pages
still fetch `no-store`, correct but unoptimized).

## Quotes (closing the `quoteRequired` loop)

`estimatePricing` has returned `quoteRequired: true` above a product's top
volume tier since Phase A, and the Website's /tarifs shows "Sur devis" for
it — but nothing existed to actually request one. The `Quote` Prisma model
had sat unused since Phase A, exactly like `Provider`/`Route` before Lot 20.
Closed end-to-end:

- `POST /api/quotes` (Console org session) creates a `Quote`
  (`status: SUBMITTED`) and fires `QUOTE_REQUESTED`, same
  admin-notification pattern as `USER_REGISTERED`.
- Console `/dashboard/quotes`: request form + status/offer list.
- `POST /api/admin/quotes/:id/status` drives the workflow (Draft → Submitted
  → Under Review → Info Required → Offer Available → Accepted/Rejected/
  Expired, 03_Specifications_Console §20). Admin `/dashboard/quotes`: one
  card per quote with an inline status + offer + audited-reason form.
- **Accepting a quote with an offer converts it into an
  organization-scoped `PricingRule`** (`customerScope: ORGANIZATION`,
  `organizationId` set, `priority: 100`) — this is
  `00_Contexte_Global §11`'s documented priority order ("1. prix
  contractuel client; 2. prix spécifique organisation; ...") which the
  Pricing Engine's query never actually implemented until now (it didn't
  filter by `organizationId` at all — a real gap, not just an unbuilt
  feature). `estimatePricing` now matches organization-scoped rules
  alongside global ones, so the higher-priority contractual rule naturally
  wins the tier lookup for that org only.
- Website: `ctaHref("quote", …)` now routes to Console registration
  (carrying `campaign=quote`) instead of a dead-end mailto — there's a real
  destination for it now.

Verified end-to-end: requested a quote for 500,000 SMS (above the public
100,000 tier, so normally quote-required) → Admin saw the `QUOTE_REQUESTED`
notification and the quote in its list → accepted it with a 5.5 XOF/SMS
offer (below the public 6.8 XOF tier) → a `PricingRule` was created →
re-estimating for that org at 500,000 SMS now returns `unitPrice: 5.5,
quoteRequired: false`, at *any* volume for that org (confirmed at
quantity=100 too) — while an anonymous/other-org estimate at the same
500,000 quantity still correctly returns the public tier
(`unitPrice: 6.8, quoteRequired: true`). No cross-org leakage.

## Discount Engine (02_Specifications_Backoffice §13)

`DiscountRule` had sat unused since Phase A too — `estimatePricing` always
returned `discounts: []`, and the Tarifs page's example invoice already had
a "Remise" line waiting for a non-zero value. Wired up in
`apps/core-api/src/lib/discounts.ts` (`resolveDiscounts`), inserted into the
pricing pipeline between tier resolution and the final total, matching
design handoff invariant #1's order (base → tier → discount → markup →
tax) and its exclusivity rule ("remise exclusive, la priorité la plus haute
l'emporte"): the highest-priority matching rule wins alone unless it (and
whichever others) are marked `stackable`, in which case only the stackable
ones combine.

Found and fixed a real schema gap while wiring this: `DiscountRule.scope`
only covered `GLOBAL`/`COUNTRY`/`ORGANIZATION`/`PROJECT` (`ConfigScope`) —
but 02_Specifications_Backoffice §13 explicitly lists "produit" as a
discount scope, and there was no column for it. Added `productKey: String?`
as an orthogonal targeting dimension (same pattern as `PricingRule.
countryCode` sitting alongside `customerScope`/`organizationId`) rather than
overloading `ConfigScope` with a meaning it wasn't designed for
(migration `20260923071508_add_discount_rule_product_key`).

`FIXED_PRICE` is handled as a full override (sets the effective unit price
directly, not an amount subtracted from the subtotal) and is never combined
with other rules, matching "prix fixe" semantics. `PERCENT`/`FIXED_AMOUNT`/
`UNIT_DISCOUNT` compute a numeric amount, each capped at its own
`maxDiscount` if set. `PROMO`/`BONUS` are matched the same way as
`PERCENT`/`FIXED_AMOUNT` (scope-based, no code check) as a documented
simplification — a real promo-code redemption flow isn't built, so this
isn't silently skipped, just not code-gated yet. The SMS-send and
OTP-generate wallet debits needed zero changes to become discount-aware —
they already computed `amountMinor` from `estimate.total`, not from
`unitPrice * quantity` by hand.

Verified end-to-end: a 10% global PERCENT discount cut a 65,000 XOF
subtotal to 58,500 — then a higher-priority, non-stackable 5,000 XOF
FIXED_AMOUNT discount replaced it entirely (exclusivity confirmed: not both
applied) — then a still-higher-priority *stackable* 1,000 XOF discount
applied alone too, since the only other active rules weren't stackable —
then a FIXED_PRICE override at 5.0 XOF/SMS took over unconditionally — and
a fifth rule at the highest priority of all (999) but with `endAt` in the
past was correctly ignored by the date-window filter despite outranking
everything else. Admin `/dashboard/discounts` list/create form confirmed
working; all five apps (including the worker, after the `tsconfig.json`
fix below) build and typecheck clean.

## Fixed: worker `tsconfig.json` showing a false error in editors

`moduleResolution: "Node"` compiles fine under `tsc` (TypeScript keeps it
as a legacy alias), but the community JSON schema editors use to validate
`tsconfig.json` (schemastore.org) deprecated that exact string in favor of
`"Node10"` — same behavior, different accepted spelling — so VS Code showed
a schema-validation error on a file that had zero real compiler errors.
Switched to `"Node10"`.

## Facturation & Moyens de paiement (Lots 15, 23)

Admin could always credit a wallet manually, but nothing let a customer
recharge their own — `PaymentMethod` didn't even exist as a model yet.
Closed end-to-end:

- New `PaymentMethod` model (`family`: MOBILE_MONEY/CARD/BANK_TRANSFER/
  INVOICE, per-country eligibility, min/max amount, fee %, `instant`
  flag) — migration `20260923082437_add_payment_methods`.
- `GET /api/payment-methods` (Console session): methods eligible for the
  org's country (03_Specifications_Console §9: "selon pays et
  organisation").
- `POST /api/wallet/topup` (Console session): validates eligibility/min/
  max, runs a mock payment adapter
  (`apps/core-api/src/lib/providers/mock-payment.ts`, same pattern as
  mock-sms/mock-otp), creates a `Transaction` (`type: WALLET_TOPUP`).
  **Instant** methods (Mobile Money, card) credit the wallet immediately.
  **Non-instant** ones (bank transfer, monthly invoicing — "24 à 48 h" per
  the reference mockup) leave the transaction at `PENDING` and do *not*
  touch the wallet yet.
- `POST /api/admin/transactions/:id/confirm`: the step that actually
  credits a non-instant topup once funds are seen — refuses anything not
  `WALLET_TOPUP`+`PENDING`, so a repeat confirm can't double-credit.
- Console `/dashboard/billing`: balance + statement (now backed by a real
  `GET /api/wallet/transactions`, Console's own view rather than Admin's)
  + a recharge form.
- Admin `/dashboard/payment-methods`: catalog CRUD. Admin
  `/dashboard/transactions`: a "Confirmer" action appears next to any
  `PENDING` topup.

Verified end-to-end: registered a Togo org, wallet at 0 → instant Mobile
Money recharge of 10,000 XOF credited immediately → non-instant bank
transfer of 600,000 XOF (above its 500,000 minimum) created a `PENDING`
transaction and left the wallet untouched at 10,000 → a 100,000 XOF bank
transfer attempt was correctly rejected as below the minimum
(`amount_below_minimum`) → Admin confirmed the pending transfer → wallet
became 610,000 → **confirming the same transaction a second time correctly
returned 409 and did not double-credit the wallet**. All apps build and
typecheck clean.

## Campaigns (Lot 8) — and the Worker finally does real work

The Worker has existed since Phase A as a connection/logging skeleton with
no processor. Campaigns are the first thing that actually needs it: a
bulk send must not block the HTTP request that launches it (04_Prompt §21),
so this is the first feature genuinely split across two processes.

**Shared domain logic first.** The Worker's campaign processor needs the
same Prisma client and wallet ledger functions (`holdFunds`/`captureFunds`/
`releaseFunds`) that Core API's route handlers already had in
`apps/core-api/src/lib/{db,wallet}.ts` — duplicating that logic in the
Worker would drift. Extracted into a new package, `packages/domain`
(`db.ts`, `wallet.ts`, and the three mock provider adapters), and turned
the original `apps/core-api/src/lib/*` files into thin re-exports so
**none of the ~20 files already importing `@/lib/db` or `@/lib/wallet` in
Core API needed to change**. Queue name constants moved the same way, into
`packages/queue`, so producer (Core API) and consumer (Worker) can never
drift on the string BullMQ builds Redis keys from.

One resolution gotcha: `packages/domain` first shipped with per-module
subpath exports (`@notifyafrica/domain/db`, `.../wallet`, ...), which broke
under the Worker's `moduleResolution: "Node10"` (a classic/CommonJS
resolution mode that doesn't understand package.json `"exports"` subpath
maps at all — that's a Node16/NodeNext/Bundler-only feature). Rather than
change the Worker's module settings (real risk to its `tsc`-then-`node`
production build, unlike Core API which runs through Next's bundler),
flattened `packages/domain` to a single entry point re-exporting
everything — the same pattern `@notifyafrica/observability` already used
successfully there.

**The flow** (03_Specifications_Console §12: Draft → Channel → Audience →
Content → Estimate → Schedule → Review → Reserve Funds → Run → Report):
- `POST /api/campaigns` creates a `DRAFT` campaign (name, content,
  destinations — one per line/comma in the Console form) — no pricing or
  funds touched yet.
- `POST /api/campaigns/:id/estimate` runs the same Pricing Engine single
  sends use, quantity = audience size, and stores the resolved
  unit price/total on the campaign.
- `POST /api/campaigns/:id/launch` holds funds for the *entire* estimated
  audience in one `holdFunds` call, creates a `PENDING` `Transaction`
  (`type: CAMPAIGN_SEND`), flips the campaign to `QUEUED`, enqueues a
  `notifyafrica-campaigns` job via `apps/core-api/src/lib/queue.ts`,
  and returns immediately.
- The Worker's `processCampaign` (`apps/worker/src/processors/campaign.ts`)
  picks up the job, sends each destination through the same mock SMS
  adapter single-send uses, creates one `Message` per destination
  (`campaignId` set), then trues up the wallet: captures the amount for
  what actually sent, releases whatever of the hold went unused, finalizes
  the `Transaction` (`CAPTURED`/`FAILED`), and sets the campaign to
  `COMPLETED`/`PARTIAL`/`FAILED` with `sentCount`/`failedCount`.
- `POST /api/campaigns/:id/cancel` releases the hold if still
  `DRAFT`/`SCHEDULED`/`QUEUED`. Cancelling mid-`RUNNING` isn't supported —
  the send loop doesn't poll for it — documented, not silently dropped.
- Console `/dashboard/campaigns` (list + create) and `/dashboard/campaigns/
  [id]` (estimate/launch/cancel buttons + live report once terminal).

A real bug surfaced during testing here, the same class as one already
fixed for Wallet/Transaction: `Campaign.heldAmountMinor` is a Postgres
`BigInt`, and `JSON.stringify` doesn't know how to serialize those —
every route returning a campaign 500'd until a `campaignJson` serializer
(mirroring `walletJson`/`transactionJson`) was applied everywhere a
campaign crosses the HTTP boundary.

Also cleaned up a benign but noisy build warning found along the way:
bullmq optionally imports `@valkey/valkey-glide` (an alternative Redis
client we don't use, we're on ioredis) — harmless at runtime, silenced via
a one-line webpack alias in `apps/core-api/next.config.mjs`.

Verified end-to-end against the real Worker process (not mocked): created
a 5-destination campaign, estimated it, launched it → funds held → **the
Worker received the BullMQ job, sent all 5 through the mock adapter,
created 5 `Message` rows with the right `campaignId`, captured the exact
spend, and marked the campaign `COMPLETED` — end to end in under 30ms**.
Re-ran with 3 destinations after the BigInt fix: launch now returns clean
JSON, `Transaction` finalized to `CAPTURED` at the exact captured amount,
wallet debited precisely (9,967 → 9,947), all 3 `Message` rows correctly
linked to the campaign. All five apps (Website, Console, Admin, Core API,
Worker) build and typecheck clean.

## What's built vs. what's next

Built:
- **Phase A** — Monorepo, pnpm + Turborepo, shared packages, Nocturne design
  system wired into all three frontends, Prisma schema, Config Registry +
  resolver + seed + idempotent Admin import, Catalog + minimal Pricing
  Engine, Console register/login → `USER_REGISTERED` → Admin notification.
- **Website** (Lot 2, design-fidelity pass) — all 6 pages the nav links to
  rebuilt against the reference mockup, correct light-theme tokens, seeded
  marketing content, zero hardcoded prices (see above for detail).
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
- **Developers / Team** (Lots 12, 16 partial) — API key create/list/revoke
  with one-time secret reveal; team member list, invite-by-email with a
  7-day token, public accept screen, revoke pending invitation.
- **OTP** (Lot 9 partial) — per-app config, generate (wallet-gated) and
  verify with server-enforced expiry/attempts, history log. Bulk/fallback
  channel logic and analytics aren't built.
- **Providers & Routing** (Lot 20 partial) — Admin CRUD for Operators,
  Providers, ProviderEndpoints, Routes. Configuration only, no live gateway
  or Credentials Vault yet.
- **Quotes** (Lots 14, 19-20, 22 partial) — Console request + list, Admin
  pipeline with status transitions, accepted offers become a binding
  organization-scoped pricing rule the engine actually honors (see above).
- **Discount Engine** (Lot 21 partial) — exclusive-by-default/opt-in-stacking
  rule resolution wired into the Pricing Engine, Admin CRUD, product-scoped
  targeting added to the schema (see above).
- **Facturation & Moyens de paiement** (Lots 15, 23 partial) — self-service
  recharge (instant + pending/confirm flows), Admin payment methods catalog
  and pending-transaction confirmation (see above).
- **Campaigns** (Lot 8) — Draft → Estimate → Reserve Funds → Run → Report,
  the Worker's first real job processor, shared `packages/domain`/
  `packages/queue` so Core API and Worker never drift on business logic or
  queue names (see above).
- Infra: docker-compose (dev deps + full stack), per-app Dockerfiles, Caddy
  proxy, CI/CD (`.github/workflows/deploy.yml`) — push to `main` builds and
  pushes images to GHCR, then deploys to a VPS over SSH, see
  `docs/DEPLOYMENT.md`. Not yet exercised against a real server (no VPS
  access in this session) — only compose/CI YAML and the Dockerfile logic
  have been validated locally.

Verified end-to-end against local Postgres/Redis: register → 0 balance →
send blocked with `insufficient_balance` → Admin credits wallet → send
succeeds → wallet debited → Admin sees the Transaction, the credited
Organization, and both `USER_REGISTERED`/`FIRST_MESSAGE_SENT` notifications.
Separately: create an API key → secret shown once, never in the list →
revoke it; invite a team member → accept via the token → new member shows
up in `/api/team/members` with a working session. Separately: publish an
OTP pricing rule → generate a code (wallet debited) → wrong code rejected
with attempts remaining → correct code verified → shows up in history.
Separately: created an operator, a provider with an endpoint, and a route
tying them to a product/country — all three list endpoints reflect it with
the right nested relations. Separately: all 6 rebuilt Website pages return
200 with the expected mockup copy; the light-theme accent override
(`#5d5294`) was confirmed present in the actual production CSS bundle, not
just the source file. Separately: requested a 500,000-SMS quote (above the
public tier) → Admin accepted it with a negotiated price → the requesting
org's estimates now use that price at any volume, while other orgs and
anonymous estimates still see the public tier and `quoteRequired: true` —
no cross-org leakage. Separately: PERCENT/FIXED_AMOUNT/FIXED_PRICE discount
rules confirmed for correct amount math, priority-based exclusivity,
opt-in stacking, and date-window expiry (see Discount Engine above).
Separately: instant vs. non-instant recharge, min/max amount validation,
and the Admin-confirm double-credit guard (see Facturation above).
Separately: launched a real campaign through the real Worker process (not
mocked/skipped) — 5-for-5 sent, wallet held/captured exactly right, then
re-verified after the BigInt serialization fix with a fresh 3-destination
campaign, checking the Transaction, Message rows, and wallet balance
directly (see Campaigns above).

Not built yet (tracked so it isn't silently dropped):
- The other 18 design lots (WhatsApp, Email, Statistiques, Settings,
  Support, and Back-office lots 19, 24-25 — Pricing admin (Lot 21) and
  Devis interne (Lot 22) each have a minimal slice).
- Campaign scheduling (`scheduledAt`) and mid-run cancellation — launch is
  immediate-only for now; audience is manual entry only, no CSV import or
  saved segments (03_Specifications_Console §11 lists CSV/contacts/segments
  alongside manual entry).
- Tax rules, a real promo-code redemption flow (PROMO/BONUS discount types
  are matched by scope only, not gated behind a code input yet),
  usage-limit enforcement on discount rules (the `usageLimit` column exists
  but isn't checked).
- Real provider adapters (SMPP/Meta WhatsApp/Mobile Money) — no sandbox
  credentials yet (design handoff README §9 point 4); `mock-sms.ts` is the
  swap point.
- PDF invoices/receipts (03_Specifications_Console §15 "Factures, reçus") —
  the wallet statement (`/api/wallet/transactions`) covers "relevés" only.
- Cross-app cache invalidation on publish (Website currently always fetches
  `no-store`, so it's correct but not optimized — 01_Specifications_Website §21).
- Lots 26/27 (not designed yet) — see `docs/DECISIONS.md`.
