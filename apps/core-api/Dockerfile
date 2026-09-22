# Build context: repo root (see infra/docker/docker-compose.yml).
FROM node:20-alpine AS base
RUN corepack enable

FROM base AS pruner
WORKDIR /repo
COPY . .
RUN npx turbo prune @notifyafrica/core-api --docker

FROM base AS installer
WORKDIR /repo
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
RUN pnpm --filter @notifyafrica/core-api run db:generate
RUN pnpm turbo run build --filter=@notifyafrica/core-api

FROM base AS runner
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=installer /repo/apps/core-api/.next ./apps/core-api/.next
COPY --from=installer /repo/apps/core-api/prisma ./apps/core-api/prisma
COPY --from=installer /repo/apps/core-api/package.json ./apps/core-api/package.json
COPY --from=installer /repo/apps/core-api/node_modules ./apps/core-api/node_modules
COPY --from=installer /repo/node_modules ./node_modules
WORKDIR /repo/apps/core-api
EXPOSE 3010
# Migrations run on every container start so a deploy never ships a build
# whose schema is ahead of the database it's about to talk to.
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start --port 3010"]
