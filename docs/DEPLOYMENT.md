# Aura Capital MVP — Production Deployment Guide & Runbook (FEAT-081)

This runbook outlines the deployment architecture, configuration, containerization, and operations procedures for deploying the Aura Capital MVP on production infrastructure (cloud VPS, bare metal, or container platforms).

---

## 1. Architecture & Container Topology

The Aura Capital production deployment packages the entire institutional learning and simulation platform into an isolated, coordinated Docker Compose mesh:

```
                      Internet / Client Browser
                                 │
                                 ▼ [Port 80 / 443]
                     ┌───────────────────────┐
                     │     aura-web-prod     │
                     │  (Nginx 1.27 Alpine)  │
                     └───────────┬───────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │ Reverse Proxy (/api, /health) │ Static Asset Serving
                 ▼                               ▼ (SPA try_files, gzip)
      ┌───────────────────────┐             [HTML5 / JS / CSS]
      │     aura-api-prod     │
      │  (Node.js 20 Alpine)  │
      └───────────┬───────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│ aura-postgres │   │   aura-redis  │
│(PostgreSQL 16)│   │   (Redis 7)   │
└───────────────┘   └───────────────┘
```

### Components

1. **`aura-web-prod` (Frontend)**:
   - High-performance Nginx Alpine container serving production-optimized Vite static bundles.
   - Built-in Gzip/Brotli compression and 1-year immutable caching for `/assets/`.
   - Single Page Application routing fallback (`try_files $uri $uri/ /index.html;`).
   - Reverse proxy forwarding `/api/` and `/health` requests to `aura-api-prod`.
   - Security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`.

2. **`aura-api-prod` (Backend API)**:
   - Node.js 20 LTS Alpine minimal runtime executed under non-root `node` user via `dumb-init`.
   - Pre-generated Prisma client with native Linux Musl query engine.
   - Deployment entrypoint executing `prisma migrate deploy` and idempotent demo fixture seeding (`npm run seed:demo`).
   - Express server handling institutional learning curricula, deterministic market simulation, community discussions, and RBAC authentication.

3. **`aura-postgres-prod` (Relational Database)**:
   - PostgreSQL 16 Alpine with persistent volume `postgres_prod_data`.
   - Healthcheck probing `pg_isready`.

4. **`aura-redis-prod` (Cache & Rate Limiting)**:
   - Redis 7 Alpine with persistent volume `redis_prod_data`.
   - Fail-closed rate limiting store and cache. Healthcheck probing `redis-cli ping`.

---

## 2. System Requirements & Prerequisites

- **Operating System**: Linux (Ubuntu 22.04 LTS / Debian 12 / Rocky Linux 9), macOS, or Windows with WSL2/Docker Desktop.
- **Hardware**: Minimum 2 vCPU, 2GB RAM, 20GB SSD disk space. Recommended 4 vCPU, 4GB RAM.
- **Software**:
  - Docker Engine `24.0.0+`
  - Docker Compose `v2.20.0+`
  - Open Ports: Port `80` (HTTP) or `443` (HTTPS).

---

## 3. Environment Configuration

1. Clone or copy the repository onto the production server:
   ```bash
   git clone <repository-url> /opt/aura-capital
   cd /opt/aura-capital
   ```

2. Copy the production environment template:
   ```bash
   cp .env.production.example .env.production
   ```

3. Update key secrets in `.env.production`:
   ```bash
   # Generate high-entropy 32+ character secrets:
   openssl rand -hex 32
   ```
   Set:
   - `JWT_SECRET`: Secret key for JWT signing.
   - `AUTH_ACCESS_TOKEN_SECRET`: Secret key for access tokens.
   - `AUTH_REFRESH_TOKEN_SECRET`: Secret key for refresh tokens.
   - `AUTH_RATE_LIMIT_KEY_SECRET`: HMAC key for IP rate limiting.
   - `COMMUNITY_RATE_LIMIT_KEY_SECRET`: HMAC key for community rate limiting.
   - `POSTGRES_PASSWORD`: Strong password for PostgreSQL.
   - `DEV_SEED_USER_PASSWORD`: Default password for pre-seeded demo accounts.
   - `AUTH_REFRESH_COOKIE_SECURE`: Set to `true` when running behind an SSL/TLS reverse proxy (e.g., Cloudflare, Traefik, Let's Encrypt).

---

## 4. Single-Command Launch

Launch the entire stack using Docker Compose:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Startup Flow (Automated)

1. `postgres` and `redis` start first and pass internal health checks.
2. `api` starts upon database & cache readiness.
   - Executes `npx prisma migrate deploy` (applying all 10 approved migrations safely).
   - Executes `npm run seed:demo` (idempotently provisioning sample courses, simulation assets, and community posts).
   - Launches Express on port 4000.
3. `web` compiles frontend static assets via multi-stage build, loads Nginx, and binds to port 80.

---

## 5. Pre-Seeded Client Demo Accounts

Upon initial launch, the system automatically populates the database with realistic demo data so clients immediately experience a rich, populated environment:

| Role / User | Email | Default Password | Initial State |
| :--- | :--- | :--- | :--- |
| **Demo Learner** | `alex.demo2026@aura.internal` | `DemoClientPassword2026!` (or `.env` value) | Active user, posted market volatility analysis |
| **Platform Dev 1** | `dev.user1@aura.internal` | `DemoClientPassword2026!` | Active user, posted simulation execution notes |
| **Platform Dev 2** | `dev.user2@aura.internal` | `DemoClientPassword2026!` | Active user, posted defensive rebalancing guide |

### Available Demo Curricula & Simulation Assets

- **Academy**:
  - `Stock Investing 101` (*Market Basics & Order Mechanics*, *Order Book Depth & Spread Analysis*)
  - `Options & Derivatives Trading` (*The Options Greeks: Delta, Gamma, Theta*)
- **Simulation**:
  - Battleground Map 1 (FOMO Arena) & Map 2 (Pro Room)
  - Active assets: `AURA` ($152.50), `AAPL` ($224.30), `MSFT` ($448.20), `NVDA` ($128.90) across discrete economic cycles.
- **Community**:
  - Populated feed discussions with comments, author avatars, and timestamps.

---

## 6. Health & Readiness Verification

Verify deployment health with curl:

```bash
# 1. Process Liveness Check (Heartbeat)
curl -i http://localhost/health/liveness
# Expected: HTTP 200 OK {"status":"healthy","service":"aura-api",...}

