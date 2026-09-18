# FEAT-040 QA Report: Phase 5 Simulation Engine Integration Gate

Feature: FEAT-040
Phase: Phase 5 - Simulation Engine
QA Owner: Codex
QA Iteration: 1
Executed: 2026-09-18
Final Verdict: FAIL
Human Final Gate Readiness: NOT READY
Application Code Changes By QA: ZERO

## Executive Summary

The Phase 5 backend foundation is substantially healthy. Independent live validation passed for fresh and Phase 4 upgrade migrations, PostgreSQL accounting and transaction behavior, concurrency, idempotency, IDOR protection, Redis rate limiting, outage fail-closed behavior, audit deferral, and Phase 1-4 regression.

Phase 5 cannot pass this gate. One P1 financial-integrity defect corrupts valid Decimal values in order response DTOs. A second P1 blocks mandatory CI evidence: the approved FEAT-039 commit has no GitHub Actions run/check, and the workflow does not execute all mandatory Phase 5 validations. The learner UI also cannot complete its real authenticated journey because it supplies no access token and sends a server-forbidden `startingCash` field when creating a session.

Defect count: P0 0, P1 2, P2 3, P3 0, advisory 2.

## Canonical Baseline

| Item | Evidence | Result |
| --- | --- | --- |
| Approved baseline | `phase-4-approved` | PASS |
| Integrated head | `9922a804f18bc6b88a20f40bfe12d07c77cd9991` | PASS |
| Branch | `feat/FEAT-039-simulation-security-hardening` | PASS |
| Tags | `feat-031-approved` through `feat-039-approved` resolve in coherent history | PASS |
| Application worktree | No uncommitted application changes; only FEAT-040 QA artifacts are untracked | PASS |
| Migration inventory | 8 ordered migration directories and 8 verified digests | PASS |
| CI checkpoint | No Actions run or check exists for approved FEAT-039 commit | FAIL |

## QA Independence

Codex independently executed this Phase-level gate. Independence is reduced for FEAT-032 and FEAT-036 because Codex held temporary implementation ownership for those features. All reduced-independence areas were revalidated with live PostgreSQL tests at this gate. This report does not claim uniform full independence across every Phase 5 feature.

## Feature Matrix

| Feature | Contract revalidated | Gate result |
| --- | --- | --- |
| FEAT-031 | Schema, constraints, repository foundation, migration | PASS |
| FEAT-032 | Fixed assets/scenarios/snapshots and safe reads | PASS |
| FEAT-033 | Session lifecycle, ownership, reset/history | PASS |
| FEAT-034 | Portfolio/position accounting and reconciliation | PASS |
| FEAT-035 | MARKET execution, atomic mutation, authority | FAIL - Decimal response corruption |
| FEAT-036 | Idempotency and concurrency hardening | PASS |
| FEAT-037 | Current-only valuation and owner-scoped reads | PASS |
| FEAT-038 | Learner UI and implementation evidence | FAIL |
| FEAT-039 | IDOR, abuse protection, Redis rate limit, audit deferral | PASS locally; mandatory CI evidence FAIL |

## Standards Review

- Repository/UoW boundary guard passed: controllers 15, services 20, repositories 7.
- Persistence, migration, product-audit, and seed-safety guards passed.
- PostgreSQL remains the durable Simulation authority; Redis is limited to transient rate-limit counters.
- Simulation order DTO conversion violates the approved exact-Decimal boundary by converting Prisma Decimal values through native JavaScript `Number`.
- FEAT-038 implementation evidence is not truthful and does not match the current route/client/test surface.

## Architecture

The approved authority split remains intact in durable state:

- Browser submits intent and presents server responses.
- API/services own lifecycle, price selection, accounting, valuation, and authorization.
- PostgreSQL owns scenarios, snapshots, sessions, portfolios, positions, orders, trades, and idempotency.
- Redis owns transient order-rate counters only.
- External brokerage, payment, exchange, and live-market-provider authority is absent.

The frontend integration does not successfully connect this architecture to an authenticated learner session; see DEF-003 and DEF-004.

## Migration Validation

### Fresh Zero-State Database

Database: independent FEAT-040 fresh QA database.

- `prisma migrate deploy`: PASS.
- `prisma migrate status`: PASS, schema up to date.
- `prisma validate`: PASS.
- Applied migrations: 8, in canonical order.

### Phase 4 Upgrade Database

Database: independent FEAT-040 upgrade QA database.

