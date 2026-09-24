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

## WhatsApp Business (Lot 10)

WhatsApp's pricing is fundamentally different from SMS/OTP: Meta charges
per **conversation category** (utility/authentication/marketing), not a
flat per-message rate, and only an approved message *template* can be sent
outside a user-initiated 24h window. Both of those are business invariants,
not UI details, so they had to reach the Pricing Engine and the data model,
not just the Console form.

**Two real bugs fixed in already-shipped code, found while building this.**
`PricingEstimateRequest.category` had existed in the type since Phase A but
the Pricing Engine's Prisma query never referenced it — every WhatsApp
estimate silently ignored category and matched whichever rule happened to
win on productKey/country/currency alone. Fixed in
`apps/core-api/src/lib/pricing-engine.ts` by adding `category` to both the
published-rule query and the seed-fallback filter (`{ OR: [{ category:
input.category }, { category: null }] }`, so non-WhatsApp products with no
category keep matching `category: null` rules exactly as before).

The second bug was caught *before* it could ship a wrong price: the Admin
pricing-rules "publish" endpoint archives the previously-ACTIVE rule that
overlaps the new one on productKey/country/currency/volume range — but
didn't match on category. WhatsApp needed three simultaneously-ACTIVE rules
(one per category) at the identical volume range, so publishing
`authentication` after `utility` would have wrongly archived `utility`.
Fixed by adding `category: input.category` to the overlap query in
`apps/core-api/src/app/api/admin/pricing-rules/route.ts`. Also replaced the
Phase A placeholder WhatsApp rule (a made-up 1.4 XOF/message flat rate)
with the design handoff's actual three category prices (utility 24,
authentication 28, marketing 46 XOF) and bumped `SEED_VERSION` to 3.

**Data model.** Two new tables: `WhatsAppNumber` (a business number a Console
org registers, `PENDING`/`VERIFIED`/`REJECTED` — verification is a stand-in,
no real Meta Business API integration exists yet) and `WhatsAppTemplate`
(`name`, `category`, `language`, `bodyText`, `DRAFT`/`PENDING_REVIEW`/
`APPROVED`/`REJECTED`, `rejectionReason`). `Message` got a nullable
`whatsappTemplateId` so a sent WhatsApp message links back to the exact
template/category it billed against.

**The flow:**
- Console submits a template → always created `PENDING_REVIEW` regardless
  of who submits it — approval is never self-service, mirroring how Meta's
  real template review works.
- Admin's `/dashboard/whatsapp-templates` review queue (pending vs.
  history sections) approves or rejects with a required reason on reject.
- `POST /api/whatsapp/send` refuses anything but an `APPROVED` template
  (`422 template_not_approved`) — the same estimate → hold → mock-send →
  capture/release sequence every other product uses, with
  `category: template.category.toLowerCase()` passed into the Pricing
  Engine so the right one of the three rules resolves.
- Console `/dashboard/whatsapp` — one page for numbers, templates, the send
  form, and history, reusing the `CoreApiError` code-mapping pattern from
  the SMS send action.

Verified end-to-end against local Postgres/Redis with the real dev stack:
confirmed all three category rules resolve independently and correctly
(`pricing/estimate` with `category: utility/authentication/marketing` →
24/28/46 XOF respectively, matching the mockup exactly) and that publishing
all three left all three `ACTIVE` with only the old 1.4 XOF placeholder
archived once (not repeatedly — proof the overlap-query fix works). Then a
full lifecycle: registered an org, credited its wallet, added a WhatsApp
number (`VERIFIED`), submitted a utility-category template → send correctly
blocked with `template_not_approved` (HTTP 422) while `PENDING_REVIEW` →
Admin approved it → send succeeded, wallet debited exactly 24 XOF
(1000 → 976), the `Message` row carries `product: "WHATSAPP"`,
`whatsappTemplateId` set to the approved template, and a `pricingSnapshot`
recording `category: "UTILITY"`/`unitPrice: 24` → the `Transaction` row
confirmed directly via the Admin API as `type: "WHATSAPP_SEND"`,
`status: "CAPTURED"`, `amountMinor: 24` → Admin's review queue correctly
shows the template as `APPROVED` under history. All five apps (Website,
Console, Admin, Core API, Worker) typecheck and production-build clean.

## Console & Admin design-fidelity pass — shell + dashboards (Lots 5-6, 19)

