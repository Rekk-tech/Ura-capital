# Aura Capital — Final Technology Decisions

**Status**: Approved for Phase 0 Governance  
**Date**: 2026-08-25  
**Scope**: Greenfield rebuild through Production MVP  
**Source Context**: `project-overview.md`, `architecture-context.md`, `code-standards.md`, `ui-context.md`, `ai-workflow-rules.md`, FEAT-001 artifacts and QA report

## Decision Summary

| Area | Selected Option |
|------|-----------------|
| Frontend framework | React + TypeScript + Vite |
| Backend framework | Node.js + TypeScript + Express |
| Repository structure | npm workspaces monorepo: `apps/web`, `apps/api`, `packages/shared` |
| Primary database | PostgreSQL |
| ORM/query strategy | Prisma for migrations and database access, with repositories isolating Prisma from domain logic |
| Redis usage | Transient/distributed state only |
| Validation library | Zod |
| Authentication/session strategy | Short-lived access token plus rotated, revocable HttpOnly refresh token |
| Testing stack | Vitest, Supertest, Testing Library/JSDOM, Playwright for later browser E2E |
| Observability stack | OpenTelemetry-ready structured logs, metrics, traces, and audit events |
| CI/CD baseline | GitHub Actions |
| Containerization/development environment | Docker Compose for local PostgreSQL and Redis; Docker images for deployable services |

## 1. Frontend Framework

**Selected**: React + TypeScript + Vite.

**Rationale**:

- Matches FEAT-001 implementation and current repository baseline.
- Supports the planned UI feature areas: auth, dashboard, academy, simulation, portfolio, community, profile, admin, and Aura Intelligence.
- TypeScript aligns UI contracts with API/shared schemas.
- Vite provides a fast local development baseline without adding framework-level server rendering decisions too early.

**Rejected Alternatives**:

- Next.js: useful for SSR and routing conventions, but not required for the current app-shell and dashboard-oriented product. It would add deployment/runtime decisions before they are justified.
- Vue/Svelte: viable frontend options, but would conflict with the approved architecture context and FEAT-001 baseline.

**Implications**:

- Frontend server state should use TanStack Query.
- Feature code belongs under `apps/web/src/features/`.
- Full product screens arrive in later feature phases, not Phase 0 or FEAT-001.

## 2. Backend Framework

**Selected**: Node.js + TypeScript + Express.

**Rationale**:

- FEAT-001 already created and QA-approved an Express API foundation.
- Express keeps the modular monolith explicit without committing to a heavier framework before domain complexity requires it.
- The project code standards already enforce controller/service/repository boundaries, so module discipline is handled by conventions and review gates.

**Rejected Alternatives**:

- NestJS: strong for larger enterprise modules, dependency injection, and conventions; rejected for now because it would replace a working FEAT-001 baseline and add framework complexity before Identity/Data phases prove the need.
- Fastify: performant and schema-friendly, but Express has already passed FEAT-001 and is sufficient for Production MVP foundation.

**Implications**:

- Backend modules must follow `controller -> service -> repository`.
- Express middleware owns cross-cutting concerns such as request IDs, error envelopes, logging, validation, auth guards, rate limits, and security headers.
- A switch to NestJS later would require an ADR amendment and migration plan.

## 3. Repository Structure

**Selected**: npm workspaces monorepo.

```text
apps/
  web/
  api/
packages/
  shared/
```

**Rationale**:

- Matches FEAT-001 accepted structure.
- Keeps frontend, backend, and shared contracts in one repository for early product velocity.
- Avoids microservice coordination while the product domains are still being rebuilt.

**Rejected Alternatives**:

- Polyrepo: premature and would slow shared schema/contract evolution.
- Single app folder: weak boundaries for frontend/backend/shared ownership.
- Microservices: explicitly rejected by architecture context until scale or ownership requires it.

**Implications**:

- Shared package must stay focused on contracts, constants, schemas, and types.
- Domain business logic stays inside the owning API module, not in `packages/shared`.
- CI validates all workspaces.

## 4. Primary Database

**Selected**: PostgreSQL.

**Rationale**:

- Durable relational state is central to users, auth, courses, quizzes, simulation sessions, orders, trades, portfolios, community, subscriptions, AI conversations, and audit logs.
- Constraints and transactions are required for correctness in auth, rewards, trades, settlement, subscriptions, and moderation.
- Replaces prototype JSON-file persistence as the production source of truth.

**Rejected Alternatives**:

- JSON files: explicitly rejected by project assessment.
- MongoDB/document DB: less suitable for relational integrity and transaction-heavy simulation/accounting flows.
- SQLite: useful for local experiments, insufficient as the primary Production MVP database.

**Implications**:

- Durable business state must be persisted in PostgreSQL.
- Database constraints must protect core integrity.
- Phase 3 must define migrations, repositories, transactions, and isolated integration-test database strategy.

## 5. ORM / Query Strategy

**Selected**: Prisma.

**Rationale**:

- TypeScript-native schema, generated types, and migration workflow fit the selected stack.
- Provides a clean entry point for Phase 3 migrations and repository implementation.
- Strong enough for relational models while still allowing raw SQL for carefully reviewed performance-critical queries.

**Rejected Alternatives**:

- Drizzle: excellent lightweight SQL-first option, but Prisma has broader migration/client conventions and lower onboarding friction for this rebuild.
- TypeORM: mature but heavier, with more decorator/ORM complexity than needed.
- Handwritten SQL only: maximally explicit, but increases boilerplate and migration discipline burden at this stage.

