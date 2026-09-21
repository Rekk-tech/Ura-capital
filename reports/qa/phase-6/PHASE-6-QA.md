# Phase 6 QA Report: Community Integration Gate

Feature: FEAT-047
Phase: Phase 6 - Community
QA Owner: Codex
QA Iteration: 1
Final Verdict: FAIL
Integrated Commit: `c12c6ace95f8314d5d464646d444045eb5e04e2e`
QA Date: 2026-09-21

## Executive Summary

Phase 6 is not ready for the Human Phase Final Gate. Fresh and upgrade migrations, live PostgreSQL/Redis suites, Community persistence and concurrency, rate limiting, authority boundaries, upstream regressions, and the local canonical 14 all pass. Four P1 defects and one P2 governance defect remain:

1. Post/comment DELETE endpoints accept forbidden request fields and mutate durable state instead of rejecting with zero mutation.
2. The frontend delete client parses JSON from the backend's canonical `204 No Content`, causing successful owner removals to reject with `SyntaxError`.
3. The claimed Community E2E journey is API-mocked, omits a real unlike operation, and never reaches the API, PostgreSQL, or Redis.
4. GitHub Actions for the exact integrated commit failed at the PostgreSQL test step.
5. The Phase 6 decomposition still presents active planning-era lifecycle states.

FEAT-047 is QA FAIL. Phase 6 is BLOCKED. Human Phase Final Gate is NOT READY. Phase 7 remains BLOCKED.

## QA Independence

- QA execution and defect discovery: Codex, independent from DEV-B / Antigravity implementation.
- FEAT-044 implementation had reduced QA independence; this phase-level review is the compensating independent control.
- No application, test, Prisma schema, migration, or runtime source was modified by this QA.
- Temporary QA probes were created under disposable paths, executed, removed, and left no repository diff.

## Git Baselines

| Checkpoint | Commit SHA | Status |
| --- | --- | --- |
| `feat-041-approved` | `2dd775851f5d3ddf5b923886c54e87bb6b8809bb` | Present |
| `feat-042-approved` | `f2c0d79abe1fa220667abb124edc9c481f487cd1` | Present |
| `feat-043-approved` | `1c569c58a0371658fa2204610f374cd2a1964f35` | Present |
| `feat-044-approved` | `072a9c31ab956d0b75264f394c4c68ddcc845cf9` | Present |
| `phase-6-community-core-044-integrated` | `1d8274b90fe0eb977d6c0a468d785e9705312f43` | Present |
| `feat-045-approved` | `733d5b2c449238ec33d57afe780bdf127d4e4921` | Present |
| `feat-046-approved` | `c12c6ace95f8314d5d464646d444045eb5e04e2e` | Present; integrated QA SHA |

The integrated working tree was clean before QA. Application source remained unchanged throughout QA.

## Feature Matrix

| Feature | Historical gate | Checkpoint | FEAT-047 integration result | QA independence note |
| --- | --- | --- | --- | --- |
| FEAT-041 | QA PASS / Human targeted governance approval | `feat-041-approved` | PASS | Independent history preserved |
| FEAT-042 | Internal Feature Gate PASS | `feat-042-approved` | FAIL: DEF-001 affects post DELETE | Phase gate independently detected gap |
| FEAT-043 | Internal Feature Gate PASS | `feat-043-approved` | FAIL: DEF-001 affects comment DELETE | Phase gate independently detected gap |
| FEAT-044 | Internal Feature Gate PASS | `feat-044-approved` | PASS | Implementation QA independence reduced; compensated here |
| FEAT-045 | Internal Feature Gate PASS | `feat-045-approved` | FAIL: strict all-write tampering boundary incomplete | Phase gate independently detected gap |
| FEAT-046 | Internal Feature Gate PASS | `feat-046-approved` | FAIL: DEF-002 and DEF-003 | Mocked tests hid real API contract mismatch |
| FEAT-047 | Current independent gate | N/A | FAIL | Four P1 and one P2 open |

