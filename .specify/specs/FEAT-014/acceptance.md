# Acceptance Criteria: FEAT-014 Core Domain Constraint Baseline

**Status**: APPROVED FOR IMPLEMENTATION

## 1. Acceptance Matrix

| ID | Criterion | Verification |
|----|-----------|--------------|
| AC-001 | A reusable constraint standards document exists and is linked or referenced by implementation evidence. | Docs/report review. |
| AC-002 | Standards classify rules as `MUST`, `SHOULD`, or `DOMAIN-SPECIFIC DECISION`. | Docs review. |
| AC-003 | Standards cover future domain schemas without creating concrete product-domain tables. | Docs/schema review. |
| AC-004 | Prohibited patterns are documented, including product-domain placeholder tables, application-only durable invariants, and unapproved destructive migrations. | Docs review. |
| AC-005 | Exception process requires written rationale, risk assessment, tests, and explicit Human approval for `MUST` exceptions. | Docs review. |
| AC-006 | No global soft-delete convention is introduced; soft delete remains a later domain-specific decision. | Docs/schema review. |
| AC-007 | UUID primary key standard is defined and representative live PostgreSQL evidence proves UUID PK behavior. | Docs and PostgreSQL-backed tests. |
| AC-008 | Foreign key and relationship cardinality standards are defined and invalid references are rejected by PostgreSQL. | Docs and PostgreSQL-backed tests. |
| AC-009 | Required durable invariants use database-level `NOT NULL`; missing required values are rejected by PostgreSQL. | Docs and PostgreSQL-backed tests. |
| AC-010 | Unique constraint standard is defined and duplicate unique values are rejected by PostgreSQL. | Docs and PostgreSQL-backed tests. |
| AC-011 | Composite uniqueness standard is defined and duplicate composite pairs are rejected by PostgreSQL. | Docs and PostgreSQL-backed tests. |
| AC-012 | Index standards define integrity indexes, FK/query-path review, and avoidance of speculative indexes. | Docs/schema review. |
| AC-013 | Timestamp standards define mutable-record and immutable-event expectations. | Docs/schema review and tests where applicable. |
| AC-014 | Enum/status integrity standard requires database/Prisma closed-set enforcement where future domains define status values. | Docs and tests where applicable. |
| AC-015 | Delete policy standards define restrict/no-action, cascade, and set-null selection rules. | Docs review. |
| AC-016 | Existing approved deletion policies or test-only fixtures prove cascade/restrict/set-null behavior where feasible; unavailable categories are explicitly marked not applicable with rationale. | PostgreSQL tests/report review. |
| AC-017 | Relationship cardinality standards require one-to-one uniqueness, one-to-many FK, and many-to-many composite uniqueness. | Docs/schema review. |
| AC-018 | Specification and standards explicitly state application validation MUST NOT replace PostgreSQL constraints. | Docs review. |
| AC-019 | Duplicate/concurrency race handling relies on database constraints, not only pre-checks. | Source/test review. |
| AC-020 | Constraint errors are mapped or handled safely without exposing raw DB internals. | Tests/output review. |
| AC-021 | Live PostgreSQL constraint verification runs against an isolated test database. | Command evidence. |
| AC-022 | Test/log/report output does not expose raw database URLs, credentials, secrets, tokens, cookies, passwords, SQL values, or sensitive absolute local paths. | Output review and tests. |
| AC-023 | Validation uses existing approved schema or dedicated test-only fixtures/helpers and does not add product-domain migrations. | Source/schema/migration review. |
| AC-024 | PostgreSQL validation covers UUID, FK, NOT NULL, unique, composite unique, and applicable deletion/status behavior. | DB test evidence. |
| AC-025 | Constraint verification is deterministic and has no skips caused by missing setup. | Test evidence. |
| AC-026 | Fresh migration deploy/status remains clean under FEAT-012 governance. | Migration command evidence. |
| AC-027 | No destructive/data-loss migration is introduced without explicit Human approval. | Migration review. |
| AC-028 | No Academy, Simulation, Community, Subscription, AI, placeholder product tables, product APIs, UI, seed behavior, Redis health behavior, or product audit table is introduced. | Source/schema review. |
| AC-029 | FEAT-002 through FEAT-013 regression validation remains green. | Full validation evidence. |
| AC-030 | Existing guards remain green: persistence, migration, and repository boundary. | Guard command evidence. |
| AC-031 | `reports/implementation/phase-3/FEAT-014.md` exists and truthfully records standards, evidence, validation, limitations, and AC mapping. | Report review. |
| AC-032 | Governance state remains consistent: FEAT-014 in QA/review after implementation, FEAT-015+ blocked as applicable, Phase 3 in progress, Phase 4 blocked. | Tracker/report review. |

## 2. PASS Requirements

FEAT-014 may receive QA PASS only when:

- AC-001 through AC-032 pass.
- Constraint standards are documented and objectively testable.
- Live PostgreSQL evidence proves representative DB constraint enforcement.
- No product-domain schema or behavior is introduced.
- No global soft-delete convention is introduced.
- No destructive/data-loss migration is introduced without explicit Human approval.
- FEAT-002 through FEAT-013 regression remains green.
- No unresolved P0/P1 data-integrity or security defect remains.

## 3. FAIL Conditions

FEAT-014 must fail QA if any of the following are true:

- The implementation creates Academy, Simulation, Community, Subscription, AI, or placeholder product-domain tables.
- Application validation is presented as a replacement for PostgreSQL constraints.
- Required durable invariants lack database constraint coverage without approved exception.
- Live PostgreSQL constraint verification is missing, skipped, or simulated while reported as executed.
- Destructive migration is introduced without explicit Human approval.
- Global soft-delete behavior is introduced.
- FEAT-002 through FEAT-013 behavior regresses.
- Implementation evidence claims validation passed without actual evidence.

## 4. Required Validation Suite

Expected validation:

```text
npm run clean
npm run lint
npx prisma validate --schema=apps/api/prisma/schema.prisma
npm run typecheck
npm run build
npm run test
npm run test:db
npm run test:redis
npm run guard:persistence
npm run guard:migration
npm run guard:boundary
```

FEAT-014 must also provide live isolated PostgreSQL constraint verification evidence. If implementation adds a dedicated constraint guard command, QA must run it independently.

## 5. Human Review Checklist

- [ ] FEAT-014 scope is limited to reusable constraint standards and validation.
- [ ] No concrete product-domain tables are specified.
- [ ] No global soft-delete convention is introduced.
- [ ] Application validation is explicitly complementary to PostgreSQL constraints.
- [ ] Destructive migration requires explicit Human approval.
- [ ] Acceptance criteria are independently testable.
- [ ] FEAT-015 remains blocked until FEAT-014 receives Human Final Gate approval or Human explicitly changes sequencing.

## 6. Final Gate

Implementation may begin only after Human approval of this spec package. FEAT-015 and later Phase 3 implementation must not begin from this package.
