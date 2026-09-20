# FEAT-041 QA Report: Community Persistence Foundation

Feature: FEAT-041
Phase: Phase 6 - Community
QA Owner: Codex
QA Iteration: 1
Final Verdict: FAIL

## Executive Summary

Independent QA reproduced the fresh migration, Phase 5 upgrade, PostgreSQL suite, Redis suite, and canonical 14 successfully. Scope isolation, FK policies, content/status checks, like uniqueness, concurrency, repository factory integration, UoW rollback, Redis authority, audit separation, and seed safety are green.

FEAT-041 nevertheless fails the approved specification. The ordinary repository contract exposes physical post/comment deletion, `REMOVED` records can persist with `removed_at = NULL`, required index definitions do not match the QA contract, and the implementation report contains material false evidence about the migration baseline and actual PostgreSQL schema. FEAT-042 remains blocked.

## QA Independence

- QA execution and verdict owner: Codex.
- Implementation owner: DEV-B / Antigravity.
- Source reviewed at commit `fa8dde76dd977a5d66875b59d45f975c05f3cc79`.
- Branch: `feat/FEAT-041-community-persistence-foundation`.
- Fixed point for implementation diff: `main` at `545187e145e22070b0e4d7f729ceb644e4f35e63`.
- Published Phase 5 tag ancestry was also verified.
- Worktree was clean before QA; no implementation source was modified by QA.

## Scope Verification

PASS.

- Production Community models are limited to `CommunityPost`, `CommunityComment`, and `CommunityPostLike`.
- No Community HTTP route, controller, service, frontend, rate limiter, product audit persistence, or Redis persistence was introduced.
- No FEAT-042 application behavior exists.
- No materialized like/comment counters, nested-comment field, or comment-like model exists.

## Migration Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Exactly one Phase 6 migration | PASS | `20260919201500_feat041_community_foundation` is the only migration added relative to `main`. |
| Phase 1-5 migration immutability | PASS | Git diff contains no modification to the eight baseline migration files. |
| Forward-only/additive | PASS | Migration creates three tables, indexes, checks, and FKs; no drop/rename/truncate/backfill. |
| Seed-free | PASS | No DML or fixture data in migration. |
| Migration guard | PASS | 9 migrations, 9 digests, live integrity comparison green. |

The actual eight-migration Phase 5 baseline is:

1. `20260825000000_init_identity`
2. `20260825000001_feat005_refresh_session_rotation`
3. `20260827000000_feat009_audit_events`
4. `20260903000000_feat019_academy_foundation`
5. `20260906000000_feat024_active_attempt_constraint`
6. `20260907000000_feat025_grading_integrity_constraints`
7. `20260909000000_feat025_grading_state_constraint_fix`
8. `20260914072000_feat031_simulation_foundation`

## Fresh Database

PASS.

- Independent DB: `aura_capital_test_feat041_qa1`.
- `prisma migrate deploy`: PASS, 9/9 migrations applied from zero-state.
- `prisma migrate status`: PASS, schema up to date.
- `prisma validate`: PASS.
- Community tables, constraints, FKs, and indexes were queried directly from PostgreSQL metadata.

## Phase 5 Upgrade

PASS.

- The upgrade DB was recreated from zero.
- Eight Phase 5 migrations were deployed first.
- Representative Auth, Academy, and Simulation rows were inserted.
- FEAT-041 migration was then deployed and migration status reported up to date.
- Representative rows and relationships remained available.
- New Community content and uniqueness constraints were active after upgrade.
- Static SQL review confirms the FEAT-041 migration does not alter prior tables or constraints.

## Schema, Constraints, And FK Policies

| Area | Result | Evidence |
| --- | --- | --- |
| Server-controlled UUIDs | PASS | Prisma `@default(uuid())`; repository callers do not provide IDs. |
| Required ownership | PASS | Post/comment author FKs are NOT NULL and `RESTRICT`. |
| Comment parent post | PASS | Required FK and `RESTRICT`. |
| Like dependencies | PASS | User/post FKs use `CASCADE`. |
| Post content | PASS | PostgreSQL rejects blank/whitespace and length above 5000. |
| Comment content | PASS | PostgreSQL rejects blank/whitespace and length above 2000. |
| Status closed set | PASS | Only `VISIBLE`, `HIDDEN`, and `REMOVED` accepted. |
| Removal timestamp coherence | FAIL | PostgreSQL accepted a `REMOVED` post with `removed_at IS NULL`; repository input can explicitly reproduce the same state. |
| Materialized counters | PASS | No `likeCount`, `commentCount`, or global liked flag columns. |

