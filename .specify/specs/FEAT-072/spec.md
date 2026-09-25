# FEAT-072 Specification: Learner Dashboard & Cross-Domain Summary

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / IMPLEMENTATION NOT_STARTED

## 1. Architecture Contract

- Objective: Provide an authenticated learner dashboard composed from approved read contracts while avoiding a new cross-domain persistence or authority layer.
- API: Proposed default: bounded client composition of existing Academy progress, Simulation session/portfolio, Community feed, and Subscription current-user reads. No new aggregate endpoint is authorized.
- Persistence: ZERO database or migration changes; no materialized dashboard state.
- Security: Every domain request is authenticated as required. Partial results never imply authorization, entitlement, completion, balance, or ownership not returned by its owning server.
- Ownership: Owns `/dashboard`, summary orchestration, and partial-failure presentation. Excludes aggregate APIs, cross-domain transactions, analytics persistence, ranking, and client-derived authority.

## 2. Functional Contract

### FR-001

Add an authenticated `/dashboard` route with a useful summary of only the domains included in the Human-approved MVP cut.

### FR-002

Compose bounded existing read requests without adding an aggregate backend endpoint or durable dashboard model.

### FR-003

Display only server-returned facts and link users to owning domain routes for actions.

### FR-004

Handle per-widget loading, empty, unavailable, unauthorized, and error states without failing the entire dashboard.

### FR-005

Bound request fan-out, cancellation, retries, and refresh behavior to avoid request storms.

### FR-006

Keep Academy progress, Simulation portfolio, Community ownership, and Subscription entitlement authority in their owning services.

### FR-007

Meet responsive, keyboard, semantic, focus, contrast, and reduced-motion requirements.

### FR-008

Test composition, partial failure, stale/refetch behavior, security boundaries, performance bounds, and regressions.

## 3. State and Error Contract

Every networked view must distinguish loading, success, empty where meaningful, authentication-required, authorization-denied, not-found, validation/rate-limit/unavailable, and generic failure as applicable. UI copy must be safe, bounded, and must not expose stack traces, provider details, database details, secrets, tokens, cookies, or sensitive paths.

## 4. Data and Authority Contract

ZERO database or migration changes; no materialized dashboard state. Browser state and query caches are presentation mechanisms only. Server denials and owning-domain facts override stale client state.

## 5. Quality Gate

All ACs must pass, targeted tests must be deterministic, relevant earlier-phase regressions and repository checks must remain green, exact-source CI must succeed, and there must be no open P0/P1. Self-verification is not independent QA.