Every Console and Admin page up to this point was functional but visually
bare: plain `<div>`s with ad-hoc inline grid styles, not the actual shell
the design handoff specifies. The handoff's own instructions (README §3)
are explicit about how to read the 25 lot mockups: lots 7→25 render each
module as a "specification page" (lot header, screen tabs, spec-only I/J/L/N
cards) — **in production, those tabs become sub-routes living inside one
shared shell** (Lots 5-6: sidebar, topbar, org/project identity). The I/J/L/N
cards are business-rule documentation, not UI, and were never meant to be
rendered. This is the first of several passes correcting that gap, starting
with the highest-leverage piece — the shell every page inherits — plus the
one page every user sees first, the overview/pilotage dashboard.

**Shell.** Added `.shell`/`.shell-sidebar`/`.shell-nav`/`.shell-link`/
`.shell-topbar`/`.shell-main` to `packages/design-system/src/nocturne.css`
(the mockup's sidebar buttons use prototype-only inline JS styles for their
active state, not a reusable CSS class — this is the production
interpretation, built from the same tokens as everything else) and a new
`packages/ui/src/components/Shell.tsx` (`Shell`, `ShellSidebar`, `ShellNav`,
`ShellTopbar`, `ShellPageTitle`, `ShellMain`). `ShellNav`/`ShellPageTitle`
are client components (`usePathname`) since the layout that renders them is
a server component with no reliable way to read the route its children are
about to render.

Console's shell (`apps/console/src/app/(app)/layout.tsx`) matches the
mockup's sidebar (brand, nav, wallet balance card with a real "Recharger"
link) and topbar (page title, user avatar). The mockup's org/project
*switcher* and Live/Test environment toggle are deliberately rendered as
static labels, not interactive controls: there is only ever one
organization and one default project per account today (Phase C), and no
sandbox environment exists in the data model, so a working switcher would
be theater, not a feature. Documented here rather than faked.

Admin's shell (`apps/admin/src/app/(app)/layout.tsx`) reuses the same
components minus the wallet card and org switcher — those are client-account
concepts, meaningless for an internal Ops/Finance/Support user. Its topbar
shows the internal user's identity as a `tag-accent` badge ("Interne
NotifyAfrica · email · role"), matching Lot 19's header pattern.

**Dashboards, real data only.** Both overview pages previously showed
almost nothing (Console: org ID and role in two bare cards; Admin: a seed
import button and a notification list). Added `GET /api/dashboard/summary`
(Console, org-scoped) and `GET /api/admin/dashboard/summary` (Admin,
internal-role-gated), both querying real Prisma aggregates — no fixture
data anywhere:
- Console: wallet balance, messages sent this month grouped by product,
  active campaign count, pending quote count, and an 8-item activity feed
  merging recent Messages and Transactions by timestamp.
