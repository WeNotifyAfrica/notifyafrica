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
RUN pnpm turbo run build --filter=@notifyafrica/worker

FROM base AS runner
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=installer /repo/apps/worker/dist ./apps/worker/dist
COPY --from=installer /repo/apps/worker/package.json ./apps/worker/package.json
COPY --from=installer /repo/node_modules ./node_modules
WORKDIR /repo/apps/worker
CMD ["node", "dist/index.js"]
