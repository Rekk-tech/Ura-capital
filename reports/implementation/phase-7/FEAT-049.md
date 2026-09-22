# FEAT-049 Implementation Report: Plan Catalog & Entitlement Resolution

## 1. Executive Summary

| Attribute | Canonical Record |
| --- | --- |
| **Feature ID** | FEAT-049 |
| **Feature Title** | Plan Catalog & Entitlement Resolution |
| **Phase** | Phase 7 — Subscription / Premium |
| **Role / Owners** | Architecture Owner: CODEX / Implementation Owner: DEV-B (ANTIGRAVITY) |
| **Baseline** | `feat-048-approved` (`48105db`) |
| **Delivery Strategy** | Fast-Track Implementation |
| **Migration Total** | **0 new migrations** (Total remains 10) |
| **Internal Feature Gate Status** | **PASS** (12/12 tasks complete, 18/18 ACs pass, Canonical 14 PASS) |

---

## 2. Implemented Architecture & Contracts

### 2.1 Canonical Taxonomies & Locks (D2..D5, D9)
- **D2 (Plan Catalog)**: Strictly `FREE` and `PREMIUM`. Catalog is server-owned and configuration-backed with zero database plan table.
- **Initial Entitlement Key**: Strictly `PREMIUM_ACCESS`.
  - `FREE -> []`
  - `PREMIUM -> ["PREMIUM_ACCESS"]`
- **D3 (Past Due)**: `PAST_DUE` has **no grace period** and grants **no premium access**.
- **D4 (Cancellation)**: `ACTIVE` with `cancelAtPeriodEnd = true` remains entitled until `currentPeriodEnd`; at or after `currentPeriodEnd`, effective status is `EXPIRED` (denies access).
- **D5 (Terminal States)**: `CANCELLED` (provider-confirmed immediate cancellation) and `EXPIRED` are terminal and deny access. No trial or `TRIALING` state exists.
- **D9 (Deferred Gating)**: Existing Academy, Simulation, Community, and AI domain gates are strictly deferred. Zero middleware or existing route modifications in FEAT-049.

### 2.2 Server-Owned Plan Catalog (`apps/api/src/modules/subscription/plan-catalog.ts`)
- `SERVER_PLAN_CATALOG`: Code-backed dictionary of `PlanCatalogItem`.
- `validatePlanCatalog()`: Enforces catalog invariants at startup (correct keys, correct entitlements, no unapproved additions).
- `getPublicPlans()`: Exposes safe public projections (`planKey`, `name`, `description`, `entitlements`) omitting all provider price IDs, secrets, or internal mappings.
- `getPlan(planKey)` & `getEntitlementsForPlan(planKey)`: Safe deterministic accessors.

### 2.3 Pure Non-Prisma Domain Types (`apps/api/src/modules/subscription/subscription-entitlement.types.ts`)
- `Clock`: Injected server-controlled clock abstraction (`{ now(): Date }`).
- `EffectiveSubscriptionStatus`: `"ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED" | "NONE"`.
- `EntitlementContext`: Immutable frozen context returned by resolver. Contains zero Prisma references, zero provider credentials, and zero internal database IDs beyond `userId`.
- `IEntitlementResolver`: Clean service interface reusable by readers and future guards without importing `@prisma/client`.

### 2.4 Deterministic Resolution Service (`apps/api/src/modules/subscription/subscription-entitlement.service.ts`)
- `SubscriptionEntitlementService` implements `IEntitlementResolver`.
- Takes `ISubscriptionRepository` and optional `Clock`.
- Evaluates:
  1. Input validation on `userId`.
  2. Non-terminal subscription query in PostgreSQL (`findActiveByUserId`).
  3. Missing record semantics -> returns `FREE` with `status: "NONE"`, `entitlements: []`, `isEntitled: false`.
  4. Durable state integrity validation: checks plan key, status, and period boundaries (`start <= end`). Fails closed on corruption with sanitized diagnostics (zero secrets/provider IDs).
  5. Period boundary evaluation against `clock.now()`:
     - `now < currentPeriodStart`: Not yet started -> denies access.
     - `now >= currentPeriodEnd`: Expired -> effective status `EXPIRED`, denies access.
  6. Status evaluation:
     - `CANCELLED` / `EXPIRED`: Denies access.
     - `PAST_DUE`: Denies access (no grace period).
     - `ACTIVE`: Grants mapped entitlements from catalog (`["PREMIUM_ACCESS"]` for `PREMIUM`).
- Ignores all client/JWT assertions: authority resides strictly in PostgreSQL + Server Catalog + Server Clock.

---

## 3. Scope Boundary Enforcement

| Scope Item | Status | Verification Evidence |
| --- | --- | --- |
| **New Migrations** | **0** | `guard:migration` passes with exactly 10 migrations |
| **Public API Endpoints / Routes** | **0** | No routes or controllers added |
| **Provider SDKs / Webhooks** | **0** | No external billing SDKs or webhook handlers |
| **Checkout / Cancellation Actions** | **0** | No checkout or cancellation mutation endpoints |
| **Middleware / Domain Gates** | **0** | Reusable resolver service only (middleware deferred to FEAT-051) |
| **UI Components** | **0** | Web application unchanged |
| **Redis Authority / Caching** | **0** | No caching layer; resolver queries PostgreSQL authoritatively |