- Admin: organization count, revenue captured this month (grouped by
  currency, since orgs bill in different ones), pending quotes/WhatsApp
  template reviews/transactions-to-reconcile counts, recent notifications,
  and the last 8 `AuditLog` entries as "journal des actions internes" (one
  of Lot 19's five screens).

Both intentionally skip the mockup's 14-day bar chart and Lot 19's
revenue/supplier-cost/margin chart: the latter needs a `SupplierCost` model
that doesn't exist yet (Lot 20/25 territory — see "Not built yet" below),
so rendering it would mean fabricating numbers. A real "consommation par
produit" breakdown (Console) answers the same "where is spend/volume going"
question without inventing data.

Also added, reusable everywhere: `formatMoney()` in `packages/ui` (uses the
real decimals/symbol from `catalog.currencies` — e.g. XOF's 0 decimals — via
a new `listCurrencies()` API-client method, never a hardcoded per-currency
assumption) and a `Currency` type in `packages/types`.

Verified end-to-end against the real dev stack (after discovering and
cleaning up ~60 leaked `pnpm dev` process trees from earlier sessions that
were never killed between turns — the actual cause of a false "500 error"
during this verification, which disappeared once a single clean dev stack
was restarted; a reminder to kill stale background dev servers before
trusting a "bug"): both summary endpoints return real aggregates matching
direct Prisma queries exactly (Console: wallet 976 XOF, 1 WhatsApp message
this month, matching the Lot 10 verification above; Admin: 9 organizations,
610 101 XOF revenue this month, 8 audit log entries). Both rendered pages
return 200 with the `.shell`/`.shell-sidebar`/`.shell-nav`/`.shell-topbar`/
`.shell-main` structure present and `formatMoney` producing correctly
grouped output ("610 101 FCFA", "976 FCFA"). Spot-checked that existing
pages (Console SMS, Admin Pricing) still render 200 inside the new shell.
All five apps typecheck and production-build clean.

**Still ahead in this pass** (tracked, not silently dropped): the 25
remaining Console/Admin product pages (SMS, OTP, Campaigns, WhatsApp,
Quotes, Pricing, Billing, Developers, Team on Console; Catalog, Pricing,
Discounts, Providers, Quotes, WhatsApp templates, Payment methods,
Organizations, Users, Transactions on Admin) still use the pre-shell
ad-hoc layout for their own content area and haven't been individually
matched against their design handoff lot yet — only the shell wrapping them
changed in this pass. Continuing lot by lot.

### Follow-up: a real `formatMoney` bug, and `formatMoney` vs `formatPrice`

While extending money formatting to the four other pages still showing a
raw `wallet.availableMinor` + currency code, and then to the Admin Pricing
page, two things surfaced:

1. **`formatMoney` never divided by `10 ** decimals`.** It multiplied
   nowhere and divided nowhere — for XOF/XAF (0 decimals) that's a no-op,
   so every live check up to this point (all XOF) looked correct by
   coincidence. `toMinorUnits()` (`packages/domain/src/wallet.ts`)
   multiplies by `10 ** decimals` when *crediting* a wallet, so a 2-decimal
   currency's `availableMinor` is truly in minor units (976 GHS credited ->
   `availableMinor: "97600"`) — `formatMoney` needed the inverse operation
   and didn't have it. Caught before it reached more pages, by reasoning
   through the admin Pricing page's use of it on a Pricing Engine value
   (see #2) — not by a XOF-only live check, which couldn't have caught it.
   Fixed by dividing by `10 ** decimals` before formatting, then verified
   against a fresh org with `currency: "GHS"` (2 decimals): credited 976
   GHS, `availableMinor` stored as `"97600"` exactly as `toMinorUnits`
   predicts, rendered page shows "976,00 GH₵" — correct.
2. **Pricing Engine values (`unitPrice`/`subtotal`/`total`) are already
   major-unit decimals, never minor units** (confirmed by the WhatsApp Lot
   10 verification: `unitPrice: 24` for a 24 XOF rate, not 2400). Passing
   one through the now-fixed `formatMoney` would wrongly divide it again.
   Split into two functions in `packages/ui/src/format.ts`: `formatMoney`
   (minor-unit amounts — wallets, transactions, campaigns) and
   `formatPrice` (major-unit Pricing Engine rates). `formatPrice`
   deliberately does *not* use the currency's official `decimals` either —
   XOF's 0 decimals is correct for a real transaction (no FCFA cents
   circulate) but a per-message *rate* still needs fractional precision to
   be meaningful, exactly as the design handoff's own mockup shows ("6,10
   FCFA / message"). `formatPrice` shows 2 decimals only when the amount
   actually has a fractional part, else 0 — verified live: SMS tiers
   (6.5/6.8 XOF) render "6,50 FCFA"/"6,80 FCFA", WhatsApp categories
   (24/28/46, all integers) render "24 FCFA" etc. with no trailing zeros.

Also upgraded the Admin Pricing page (previously hardcoded to SMS/XOF
only) to a real product + currency selector driven by the Catalog and
`catalog.currencies` APIs — the underlying `listPricingTiers(product,
currency)` already supported any product/currency, only the UI was
hardcoded. Verified live for SMS/XOF and WhatsApp/XOF.

### Follow-up: French-label sweep