## Index Verification

FAIL.

Direct `pg_indexes` inspection found:

- Correct: posts feed `(status, created_at DESC, id DESC)`.
- Correct: comments post `(post_id, created_at ASC, id ASC)`.
- Incorrect: posts author is `(author_id, created_at DESC)`; required `(author_id, created_at DESC, id DESC)`.
- Incorrect: comments author is `(author_id, created_at DESC)`; required `(author_id, created_at DESC, id DESC)`.
- Incorrect: likes post is `(post_id)`; required `(post_id, created_at DESC)`.
- Incorrect: likes user is `(user_id)`; required `(user_id, created_at DESC)`.
- Correct: unique `(user_id, post_id)`.

The integration suite verifies query output ordering but does not verify these index definitions from PostgreSQL metadata.

## Logical Removal Review

FAIL.

The approved architecture permits logical owner removal and does not expose public physical deletion. However, `ICommunityPostRepository` and `ICommunityCommentRepository` expose `deletePost` and `deleteComment`, and the root/UoW repository factory makes those methods available to ordinary future services. They are not isolated as maintenance/test-only primitives.

The status transition implementation also accepts `removedAt: null` for `status: "REMOVED"`, and create inputs can set `REMOVED` without a timestamp. A live SQL probe independently persisted a `REMOVED` row with `removed_at = NULL`.

## Like Uniqueness And Concurrency

PASS.

- Sequential duplicate: PostgreSQL unique constraint rejected the second insert.
- Five concurrent duplicate writes: exactly one succeeded, four were rejected, and one durable row remained.
- Caller-scoped unlike behavior remained isolated.

## Repository Architecture And UoW

PARTIAL / FAIL due to the logical-removal interface defect.

- Interfaces and Prisma implementations exist for all three repositories.
- The same implementation classes accept root and transaction clients.
- Repository factory and boundary guard pass.
- Multi-operation commit passes.
- Forced rollback passes.
- Independent live constraint-triggered rollback probe returned `constraintFailureObserved=true` and `partialPostsRemaining=0`.
- No second transaction abstraction was introduced.
- Physical delete remains exposed through ordinary repository interfaces and therefore blocks approval.

## Error Sanitization

PASS.

Known Prisma failures map to stable `AppError` envelopes. Unit and regression suites did not expose SQL, database URLs, credentials, host/port, content values, tokens, cookies, or sensitive paths through external messages.

## Authority And Safety Boundaries

| Boundary | Result |
| --- | --- |
| PostgreSQL durable Community authority | PASS |
| Redis Community durable authority | ZERO / PASS |
| Community product audit persistence | ZERO / PASS |
| `AuthSecurityAuditRecord` reuse | ZERO / PASS |
| Community production/default seeds | ZERO / PASS |
| Public Community API/UI | ZERO / PASS |
| FEAT-042 application code | ZERO / PASS |

## Canonical 14

| # | Command | Result | QA evidence |
| ---: | --- | --- | --- |
| 1 | `npm run clean` | PASS | Completed. |
| 2 | `npm run lint` | PASS | 0 errors. |
| 3 | `npx prisma validate --schema=apps/api/prisma/schema.prisma` | PASS | Schema valid. |
| 4 | `npm run typecheck` | PASS | All workspaces. |
| 5 | `npm run build` | PASS | API/shared/web built; existing Vite chunk advisory only. |
| 6 | `npm run test` | PASS | 84 files / 940 tests. |
| 7 | `npm run test:unit` | PASS | 60 files / 750 tests. |
| 8 | `npm run test:db` | PASS | 31 files / 419 tests, no mandatory skips. |
| 9 | `npm run test:redis` | PASS | 5 files / 50 tests, no mandatory skips. |
| 10 | `npm run guard:persistence` | PASS | 1 file / 14 tests. |
| 11 | `npm run guard:migration` | PASS | 9 migrations / 9 digests. |
| 12 | `npm run guard:boundary` | PASS | 15 controllers / 20 services / 8 repositories. |
| 13 | `npm run guard:audit-governance` | PASS | No prohibited product-audit behavior. |
| 14 | `npm run guard:seed-safety` | PASS | No unsafe seed behavior. |

