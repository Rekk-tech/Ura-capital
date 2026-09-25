# FEAT-077 Specification: Admin Access Boundary & Existing Capability Surface

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / IMPLEMENTATION_NOT_STARTED

## 1. Architecture Contract

- Objective: Provide a minimal, fail-closed admin access/status surface over the existing PostgreSQL-authorized ADMIN guard without inventing administrative product capabilities.
- API: Consumes existing authenticated `GET /admin/ping` or its approved canonical alias only. No admin mutation/read API is invented.
- Persistence: ZERO database or migration changes.
- Security: PostgreSQL is the sole ADMIN authority; JWT remains role-free; client navigation or cached account data never authorizes; 401/403/5xx fail closed.
- Ownership: Owns `/admin` status/access presentation only. Excludes CMS, moderation, role/user/subscription mutation, audit viewing, support override, reconciliation, and default credentials.

## 2. Functional Contract

### FR-001

Add a canonical `/admin` route only after Human approves the minimal existing-capability scope.

### FR-002

Authenticate through the approved session and verify access through the existing server admin guard.

### FR-003

Render distinct safe unauthenticated, denied, allowed, and unavailable states without role enumeration leakage.

### FR-004

Ensure zero-role, USER-only, and ROOT-only users cannot gain ADMIN access through client state.

### FR-005

Reflect same-token ADMIN grant/removal immediately by rechecking server authority.

### FR-006

Expose no administrative command, role-management, CMS, moderation, subscription, audit, or repair operation.

### FR-007

Meet responsive, keyboard, focus, semantic, contrast, and announcement requirements.

### FR-008

Test server-authority, spoof resistance, fail-closed errors, route security, and regressions.

## 3. State and Error Contract

Every networked view must distinguish loading, success, empty where meaningful, authentication-required, authorization-denied, not-found, validation/rate-limit/unavailable, and generic failure as applicable. UI copy must be safe, bounded, and must not expose stack traces, provider details, database details, secrets, tokens, cookies, or sensitive paths.

## 4. Data and Authority Contract

ZERO database or migration changes. Browser state and query caches are presentation mechanisms only. Server denials and owning-domain facts override stale client state.

## 5. Quality Gate

All ACs must pass, targeted tests must be deterministic, relevant earlier-phase regressions and repository checks must remain green, exact-source CI must succeed, and there must be no open P0/P1. Self-verification is not independent QA.