Design handoff README §3 requires "high fidelity" text, in French, for
every screen — Console and Admin alike. A systematic grep for
`<Tag>{x.status}</Tag>`-shaped patterns across every page turned up
several spots still showing a raw Prisma enum value instead of a French
label (some pages, like Billing or WhatsApp templates, already had this
right — it just wasn't applied everywhere): Console SMS/WhatsApp message
status, WhatsApp number status, Campaign status (list + detail), OTP code
status, Pricing's product status, Developers' key environment, Team's 7
console roles (member list, invitation list, and the invite form's
select); Admin Quote status (including the status-change select), Catalog
product status, Users status, Transaction status, Payment method family,
Provider health state / Route status, and Discount type / scope. Left
WhatsApp template category (UTILITY/AUTHENTICATION/MARKETING)
untranslated deliberately — that's Meta's own Business Platform
terminology, not an internal enum, and translating it would be wrong.

Verified live across all of Console and Admin against a clean dev stack
(pages return 200, French labels render instead of raw enum strings); all
five apps typecheck and production-build clean.

## API documentation — self-hosted Swagger (OpenAPI)

The Core API now serves its own interactive API reference at `/docs`
(Swagger UI), backed by `GET /api/openapi.json` — both on the Core API's
own domain, no third-party account (SwaggerHub etc.) involved.

**Generated from the real Zod schemas, not hand-written.** A hand-
maintained OpenAPI YAML would drift from what the route handlers actually
validate — the same class of problem as every other "duplicated business
data" bug fixed this session. Instead, `@asteasolutions/zod-to-openapi`
extends Zod (`packages/validation/src/zod-setup.ts`, imported first via a
side-effect import in `index.ts` so every schema file sees the same
already-extended `z` singleton) so the *same* schemas the routes call
`.safeParse()` against can carry `.openapi()` metadata (examples,
descriptions) and be dropped straight into the spec.

`apps/core-api/src/lib/openapi-registry.ts` is the single place routes get
registered — method, path, request schema, response schema(s) per status
code, tag. `GET /api/openapi.json` calls `generateOpenApiDocument()` on
every request (never a static file, so it can't go stale), and `/docs`
renders it with `swagger-ui-react` (a client component loaded via
`next/dynamic(..., { ssr: false })`, since the library touches `window` at
import time — App Router requires that dynamic-with-no-ssr to live in a
Client Component, not a Server Component, which the first build attempt
caught).

**Coverage: all 57 route files, every exported method — 100 %, zero gaps.**
After the proof of concept (Auth + Wallet) was confirmed, every remaining
route got registered the same way in one pass, grouped by tag (Auth,
Catalog, Wallet, SMS, OTP, WhatsApp, Campaigns, Quotes, Developers, Team,
Dashboard, Admin). Response schemas mirror what the route handlers
actually return (`packages/types`' shapes, not the internal Prisma model)
— minor-unit BigInt amounts stay strings, matching the real wire format.

Verified two ways, not just "it typechecks":
1. **Coverage script** — walked every `route.ts` under `apps/core-api/src/
   app/api`, extracted its exported HTTP methods via regex, and diffed
   against the generated spec's `paths`. Zero routes missing, zero method
   mismatches (no route with an undocumented GET or POST) — confirmed
   against the live `/api/openapi.json`, not just the registry source.
2. **Build + runtime** — production build compiles clean, `/api/openapi.json`
   returns a valid OpenAPI 3.0 document (57 paths, 70 operations) with real
   examples, `/docs` returns 200 and its compiled JS bundle contains the
   actual `swagger-ui-react` code. No headless browser available in this
   environment to screenshot the rendered UI, so a manual check in an
   actual browser is still worth doing.

Also fixed along the way: `swagger-ui-react`'s internal `ModelCollapse`
component still uses the legacy `UNSAFE_componentWillReceiveProps`
lifecycle (an upstream issue, not fixable from here) — React's Strict Mode
surfaced it as a console warning on every render. Since Core API's only
client-rendered React is this one `/docs` page, disabled
`reactStrictMode` for the whole app (`next.config.mjs`) rather than
leaving a noisy, unactionable warning — there's no other interactive
logic here StrictMode would be protecting.

## SMS deep dive: Sender Names, Templates, Message Detail (Lot 7)

The earlier design-fidelity passes matched Console/Admin pages to the
mockups' component vocabulary and shell, but hadn't gone screen-by-screen
against any single lot's actual content. Lot 7's own mockup states it
plainly: "Sept écrans" — Send, Bulk, History, Detail, Sender Names,
Templates, Scheduled — of which only Send + History existed. This pass
closes three of the remaining five with real data models and APIs, not
just UI:

- **Sender Names** (`SenderName` model + `SenderNameStatus`) — a name
  must be validated per-country by each operator; modeled the same way
  WhatsApp templates model Meta's review (Console submits at `PENDING`,
  Admin approves/rejects at `/dashboard/sms-sender-names`, mirroring the
  WhatsApp template queue's exact pattern) since there's no real
  per-operator channel to integrate with. `Message.senderId` stays a
  free-text field on purpose — a rejected or pending name doesn't block
  sending, it just isn't offered as a *validated* option in the Console's
  sender picker, which falls back to free text ("partagé par défaut")
  when no validated name exists yet.
- **Templates** (`SmsTemplate` model) — reusable bodies with
  `{variable}` placeholders, no approval gate (an org's own drafts, not
  reviewed by anyone). "Utiliser" on the templates page links back to
  Send with `?template=<id>`, which pre-fills the textarea server-side —
  no client state needed, same convention the rest of the app uses for
  banners. `usageCount` isn't the mockup's illustrative number: `/api/
  sms/send` now accepts an optional `smsTemplateId` and increments it for
  real when a send references one — verified live (0 → 1 after one send).
- **Message Detail** (`GET /api/sms/[id]`, `/dashboard/sms/[id]`) — the
  mockup's 5-step delivery timeline (accepted → debited → transmitted →
  operator ack → delivered) assumes provider-level delivery receipts that
  don't exist (no real SMPP/HTTP provider wired — design handoff README
  §9 point 4). Shows the 3 steps that are real instead of fabricating the
  other two: created, debited (from the linked Transaction), final
  status — plus the full billing breakdown from the message's frozen
  `pricingSnapshot`.

Each mockup tab became a real sub-route, per the design handoff's own
instruction (README §3: "les onglets deviennent des sous-routes") —
`/dashboard/sms`, `/dashboard/sms/senders`, `/dashboard/sms/templates`,
`/dashboard/sms/[id]`, linked by a small `SmsSubNav` component.

**Deliberately not built** (documented, not silently dropped): bulk
send/CSV import and scheduled sends. Bulk send already exists as
Campaigns (`product: "SMS"` already does audience → estimate → reserve
funds → background run) — duplicating that engine behind a separate CSV
pipeline would drift the two apart, so the SMS page's "Envoi en masse"
links straight to Campaigns instead. Scheduled sends need a real
time-based trigger (a `scheduledAt` field plus a delayed BullMQ job) that
doesn't exist yet — a bounded, legitimate follow-up, not attempted here.

Verified end-to-end against the real dev stack, not just typechecked:
requested a sender name → blocked from the validated picker while
`PENDING` → Admin-approved → appeared in the Console send form's select
→ created a template → sent an SMS referencing both → wallet debited
the real Pricing Engine rate → template `usageCount` incremented 0→1 →
message detail page shows the real Transaction amount, rule version, and
status. All five apps typecheck and production-build clean; a fresh
`prisma migrate dev` applied without conflicts.

## OTP billing fix: charge the verified code, not the send attempt (Lot 9)

Reading Lot 9's mockup closely (continuing the same screen-by-screen pass
as the SMS lot) surfaced a real business-logic bug, not a visual gap: its
"I · Règles métier" section states plainly — **"Facturation au code
vérifié : un code envoyé mais non vérifié n'est pas facturé"** — and the
mockup's own overview KPIs, funnel, and cost breakdown all key off
*verified* codes, never sent ones. `/api/otp/generate` had followed the
same estimate → hold → deliver → **capture** sequence as SMS/WhatsApp send
— billing immediately on delivery, before anyone had typed anything.
Every code, verified or not, cost the organization money — directly
contradicting the lot's headline invariant.

