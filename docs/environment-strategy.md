# Aura Capital — Environment Strategy

**Status**: Approved for Phase 0 Governance  
**Date**: 2026-08-25  
**Scope**: Local, test, CI, staging, and production configuration policy

## Principles

- Configuration is environment-specific and validated at startup.
- No production fallback secrets are allowed.
- `.env.example` may contain safe dummy values only.
- `.env` is local-only and must never be committed.
- PostgreSQL owns durable state; Redis owns transient/distributed state.
- Test and CI environments must be isolated from local, staging, and production data.
- Any command or report claiming validation must be backed by actual execution evidence.

## Environment Matrix

| Environment | Purpose | Data Isolation | Secrets Source | Database/Redis |
|-------------|---------|----------------|----------------|----------------|
| Local | Developer and agent implementation | Developer-local only | Local `.env` copied from `.env.example` | Docker Compose PostgreSQL/Redis by default |
| Test | Unit/integration test execution | Ephemeral test process; no production data | Test env variables in test setup or CI env | Isolated test database/Redis when integration requires real services |
| CI | Pull request and branch validation | Fresh checkout/build workspace | GitHub Actions env/secrets | No production data; future DB tests must use isolated services |
| Staging | Production-like validation before release | Dedicated staging data only | Secret manager or protected CI/CD environment variables | Dedicated staging PostgreSQL/Redis |
| Production | Live system | Production data only | Secret manager or managed platform secrets | Dedicated managed PostgreSQL/Redis with backup/restore |

## Local

Local development uses:

- `npm install`
- `.env` copied from `.env.example`
- `npm run dev:web`
- `npm run dev:api`
- `docker compose up -d` when PostgreSQL/Redis are needed

Rules:

- `.env` must remain ignored by git.
- `.env.example` must stay safe and synchronized with Docker Compose defaults.
- Local database content is disposable unless a feature explicitly defines seed or migration procedures.

## Test

Test execution uses:

- `NODE_ENV=test`
- Safe test secrets with no production value.
- Vitest for unit/integration tests.
- Supertest for API integration tests.
- JSDOM/Testing Library for component smoke tests.
- Playwright for future browser-level E2E tests.

Rules:

- Tests must not require production secrets.
- Tests must not mutate local development data unless explicitly documented.
- Future database integration tests must use an isolated test database and cleanup strategy.
- Redis-backed tests must use isolated keys or isolated Redis instance/database.

## CI

CI uses GitHub Actions.

Required validation categories:

1. Install dependencies with `npm ci`.
2. Run lint.
3. Run typecheck.
4. Run build.
5. Run tests.

Current ordering intentionally runs build before tests because API production artifact smoke tests validate built output.

Rules:

- CI must be deterministic from a clean checkout.
- CI environment variables must use safe test values.
- CI must not require developer-local `.env`.
- Future CI database/Redis tests must provision isolated service containers or managed test services.

## Staging

Staging is not yet implemented but is required before controlled production release.

Rules:

- Staging must use separate PostgreSQL and Redis instances.
- Staging secrets must come from a secret manager or protected CI/CD environment variables.
- Staging should mirror production configuration as closely as practical.
- Staging data must not be copied from production unless explicitly approved and sanitized.
- Deployment smoke tests must include API health, web availability, migrations, and critical auth checks once those phases exist.

## Production

Production is not yet implemented.

Rules:

- Production secrets must never live in `.env`, repository files, screenshots, logs, or reports.
- Production startup must fail when required config is missing or invalid.
- PostgreSQL must have backup/restore policy before production readiness PASS.
- Redis must not be the only source of truth for durable business data.
- High-value actions must produce audit events.
- AI usage must be rate-limited, quota-controlled, and observable.

## Required Configuration Categories

Current and future environment variables include:

- Runtime: `NODE_ENV`, `PORT`, `HOST`, `CORS_ORIGIN`
- Security: `JWT_SECRET`, future token/cookie settings
- Database: `DATABASE_URL`
- Redis: `REDIS_URL`
- AI: `GEMINI_API_KEY`, `AI_DAILY_QUOTA`
- Observability: future trace/exporter/log configuration

## Validation Rules

- Required variables must be validated at startup.
- Secret values must not be logged.
- Invalid configuration must stop the process before serving traffic.
- Optional variables must have documented behavior when absent.
- Production defaults must never silently weaken security.

## Database Isolation Expectations

- Local: `aura_capital_dev` or equivalent local database.
- Test: isolated test database per test run or reliable cleanup before/after tests.
- CI: isolated database service; no developer or staging data.
- Staging: dedicated staging database.
- Production: dedicated production database with backup/restore.

## Redis Isolation Expectations

- Local: local Docker Redis.
- Test/CI: isolated instance, database index, or key prefix.
- Staging: dedicated staging Redis.
- Production: dedicated production Redis.

Redis keys must use clear namespacing once feature modules introduce Redis-backed behavior.
