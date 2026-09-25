# FEAT-075 Specification: Community Experience Integration & Polish

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / IMPLEMENTATION_NOT_STARTED

## 1. Architecture Contract

- Objective: Integrate and polish approved Community feed, post, comment, and like workflows while preserving authentication, ownership, visibility, and rate-limit boundaries.
- API: Consumes only approved authenticated Community feed/post/comment/like endpoints and opaque cursor contracts.
- Persistence: ZERO database or migration changes.
- Security: User content renders as text, ownership is server-enforced, hidden/removed content stays unavailable, and Redis/rate-limit failures never produce false write success.
- Ownership: Owns Community frontend integration. Excludes public feed, editing, nested replies, comment likes, moderation/admin, reporting, recommendation, private messaging, and audit persistence.

## 2. Functional Contract

### FR-001

Integrate approved Community routes into the canonical shell with authenticated entry states.

### FR-002

Preserve opaque cursor pagination, server ordering, bounded load-more behavior, and canonical refetch.

### FR-003

Keep create/remove post and comment flows server-validated and ownership-authorized.

### FR-004

Keep post like/unlike state relationally server-derived with pending protection and canonical refetch.

### FR-005

Render user content safely as text and keep hidden/removed/moderation details unavailable.

### FR-006

Complete loading, empty, auth-required, not-found, validation, forbidden, rate-limit, Redis-unavailable, and generic error states.

### FR-007

Meet responsive, keyboard, focus, semantic, contrast, announcement, and reduced-motion requirements.

### FR-008

Run targeted Community journeys and Phase 6 ownership/concurrency/security regression with truthful evidence.

## 3. State and Error Contract

Every networked view must distinguish loading, success, empty where meaningful, authentication-required, authorization-denied, not-found, validation/rate-limit/unavailable, and generic failure as applicable. UI copy must be safe, bounded, and must not expose stack traces, provider details, database details, secrets, tokens, cookies, or sensitive paths.

## 4. Data and Authority Contract

ZERO database or migration changes. Browser state and query caches are presentation mechanisms only. Server denials and owning-domain facts override stale client state.

## 5. Quality Gate

All ACs must pass, targeted tests must be deterministic, relevant earlier-phase regressions and repository checks must remain green, exact-source CI must succeed, and there must be no open P0/P1. Self-verification is not independent QA.