Historical feature gate outcomes are not rewritten by this report. The integration result records current cross-feature evidence.

## Persistence And Migration

### Fresh Database

- Database: `aura_capital_test_feat047_fresh`
- `prisma migrate deploy`: PASS
- `prisma migrate status`: PASS
- `prisma validate`: PASS
- Migration count: 9
- Community migration: `20260919201500_feat041_community_foundation`

### Phase 5 Upgrade

- Database: `aura_capital_test_feat047_upgrade`
- Exact `phase-5-approved` baseline: 8 migrations
- Representative Identity, Credential, Role/UserRole, auth audit, Academy course/lesson/progress/XP, and Simulation scenario/asset/snapshot/session/portfolio rows inserted before upgrade.
- Current Community migration applied as migration 9.
- All representative rows, stable IDs, and relationships survived.
- Pre-Community constraints after upgrade: 103, unchanged.
- Pre-Community indexes after upgrade: 103, unchanged.
- Community tables created: 3.
- Migration guard: PASS, 9 ordered digests and applied-state integrity verified.

### Community Constraints

Live PostgreSQL tests pass for status checks, removal timestamp coherence, post/comment length checks, foreign keys, delete policies, exact indexes, `UNIQUE(user_id, post_id)`, relational counts, idempotent unlike, same-user concurrency, and distinct-user concurrency. PostgreSQL remains the durable authority; no materialized counters or Community product-audit persistence exist.

## API And Security Results

| Area | Result | Evidence |
| --- | --- | --- |
| Posts | PASS with DEF-001 exception | Auth, feed/detail/create/remove, cursor, safe DTO, visibility, owner isolation, relational counts pass; DELETE strict-body rejection fails |
| Comments | PASS with DEF-001 exception | Flat list/create/remove, parent visibility, ordering, counts, owner isolation pass; DELETE strict-body rejection fails |
| Likes | PASS | PUT/DELETE idempotency, caller scope, one-row convergence, cross-user isolation, counts, hidden/removed rejection |
| Moderation | PASS | `VISIBLE/HIDDEN/REMOVED`, terminal removal, no public moderation API/UI, no ADMIN bypass |
| IDOR | PASS | Foreign post/comment removal and foreign like manipulation return safe contracts |
| Tampering | FAIL | Create and like bodies are strict; post/comment DELETE bodies are ignored and still mutate |
| Diagnostics | PASS | No raw Prisma/PostgreSQL/Redis URLs, credentials, SQL, tokens, or paths observed |
| Product audit | PASS | Deferred; no Community persistence and no `AuthSecurityAuditRecord` reuse |
| Seed safety | PASS | No Community seed/backdoor/default content or account |

### Independent DELETE Tampering Probe

An authenticated owner sent forbidden fields to both deletion routes:

- `DELETE /api/community/comments/:commentId` with `status`, `moderatorId`, and `isAdmin` returned 204; PostgreSQL changed the comment to `REMOVED`.
- `DELETE /api/community/posts/:postId` with `status`, `moderatorId`, `isAdmin`, and `likeCount` returned 204; PostgreSQL changed the post to `REMOVED`.

Expected: safe 400 validation failure and zero mutation. Actual: successful durable mutation.

## Rate Limiting And Redis

| Check | Result |
| --- | --- |
| Post create 10/user, 60/source, 600s | PASS |
| Post delete 30/user, 180/source, 600s | PASS |
| Comment create 30/user, 180/source, 600s | PASS |
| Comment delete 60/user, 300/source, 600s | PASS |
| Combined like/unlike 120/user, 600/source, 600s | PASS |
| Independent user/source ceilings | PASS |
| 429, `TOO_MANY_REQUESTS`, `Retry-After`, zero DB mutation | PASS |
| Proxy spoof resistance | PASS |
| HMAC-SHA-256 keys and dedicated secret | PASS |
| No raw user/IP/resource/content/token in keys or logs | PASS |
| Multi-instance sharing, TTL, run/worker isolation | PASS |
| Redis outage: all writes 503 before mutation | PASS |
| Redis outage: reads remain available | PASS |
| Recovery after Redis returns | PASS |

