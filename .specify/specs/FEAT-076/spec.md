# FEAT-076 Specification: Subscription Experience Integration & Polish

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / IMPLEMENTATION_NOT_STARTED

## 1. Architecture Contract

- Objective: Integrate the approved learner Subscription experience into the product shell without adding production commerce, payment handling, entitlement authority, or new premium gates.
- API: Consumes only approved plan/current-user subscription read contracts and any Human-approved existing command contract; D10 production commerce deferral remains authoritative.
- Persistence: ZERO database or migration changes.
- Security: PostgreSQL and server entitlement resolution remain authoritative. Client cache, route state, flags, and query parameters cannot grant premium. Provider/payment internals remain private.
- Ownership: Owns Subscription learner frontend integration. Excludes provider implementation, checkout/payment collection, admin override, reconciliation UI, invoices/refunds/tax/coupons, and new domain premium gates.

## 2. Functional Contract

### FR-001

Integrate the canonical Subscription learner route and navigation into the shared shell.

### FR-002

Render only approved safe plan, subscription, entitlement, period, and cancellation-state DTO fields.

### FR-003

Preserve FREE/no-record, ACTIVE, PAST_DUE, cancellation-pending, CANCELLED, and EXPIRED server semantics.

### FR-004

Enforce the approved production-commerce deferral with no upgrade, subscribe, checkout, payment, renewal, or fake-success surface.

### FR-005

Keep entitlement and command outcomes server-authoritative and resistant to client cache/flag/query spoofing.

### FR-006

Complete loading, empty, auth-required, forbidden, conflict, rate-limit, unavailable, and generic error states.

### FR-007

Meet responsive, keyboard, focus, labels, announcement, contrast, and reduced-motion requirements.

### FR-008

Run targeted Subscription journeys and Phase 7 provider/entitlement/audit regression with truthful evidence.

## 3. State and Error Contract

Every networked view must distinguish loading, success, empty where meaningful, authentication-required, authorization-denied, not-found, validation/rate-limit/unavailable, and generic failure as applicable. UI copy must be safe, bounded, and must not expose stack traces, provider details, database details, secrets, tokens, cookies, or sensitive paths.

## 4. Data and Authority Contract

ZERO database or migration changes. Browser state and query caches are presentation mechanisms only. Server denials and owning-domain facts override stale client state.

## 5. Quality Gate

All ACs must pass, targeted tests must be deterministic, relevant earlier-phase regressions and repository checks must remain green, exact-source CI must succeed, and there must be no open P0/P1. Self-verification is not independent QA.

