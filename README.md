# NotifyAfrica

Monorepo for the NotifyAfrica platform: Website, Console, Admin, Core API and a
background Worker. See `docs/ARCHITECTURE.md` for the design and
`docs/DECISIONS.md` for decisions taken where specs/design left an open question.

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable` gets you the pinned version)
- Docker (for Postgres/Redis — `infra/docker/docker-compose.dev.yml`)

## First run

```bash
cp .env.example .env               # adjust if needed
docker compose -f infra/docker/docker-compose.dev.yml up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed                       # imports the design seed + creates a dev super-admin
pnpm dev                           # website:3000 console:3001 admin:3002 core-api:3010
```

Dev super-admin (Admin app login, unless overridden via `ADMIN_SEED_EMAIL`/
`ADMIN_SEED_PASSWORD`): `admin@notifyafrica.dev` / `ChangeMe123!`.

## Scripts

```bash
pnpm dev            # all apps in parallel
pnpm dev:website
pnpm dev:console
pnpm dev:admin
pnpm dev:api
pnpm dev:worker
pnpm build
pnpm lint
pnpm typecheck
pnpm db:migrate
pnpm db:seed
```

## Design source

`design_handoff_notifyafrica/` — 25 of 27 lots designed, Nocturne design
system. `packages/design-system` reuses its CSS verbatim as the source of
truth; `packages/ui` wraps it in React components.