The first sandboxed executions of Prisma/Vitest were blocked by local process/network sandbox policy. The canonical commands were rerun with approved execution access and passed; those sandbox failures are not implementation defects.

## Acceptance Criteria Matrix

| AC | Requirement | Evidence | Verdict |
| --- | --- | --- | --- |
| AC-001 | Exact Phase 5 baseline recorded | Repository has the correct eight migrations, but implementation report lists a different migration history. | FAIL |
| AC-002 | Prior migrations immutable | Only the FEAT-041 migration is new. | PASS |
| AC-003 | Server-generated UUID PKs | Prisma generates UUIDs; live inserts return UUIDs. | PASS |
| AC-004 | Required post ownership | NOT NULL author FK. | PASS |
| AC-005 | Required comment ownership | NOT NULL author FK. | PASS |
| AC-006 | Author FK restrict | Live delete rejection for authored post/comment. | PASS |
| AC-007 | Comment-post restrict | Live post deletion rejected while comment exists. | PASS |
| AC-008 | Like FK cascade | Live post/user deletion cascades likes. | PASS |
| AC-009 | Reject blank post | Live PostgreSQL check. | PASS |
| AC-010 | Reject post above 5000 | Live PostgreSQL check. | PASS |
| AC-011 | Reject invalid comment length | Live PostgreSQL checks. | PASS |
| AC-012 | Closed status set | Live PostgreSQL check. | PASS |
| AC-013 | Exact required indexes | Four index definitions do not match required ordering/columns. | FAIL |
| AC-014 | Unique user/post like | Sequential and concurrent live evidence. | PASS |
| AC-015 | No counters/nesting/leakage | Schema and metadata inspection. | PASS |
| AC-016 | One additive migration | Git and SQL inspection. | PASS |
| AC-017 | Seed/destructive/API-free migration | SQL and guards. | PASS |
| AC-018 | Safe repository interfaces exist | Interfaces exist but expose ordinary physical post/comment deletion contrary to logical-removal architecture. | FAIL |
| AC-019 | Root/transaction support and safe error mapping | Factory, unit tests, UoW and failure probes pass. | PASS |
| AC-020 | Factory boundary | Factory wiring and boundary guard pass. | PASS |
| AC-021 | Safe errors/diagnostics | Error probes and suites pass. | PASS |
| AC-022 | FK/delete policy evidence | Live DB suite covers each FK policy. | PASS |
| AC-023 | Five-write concurrency | Exactly one durable like. | PASS |
| AC-024 | Upstream boundaries unchanged | Scope scan and regressions pass. | PASS |
| AC-025 | Fresh DB reproducible | Independent zero-state deploy/status/validate pass. | PASS |
| AC-026 | Phase 5 upgrade preservation | Recreated upgrade validation passes. | PASS |
| AC-027 | Canonical 14 | 14/14 pass. | PASS |
| AC-028 | Truthful report and FEAT-042 absent | FEAT-042 is absent, but report contains material schema/migration inaccuracies. | FAIL |

Result: 24 PASS, 4 FAIL.

## Task Verification

| Task | Verdict | Evidence |
| --- | --- | --- |
| T001 | FAIL | Code has exact baseline, but the required recorded inventory in the implementation report is inaccurate. |
| T002 | FAIL | Models exist, but removal timestamp coherence is not enforced. |
| T003 | PASS | Content and closed-status checks exist. |
| T004 | FAIL | Four required index definitions are incomplete. |
| T005 | PASS | Unique like and no counters. |
| T006 | PASS | One additive seed-free migration. |
| T007 | FAIL | Interfaces exist but expose unsafe physical delete primitives to ordinary services. |
| T008 | FAIL | Post repository supports root/tx but exposes physical delete and permits `REMOVED`/null. |
| T009 | FAIL | Comment repository has the same logical-removal defects. |
| T010 | PASS | Like repository implemented and constrained. |
| T011 | PASS | Factory registration works for root/tx clients. |
| T012 | PASS | Mapping and safe-error unit evidence exists. |
| T013 | PASS | Live primitive/content/status tests pass. |
| T014 | PASS | Live FK/delete-policy tests pass. |
| T015 | PASS | Duplicate and concurrency tests pass. |
| T016 | PASS | No counters/nesting/product-domain leakage. |
| T017 | PASS | Independent fresh deploy/status/validate pass. |
| T018 | PASS | Phase 5 upgrade preservation reproduced. |
| T019 | PASS | Canonical 14 passes. |
| T020 | FAIL | Implementation report is not truthful about baseline/schema evidence. |

