# FEAT-071 Specification: Authentication Entry & Account Experience

Status: DONE / HUMAN FEATURE GATE APPROVED (2026-09-25)

## 1. Architecture Contract

- Objective: Provide safe registration, login, session recovery, logout, and read-only account identity experiences over the approved Phase 2 contracts.
- API: Consumes POST `/api/auth/register`, POST `/api/auth/login`, POST `/api/auth/refresh`, POST `/api/auth/logout`, and GET `/api/auth/me`. Canonical aliases share backend quotas and are not used to bypass limits.
- Persistence: ZERO database or migration changes.
- Security: Access tokens remain memory-only and refresh tokens remain HTTP-only cookies. Unknown-user/wrong-password errors stay uniform. Safe internal redirects reject external and protocol-relative targets.
- Ownership: Owns `/login`, `/register`, `/account`, auth form adapters, and account identity presentation. Profile mutation, password reset, email verification, role management, and admin provisioning are excluded.

## 2. Functional Contract

### FR-001

Add canonical `/login`, `/register`, and `/account` routes integrated with the shared shell.

### FR-002

Use only approved auth endpoints and request/response fields through the centralized auth client.

### FR-003

Apply FEAT-003 email normalization and password-policy UX while treating server validation as final authority.

### FR-004

Preserve uniform invalid-login behavior and safe 400/401/409/429/503/5xx presentation without enumeration leakage.

### FR-005

Keep access tokens in memory and refresh tokens inaccessible to JavaScript; never persist credentials or tokens.

### FR-006

Validate return destinations as same-application relative paths before redirecting after authentication.

### FR-007

Render read-only server-derived account identity and provide logout/session-expiry behavior without client role authority.

### FR-008

Test registration, login, refresh recovery, logout, redirects, accessibility, security, and regressions.

## 3. State and Error Contract

Every networked view must distinguish loading, success, empty where meaningful, authentication-required, authorization-denied, not-found, validation/rate-limit/unavailable, and generic failure as applicable. UI copy must be safe, bounded, and must not expose stack traces, provider details, database details, secrets, tokens, cookies, or sensitive paths.

## 4. Data and Authority Contract

ZERO database or migration changes. Browser state and query caches are presentation mechanisms only. Server denials and owning-domain facts override stale client state.

## 5. Quality Gate

All ACs must pass, targeted tests must be deterministic, relevant earlier-phase regressions and repository checks must remain green, exact-source CI must succeed, and there must be no open P0/P1. Self-verification is not independent QA.