Redis remains transient-only. PostgreSQL remains the sole durable Community authority.

## UI, XSS, And E2E

- `/community` and `/community/posts/:postId` routes, auth gating, feed/detail/components, loading/empty/404/429/503/generic states, cursor loading, keyboard controls, and accessibility component coverage: PASS.
- User content renders as React text; no Community `dangerouslySetInnerHTML`: PASS.
- No Community token storage in `localStorage`, `sessionStorage`, query parameters, or a second auth context: PASS.
- Mutations invalidate/refetch server-authoritative counts; no optimistic count authority: PASS.
- Owner removal against the canonical backend 204 contract: FAIL. Both `removePost` and `removeComment` call `res.json()` after a successful 204 and reject with `SyntaxError`.
- Real authenticated frontend journey against API/PostgreSQL/Redis: NOT IMPLEMENTED / FAIL.

`apps/web/tests/e2e/community-learner-journey.spec.tsx` uses `MemoryRouter`, a synthetic token/user, and `vi.spyOn(...).mockResolvedValue(...)` for every Community API operation. It neither starts nor calls the backend, PostgreSQL, or Redis. Despite its title, it calls like only and does not execute unlike. `npm run test:e2e` passes 2 files / 2 tests, but that result is component-level mocked evidence and does not satisfy AC-035.

## Validation Suite

| Validation | Result | Actual evidence |
| --- | --- | --- |
| `npm run clean` | PASS | No error |
| `npm run lint` | PASS | No error |
| `prisma validate` | PASS | Schema valid |
| `npm run typecheck` | PASS | All workspaces |
| `npm run build` | PASS | API/shared/web; Vite size advisory only |
| `npm run test` | PASS | 96 files / 1,108 tests |
| `npm run test:unit` | PASS | 68 files / 881 tests |
| `npm run test:db` | PASS | 36 files / 482 tests; no mandatory skips |
| `npm run test:redis` | PASS | 5 files / 50 tests; no skips |
| `npm run guard:persistence` | PASS | 1 file / 14 tests |
| `npm run guard:migration` | PASS | 9 migrations / 9 digests |
| `npm run guard:boundary` | PASS | 18 controllers / 23 services / 8 repositories |
| `npm run guard:audit-governance` | PASS | No premature product audit persistence/API |
| `npm run guard:seed-safety` | PASS | No unsafe seed/backdoor |
| Targeted Community live suite | PASS | Invocation reported 9 files / 148 tests |
| `npm run test:e2e` | PASS as test execution; FAIL as AC-035 evidence | 2 files / 2 mocked tests |

Local canonical 14 result: 14/14 PASS. This does not override the exact-SHA CI failure or the independent behavior defects.

## Prior Phase Regression

| Phase | Result | Evidence |
| --- | --- | --- |
| Phase 2 - Identity & Security | PASS | Standard, DB, Redis auth/RBAC/audit/rate-limit suites |
| Phase 3 - Data Foundation | PASS | Migration, repository/UoW, constraints, Redis, seed and all guards |
| Phase 4 - Academy | PASS | Standard and PostgreSQL Academy suites |
| Phase 5 - Simulation | PASS | Standard, PostgreSQL, security, lifecycle/accounting/order/valuation suites |

## Exact-Commit CI

- Commit: `c12c6ace95f8314d5d464646d444045eb5e04e2e`
- Workflow: Aura Capital CI
- Run: #53 (`35557079443`), attempt 1
- Status: completed
- Conclusion: FAILURE
- Failed job step: `9. PostgreSQL Database & Integration Tests (npm run test:db)`
- Run URL: `https://github.com/Rekk-tech/Ura-capital/actions/runs/35557079443`

AC-039 requires green CI for the exact integrated commit. A later local PASS is useful diagnostic evidence but is not an acceptable substitute.

## FEAT-047 Acceptance Matrix