Fixed by splitting where hold and capture happen:
- `/api/otp/generate` still estimates and **holds** funds (so an org
  without enough balance still can't generate codes it can't pay for) but
  creates the `Transaction` at `PENDING`, not `CAPTURED`.
- `/api/otp/verify` is where the hold actually settles: a correct code
  **captures** it (`status: CAPTURED`); an expired code or exhausted
  attempts **releases** it (`status: CANCELLED`) — a code sent but never
  verified now costs nothing, exactly as designed.
- **New gap this created and closed in the same pass**: a code the caller
  never calls `/verify` on again after it expires would otherwise leave
  its hold "stuck" in `reservedMinor` forever — nothing was watching for
  that. Added `releaseExpiredOtpHolds()` (`apps/core-api/src/lib/otp.ts`)
  and call it from the two read paths most likely to be hit before the
  org would notice a discrepancy: `GET /api/otp/history` and `GET /api/
  wallet` itself. No cron/scheduler exists for this yet, so it's a lazy
  self-heal-on-next-read, not real-time — a documented, bounded gap
  rather than a real-time sweep.

Verified end-to-end against the real dev stack with three separate paths,
each checked against actual wallet movements (not just response bodies):
1. **Generate → hold**: available 969→964 XOF, reserved 0→5 XOF,
   Transaction stays `PENDING` — confirmed nothing was captured yet.