**Implications**:

- Prisma must be used behind repositories; controllers and services must not couple to raw Prisma query details.
- Transaction boundaries belong in services/repositories.
- Raw SQL requires architectural justification and tests.

## 6. Redis Usage

**Selected**: Redis for transient and distributed state only.

**Allowed Uses**:

- Rate limits.
- Short-lived sessions or token metadata where appropriate.
- Cache.
- Distributed locks.
- Simulation transient state.
- Leaderboard cache.
- AI quota counters.

**Rationale**:

- Redis is valuable for fast, expiring, distributed coordination.
- The project explicitly requires PostgreSQL to remain the durable source of truth.

**Rejected Alternatives**:

- Redis as durable business store: rejected because it weakens auditability and persistence guarantees.
- No Redis: rejected because rate limiting, AI quota, distributed locks, and simulation coordination need a transient-state tool.

**Implications**:

- Every Redis-backed business-sensitive flow needs a PostgreSQL durability/audit strategy where data must survive.
- Redis outage behavior must be defined per feature.

## 7. Validation Library

**Selected**: Zod.

**Rationale**:

- Already present in FEAT-001 shared schemas and environment validation.
- TypeScript inference keeps runtime validation and compile-time types aligned.
- Code standards require external input validation using Zod or an approved equivalent.

**Rejected Alternatives**:

- Joi/Yup: valid validators but weaker TypeScript-first alignment for this stack.
- Manual validation: too error-prone for a financial learning and simulation platform.

**Implications**:

- Validate `req.body`, `req.params`, `req.query`, environment configuration, external API responses where necessary, and AI structured outputs.
- Schemas shared across API and web can live in `packages/shared` only when they are true cross-boundary contracts.

## 8. Authentication / Session Strategy

**Selected**:

- Access token: short-lived, 5-15 minutes.
- Refresh token: HttpOnly, Secure, SameSite, rotated, revocable.
- Refresh token persistence: PostgreSQL.
- Optional Redis support: rate limits, token replay detection/cache, short-lived session acceleration.

**Rationale**:

- Matches architecture context and addresses legacy fallback-secret weakness.
- Supports server-enforced authorization and session revocation.
- Keeps durable auth/session auditability in PostgreSQL.

**Rejected Alternatives**:

- Long-lived access tokens: weak revocation and higher compromise impact.
- Browser-readable refresh tokens: unacceptable XSS exposure.
- Stateless refresh tokens only: weak revocation and audit story.

**Implications**:

- Phase 2 must implement password hashing, registration, login, refresh rotation, logout/revocation, role guards, admin guard, and auth audit events.
- No fallback JWT secret is allowed.
- Startup must fail when required secrets are missing.

## 9. Testing Stack

**Selected**:

- Vitest for unit tests.
- Supertest for API integration tests.
- Testing Library + JSDOM for component/smoke tests.
- Playwright for browser E2E in later UI/product phases.

**Rationale**:

- FEAT-001 validates Vitest, Supertest, and JSDOM smoke coverage.
- Playwright remains the right tool for full browser flows when critical user journeys exist.

**Rejected Alternatives**:

- Jest: mature, but Vitest aligns well with Vite/TypeScript and current baseline.
- Cypress: viable E2E alternative, but Playwright is already the selected architecture baseline.

**Implications**:

- Critical business flows need behavior-focused tests.
- CI must run lint, typecheck, build, and tests deterministically from clean checkout.

## 10. Observability Stack

**Selected**: OpenTelemetry-ready instrumentation plus structured logs and audit events.

**Rationale**:

- Architecture context requires tracking request IDs, trace IDs, user IDs, actions, latency, error categories, AI model usage, token usage, estimated cost, and prompt version.
- FEAT-001 already provides structured request logs and request IDs.

**Rejected Alternatives**:

- Console-only ad hoc logs: rejected by code standards.
- Vendor-specific instrumentation first: premature before deployment targets are finalized.

**Implications**:

- Phase 10 will harden logs, metrics, traces, dashboards, and deployment observability.
- High-value actions must emit audit events.
- AI usage must be observable and rate-limited.

## 11. CI/CD Baseline

**Selected**: GitHub Actions.

**Rationale**:

- Already implemented and QA-approved in FEAT-001.
- Fits current repository hosting assumptions and PR quality gates.

**Rejected Alternatives**:

- GitLab CI/CircleCI/etc.: viable, but no project need currently justifies switching.
- Manual-only validation: rejected by Definition of Success and AI workflow rules.

**Implications**:

- Pull requests must run install, lint, typecheck, build, and tests.
- Deployment workflow can be added later after staging/production targets are selected.

## 12. Containerization / Development Environment

**Selected**:

- Docker Compose for local PostgreSQL and Redis.
- Docker images for deployable web/API runtime once deployment environments are introduced.

**Rationale**:

- FEAT-001 includes local PostgreSQL and Redis service baseline.
- Docker keeps local infrastructure reproducible across developer machines and agents.

**Rejected Alternatives**:

- Local bare-metal database only: too inconsistent.
- Kubernetes in early phases: premature operational complexity.

**Implications**:

- Local `.env.example` must remain aligned with Docker Compose.
- Production secrets must come from environment/secret manager, not committed files.
- Deployment hardening belongs to later production-readiness phases.