| AC | Requirement summary | Evidence | Status |
| --- | --- | --- | --- |
| AC-001 | FEAT-041..046 artifacts/history truthful | FEAT-046 overclaims real E2E; phase decomposition current state is stale | FAIL |
| AC-002 | Implementation feature gates approved before gate | Published approved checkpoints and Human-authorized FEAT-047 start | PASS |
| AC-003 | Integrated scope remains Community-only | Source/schema/diff review | PASS |
| AC-004 | No Phase 7/8/9 or prohibited Community behavior | Repository search/source review | PASS |
| AC-005 | Fresh independent PostgreSQL validation | Fresh DB, 9 migrations, status/validate | PASS |
| AC-006 | Real Phase 5 upgrade validation | 8-migration Phase 5 baseline -> Community migration | PASS |
| AC-007 | Migration ordering/digests/integrity | Migration guard and live status | PASS |
| AC-008 | Prior representative data preserved | Before/after rows, relationships, constraints, indexes | PASS |
| AC-009 | Community schema matches FEAT-041 | Prisma/migration/live tests | PASS |
| AC-010 | DB checks reject invalid state | Live constraint suite | PASS |
| AC-011 | Delete/FK/logical-removal policies | Live PostgreSQL suite | PASS |
| AC-012 | Authenticated post lifecycle | API/DB suites | PASS |
| AC-013 | Feed order/cursor/counts | API/DB suites | PASS |
| AC-014 | Post DTO privacy | DTO/source/tests | PASS |
| AC-015 | Foreign/hidden/removed post safety | API/DB suites | PASS |
| AC-016 | Flat comment lifecycle | API/DB suites | PASS |
| AC-017 | Comment order/cursor/count | API/DB suites | PASS |
| AC-018 | Cross-user comment/relation isolation | API/DB suites | PASS |
| AC-019 | Like/unlike idempotency | Live DB suite | PASS |
| AC-020 | Caller-scoped unlike | Live DB suite | PASS |
| AC-021 | Relational like state/count | Live DB suite | PASS |
| AC-022 | Five concurrent same-user likes | Live DB suite | PASS |
| AC-023 | Distinct-user concurrent likes | Live DB suite | PASS |
| AC-024 | Status/visibility policy | Policy and DB suites | PASS |
| AC-025 | No moderation surface/audit persistence | Source/route/schema/guard review | PASS |
| AC-026 | All writes reject forged authority fields | DELETE post/comment live probes mutated state | FAIL |
| AC-027 | IDOR/non-enumeration safety | Cross-user API/DB tests | PASS |
| AC-028 | Safe diagnostics | Negative DB/Redis/API tests and log review | PASS |
| AC-029 | Exact approved rate limits | Live abuse-prevention suite | PASS |
| AC-030 | 429/Retry-After/zero mutation | Live abuse-prevention suite | PASS |
| AC-031 | Proxy spoof cannot bypass | Source-IP tests | PASS |
| AC-032 | Redis outage policy | Live fail-closed/read-available/recovery tests | PASS |
| AC-033 | PostgreSQL/Redis authority | Source/schema/key review | PASS |
| AC-034 | Redis sharing/TTL/isolation | Live Redis suites | PASS |
| AC-035 | Real authenticated frontend journey | Only mocked component journey exists; delete client breaks on 204 | FAIL |
| AC-036 | UI states/text/count/accessibility | Component/API-client/static review | PASS |
| AC-037 | Product audit deferral/auth audit untouched | Audit guard/schema/source review | PASS |
| AC-038 | Phase 2-5 regressions | Standard, DB, Redis, guards | PASS |
| AC-039 | Canonical 14, targeted suites, exact-SHA CI | Local 14 PASS; exact SHA CI #53 FAILURE | FAIL |
| AC-040 | Truthful report; Phase 7 blocked | This report and governance result | PASS |

Acceptance result: 36 PASS / 4 FAIL.

## Task Result

- PASS: T002..T011, T013..T014, T016..T020, T022..T024.
- FAIL: T001 (truthful artifact reconciliation), T012 (DELETE tampering), T015 (real frontend journey), T021 (exact-SHA CI).
- Result: 20 PASS / 4 FAIL.

