# Build context: repo root (see infra/docker/docker-compose.yml).
FROM node:20-alpine AS base
RUN corepack enable

FROM base AS pruner
WORKDIR /repo
COPY . .
RUN npx turbo prune @notifyafrica/admin --docker

FROM base AS installer
WORKDIR /repo
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
COPY --from=pruner /repo/tsconfig.base.json ./tsconfig.base.json
RUN pnpm turbo run build --filter=@notifyafrica/admin

FROM base AS runner
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=installer /repo/apps/admin/.next ./apps/admin/.next
COPY --from=installer /repo/apps/admin/package.json ./apps/admin/package.json
COPY --from=installer /repo/apps/admin/node_modules ./apps/admin/node_modules
COPY --from=installer /repo/node_modules ./node_modules
WORKDIR /repo/apps/admin
EXPOSE 3002
CMD ["npx", "next", "start", "--port", "3002"]
