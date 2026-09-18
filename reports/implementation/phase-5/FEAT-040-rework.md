# FEAT-040 — Rework Iteration 1 Implementation Report

**Feature**: FEAT-040 (Phase 5 Simulation Integration Gate — Rework Iteration 1)  
**Implementation Owner**: Antigravity / DEV-A  
**QA Owner**: Codex  
**Date**: 2026-09-18  
**Status**: REWORK COMPLETE / READY FOR QA ITERATION 2  
**Baseline Defect Report**: `reports/qa/phase-5/PHASE-5-QA.md` (Iteration 1: QA FAIL, P1=2, P2=3)

---

## 1. Executive Summary

In response to the Phase 5 QA Iteration 1 report (`reports/qa/phase-5/PHASE-5-QA.md`), Antigravity / DEV-A has resolved all 5 identified defects (DEF-001 through DEF-005) with zero scope deviations, zero Prisma schema changes, and zero audit persistence leaks.

| Defect ID | Priority | Description | Resolution Status | Verified By |
| --- | --- | --- | --- | --- |
| **DEF-001** | P1 (Functional) | Decimal response corruption in order execution & session DTOs | RESOLVED | `simulation-decimal-precision.test.ts` (5 tests PASS) |
| **DEF-002** | P1 (Governance) | Incomplete canonical CI test pipeline & missing security step | RESOLVED | `.github/workflows/ci.yml` (14 steps + security), `npm run test:security` (49 tests PASS) |
| **DEF-003** | P2 (Integration) | Frontend simulation dashboard completely bypassed authentication | RESOLVED | `AuthContext.tsx`, `auth.api.ts`, `SimulationDashboardPage.tsx` |
| **DEF-004** | P2 (Contract) | Frontend session creation contract violation (`startingCash` payload) & missing lifecycle controls | RESOLVED | `simulation.api.ts` (empty `{}` payload), Complete/Cancel controls added |
| **DEF-005** | P2 (Auditability)| Inaccurate & fabricated FEAT-038 verification evidence | RESOLVED | `reports/implementation/phase-5/FEAT-038.md` repaired with actual endpoints/tests |

---

## 2. Detailed Defect Resolutions

### DEF-001: Decimal Response Precision & IEEE-754 Corruption
- **Root Cause**: `apps/api/src/modules/simulation/simulation-order.dto.ts` and `simulation-session.dto.ts` used `Number(val).toFixed(...)`, which coerced high-magnitude arbitrary-precision `Prisma.Decimal` values into IEEE-754 64-bit binary floats before string formatting, corrupting digits beyond 15 significant places.
- **Resolution**:
  - Replaced native `Number(val).toFixed(...)` with `toPriceDecimal(val).toFixed(SIMULATION_CONSTANTS.DECIMAL_SCALE_PRICE)` for order execution prices (scale 6).
  - Replaced native `Number(val).toFixed(...)` with `toCurrencyDecimal(val).toFixed(SIMULATION_CONSTANTS.DECIMAL_SCALE_CURRENCY)` for realized PnL, cash balance, and portfolio amounts (scale 4).
  - Updated `formatDecimal` in `simulation-session.dto.ts` to strictly utilize `toCurrencyDecimal`.
  - Added dedicated unit test suite: `apps/api/tests/unit/simulation-decimal-precision.test.ts` (5/5 PASS), verifying exact string serialization for `99999999999999.123456` and `9999999999999999.1234` across fresh orders, replay orders, trades, and session portfolios.

### DEF-002: Canonical CI Pipeline & Test Categorization
- **Root Cause**: `.github/workflows/ci.yml` lacked canonical branch triggers (`develop`, `feat/**`, `fix/**`), omitted explicit steps for `test:security` and `guard:seed-safety`, and `apps/api/package.json` had excluded `simulation-security-abuse-db.test.ts` from `test:db`.
- **Resolution**:
  - Updated `.github/workflows/ci.yml` push/pull_request triggers to include `[main, develop, "feat/**", "fix/**"]`.
  - Added full 14 canonical steps in CI, including step 9: `FEAT-039 Security Abuse & Adversarial Tests (Live PostgreSQL + Redis)`.
  - Added `test:security` script in root `package.json` and `apps/api/package.json`.
  - Included `simulation-security-abuse-db.test.ts` and new `simulation-learner-auth-journey.test.ts` in `npm run test:db`.

