# ==============================================================================
# Aura Capital API — Multi-Stage Production Dockerfile (FEAT-081)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Compilation Environment
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy root monorepo manifests
COPY package.json package-lock.json tsconfig.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Clean install all dependencies
RUN npm ci

# Copy shared package and API source
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

# Generate Prisma client for Linux container environment
WORKDIR /app/apps/api
RUN npx prisma generate

# Build shared package then API bundle
WORKDIR /app
RUN npm run build:shared
RUN npm run build --workspace=@aura/api

# Prune devDependencies for minimal runtime
RUN npm prune --omit=dev

# ------------------------------------------------------------------------------
# Stage 2: Production Minimal Runtime
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

RUN apk add --no-cache dumb-init openssl curl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy node_modules and built artifacts
COPY --chown=node:node package.json package-lock.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=node:node /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=node:node /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=node:node /app/apps/api/scripts ./apps/api/scripts

# Set executable permissions on entrypoint script
RUN chmod +x /app/apps/api/scripts/deploy-entrypoint.sh

USER node

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/bin/sh", "/app/apps/api/scripts/deploy-entrypoint.sh"]