## Defects

### DEF-001 - P1 - DELETE mutations ignore forbidden bodies and violate zero-mutation tampering policy

- Owning features: FEAT-042, FEAT-043, FEAT-045
- Files/modules: `community-post.controller.ts`, `community-comment.controller.ts`, Community delete route tests
- Affected AC: AC-026; T012
- Expected: every Community write strictly rejects identity/role/admin/status/count/timestamp/relationship fields before mutation.
- Actual: authenticated owner DELETE requests with forbidden fields return 204 and commit logical removal.
- Required fix: enforce an exact empty-body contract on both delete controllers, add live PostgreSQL tests for every prohibited-field class, and prove 400 plus zero mutation.

### DEF-002 - P1 - Frontend owner removal is incompatible with canonical 204 responses

- Owning feature: FEAT-046
- Files/modules: `apps/web/src/api/community.api.ts` (`removePost`, `removeComment`), UI mutation tests
- Affected AC: AC-035; T015
- Expected: canonical 204 deletion resolves successfully and triggers server-authoritative invalidation/refetch/navigation behavior.
- Actual: both methods call `res.json()` on an empty 204 response and reject with `SyntaxError`; current tests supply a noncanonical JSON body.
- Required fix: align client return handling with 204 No Content, update mocks to the real contract, and validate both owner-removal flows against the backend.

### DEF-003 - P1 - Claimed E2E journey is fully mocked and omits unlike

- Owning feature: FEAT-046
- Files/modules: `apps/web/tests/e2e/community-learner-journey.spec.tsx`, FEAT-046 implementation report
- Affected AC: AC-001, AC-035; T001, T015
- Expected: real authenticated browser/frontend flow through API, PostgreSQL, and Redis, including like and unlike, with final durable-state assertions.
- Actual: MemoryRouter/component test mocks every `communityApi` method; it never calls backend infrastructure and performs like only.
- Required fix: add a real integrated frontend journey on an isolated environment, cover the exact required sequence and durable final state, and correct the report evidence.

### DEF-004 - P1 - Exact integrated commit CI is red

- Owning feature: FEAT-047 integration/CI closure; underlying failure must be assigned after CI log diagnosis
- Module: `.github/workflows/ci.yml` / GitHub Actions run #53
- Affected AC: AC-039; T021
- Expected: exact integrated SHA has GREEN/SUCCESS mandatory CI.
- Actual: run #53 for `c12c6ace...` concluded FAILURE at `npm run test:db`.
- Required fix: diagnose and correct the CI-only DB failure without weakening tests, publish a corrected integrated SHA, and obtain green CI for that exact SHA.

### DEF-005 - P2 - Phase 6 decomposition active lifecycle state is stale

- Owner: Phase 6 governance
- File: `docs/phase-6-feature-decomposition.md`
- Affected AC: AC-001; T001
- Expected: active/current section reflects FEAT-041..046 completed and FEAT-047 under independent QA/blocked after this verdict.
- Actual: active text still says Phase 6 implementation NOT_STARTED and FEAT-042..047 planned/dependency-blocked.
- Required fix: preserve the planning snapshot as explicitly historical or update current lifecycle fields; do not rewrite approved scope or history.

## Advisories

1. Vite production build reports a non-blocking bundle chunk larger than 500 kB.
2. FEAT-044 reduced implementation/QA independence remains recorded; FEAT-047 provided independent review and found no FEAT-044-specific blocker.

## Blocking Issues

- DEF-001 OPEN (P1)
- DEF-002 OPEN (P1)
- DEF-003 OPEN (P1)
- DEF-004 OPEN (P1)
- DEF-005 OPEN (P2, truthful governance evidence)

Severity totals: P0=0, P1=4, P2=1, P3=0. Advisories=2.

## Final Verdict

FAIL

FEAT-047: QA FAIL

Phase 6: BLOCKED

Human Phase Final Gate: NOT READY / NOT APPROVED

Phase 7: BLOCKED