1. Applied the seven approved Phase 1-4 migrations.
2. Inserted representative User, Credential, Role/UserRole, RefreshSession, auth audit, Academy content, attempt, progress, XP, and reward rows.
3. Captured stable IDs, counts, relationships, constraints, and indexes.
4. Applied `20260914072000_feat031_simulation_foundation`.
5. Confirmed all representative counts and stable IDs were unchanged.
6. Confirmed relationships still joined correctly and unique/FK probes remained enforced.
7. Confirmed eight Simulation tables and eight applied migrations.

Result: PASS.

## E2E Lifecycle

Live PostgreSQL/API coverage passed for create, start, complete, cancel, reset, assets, current snapshots, starting portfolio, BUY, SELL, order/trade history, valuation, and foreign-user denial. Reset cancels the old session, preserves history, and creates a new `CREATED` session.

Backend/API lifecycle: PASS.

Learner browser lifecycle: FAIL. The dashboard cannot authenticate its requests and its create action submits a payload the API must reject.

## Financial Integrity

| Check | Result |
| --- | --- |
| Cash never negative | PASS |
| Position never negative / no short selling | PASS |
| Authoritative current snapshot price | PASS |
| Average cost | PASS |
| Realized PnL durable calculation | PASS |
| Unrealized PnL, market value, equity | PASS |
| Materialized state reconciliation | PASS |
| Exact Decimal response serialization | FAIL |

The database and accounting services retain exact values, but `toSimulationOrderResponseDto` converts `Decimal` through `Number`. An actual function probe changed valid `NUMERIC(20,6)` value `99999999999999.123456` to `99999999999999.125000`, and valid `NUMERIC(20,4)` value `9999999999999999.1234` to `10000000000000000.0000`.

## Atomicity

PASS. Live PostgreSQL tests verified order, trade, cash, position, and realized-PnL writes commit together. Forced and constraint failures roll back with zero partial business state.

## Concurrency

PASS. Live contention verified finite-cash BUYs, finite-position SELLs, same-key races, different-key races, lock ordering, no duplicate trades, no negative balances, and post-stress reconciliation.

## Idempotency

PASS. Sequential replay, concurrent identical replay, conflicting quantity/asset/side, cross-user isolation, cross-session isolation, and transport retry all preserved one semantic execution.

## Valuation

PASS for authoritative current valuation. Current scenario/cycle snapshots drive market value and PnL; past/future/wrong-scenario snapshots are ignored; missing current snapshots fail safely; valuation reads do not mutate state. Historical valuation remains deferred.

## Authorization, IDOR, And JWT

- Full User A/User B private-resource matrix: PASS.
- Unknown and foreign resources use the same safe non-enumerating result: PASS.
- Forged `role`, `roles`, `isAdmin`, and user identity claims cannot bypass ownership: PASS.
- JWT remains role-free and server-derived identity remains authoritative: PASS.

## Client Tampering And Numeric Abuse

PASS at the API boundary. Authority fields, malformed UUIDs, invalid side/type/symbol, zero/negative/fractional/oversized quantities, NaN/Infinity representations, and empty idempotency keys are rejected with zero business mutation.

The dashboard nevertheless sends forbidden `startingCash` during session creation. The server rejects it safely, but this breaks the frontend journey.

## Rate Limiting And Redis

- Policy: 60 submissions per authenticated user per 600 seconds.
- 60th request allowed, 61st returns `429 TOO_MANY_REQUESTS` with `Retry-After`: PASS.
- Zero DB mutation on 429: PASS.
- Redis unavailable returns safe 503 with zero DB mutation: PASS.
- Multi-instance/shared transient counter behavior: PASS.
- No session, snapshot, portfolio, position, order, trade, idempotency, valuation, or PnL authority in Redis: PASS.

The dedicated FEAT-039 live security suite passed 1 file / 49 tests, but it is omitted from `npm run test:db` and from CI. This is included in DEF-002.

## Frontend

| Surface | Result |
| --- | --- |
| Portfolio, positions, orders, trades presentation | PASS in mocked component tests |
| Mandatory Simulation disclosures | PASS |
| Loading/empty/error state rendering | PASS in component tests |
| Historical chart absence | PASS |
| Authenticated real API journey | FAIL |
| Create-session contract | FAIL |
| Complete/cancel learner controls | NOT IMPLEMENTED in dashboard |
| Post-order cache refresh | PASS by hook-level implementation |

All protected Simulation routes require Bearer authentication. The dashboard invokes every Simulation query/mutation without an access token, and the web application has no auth context/session integration that supplies one. The mocked component tests bypass this defect.

## Audit, Admin, And Product Boundaries

