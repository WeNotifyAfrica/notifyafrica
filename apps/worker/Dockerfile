# Build context: repo root (see infra/docker/docker-compose.yml).
FROM node:20-alpine AS base
RUN corepack enable
# Prisma's query/schema engine binaries are compiled against a specific
# OpenSSL version; node:20-alpine ships none, so without this the engine
# fails at runtime with an unparseable (non-JSON) crash message.
RUN apk add --no-cache openssl

FROM base AS pruner
WORKDIR /repo
COPY . .
RUN npx turbo prune @notifyafrica/worker --docker

FROM base AS installer
WORKDIR /repo
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
COPY --from=pruner /repo/tsconfig.base.json ./tsconfig.base.json
# @notifyafrica/domain imports the generated Prisma client, but the schema
# lives in apps/core-api (not one of the worker's pruned workspace deps).
# Copying it under apps/worker/prisma (rather than apps/core-api/prisma, which
# has no package.json in this pruned tree) keeps it inside the worker's own
# project root so the local `prisma` devDependency resolves it directly
# instead of Prisma's CLI falling back to an auto-install of a different major version.
COPY --from=pruner /repo/apps/core-api/prisma/schema.prisma ./apps/worker/prisma/schema.prisma
RUN pnpm --filter @notifyafrica/worker exec prisma generate --schema=prisma/schema.prisma
# Kept as a compile-time check (fails the Docker build on a real TS error) —
# the runner stage below doesn't use its `dist` output; see the CMD note.
RUN pnpm turbo run build --filter=@notifyafrica/worker

FROM base AS runner
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=installer /repo/apps/worker/src ./apps/worker/src
COPY --from=installer /repo/apps/worker/tsconfig.json ./apps/worker/tsconfig.json
COPY --from=installer /repo/apps/worker/package.json ./apps/worker/package.json
COPY --from=installer /repo/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=installer /repo/node_modules ./node_modules
COPY --from=installer /repo/tsconfig.base.json ./tsconfig.base.json
# None of the shared packages (@notifyafrica/domain, /observability, /queue)
# have a build step — they're consumed as raw TypeScript, which works for
# Next.js apps (webpack transpiles them) but not for plain `node`, which
# can't resolve a workspace package whose "main" points at a .ts file with
# extensionless internal imports. pnpm resolves them via symlinks into
# /repo/packages/*, so the real files have to exist here too.
COPY --from=installer /repo/packages ./packages
WORKDIR /repo/apps/worker
# Runs against source via tsx — same as `pnpm dev` locally (tsx watch
# src/index.ts) — rather than plain `node dist/index.js`, for the same
# reason the packages above are copied as source: nothing in this
# dependency graph is actually compiled ahead of time.
CMD ["node_modules/.bin/tsx", "src/index.ts"]