Result: 13 PASS, 7 FAIL.

## Defects

### DEF-001 - P1 - Physical deletion is exposed through ordinary Community repositories

- Files: `apps/api/src/modules/community/community.repository.ts`, `apps/api/src/infrastructure/database/repository-factory.ts`
- Affected AC: AC-018
- Expected: product-facing repository contracts expose logical transition to `REMOVED`; any physical maintenance primitive is isolated and unavailable to ordinary services.
- Actual: `deletePost` and `deleteComment` are public interface methods and are exposed through both root and transaction repository containers.
- Required fix: remove physical post/comment deletion from ordinary repository interfaces/containers, or move it to an explicitly approved maintenance/test-only boundary that product services cannot receive. Add boundary tests proving FEAT-042/043 cannot call physical delete.

### DEF-002 - P2 - `REMOVED` timestamp invariant can be bypassed

- Files: `apps/api/prisma/schema.prisma`, FEAT-041 migration, `community.types.ts`, `community.repository.ts`
- Affected AC: AC-018 and approved logical-removal specification
- Expected: a durable `REMOVED` post/comment always has `removedAt`; ordinary transition APIs cannot explicitly bypass it with null.
- Actual: DB has no coherence check; create inputs accept `REMOVED`; update inputs accept `removedAt: null`. PostgreSQL independently accepted `REMOVED` with `removed_at IS NULL`.
- Required fix: enforce status/timestamp coherence at PostgreSQL level and in repository contracts, then add adversarial post and comment tests for direct DB writes and explicit-null repository calls.

### DEF-003 - P2 - Required Community index definitions are incomplete

- Files: `apps/api/prisma/schema.prisma`, FEAT-041 migration, `community-persistence-db.test.ts`
- Affected AC: AC-013
- Expected: exact author and like indexes include deterministic ordering: post/comment author indexes include `id DESC`; post/user like indexes include `created_at DESC`.
- Actual: both author indexes omit `id`; both like indexes omit `created_at`. Tests check result ordering but not actual PostgreSQL index metadata.
- Required fix: correct Prisma/migration definitions and add metadata assertions for every required index and sort direction.

### DEF-004 - P2 - Implementation report contains material false evidence

- File: `reports/implementation/phase-6/FEAT-041.md`
- Affected AC: AC-001, AC-028
- Expected: exact migration names and actual PostgreSQL schema/index/constraint evidence.
- Actual: report lists migrations that do not exist in this branch and omits actual migrations; it describes Community IDs as PostgreSQL UUIDs with `gen_random_uuid()` defaults although the migration uses `TEXT NOT NULL` with Prisma-side generation; it describes `VARCHAR` columns and constraint names that differ from the actual SQL; it omits `removed_at` from its field inventory.
- Required fix: rewrite only the inaccurate evidence using actual repository and PostgreSQL metadata, preserve the successful validation counts, and record QA1 FAIL plus these defects.

## Severity Summary

- P0: 0
- P1: 1
- P2: 3
- P3: 0
- Advisories: 1 - the upgrade verification script temporarily moves the live migration directory; a temporary copied migration workspace would be more interruption-safe.

## Blocking Issues

DEF-001 through DEF-004 block FEAT-041 Human Final Gate. FEAT-042 remains blocked.

## Final Verdict

FAIL

FEAT-041 is not ready for Human Final Gate. DEV-B / Antigravity must resolve DEF-001 through DEF-004 and return the feature for targeted re-QA. FEAT-042 must not begin.