# 2. Infrastructure Readiness Check (PostgreSQL & Redis Probe)
curl -i http://localhost/health/readiness
# Expected: HTTP 200 OK {"status":"ready","service":"aura-api","checks":{"database":"healthy","redis":"healthy"},...}

# 3. Frontend Web Entrypoint
curl -i http://localhost/
# Expected: HTTP 200 OK (Serving index.html with security headers)
```

---

## 7. Operations & Maintenance Runbook

### Viewing Service Logs
```bash
# Stream all logs
docker compose -f docker-compose.prod.yml logs -f

# View API logs only
docker compose -f docker-compose.prod.yml logs -f api

# View Nginx access & error logs
docker compose -f docker-compose.prod.yml logs -f web
```

### Database Backups
```bash
# Create a point-in-time PostgreSQL backup
docker exec -t aura-postgres-prod pg_dump -U postgres aura_capital_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from a backup
cat backup_file.sql | docker exec -i aura-postgres-prod psql -U postgres -d aura_capital_prod
```

### Graceful Shutdown & Restart
```bash
# Graceful shutdown (SIGTERM signal dispatched to Node.js and Nginx)
docker compose -f docker-compose.prod.yml down

# Restart all services
docker compose -f docker-compose.prod.yml restart
```

### Updating & Redeploying
```bash
git pull origin main
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```
*(Migrations and seed packs automatically run on container restart without downtime to existing data)*.
