# Tasks: FEAT-018 Phase 3 Data Foundation Integration Gate

**Status**: APPROVED FOR IMPLEMENTATION  
**Implementation Rule**: Validation-only. Do not add product functionality. Do not begin Phase 4.

## 1. Governance And Context

- [x] T001 Read `docs/AGENT_WORKFLOW.md`, `docs/progress-tracker.md`, `docs/phase-3-feature-decomposition.md`, and FEAT-018 approved spec package. Maps to FR-001, FR-002, AC-001, AC-002.
- [x] T002 Review approved FEAT-011 through FEAT-017 spec packages, implementation reports, and QA reports. Maps to FR-002, AC-002.
- [x] T003 Confirm FEAT-011 through FEAT-017 are DONE / QA PASS / Human Final Gate APPROVED. Maps to FR-002, AC-003.
- [x] T004 Confirm FEAT-018 remains validation-only, Phase 3 remains IN_PROGRESS, and Phase 4 remains BLOCKED. Maps to FR-001, FR-032, AC-001, AC-039.

## 2. Static Scope And Boundary Review

- [x] T005 Search for product-domain schema, Academy/Simulation/Community/Subscription/AI models, product APIs, product UI, product audit table/API/UI, durable Redis business state, new auth behavior, new seed behavior, and Phase 4 behavior. Maps to FR-003, AC-001, AC-004.
- [x] T006 Review persistence boundary for `db.json`, flat-file DBs, mutable filesystem persistence, JSON fallback, and PostgreSQL/Redis failure fallback. Maps to FR-004, FR-005, AC-005, AC-006.
- [x] T007 Review Redis usages for transient-only authority and no durable business, privilege, audit, or seed state. Maps to FR-006, AC-007, AC-020.
- [x] T008 Review controllers, ordinary services, repositories, transaction runner, raw SQL, and Prisma import boundaries. Maps to FR-007, FR-008, AC-008, AC-009.
- [x] T009 Review FEAT-009 and FEAT-016 audit boundaries for AuthSecurityAuditRecord invariance, no product audit persistence, no public audit API/UI, metadata governance, and observability distinction. Maps to FR-023, FR-024, AC-028, AC-029.

## 3. Fresh Migration And Existing-Schema Upgrade

- [x] T010 Create fresh isolated PostgreSQL database `aura_capital_test_feat018_fresh` or stricter equivalent and set explicit `DATABASE_URL` / `TEST_DATABASE_URL`. Maps to FR-009, FR-029, AC-010.
- [x] T011 Verify migration/test DB safety guard accepts the FEAT-018 fresh DB and rejects local dev, staging, production, production-like, missing, and ambiguous targets before mutation. Maps to FR-029, AC-010, AC-011.
- [x] T012 Run `npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma` from zero-state and record ordered migration names/count. Maps to FR-009, FR-010, AC-012.
- [x] T013 Run `npx prisma migrate status --schema=apps/api/prisma/schema.prisma` and `npx prisma validate --schema=apps/api/prisma/schema.prisma`. Maps to FR-010, AC-013.
- [x] T014 Verify migration checksum/drift detection, applied migration integrity, monotonic ordering, immutable applied migration policy, and no seed data in migrations. Maps to FR-011, FR-013, AC-014, AC-015.
- [x] T015 Create representative existing-schema upgrade DB `aura_capital_test_feat018_upgrade` or stricter equivalent with approved user, credential, role, user-role, refresh session, auth security audit, and seed-compatible rows. Maps to FR-012, FR-029, AC-016.
- [x] T016 Apply current migrations to the upgrade DB and verify rows preserved plus unique/FK/key constraints still enforced. Maps to FR-011, FR-012, AC-016, AC-017.

## 4. Transaction And Constraint Integration

- [x] T017 Validate root UoW commit, forced rollback, DB constraint rollback, composed rollback, active-context reuse, accidental nested fail-fast, no second nested transaction, ALS cleanup, parallel isolation, and transaction client propagation. Maps to FR-014, AC-018, AC-019.
- [x] T018 Validate transaction-sensitive regressions for registration plus audit, role assignment plus audit, refresh/session security state, and FEAT-017 seed multi-write behavior. Maps to FR-015, AC-019.
- [x] T019 Validate live PostgreSQL constraints for UUID/PK, NOT NULL, unique, composite unique, FK, one-to-one, cascade, restrict/no-action, set-null, closed-set status, and concurrent duplicate protection. Maps to FR-016, FR-017, AC-021, AC-022.
- [x] T020 Confirm constraint validation uses approved existing schema and neutral test-only fixtures only, with no production product-domain migration. Maps to FR-017, AC-004, AC-022.

## 5. Redis, Rate Limit, And Seed Integration