2. **Verify success → capture**: reserved 5→0 XOF, available stays 964
   XOF (the spend is now real), Transaction flips to `CAPTURED`.
3. **Expire without verify → release**: a second code with a 30-second
   config, left unverified past expiry, checked via `GET /api/wallet`
   (which triggers the lazy sweep) — available correctly returned to 964
   XOF, reserved back to 0, Transaction flips to `CANCELLED`, OtpCode to
   `EXPIRED`. Cross-checked directly against Admin's transaction list:
   one `OTP_SEND` at `CAPTURED`, one at `CANCELLED`, both 5 XOF.

Also added a visible note to the Console OTP page itself ("Facturé au
code vérifié, pas à la tentative d'envoi...") — this is a business rule
worth surfacing to the person generating codes, not just a code comment.
All five apps typecheck and production-build clean.

## WhatsApp billing fix: per 24h conversation window, not per message (Lot 10)

Same screen-by-screen pass, same class of finding as OTP: Lot 10's "I ·
Règles métier" states **"La facturation est par conversation de 24 h, pas
par message : les réponses dans la fenêtre sont gratuites. La catégorie
du premier message sortant fixe le prix de la fenêtre."** This isn't a
design-only simplification — it's how Meta's real WhatsApp Business
Platform actually bills. `/api/whatsapp/send` charged every single send
at the template's category rate, with no concept of a conversation window
at all — a customer receiving 5 messages in an hour would be billed 5
times instead of once.

Fixed with a new `WhatsAppConversation` model — one row per window
actually opened (not upserted in place, so it doubles as real conversation
history), keyed by `(organizationId, destination)` with a category and
`expiresAt`. Send logic now branches on whether a non-expired window
exists for that destination:
- **Open window found** → send goes through for free: no Pricing Engine
  call, no wallet hold/capture, no `Transaction` row at all.
  `Message.transactionId` stays `null`, and `pricingSnapshot` records
  `freeWithinConversation: true` plus which category/window it rode on.
- **No open window** → priced and billed exactly as before (estimate →
  hold → capture), and opens a new 24h window for that destination.

Console surfaces the distinction rather than hiding it: the send
confirmation banner says whether this specific send was free (window
reused) or opened a new billed window, and the WhatsApp journal got a new
"Facturation" column tagging each message Facturé/Gratuit.

Verified end-to-end against real wallet movements: send #1 to a new
number → charged 24 XOF (964→940 available), `freeWithinConversation:
false`. Send #2 to the **same** number → `freeWithinConversation: true`,
wallet completely unchanged (940→940), message's `transactionId: null`.
Send #3 to a **different** number → charged again (940→916), confirming
window isolation is per-destination, not global to the organization. All
five apps typecheck and production-build clean; migration applied
without conflicts. (Also re-learned: after `prisma migrate dev` +
`generate`, the *already-running* dev server process still holds the old
`@prisma/client` in its Node module cache — Next's fast-refresh
recompiles changed route code but doesn't reload node_modules packages,
so a schema change always needs a full dev-stack restart, not just a
rebuild, to actually take effect.)

**Deliberately not built** (documented gaps, Lot 10 names these
explicitly): consent/opt-in tracking for contacts ("un contact sans
consentement WhatsApp est exclu" needs a Contact/consent model that
doesn't exist), Meta's quality-rating and sending-limit states, template
reclassification mid-flight, and a real Conversations screen showing the
open-window list itself rather than just tagging messages after the fact.

## Live/Test environment switch (Lots 5-6 shell)

The Console shell's mockup shows a Live/Test toggle in the sidebar (design
handoff Lots 5-6: "sélecteurs org/projet, environnement test/live"); until
now it was a static, non-functional label, documented as such in the
first design-fidelity pass. This makes it real, end to end.

**Data model.** The schema already had `Project.environment` (`sandbox` |
`production`) — it just wasn't used meaningfully: every org (confirmed
directly against the dev DB) had exactly one Project, named "Default",
`environment: sandbox`, and every project-scoped route picked it with an
unconditional `project.findFirst({ where: { organizationId } })`.
Registration now creates **two** — "Live" (production) and "Test"
(sandbox) — and a one-time backfill script gave the same to all 10
pre-existing dev-DB orgs (renaming their original "Default" project to
"Test", adding a new "Live" one).

