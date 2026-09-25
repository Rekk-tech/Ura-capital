# Phase 9 Feature Decomposition: UI Integration & Product Polish

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW
Planning Owner: Codex
Implementation: NOT STARTED
Phase 7: IN_PROGRESS pending FEAT-057 QA and Human Final Gate
Phase 8: IDENTIFIED / NOT PLANNED
Phase 9: PLANNING ONLY

## 1. Purpose

Phase 9 turns the approved Academy, Simulation, Community, Subscription, identity, and future Aura Intelligence capabilities into one cohesive production-MVP web experience. This document proposes scope; it does not claim Human approval and does not authorize implementation.

The plan preserves server authority. The browser presents approved DTOs and commands but never becomes the authority for authentication, roles, entitlement, progression, grading, market state, Community ownership, or AI safety decisions.

## 2. Proposed Feature IDs

The repository currently ends at FEAT-057 and Phase 8 has not been decomposed. To avoid consuming the next IDs before the earlier phase is planned, this proposal reserves FEAT-058 through FEAT-069 for Phase 8 and assigns FEAT-070 through FEAT-080 to Phase 9. Human approval of this reservation is required.

| ID | Feature | Type | Proposed State |
|---|---|---|---|
| FEAT-070 | Application Shell, Navigation & Route Governance | Implementation | Proposed |
| FEAT-071 | Authentication Entry & Account Experience | Implementation | Proposed |
| FEAT-072 | Learner Dashboard & Cross-Domain Summary | Implementation | Proposed / decision-blocked |
| FEAT-073 | Academy Experience Integration & Polish | Implementation | Proposed |
| FEAT-074 | Simulation & Portfolio Experience Integration | Implementation | Proposed |
| FEAT-075 | Community Experience Integration & Polish | Implementation | Proposed |
| FEAT-076 | Subscription Experience Integration & Polish | Implementation | Proposed |
| FEAT-077 | Admin Access Boundary & Existing Capability Surface | Implementation | Proposed / decision-blocked |
| FEAT-078 | Aura Intelligence UI Integration | Implementation | Proposed / Phase-8-blocked |
| FEAT-079 | Accessibility, Responsive & Async-State Hardening | Integration hardening | Proposed |
| FEAT-080 | Phase 9 Product Integration & Browser E2E Gate | Validation-only gate | Proposed |

## 3. Scope Boundary

### In Scope

- A coherent authenticated and unauthenticated application shell.
- Login, registration, session recovery, logout, and read-only account identity using approved Phase 2 APIs.
- A learner dashboard composed from approved domain read contracts.
- Integration and polish of approved Academy, Simulation, Community, and Subscription experiences.
- A minimal admin-access surface limited to capabilities that already exist and are server-authorized.
- Aura Intelligence UI only after Phase 8 freezes and approves its client contract.
- Responsive, keyboard, focus, contrast, reduced-motion, loading, empty, error, retry, and not-found behavior.
- Real browser E2E coverage for critical desktop and mobile journeys.

### Out of Scope

- New durable domain behavior, schema, migrations, or database ownership.
- New profile mutation APIs, dashboard aggregation APIs, admin operations, CMS, moderation tools, or payment flows unless separately Human-approved.
- Direct Gemini/provider calls from the browser or any Phase 8 gateway implementation.
- Client-side authentication, role, entitlement, grading, progress, market, ownership, audit, or AI-safety authority.
- Production hardening owned by Phase 10, including full observability rollout, deployment automation, backup/restore, and broad performance programs.

## 4. Dependency Classification

