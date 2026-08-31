# Aura Capital — Greenfield Rebuild

> An AI-assisted financial learning and investment simulation platform built on production-grade modular monolith foundations.

---

## 1. Project Architecture

The repository is structured as a **modular monolith** with npm workspaces:

```text
aura-capital/
├── apps/
│   ├── api/          # Node.js + Express + TypeScript backend
│   └── web/          # React + Vite + TypeScript frontend
├── packages/
│   └── shared/       # Shared schemas (Zod), types, and constants
├── docs/             # Governance, architecture, UI, and coding standards
├── reports/          # Implementation and QA verification reports
├── docker-compose.yml# Local development services (PostgreSQL, Redis)
└── .specify/         # Spec-Driven Development artifacts (FEAT-001)
```

---

## 2. Quickstart & Local Development

### Prerequisites

- **Node.js**: `v20+` or `v22+` (LTS recommended)
- **npm**: `v10+`
- **Docker** *(optional for Phase 1, recommended for PostgreSQL & Redis in Phase 3)*

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Environment Configuration

Copy the example environment file:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

Ensure `JWT_SECRET` is at least 32 characters long. Startup will fail fast if required secrets or configurations are missing or invalid.

### Step 3: Run Development Servers

Run both Web and API concurrently:

```bash
npm run dev
```

Or run individual apps:

```bash
# Start API only (http://localhost:4000)
npm run dev:api

# Start Web only (http://localhost:5173)
npm run dev:web
```

### Step 4: Verify API Health

```bash
curl http://localhost:4000/health
```

Expected output:

```json
{
  "status": "healthy",
  "service": "aura-api",
  "version": "0.1.0",
  "environment": "development",
  "timestamp": "2026-08-25T13:00:00.000Z",
  "uptime": 4.12
}
```

---

## 3. Quality Gates & Validation

All commands are runnable locally and enforced in CI:

| Command | Purpose |
| :--- | :--- |
| `npm run lint` | Run ESLint check across all workspaces |
| `npm run typecheck` | Strict TypeScript check without emitting files |
| `npm run test` | Run all unit, integration, and smoke tests |
| `npm run test:unit` | Run unit tests across workspaces |
| `npm run test:integration` | Run backend integration tests |
| `npm run test:e2e` | Run web smoke tests |
| `npm run build` | Build all production packages and applications |

---

## 4. Local Infrastructure & Database

To launch local PostgreSQL and Redis containers for development:

```bash
docker compose up -d
```

### Prisma & Database Migrations (Phase 2 Identity Baseline)

```bash
# Generate Prisma Client
npm run prisma:generate --workspace=@aura/api

# Apply migrations to development database
npm run prisma:migrate:deploy --workspace=@aura/api
```

### Isolated Test Database Setup & Safety Guard

Database-backed tests are strictly protected by `assertSafeTestDatabase`:
- Tests require `NODE_ENV=test`.
- The database target must contain an explicit test marker (e.g. `postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test` or `TEST_DATABASE_URL`).
- Development (`aura_capital_dev`), staging, and production databases are **strictly rejected** by the guard to prevent accidental data contamination or destructive mutations.

```bash
# Apply migrations to isolated test database
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test" npm run prisma:migrate:deploy --workspace=@aura/api

# Run PostgreSQL-backed database constraints test suite against isolated test database
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test" npm run test:db
```

---

## 5. Security & Engineering Standards

- **Server-Authoritative**: Business logic, balances, and prices are owned strictly by the server.
- **Fail-Fast Configuration**: Server will not start if required environment variables are absent.
- **Zero Fallback Secrets**: No hard-coded fallback secrets exist in production code.
- **Standardized Error Responses**: Controlled errors follow `{ error: { code, message, requestId } }`.
- **Structured Logs**: Logs are serialized as structured JSON and redact sensitive credentials.
