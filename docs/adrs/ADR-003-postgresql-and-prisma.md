# ADR-003: PostgreSQL Persistence with Prisma Repository Boundary

**Status**: Accepted  
**Date**: 2026-08-25

## Context

Aura Capital requires durable relational state for users, roles, refresh tokens, courses, quiz attempts, simulation sessions, orders, trades, positions, posts, subscriptions, AI conversations, and audit logs. The legacy JSON-file persistence is explicitly rejected.

## Decision

Use PostgreSQL as the durable source of truth. Use Prisma for migrations and database access, isolated behind repositories.

## Rationale

- PostgreSQL supports transactions, constraints, relational integrity, and auditability.
- Prisma fits the TypeScript stack with typed client generation and migrations.
- Repository boundaries prevent controllers/services from coupling directly to database details.

## Rejected Alternatives

- JSON files: rejected as non-production persistence.
- MongoDB/document DB: rejected for relational and transaction-heavy domain needs.
- SQLite as primary: rejected for Production MVP durability/scale expectations.
- Handwritten SQL only: rejected for initial rebuild due to migration/type-safety overhead.
- TypeORM: rejected as heavier than needed.
- Drizzle: viable, but Prisma provides stronger onboarding and migration conventions for this phase.

## Consequences

- Phase 3 must define Prisma schema, migrations, repository patterns, and transaction strategy.
- Raw SQL is allowed only when justified, tested, and contained behind repositories.
- PostgreSQL constraints must protect core data integrity.