- Durable Simulation product audit remains Human-deferred: PASS.
- No product audit table, migration, API, or UI: PASS.
- No Simulation event is written to `AuthSecurityAuditRecord`: PASS.
- Accepted risk: high-value Simulation events are not durably product-audited in Phase 5.
- No admin/support Simulation listing or cross-user override: PASS.
- No real-money, brokerage, exchange, deposit, withdrawal, crypto, options, margin, short, leaderboard, or competition behavior: PASS.

## Regression

| Area | Evidence | Result |
| --- | --- | --- |
| Phase 2 | Auth, refresh/logout, RBAC/admin, audit, rate limiting | PASS |
| Phase 3 | Persistence, migrations, UoW, Redis boundary, seed safety | PASS |
| Phase 4 | Academy content, quiz, grading, progression, rewards, authorization | PASS |

## Canonical 14

| Validation | Result |
| --- | --- |
| `npm run clean` | PASS |
| `npm run lint` | PASS |
| Prisma validate | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS, non-blocking bundle-size warning |
| `npm run test` | PASS - 82 files / 917 tests |
| `npm run test:unit` | PASS - 58 files / 727 tests |
| `npm run test:db` | PASS - 28 files / 337 tests, 0 skips |
| `npm run test:redis` | PASS - 5 files / 50 tests, 0 skips |
| `guard:persistence` | PASS - 14 tests |
| `guard:migration` | PASS - 8 migrations / 8 digests |
| `guard:boundary` | PASS |
| `guard:audit-governance` | PASS |
| `guard:seed-safety` | PASS |

All local canonical commands passed. This does not cure the missing/incomplete CI execution described in DEF-002.

## CI

FAIL / NOT VERIFIED AS GREEN.

- GitHub checks API for approved commit `9922a804...`: 0 check runs.
- GitHub Actions API by commit and branch: 0 workflow runs.
- Legacy commit status: pending with 0 statuses.
- Workflow triggers only pushes/PRs targeting `main` or `develop`; no FEAT-039 checkpoint run exists.
- Current CI workflow omits `guard:boundary`, `guard:audit-governance`, `guard:seed-safety`, and the dedicated 49-test FEAT-039 security suite.

The user-provided `CI: GREEN` baseline is not reproducible from GitHub.

## Defects

### DEF-001 - P1 - Decimal response corruption

- Owner: FEAT-035 / order DTO boundary.
- File: `apps/api/src/modules/simulation/simulation-order.dto.ts` lines 47 and 52.
- Affected AC: AC-007; financial-integrity hard gate.
- Expected: valid PostgreSQL Decimal values are serialized exactly at approved scale without native `Number` conversion.
- Actual: valid high-magnitude values are rounded/corrupted in order/replay/history responses.
- Required fix: serialize from Prisma Decimal or the approved Decimal helper directly; add boundary tests using valid `NUMERIC(20,6)` and `NUMERIC(20,4)` extremes across fresh execution, replay, and history DTOs.

### DEF-002 - P1 - Mandatory CI evidence absent and workflow is false-green capable

- Owner: Engineering/CI baseline and FEAT-039 validation integration.
- Files: `.github/workflows/ci.yml`, `apps/api/package.json`.
- Affected AC: AC-001, AC-004.
- Expected: the approved integrated commit has a GREEN run executing mandatory migration, PostgreSQL, Redis, Phase 5 security, and governance validations.
- Actual: no Actions/check run exists for the approved commit/branch. The workflow omits three mandatory guards and the FEAT-039 49-test live security suite; `test:db` also excludes that suite.
- Required fix: include all mandatory guards and the security suite in canonical CI, publish a run for the corrected integrated commit, and provide run/job evidence.

### DEF-003 - P2 - Learner UI never supplies authentication

- Owner: FEAT-038.
- Files: `apps/web/src/features/simulation/pages/SimulationDashboardPage.tsx`, `apps/web/src/features/simulation/hooks/use-simulation.ts`, `apps/web/src/api/simulation.api.ts`, `apps/web/src/app/App.tsx`.
- Affected AC: AC-022.
- Expected: an authenticated learner journey sends the approved Bearer access token to every protected Simulation request.
- Actual: dashboard hooks and mutations are called without a token, and no web auth context supplies one; protected endpoints return 401.
- Required fix: integrate the approved Phase 2 auth/session contract, pass server-issued tokens consistently, and add non-mocked frontend/API integration coverage.

### DEF-004 - P2 - Dashboard create-session request violates API authority contract