**How the selection travels.** Console's choice lives in a cookie
(`apps/console/src/lib/env.ts` `ENV_COOKIE`, default `sandbox` — the safe
choice: it matches every pre-existing org's only project, so a visitor
who's never touched the toggle behaves exactly as before this feature
existed). `coreApi(token, environment)` (`packages/api-client`) forwards
it as an `X-Environment` header on every request. Core API's new
`apps/core-api/src/lib/project.ts` reads that header
(`getEnvironmentFromRequest`, defaulting to `sandbox` when absent — same
safe-default reasoning) and resolves the right Project
(`resolveProject`), falling back to *any* project for the org rather than
hard-failing if the specific environment one is somehow missing.

**What actually changes per environment.** Every project-scoped resource
is now isolated by it — SMS/WhatsApp history, sender names, WhatsApp
numbers/templates, OTP configs/history, campaigns, API keys: a Test
WhatsApp number doesn't show up while viewing Live, matching how Meta's
real WhatsApp Business API keeps test numbers as entirely separate
objects from production ones, not a NotifyAfrica-only simplification.
More importantly, **Test never spends real money**: SMS send, OTP
generate, WhatsApp send, and Campaign estimate/launch all check the
resolved project's environment and skip the Pricing Engine/wallet hold-
capture entirely under sandbox — the send/message/campaign still happens
for real (so integration testing exercises the real code path end to
end), it just never touches `availableMinor`/`reservedMinor`. Campaigns
specifically: `estimate` returns a zeroed quote for sandbox, and `launch`
skips holding funds and creating a `Transaction` — which the Worker's
existing capture/release logic (already conditional on "is there
something to act on") handles as a no-op with no changes needed there.

**Console UI.** The sidebar's Live/Test control is two small `<form
action={setEnvironmentAction}>` buttons styled with the mockup's own
`.seg`/`.seg-opt` classes (not the mockup's literal markup — this is a
prototype-only client-state toggle there; production needs an actual
server round trip to change a cookie). Submitting sets the cookie and
calls `revalidatePath("/", "layout")` — no redirect, the current page
just re-renders with the new environment's data. A note under the toggle
("Envois gratuits, aucun débit.") appears only in Test.

Verified end-to-end against the real dev stack, checking actual wallet
movements, not just response flags: registered a fresh org, credited its
wallet 1000 XOF. Sent SMS with no `X-Environment` header (the default) →
`sandbox: true`, wallet unchanged at 1000. Sent again with
`X-Environment: production` → charged 7 XOF (1000→993), real
`Transaction` returned. `GET /api/sms/history` under each header shows
only that environment's message — full isolation confirmed both via API
and by fetching the actual Console pages with `na_env=sandbox` vs.
`na_env=production` cookies (each rendered only its own message).
Generated an OTP code under sandbox → free, wallet unchanged; the same
config's id rejected with 404 when called under `X-Environment:
production` — cross-environment access correctly blocked, not just
hidden from listings. All five apps typecheck and production-build
clean.

**Known UX overlap, not resolved here:** `ApiKey.environment`
(sandbox/production, chosen per-key at creation — a pre-existing field
for which auth scope a key carries) is a different concept from the
Console-wide Live/Test toggle (which project a key belongs to). Both
exist on the Developers page now; worth reconciling in a future pass
rather than conflating them under time pressure here.

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
- **WhatsApp Business** (Lot 10 partial) — category-based pricing
  (utility/authentication/marketing) reaching the Pricing Engine, number
  registration, template submit/review/approve, send gated on an
  `APPROVED` template (see above). No real Meta Business API integration.
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
directly (see Campaigns above). Separately: WhatsApp's three category
prices confirmed independently correct, a template blocked from sending
until Admin-approved, then sent with the wallet debited the exact
category price and the Transaction/Message rows checked directly (see
WhatsApp above).

Not built yet (tracked so it isn't silently dropped):
- The other 17 design lots (Email, Statistiques, Settings, Support, and
  Back-office lots 19, 24-25 — Pricing admin (Lot 21) and Devis interne
  (Lot 22) each have a minimal slice).
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
