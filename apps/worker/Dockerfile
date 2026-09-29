# Build context: repo root (see infra/docker/docker-compose.yml).
FROM node:20-alpine AS base
RUN corepack enable

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
RUN pnpm turbo run build --filter=@notifyafrica/worker

FROM base AS runner
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=installer /repo/apps/worker/dist ./apps/worker/dist
COPY --from=installer /repo/apps/worker/package.json ./apps/worker/package.json
COPY --from=installer /repo/node_modules ./node_modules
WORKDIR /repo/apps/worker
CMD ["node", "dist/index.js"]
