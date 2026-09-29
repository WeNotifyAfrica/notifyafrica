# Build context: repo root (see infra/docker/docker-compose.yml).
FROM node:20-alpine AS base
RUN corepack enable

FROM base AS pruner
WORKDIR /repo
COPY . .
RUN npx turbo prune @notifyafrica/website --docker

FROM base AS installer
WORKDIR /repo
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
COPY --from=pruner /repo/tsconfig.base.json ./tsconfig.base.json
RUN pnpm turbo run build --filter=@notifyafrica/website

FROM base AS runner
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=installer /repo/apps/website/.next ./apps/website/.next
COPY --from=installer /repo/apps/website/public ./apps/website/public
COPY --from=installer /repo/apps/website/package.json ./apps/website/package.json
COPY --from=installer /repo/node_modules ./node_modules
WORKDIR /repo/apps/website
EXPOSE 3000
CMD ["npx", "next", "start", "--port", "3000"]
