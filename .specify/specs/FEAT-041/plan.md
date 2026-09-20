# FEAT-041 Plan: Community Persistence Foundation

Status: APPROVED FOR IMPLEMENTATION

## Delivery Sequence

1. Record the approved schema inventory and Phase 5 migration baseline.
2. Add Community Prisma models and explicit relations to `User`.
3. Generate one additive FEAT-041 migration with database checks and indexes.
4. Add Community repository interfaces and factory-backed Prisma implementations.
5. Add unit/static boundary tests for repository contracts.
6. Add live PostgreSQL tests for every durable invariant and concurrency race.
7. Validate a fresh isolated database and an independent Phase 5 upgrade database.
8. Run canonical validation and publish the implementation report.

## Migration Impact

Adds `community_posts`, `community_comments`, and `community_post_likes`. No existing table is dropped, renamed, or semantically changed except adding Prisma relation declarations to `User`. No data backfill is required.

## Test Strategy

- Unit: repository mapping and safe error mapping.
- Static: controller/service Prisma boundaries remain green.
- PostgreSQL: constraints, indexes, FK delete behavior, duplicate and concurrent likes.
- Migration: fresh deploy/status and Phase 5 upgrade preservation.
- Regression: canonical 14, including DB, Redis, and all governance guards.

## Risks

- Unicode length checks must match application semantics.
- Logical removal retains content in PostgreSQL; retention/erasure remains future governance.
- User deletion becomes restricted when authored content exists.
- Incorrect cascade choices could destroy threads; deletion tests are mandatory.

## Completion Gate

FEAT-041 may reach QA only when migration, repository boundaries, all live DB constraints, upgrade preservation, and canonical validation pass with no mandatory skips. FEAT-042..044 remain implementation-blocked until Human approval and FEAT-041 Human Final Gate.