---

## 4. Acceptance Criteria Validation Matrix

| AC ID | Description | Result | Evidence |
| --- | --- | --- | --- |
| **AC-001** | D2..D5 and D9 locks implemented exactly | **PASS** | Taxonomies, plans, and terminal states enforced in service & catalog |
| **AC-002** | Canonical tier/entitlement constants contain no unapproved key | **PASS** | `plan-catalog.test.ts` verifies `SUBSCRIPTION_PLANS` & `CANONICAL_ENTITLEMENT_KEYS` |
| **AC-003** | Plan catalog is server-owned, config-backed, and startup-validated | **PASS** | `validatePlanCatalog()` validates structure on module load |
| **AC-004** | Provider price IDs/secrets absent from public projections | **PASS** | `getPublicPlans()` projection omits all provider keys & secrets |
| **AC-005** | Entitlement resolver exposes narrow reusable non-Prisma interface | **PASS** | `IEntitlementResolver` and `EntitlementContext` import 0 Prisma types |
| **AC-006** | Missing subscription resolves to FREE with zero premium entitlement | **PASS** | Tested in unit (`subscription-entitlement.test.ts`) & integration (`subscription-entitlement-db.test.ts`) |
| **AC-007** | Valid ACTIVE subscription grants only mapped entitlements | **PASS** | Tested in unit & PostgreSQL integration suites |
| **AC-008** | Period boundaries use server clock; deny expired/not-yet-valid state | **PASS** | Tested at `periodStart - 1ms`, `periodStart`, `periodEnd - 1ms`, `periodEnd`, and `periodEnd + 1s` |
| **AC-009** | PAST_DUE grants no premium and has no grace period | **PASS** | Unit & DB tests confirm `isEntitled: false`, `entitlements: []` |
| **AC-010** | No trial, TRIALING state, or implicit trial entitlement exists | **PASS** | Trialing state rejected by validation and schema constraints |
| **AC-011** | Cancel-at-period-end remains ACTIVE until expiry then EXPIRED; CANCELLED/EXPIRED deny | **PASS** | Unit & DB tests confirm state transitions and access denial |
| **AC-012** | Forged client/JWT claims cannot affect resolution | **PASS** | Resolver accepts only `userId` and queries PostgreSQL directly |
| **AC-013** | Repository/infrastructure failure returns safe failure and grants nothing | **PASS** | Tested repository throw -> 500 AppError, fails closed |
| **AC-014** | Invalid durable state fails closed and emits only sanitized diagnostics | **PASS** | Tested corrupted plan, corrupted status, and inverted date ranges |
| **AC-015** | FEAT-049 adds zero schema, migration, API, provider call, Redis cache, UI, or domain gate | **PASS** | Proven by code review, repo status, and test suites |
| **AC-016** | Unit and PostgreSQL-backed tests deterministically cover all boundaries | **PASS** | 13 unit tests + 9 integration tests all passing |
| **AC-017** | Canonical validation and Phase 2-6/FEAT-048 regressions pass | **PASS** | All 15 canonical verification steps PASS |
| **AC-018** | Report/AC/task evidence is truthful; dependent features correctly gated | **PASS** | tasks.md updated, implementation report published |

---

## 5. Verification Results (Canonical Pipeline)

1. `npm run clean`: **PASS**
2. `prisma validate`: **PASS**
3. `npm run lint`: **PASS** (0 errors, 0 warnings)
4. `npm run typecheck`: **PASS** (Clean TypeScript across API, Web, and Shared)
5. `npm run build`: **PASS** (Shared, API, and Web bundles compiled cleanly)
6. `npm run guard:migration`: **PASS** (10 migrations, 0 new)
7. `npm run guard:persistence`: **PASS** (14/14 checks pass)
8. `npm run guard:boundary`: **PASS** (0 architectural boundary violations)
9. `npm run guard:audit-governance`: **PASS** (0 premature audit models)
10. `npm run guard:seed-safety`: **PASS** (0 unsafe seed patterns)
11. `npm run test:unit`: **PASS** (All unit suites pass across packages)
12. `npm run test:security`: **PASS** (49/49 FEAT-039 anti-abuse tests pass)
13. `npm run test:redis`: **PASS** (50/50 Redis integration tests pass)
14. `npm run test:db`: **PASS** (39 suites, 526 tests pass including `subscription-entitlement-db.test.ts`)
15. `npm run test`: **PASS** (Standard integration suites pass)

---

## 6. Dependency State & Next Steps

- **FEAT-048**: **DONE** (`feat-048-approved`)
- **FEAT-049**: **DONE** / **INTERNAL FEATURE GATE PASS**
- **FEAT-050 (Subscription Read APIs)**: **UNBLOCKED FOR IMPLEMENTATION**
- **FEAT-054 (Subscription UI)**: Check dependency graph (requires FEAT-050/FEAT-051 as specified in roadmap)