| Dependency | Class | Effect |
|---|---|---|
| Phase 2 Identity & Security | HARD | Auth/session/RBAC contracts and security invariants are mandatory. |
| Phase 3 Data Foundation | HARD | Approved persistence, migration, repository, Redis, seed, and audit boundaries must remain intact. |
| Phase 4 Academy | HARD for FEAT-073 and related dashboard/E2E flows | Phase 9 consumes approved learner contracts and adds no Academy authority. |
| Phase 5 Simulation | HARD for FEAT-074 and related dashboard/E2E flows | Simulation remains server-authoritative and clearly simulated. |
| Phase 6 Community | HARD for FEAT-075 and related dashboard/E2E flows | Community ownership, visibility, and rate limits remain authoritative. |
| Phase 7 Subscription | HARD for FEAT-076 and Phase 9 final integration if Subscription is in MVP | Implementation cannot begin until FEAT-057 QA PASS and Human Phase Final Gate. |
| Phase 8 Aura Intelligence | HARD for FEAT-078 and FEAT-080 when AI is in MVP | ADR-006 requires the AI gateway before UI reliance. |
| Phase 8 for FEAT-070..077 | INDEPENDENT | Non-AI Phase 9 features can be built after their own upstream gates. |
| Phase 7 entitlement for existing domains | OPTIONAL | No Academy/Simulation/Community gate is added unless Human approves one. |
| Shared PostgreSQL | SOFT consumption dependency | UI consumes API contracts; Phase 9 owns no DB schema or migration. |
| Redis | SOFT runtime dependency | UI handles safe 429/503; Redis never becomes browser authority. |
| Existing design tokens/components | SOFT | Reuse and consolidate where useful without preserving stale visual defects. |
| Playwright browser E2E | HARD for FEAT-080 | Already selected in technology decisions; package/CI activation is proposed for Phase 9. |

## 5. Feature Boundaries

### FEAT-070 - Application Shell, Navigation & Route Governance

Objective: replace the stale foundation landing experience with a responsive product shell, deterministic navigation, route-level boundaries, safe 404 handling, and shared page-state primitives.

Depends on: approved frontend foundation; Phase 7 Human Final Gate before implementation.

Owns: `apps/web/src/app/**`, shell/layout/navigation components, route metadata, global page-state primitives, shell tests.

Does not own: domain workflows, authentication forms, authorization decisions, data mutations, backend, schema, or migration.

Quality Gate: route map, keyboard/mobile navigation, error boundary, 404, and shell regression pass.

### FEAT-071 - Authentication Entry & Account Experience

Objective: expose approved registration/login/logout/session-recovery behavior and a read-only account identity view without unsafe token persistence.

Depends on: FEAT-070 and approved Phase 2 contracts.

Owns: `/login`, `/register`, `/account`; auth form/UI adapters; safe internal return paths.

Does not own: profile mutation, email verification, password reset, role management, refresh-token JavaScript access, or client authorization.

Quality Gate: uniform login errors, registration validation, refresh recovery, safe redirects, no token leakage, and auth E2E pass.

### FEAT-072 - Learner Dashboard & Cross-Domain Summary

Objective: provide a useful home/dashboard assembled from approved read contracts without creating a new durable aggregate or authority.

Depends on: FEAT-070, FEAT-071, and the included Phase 4-7 domain contracts.

Owns: `/dashboard`, client-side summary orchestration, bounded partial-failure behavior.

Does not own: new aggregate API, new table/materialized view, cross-domain transaction, or invented progress/portfolio/entitlement calculations.

Quality Gate: safe DTO composition, partial failures, empty/loading/error states, request bounds, and no authority drift pass.

### FEAT-073 - Academy Experience Integration & Polish

Objective: integrate approved Academy catalog, lesson, flashcard, quiz, progression, and reward UI into the shell with consistent states and accessibility.

Depends on: FEAT-070, FEAT-071, Phase 4 approved baseline.

Owns: Academy frontend integration only.

Does not own: Academy schema/API changes, CMS, answer authority, reward authority, or product audit activation.

Quality Gate: learner journeys, answer secrecy, server grading, progression/reward regression, responsive and accessibility checks pass.

### FEAT-074 - Simulation & Portfolio Experience Integration

Objective: integrate the Simulation session, assets, orders, portfolio, positions, and trades UI while preserving clear simulated-only framing.

Depends on: FEAT-070, FEAT-071, Phase 5 approved baseline.

Owns: Simulation and portfolio frontend integration only.

Does not own: prices, balances, PnL, matching, order status, live brokerage, or new Simulation APIs.

Quality Gate: server-authoritative rendering, order safety, simulated disclosure, async states, mobile tables, and regression pass.

### FEAT-075 - Community Experience Integration & Polish