- Owner: FEAT-038.
- File: `apps/web/src/features/simulation/pages/SimulationDashboardPage.tsx` line 76; client typing/tests in `apps/web/src/api/simulation.api.ts` and `.test.ts`.
- Affected AC: AC-022.
- Expected: Phase 5 session creation sends an empty body; starting cash is server-controlled.
- Actual: dashboard sends `{ startingCash: "100000.0000" }`; API validation explicitly rejects `startingCash` with 400.
- Required fix: remove client-controlled session authority fields from types, implementation, and tests; add an integration test against the actual API contract.

### DEF-005 - P2 - FEAT-038 implementation report is materially inaccurate

- Owner: FEAT-038 governance/evidence.
- File: `reports/implementation/phase-5/FEAT-038.md`.
- Affected AC: AC-001.
- Expected: report endpoint inventory, test evidence, and AC mapping match committed code.
- Actual: report claims a nonexistent `/advance` endpoint/test, uses `:scenarioId` instead of `:scenarioKey`, claims complete/cancel client tests that do not exist, and claims session controls not present in the dashboard.
- Required fix: correct the report against actual code and add missing contract tests where the approved scope requires behavior.

## Advisories

1. ADV-001: Express `res.clearCookie` uses deprecated `expires` behavior. Existing non-blocking technical debt.
2. ADV-002: Prisma major-version upgrade is available. Existing non-blocking technical debt; upgrade requires its own controlled change.

## FEAT-040 Acceptance Matrix

| AC | Status | Independent evidence |
| --- | --- | --- |
| AC-001 | FAIL | Reports/checkpoints present, but FEAT-038 report is inaccurate and CI checkpoint claim is not reproducible. |
| AC-002 | PASS | Fresh independent DB deployed all 8 migrations; status and validate passed. |
| AC-003 | PASS | Independent Phase 4 upgrade preserved representative rows, IDs, relationships, constraints, indexes, and migration history. |
| AC-004 | FAIL | Local canonical 14 passed, but mandatory CI does not run the full required gate and no integrated run exists. |
| AC-005 | PASS | Live backend session tests cover create/start/complete/reset and history preservation. |
| AC-006 | PASS | Fixed active assets and current persisted snapshots verified without mutation. |
| AC-007 | FAIL | BUY/SELL execution passes, but valid Decimal response values can be corrupted by DTO serialization. |
| AC-008 | PASS | Reset cancels old session and creates isolated `CREATED` session without deleting history. |
| AC-009 | PASS | API rejects all client authority fields; price/state/identity remain server-controlled. |
| AC-010 | PASS | Insufficient cash rejects with zero mutation. |
| AC-011 | PASS | Oversell rejects with zero mutation. |
| AC-012 | PASS | Same-key/same-fingerprint replay returns original semantic result with one mutation. |
| AC-013 | PASS | Same key with different payload returns `409 IDEMPOTENCY_CONFLICT`. |
| AC-014 | PASS | Live contention prevents overspend, oversell, duplicates, and reconciliation drift. |
| AC-015 | PASS | Full foreign-user IDOR matrix returns safe non-enumerating denial. |
| AC-016 | PASS | Numeric abuse matrix rejects safely with zero mutation. |
| AC-017 | PASS | Error and diagnostic probes show no DB, Redis, token, secret, or sensitive-path leakage. |
| AC-018 | PASS | Redis contains transient counters only; PostgreSQL remains business authority. |
| AC-019 | PASS | 60/600 policy, exact 429 contract, Retry-After, 503 outage behavior, and zero mutation verified. |
| AC-020 | PASS | Product audit deferral and accepted risk remain documented. |
| AC-021 | PASS | No Simulation use of `AuthSecurityAuditRecord`. |
| AC-022 | FAIL | Real learner UI cannot authenticate and create-session payload is rejected. |
| AC-023 | PASS | Phase 1-4 tests and all five governance guards remain green. |
| AC-024 | PASS | No Phase 6/7 behavior introduced. |
| AC-025 | PASS | No real-money/brokerage/external-provider or prohibited instrument behavior. |
| AC-026 | PASS | This report exists at the approved path. |
| AC-027 | PASS | Verdict follows approved policy. |
| AC-028 | PASS | Financial-integrity and mandatory-CI failures produce FAIL, not CONDITIONAL PASS. |

## Blocking Issues

- DEF-001 and DEF-002 are P1 blockers.
- DEF-003 through DEF-005 are P2 blockers for the integrated learner journey and truthful evidence.
- FEAT-040 is not ready for Human Final Gate.
- Phase 5 remains blocked.

## Final Verdict

FAIL

FEAT-040: QA FAIL.

Phase 5: BLOCKED pending correction and independent re-QA.

Phase 5 must not be marked DONE, and no Human Phase Final Gate approval is recommended at this iteration.
