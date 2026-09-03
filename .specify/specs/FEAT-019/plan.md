# Plan: FEAT-019 Academy Domain Schema & Persistence Foundation

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-019  
**Phase**: Phase 4 - Academy

## 1. Approach

Implement the Academy persistence foundation as the first Phase 4 implementation feature.

The implementation must create only durable data structures and persistence-layer boundaries needed by later Academy features.

## 2. Architecture Decisions

| Decision | Selected Option | Rationale |
| --- | --- | --- |
| Durable authority | PostgreSQL | Required by ADR-003 and Phase 3. |
| ORM/migrations | Prisma migrate | Approved migration governance. |
| Repository boundary | Academy repositories behind interfaces/factory | Preserves FEAT-013. |
| Transaction readiness | Unit of Work compatible repositories | Required for future quiz/progress/reward atomicity. |
| Quiz ownership | AcademyQuiz belongs to AcademyLesson only | Avoids nullable polymorphic ownership; course ownership is derived through Lesson. |
| Flashcard ownership | AcademyFlashcard belongs to AcademyLesson only | Keeps learner content hierarchy deterministic. |
| Quiz type baseline | Single-choice only | Narrowest safe baseline for Phase 4 learner flow. |
| Correct answer storage | Server-only `AcademyQuizOption.isCorrect` | Needed for future evaluation; must never be exposed before submission. PostgreSQL must enforce exactly one correct option per question. |
| Attempt history | Immutable snapshot fields plus restrictive content deletion | Preserves historical attempt meaning without implementing CMS/versioning. |
| Reward idempotency | Unique `(userId, sourceType, sourceId, rewardType)`; optional global deterministic idempotencyKey | PostgreSQL prevents duplicate rewards by semantic source. |
| XP authority | RewardLedger source of truth; AcademyUserXp materialized aggregate | Avoids two competing durable reward authorities. |
| Progress fields | Durable facts only; no client-authored percentage | Server calculation belongs to FEAT-026. |
| User deletion | RESTRICT / NO ACTION for Academy user history | Prevents silent history deletion or corruption. |
| Redis | Not used | FEAT-019 has no transient runtime need. |
| Product audit | Deferred | FEAT-016 activation requires explicit owning-feature approval. |
| CMS/admin authoring | Out of scope | Phase 4 default boundary is learner-facing Academy only. |

## 3. Workstreams

1. Governance and context review.
2. Domain schema design.
3. Prisma migration creation.
4. Repository interface/factory integration.
5. Constraint and migration tests.
6. Security/boundary guards.
7. Regression validation and reporting.

## 4. Migration Plan

- Add Academy migration after the three approved Phase 3 migrations.
- Use forward-only migration.
- No destructive changes to Phase 2/3 tables.
- No seed/content rows in migration.
- Validate from zero-state.
- Validate true incremental upgrade from an existing Phase 3 database containing representative Phase 2/3 rows:
  1. create isolated Phase 3 baseline DB,
  2. insert representative user, credential, role, user-role, refresh session, auth audit, and Phase 3 validation rows where applicable,
  3. capture before counts/IDs/relationships/constraints,
  4. apply FEAT-019 Academy migration,
  5. capture after state,
  6. verify prior rows/constraints are unchanged,
  7. verify Academy schema exists with required constraints.

## 5. Repository Plan

Create an Academy persistence module following the established API structure:

```text
modules/academy/
  academy.repository.ts
  academy.types.ts
  academy.constants.ts
```

Exact filenames may vary if they match existing repository conventions.

Repository implementations must live in approved Prisma/infrastructure boundary locations and be constructed through the repository factory.

## 6. Test Plan

Run from repository root:

- `npm run clean`
- `npm run lint`
- `npx prisma validate --schema=apps/api/prisma/schema.prisma`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:db`
- `npm run test:redis`
- `npm run guard:persistence`
- `npm run guard:migration`
- `npm run guard:boundary`
- `npm run guard:audit-governance`
- `npm run guard:seed-safety`

PostgreSQL tests must use an isolated database such as:

```text
aura_capital_test_feat019
```

## 7. Risk Plan

| Risk | Mitigation |
| --- | --- |
| Correct answers leak through generated DTO/API | FEAT-019 adds no public API; add source/surface sentinel. |
| Schema overfits future product decisions | Keep behavior out; document deferred policies. |
| Reward idempotency under-specified | Require durable unique idempotency strategy now. |
| CMS scope creep | Explicitly exclude admin authoring/content management. |
| Product audit premature schema | Defer to FEAT-029 Human decision. |
| Historical attempts lose meaning after content changes | Add immutable attempt/answer snapshot fields and restrictive FK/delete policy. |
| Delete policy requires business logic not in scope | Use deterministic restrictive FK policy; defer draft deletion workflow. |

## 8. Handoff

Antigravity must create:

- Academy schema migration.
- Repository interfaces/implementations.
- PostgreSQL-backed tests.
- Updated validation evidence.
- `reports/implementation/phase-4/FEAT-019.md`.

Do not start FEAT-020.