- [x] T021 Run live Redis readiness, liveness independence, recovery, TTL, multi-instance, namespace, run/worker isolation, cleanup safety, and diagnostics checks. Maps to FR-018, AC-023, AC-024, AC-025.
- [x] T022 Validate FEAT-010A rate limiting remains fail-closed for protected auth endpoints and `/api/auth/*` aliases, with PostgreSQL state and durable audit unaffected on Redis outage/throttling. Maps to FR-019, AC-026.
- [x] T023 Validate FEAT-017 seed predicates, credential safety, no default ADMIN, test ADMIN opt-in, normal registration zero-role, cleanup ownership, run/worker isolation, no production/staging seed, and no product-domain seed data. Maps to FR-020, AC-027.

## 6. Auth/Security Regression And Guards

- [x] T024 Validate Phase 2 security regression: registration, login, strict role-free JWT, refresh rotation/replay, logout, RBAC, admin guard, auth audit, and rate limiting. Maps to FR-021, FR-022, AC-026, AC-030.
- [x] T025 Run `npm run guard:persistence`. Maps to FR-025, AC-031.
- [x] T026 Run `npm run guard:migration`. Maps to FR-025, AC-031.
- [x] T027 Run `npm run guard:boundary`. Maps to FR-025, AC-031.
- [x] T028 Run `npm run guard:audit-governance`. Maps to FR-025, AC-031.
- [x] T029 Run `npm run guard:seed-safety`. Maps to FR-025, AC-031.
- [x] T030 Confirm `guard:phase3-integration` is NOT REQUIRED by default; introduce it only if a concrete validation gap cannot be covered by mandatory guards or integration tests, and if introduced ensure it only orchestrates/verifies existing guards. Maps to FR-026, AC-032.

## 7. Full Validation Pipeline

- [x] T031 Run `npm run clean`. Maps to FR-027, AC-033.
- [x] T032 Run `npm run lint`. Maps to FR-027, AC-033.
- [x] T033 Run `npx prisma validate --schema=apps/api/prisma/schema.prisma`. Maps to FR-027, AC-033.
- [x] T034 Run `npm run typecheck`. Maps to FR-027, AC-033.
- [x] T035 Run `npm run build`. Maps to FR-027, AC-033.
- [x] T036 Run `npm run test` and record actual discovered counts. Maps to FR-027, FR-028, AC-033, AC-034.
- [x] T037 Run `npm run test:unit` and record actual discovered counts. Maps to FR-027, FR-028, AC-033, AC-034.
- [x] T038 Run `npm run test:db` against the FEAT-018 isolated DB strategy and record actual counts/skips. Maps to FR-027, FR-028, AC-010, AC-033, AC-034.
- [x] T039 Run `npm run test:redis` with live Redis and isolated namespace strategy and record actual counts/skips. Maps to FR-027, FR-028, AC-023, AC-033, AC-034.

## 8. Security, Reporting, And Gate Decision

- [x] T040 Verify logs, diagnostics, reports, DB rows, Redis output, and test failures do not expose secrets, credentials, tokens, cookies, passwords, hashes, raw DB/Redis URLs, SQL sensitive values, or sensitive absolute paths. Maps to FR-028, AC-035.
- [x] T041 If any mandatory PostgreSQL/Redis/Docker/Prisma/test infrastructure is unavailable, record ENVIRONMENT BLOCKED / NOT VERIFIED and do not claim PASS. Maps to FR-027, AC-036.
- [x] T042 Classify all findings using P0/P1/P2/P3 severity rules. Maps to FR-029, AC-037.
- [x] T043 Map any defect to the owning feature and required rework area without changing approved earlier specs to hide the defect. Maps to FR-030, AC-037.
- [x] T044 Produce `reports/implementation/phase-3/FEAT-018.md` with files changed, validation-only proof, command evidence, actual counts, AC mapping, defects/technical debt, and Phase 3 exit recommendation. Maps to FR-031, AC-038.
- [x] T045 Confirm Phase 3 remains IN_PROGRESS, FEAT-018 awaits QA/Human Final Gate, and Phase 4 remains BLOCKED. Maps to FR-032, AC-039.

## 9. Dependencies

- T001 through T004 must complete before any validation evidence is accepted.
- T005 through T009 may run in parallel after context review.
- T010 through T016 must run sequentially because they mutate isolated PostgreSQL targets.
- T017 through T020 require successful migration setup.
- T021 through T023 require live Redis and approved isolated namespaces.
- T024 through T030 may run after build/test setup is available.
- T031 through T039 should run as a single sequential full validation pipeline.
- T040 through T045 require all prior evidence.

## 10. Explicit Non-Tasks

- Do not create product-domain tables.
- Do not add Academy, Simulation, Community, Subscription, or AI behavior.
- Do not add business APIs or UI.
- Do not add product audit tables.
- Do not move durable authority to Redis.
- Do not change auth/session/RBAC/audit/rate-limit behavior.
- Do not add seed behavior beyond validation-only evidence.
- Do not start Phase 4.