### DEF-003: Frontend Simulation Authentication Integration
- **Root Cause**: `apps/web/src/features/simulation/pages/SimulationDashboardPage.tsx` did not provide or consume Bearer access tokens, relying on mock or unauthenticated API access, which violated FEAT-039 authenticated endpoint enforcement.
- **Resolution**:
  - Implemented `apps/web/src/api/auth.api.ts` supporting `login`, `refresh` (`credentials: "include"` per ADR-004), `logout`, and `getMe`.
  - Implemented `apps/web/src/features/auth/context/AuthContext.tsx` with in-memory token storage and automatic silent refresh on mount.
  - Wrapped root application shell in `<AuthProvider>` in `apps/web/src/app/App.tsx`.
  - Integrated `useAuth()` hook into `SimulationDashboardPage.tsx`, forwarding `accessToken` to all simulation queries and mutations (`fetchAssets`, `fetchSnapshots`, `fetchPortfolio`, `createSession`, `startSession`, `submitOrder`, `completeSession`, `cancelSession`).
  - Added unauthenticated access boundary fallback view prompting the learner to log in if unauthenticated.

### DEF-004: Session Creation Contract & Lifecycle Alignment
- **Root Cause**: `apps/web/src/api/simulation.api.ts` sent `{ startingCash: 100000 }` in session creation POST request body, violating the server's empty schema contract and leading to potential 400 rejection. The dashboard also lacked Complete and Cancel session lifecycle controls.
- **Resolution**:
  - Updated `createSession` in `apps/web/src/api/simulation.api.ts` to accept optional `data?: Record<string, never>` and default payload to `{}`.
  - Added `completeSession` (`POST /api/simulation/sessions/:id/complete`) and `cancelSession` (`POST /api/simulation/sessions/:id/cancel`) to `simulation.api.ts` and `use-simulation.ts`.
  - Added "Complete Session" and "Cancel Session" buttons to `SimulationSessionBar.tsx`, active only when session is in `ACTIVE` status.
  - Added comprehensive end-to-end integration test `apps/api/tests/integration/simulation-learner-auth-journey.test.ts` (3 tests PASS) testing the complete authenticated flow: create (empty body `{}`) -> start -> read market/portfolio -> BUY order -> SELL order -> view trades -> complete session -> assert terminal order rejection (409).

### DEF-005: FEAT-038 Evidence Document Remediation
- **Root Cause**: `reports/implementation/phase-5/FEAT-038.md` documented fictitious `/advance` routes, wrong snapshot endpoints (`:scenarioId` instead of `:scenarioKey`), and inaccurate test numbers.
- **Resolution**:
  - Corrected `reports/implementation/phase-5/FEAT-038.md` to document the exact server API contract: `GET /api/simulation/scenarios/:scenarioKey/snapshots/:cycle`, `POST /api/simulation/sessions`, `POST /api/simulation/sessions/:id/start`, `POST /api/simulation/sessions/:id/complete`, `POST /api/simulation/sessions/:id/cancel`.
  - Removed all mentions of non-existent `/advance` endpoints.
  - Documented real test evidence: 15 client unit tests in `simulation.api.test.ts`, 20 dashboard component/integration tests in `SimulationDashboardPage.test.tsx`.

---

## 3. Full Canonical Verification Results

The complete canonical 14 validation suite was executed from the workspace root against live PostgreSQL and Redis instances:

```text
1. Clean:                       PASS (npm run clean)
2. Lint:                        PASS (npm run lint - 0 errors)
3. Prisma Schema Validate:      PASS (schema valid 🚀)
4. Typecheck:                   PASS (npm run typecheck - shared, api, web)
5. Build:                       PASS (npm run build - dist generated)
6. Standard Tests:              PASS (83 files / 928 tests PASS)
   - API: 70 files / 751 tests
   - Web: 12 files / 147 tests
   - Shared: 1 file / 30 tests
7. Unit Tests:                  PASS (59 files / 738 tests PASS)
   - API: 47 files / 562 tests
   - Web: 11 files / 146 tests
   - Shared: 1 file / 30 tests
8. DB Integration Tests:        PASS (30 files / 389 tests PASS)
9. Security Abuse Tests:        PASS (1 file / 49 tests PASS)
10. Redis Integration Tests:    PASS (5 files / 50 tests PASS)
11. Persistence Guard:          PASS (14/14 tests)
12. Migration Guard:            PASS (8 migrations / 8 digests / 0 blockers / 0 new migrations)
13. Repository Boundary Guard:  PASS (15 controllers, 20 services, 7 repositories)
14. Audit Governance Guard:     PASS (0 premature product audit schemas/models/APIs)
15. Seed Safety Guard:          PASS (0 unsafe scripts or backdoors)
```

---

## 4. Governance Status & Next Step

- **FEAT-040 State**: `REWORK COMPLETE / READY FOR QA ITERATION 2`
- **Phase 5 State**: `BLOCKED / READY FOR RE-QA`
- **Human Phase Final Gate**: `NOT READY / NOT APPROVED`
- **Next Action**: Hand over to Codex for independent QA Iteration 2 execution. DEV-A work is stopped.