Objective: integrate feed, post, comments, likes, ownership actions, and safe rate-limit/outage behavior into the shell.

Depends on: FEAT-070, FEAT-071, Phase 6 approved baseline.

Owns: Community frontend integration only.

Does not own: moderation, editing, nested replies, comment likes, public feed, recommendation, or audit persistence.

Quality Gate: ownership/IDOR presentation, XSS-safe text, canonical refetch, pagination, 429/503, accessibility, and regression pass.

### FEAT-076 - Subscription Experience Integration & Polish

Objective: integrate the approved learner subscription status experience without creating checkout, payment, or entitlement authority.

Depends on: FEAT-070, FEAT-071, FEAT-057 and Phase 7 Human Final Gate.

Owns: Subscription learner frontend integration only.

Does not own: production checkout, payment input, provider selection, premium self-upgrade, admin override, or new premium gates.

Quality Gate: status matrix, server authority, privacy, no commerce surface under D10, accessibility, and Phase 7 regression pass.

### FEAT-077 - Admin Access Boundary & Existing Capability Surface

Objective: provide a minimal admin route that verifies existing PostgreSQL-authorized ADMIN access and renders no unapproved admin operation.

Depends on: FEAT-070, FEAT-071, FEAT-007/008.

Owns: `/admin` access/status presentation around the existing admin authorization contract.

Does not own: CMS, moderation, user/role/subscription mutation, audit viewer, support override, or hidden client authorization.

Quality Gate: 401/403/5xx fail-closed behavior, same-token role immediacy, role-free JWT, and no admin action surface pass.

### FEAT-078 - Aura Intelligence UI Integration

Objective: expose the approved Phase 8 assistant through the gateway contract with transparent education/simulation context, safe structured output, and complete states.

Depends on: FEAT-070, FEAT-071, Phase 8 gateway/contracts/QA/Human gate, and Human decision that AI is in the Phase 9 MVP.

Owns: AI assistant frontend only after the Phase 8 contract is frozen.

Does not own: Gemini SDK/provider calls, prompt construction, RAG, quotas, safety classification, advice guarantees, or AI persistence.

Quality Gate: gateway-only calls, structured rendering, context disclosure, refusal/safety states, quota states, accessibility, and prompt-injection display safety pass.

### FEAT-079 - Accessibility, Responsive & Async-State Hardening

Objective: run a cross-product remediation pass over the integrated UI and shared design primitives.

Depends on: FEAT-070 and completion of FEAT-071..078 surfaces included in MVP.

Owns: shared tokens/components and scoped fixes needed for accessibility, responsive behavior, and complete state coverage.

Does not own: new product functionality or server behavior.

Quality Gate: WCAG-oriented automated/manual matrix, keyboard/focus, viewport, reduced-motion, contrast, overflow, and async-state inventory pass.

### FEAT-080 - Phase 9 Product Integration & Browser E2E Gate

Objective: independently validate the integrated production-MVP UI in real browsers without adding or repairing product behavior in the gate.

Depends on: all Human-approved Phase 9 implementation features, all included product phase gates, live test dependencies, and exact-source CI.

Owns: Playwright E2E and Phase 9 QA evidence only.

Does not own: defect fixes, product behavior, schema, migrations, APIs, or UI features.

Quality Gate: all mandatory desktop/mobile journeys, accessibility checks, security boundaries, canonical validation, exact-source CI, zero P0/P1, and truthful governance pass.

## 6. Dependency DAG

```text
Phase 7 Human Final Gate
  -> FEAT-070
      -> FEAT-071
          -> FEAT-072
          -> FEAT-073
          -> FEAT-074
          -> FEAT-075
          -> FEAT-076
          -> FEAT-077
          -> FEAT-078 <- Phase 8 QA PASS + Human Final Gate

FEAT-070..FEAT-078 included in MVP
  -> FEAT-079
      -> FEAT-080
          -> Human Phase 9 Final Gate
```

The graph is acyclic. FEAT-073 through FEAT-077 may run in parallel after FEAT-070/071 and their domain gates. FEAT-078 remains hard-blocked by Phase 8.

## 7. Parallel Implementation Strategy

