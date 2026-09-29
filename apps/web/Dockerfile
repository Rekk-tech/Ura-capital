# ==============================================================================
# Aura Capital Web — Multi-Stage Production Dockerfile (FEAT-081)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Compilation Environment
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root monorepo manifests
COPY package.json package-lock.json tsconfig.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Clean install all dependencies
RUN npm ci

# Copy shared package and Web source
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/

# Build shared package then Vite web application
RUN npm run build:shared
RUN npm run build --workspace=@aura/web

# ------------------------------------------------------------------------------
# Stage 2: Production Nginx Runtime
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

RUN apk add --no-cache curl

# Copy built static files from builder
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy production Nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
