# FEAT-070 Specification: Application Shell, Navigation & Route Governance

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / IMPLEMENTATION NOT_STARTED

## 1. Architecture Contract

- Objective: Deliver a cohesive, responsive application shell and deterministic route governance that replaces stale foundation-era presentation without changing domain behavior.
- API: No new API. The shell may observe existing authenticated session state but must not call domain APIs on behalf of routes.
- Persistence: ZERO database or migration changes.
- Security: Navigation visibility is convenience only. Server 401/403 remains authoritative; route code must not infer role or entitlement authority from client state.
- Ownership: Owns app shell, route metadata, navigation, global route error/404 boundaries, and shared page-state primitives. Excludes domain workflows, auth forms, backend code, schemas, and migrations.

## 2. Functional Contract

### FR-001

Define a canonical route registry for home, dashboard, account, Academy, Simulation, Community, Subscription, Admin, and future AI surfaces without claiming unavailable features are implemented.

### FR-002

Replace foundation-era phase/status marketing copy with a product-oriented shell and honest availability states.

### FR-003

Provide responsive desktop and mobile navigation with current-route indication, keyboard operation, focus management, and escape/close behavior.

### FR-004

Provide deterministic route-level loading, unavailable, error-boundary, and not-found presentation.

### FR-005

Establish shared layout and page-state primitives plus semantic design tokens that later Phase 9 features reuse.

### FR-006

Preserve the approved QueryClient and AuthProvider lifecycle without persisting access or refresh tokens in browser storage.

### FR-007

Treat client route visibility as non-authoritative and preserve safe handling of server 401, 403, 429, 503, and 5xx responses.

### FR-008

Add shell, router, navigation, responsive, accessibility, and regression tests with truthful evidence.

## 3. State and Error Contract

Every networked view must distinguish loading, success, empty where meaningful, authentication-required, authorization-denied, not-found, validation/rate-limit/unavailable, and generic failure as applicable. UI copy must be safe, bounded, and must not expose stack traces, provider details, database details, secrets, tokens, cookies, or sensitive paths.

## 4. Data and Authority Contract

ZERO database or migration changes. Browser state and query caches are presentation mechanisms only. Server denials and owning-domain facts override stale client state.

## 5. Quality Gate

All ACs must pass, targeted tests must be deterministic, relevant earlier-phase regressions and repository checks must remain green, exact-source CI must succeed, and there must be no open P0/P1. Self-verification is not independent QA.