### Baseline and branch policy

- Common baseline: a Human-approved post-Phase-7 integration checkpoint containing all included domain UIs.
- Every feature uses an isolated worktree and `feat/FEAT-XXX-...` branch.
- No implementation branch starts from this planning branch.
- Self-verification/Internal Feature Gate is not independent QA.
- Exact-source CI must be green before publishing a feature checkpoint.

### Suggested waves

1. Wave 0: Human approves this master plan, ID reservation, MVP cut, and unresolved product decisions.
2. Wave 1: FEAT-070, then FEAT-071.
3. Wave 2 parallel: FEAT-072, FEAT-073, FEAT-074, FEAT-075, FEAT-076, FEAT-077 in separate feature-owned paths.
4. Wave 3: FEAT-078 after Phase 8 final gate.
5. Wave 4: integrate Wave 2/3 checkpoints in dependency order, then FEAT-079.
6. Wave 5: FEAT-080 independent Phase QA and Human Final Gate.

### Merge order

`FEAT-070 -> FEAT-071 -> FEAT-072 -> FEAT-073 -> FEAT-074 -> FEAT-075 -> FEAT-076 -> FEAT-077 -> FEAT-078 -> FEAT-079 -> FEAT-080`

Parallel work is rebased onto the latest approved shell checkpoint before integration. Shared `App.tsx`, global CSS/tokens, router roots, and package manifests have a single writer per integration window. FEAT-079 follows domain merges to avoid conflicting cross-cutting writes.

## 8. Architecture Decisions Preserved

- React/Vite/TanStack Query remain the frontend foundation.
- Express modular monolith and PostgreSQL/Prisma remain backend/durable authority.
- Redis remains transient-only.
- Auth access token remains memory-only; refresh token remains HTTP-only cookie based.
- Roles and entitlements remain server-derived; JWT/client state do not grant access.
- Domain data is consumed through approved APIs, not direct browser database/provider access.
- Gemini is accessible only through the Phase 8 AI gateway under ADR-006.
- Playwright is the approved browser E2E stack; Phase 9 proposes activating it in FEAT-080.
- Phase 9 owns zero database migrations under the proposed scope.

## 9. Human Decision Register

| ID | Decision Required | Proposed Default | Blocking Effect |
|---|---|---|---|
| P9-D01 | Approve reservation FEAT-058..069 for Phase 8 and FEAT-070..080 for Phase 9. | Approve | Blocks canonical feature IDs. |
| P9-D02 | Is Aura Intelligence included in the Phase 9 Production MVP cut? | Include | If included, FEAT-078/080 are hard-blocked by Phase 8; if deferred, Phase 9 scope and gate must explicitly exclude it. |
| P9-D03 | Account/profile scope. | Read-only `/account` using `/auth/me`; defer mutation | Editable profile requires a separate backend-owning feature. |
| P9-D04 | Dashboard data strategy. | Bounded client composition of existing reads | A new aggregate endpoint requires separately approved API ownership. |
| P9-D05 | Admin UI scope. | Access/status surface using existing admin guard only | New admin operations require separate backend specs. |
| P9-D06 | Existing-domain premium gates. | Add none in Phase 9 | Any gate requires per-domain Human approval and server enforcement. |
| P9-D07 | Activate Playwright and browser accessibility tooling in FEAT-080. | Approve | Blocks final real-browser gate design. |
| P9-D08 | Phase 8 and Phase 9 implementation/QA ownership. | Assign before implementation | Blocks execution, not planning review. |

## 10. Phase 9 Exit Gate

Phase 9 may be recommended PASS only when:

- The Human-approved Production MVP cut is explicit.
- Every included feature has completed its approved implementation/quality gate.
- FEAT-078 is complete if AI is included, or the deferral is explicitly Human-approved.
- FEAT-080 independently passes mandatory desktop/mobile E2E, accessibility, security-boundary, async-state, and regression validation.
- No mandatory validation is skipped and exact-source CI is green.
- There are zero unresolved P0/P1 defects and no contradictory governance state.
- Human Phase 9 Final Gate is explicitly approved.

Phase 10 remains blocked until that gate.
