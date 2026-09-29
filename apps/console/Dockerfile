# Build context: repo root (see infra/docker/docker-compose.yml).
FROM node:20-alpine AS base
RUN corepack enable

FROM base AS pruner
WORKDIR /repo
COPY . .
RUN npx turbo prune @notifyafrica/console --docker

FROM base AS installer
WORKDIR /repo
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
COPY --from=pruner /repo/tsconfig.base.json ./tsconfig.base.json
RUN pnpm turbo run build --filter=@notifyafrica/console

FROM base AS runner
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=installer /repo/apps/console/.next ./apps/console/.next
COPY --from=installer /repo/apps/console/package.json ./apps/console/package.json
COPY --from=installer /repo/node_modules ./node_modules
WORKDIR /repo/apps/console
EXPOSE 3001
CMD ["npx", "next", "start", "--port", "3001"]
