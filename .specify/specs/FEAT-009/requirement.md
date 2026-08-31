# Requirement: FEAT-009 Authentication Audit Events

**Status**: SPEC APPROVED FOR IMPLEMENTATION  
**Phase**: Phase 2 - Identity & Security  
**Feature ID**: FEAT-009  
**Owner Role**: Codex as Planner / Architect / QA Governance Owner  
**Implementation Agent**: Antigravity only after Human approval and handoff

## 1. Context

FEAT-001 through FEAT-008 have completed QA and Human Final Gate approval. Aura Capital now has identity persistence, registration, login, short-lived access tokens, refresh-token rotation, logout, RBAC, and an admin authorization guard.

FEAT-002 created an `AuthSecurityAuditRecord` persistence prerequisite, but no approved feature has implemented durable audit event emission. FEAT-009 owns the audit event behavior.

Security audit events are not ordinary application logs. Application logs are for diagnostics, request handling, runtime errors, and operational observability. Security audit events are durable records of security-significant actions and decisions, intended to support incident review, privileged-action traceability, authentication anomaly analysis, and compliance-oriented reporting.

## 2. Goal

Create a durable, structured, PostgreSQL-backed audit trail for important authentication and authorization events without weakening existing auth behavior or leaking credentials, tokens, secrets, or sensitive payloads.

## 3. Scope

FEAT-009 includes:

- Durable PostgreSQL-backed authentication/security audit event persistence.
- Central canonical event taxonomy and outcome taxonomy.
- Central audit service/emitter boundary.
- Safe actor/subject attribution.
- Request correlation with existing `requestId` where available.
- Controlled optional request metadata according to the approved PII/IP/User-Agent policy.
- Safe metadata allowlist and size limits.
- Integration of audit event emission into FEAT-003 through FEAT-008 auth/security flows.
- Tests proving persistence, no sensitive data, failure behavior, transaction behavior, and regression safety.

FEAT-009 excludes:

- Admin audit dashboard.
- Public or admin audit search/read API.
- User-facing audit endpoint.
- SIEM/exporter integration.
- Retention cleanup job or deletion API.
- Public role-management API.
- Any login, token, refresh, logout, RBAC, or admin response semantic changes.
- Authentication endpoint rate limiting.
- FEAT-010 integration gate work.

## 4. Recommended Human Decisions

These recommendations are encoded in the proposed spec and require Human approval before implementation:

| Decision | Recommendation | Rationale |
| --- | --- | --- |
| A. Event taxonomy | Use canonical event types listed in this package. | Prevent free-form scattered event strings and make QA/reporting deterministic. |
| B. Email policy | Do not store raw email. Do not persist `identityHash` in FEAT-009 by default. Unknown login failures use `actorUserId = null` and `subjectUserId = null`. If Human later requires identity correlation, it must use HMAC-SHA-256 with a dedicated audit identity secret, never raw SHA-256(email). | Minimizes Phase 2 privacy scope and avoids credential-like identity correlation without explicit approval. |
| C. IP policy | Phase 2 stores no IP address. | Avoid proxy/X-Forwarded-For trust decisions and privacy scope before rate limiting/edge architecture. |
| D. User-Agent policy | Store truncated user agent only when available, max 256 characters. | Useful for investigation while bounding attacker-controlled data. |
| E. Metadata policy | Allowlisted flat metadata per event, max serialized size 2 KiB. | Prevent unbounded JSON blobs and secret leakage. |
| F. Audit failure semantics | Auth/security decision remains correct; audit write failure is operationally logged and must not make denial permissive. Audit failure must not undo security revocation. Each state-changing event follows the explicit matrix in this package. | Prevents audit availability from weakening replay, logout, or privilege-removal security state. |
| G. Transaction coupling | `REGISTRATION_SUCCESS` and `ROLE_ASSIGNED` are transactionally coupled. `REFRESH_REPLAY_DETECTED`, `ROLE_REMOVED`, and `LOGOUT_SUCCESS` are security-state-first: revocation/removal commits even if audit persistence fails. Other events are best-effort or deferred as specified. | Privilege creation must not be untracked, while security revocation must never be rolled back by audit failure. |
| H. ADMIN authorization denial | Audit `AUTHORIZATION_DENIED` for `GET /admin/ping` denial in FEAT-009. Future admin guards require explicit scope extension and must not become universal 403 auditing by default. | Captures high-value denial without auditing every 403 in the app. |
| I. Successful ADMIN authorization | Do not audit successful `GET /admin/ping` in FEAT-009. | Avoid audit amplification from frequent admin health checks. |
| J. Logout attempts | Emit `LOGOUT_SUCCESS` only when a known active/current refresh session is actually revoked. Do not audit missing/malformed/already-inactive logout calls in FEAT-009. | Avoid audit spam from unauthenticated or arbitrary calls. |
| K. Role assignment/removal | Include `ROLE_ASSIGNED` and `ROLE_REMOVED` for server-side operational provisioning. | Privileged role changes are high-value security events. |
| L. Actor/subject FK strategy | Store actor/subject IDs as nullable UUID/text snapshots without hard user FK. Do not fabricate operator user IDs. Server-side role provisioning may include allowlisted `operationSource` metadata with values `OPERATOR` or `SYSTEM`; it must not come from public client input. | Audit records should survive user deletion and account lifecycle changes while keeping provisioning attribution honest. |
| M. Retention | Defer retention policy to production hardening. Records are append-only from application perspective. | Avoid irreversible retention/deletion commitments before compliance scope is defined. |
| N. AUTHENTICATION_FAILURE policy | Reserve `AUTHENTICATION_FAILURE` in taxonomy, but defer generic protected-endpoint 401 emission in FEAT-009. No audit-on-every-401 middleware. | Prevents audit amplification before rate limiting exists. `LOGIN_FAILURE` and `REFRESH_FAILURE` own their flows. |
| O. Legacy audit migration | Extend the existing FEAT-002 `AuthSecurityAuditRecord` / `auth_security_audit_records` persistence non-destructively. Add nullable fields/indexes as needed. Do not drop, replace, or rename the existing table without explicit Human approval and data-preserving migration tests. | Avoids data loss and forces Antigravity to stop if an unexpected destructive migration is required. |

## 5. Event Taxonomy

Proposed canonical event types:

- `REGISTRATION_SUCCESS`
- `LOGIN_SUCCESS`
- `LOGIN_FAILURE`
- `REFRESH_SUCCESS`
- `REFRESH_FAILURE`
- `REFRESH_REPLAY_DETECTED`
- `LOGOUT_SUCCESS`
- `AUTHENTICATION_FAILURE`
- `AUTHORIZATION_DENIED`
- `ROLE_ASSIGNED`
- `ROLE_REMOVED`

No arbitrary free-form event strings are allowed in production code.

## 6. Outcome Taxonomy

Proposed canonical outcomes:

- `SUCCESS`
- `FAILURE`
- `DENIED`
- `DETECTED`

Outcomes must be centralized and validated.

## 7. Actor And Subject Model

Definitions:

- `actorUserId`: the user or system/operator causing the event, nullable.
- `subjectUserId`: the user affected by the event, nullable.

Rules:

- For `REGISTRATION_SUCCESS`, actor and subject are the registered user.
- For `LOGIN_SUCCESS`, actor and subject are the authenticated user.
- For `LOGIN_FAILURE` with unknown identity, actor and subject are null.
- For `REFRESH_*`, actor and subject are the session user when known.
- For `LOGOUT_SUCCESS`, actor and subject are the user whose active session was revoked.
- For `AUTHENTICATION_FAILURE`, actor/subject are null unless a verified user context exists.
- For `AUTHORIZATION_DENIED`, actor and subject are the authenticated denied user.
- For `ROLE_ASSIGNED` and `ROLE_REMOVED`, actor is the operator/system if known, otherwise null; subject is the target user.
- Do not fabricate user IDs for unknown identities.
- Do not trust client-provided actor, subject, role, admin, or user identity fields.

## 8. Correlation And Metadata

Audit events should include:

- `requestId` where available.
- `occurredAt`.
- `eventType`.
- `outcome`.
- `actorUserId`.
- `subjectUserId`.
- `sessionId` only when it is a server-side durable identifier and safe for internal audit.
- no `identityHash` in FEAT-009 by default. If Human later enables identity correlation, it must be HMAC-SHA-256 over normalized email with a dedicated environment-only audit identity secret that is not the access-token, refresh-token, or JWT secret.
- `userAgent` if available, truncated to 256 characters.
- `metadata` as flat allowlisted JSON, max 2 KiB serialized.

Do not store raw Authorization headers, Cookie headers, full request bodies, raw JWTs, access tokens, refresh tokens, refresh verifiers, passwords, password hashes, raw emails, IP addresses, auth secrets, or database credentials.

`requestId` must be server-derived from the existing request context. Do not trust request IDs supplied through request body or query parameters. If the existing logging middleware accepts an inbound correlation header, FEAT-009 may reuse only that already-normalized server request context value and must not create a separate audit-only correlation source.

`userAgent` is attacker-controlled input. If persisted, sanitize/truncate before persistence, cap at 256 characters, remove control characters where relevant to logs, and allow absence.

Optional metadata must be sanitized before persistence. Invalid or oversized optional metadata must be dropped or reduced for security-state-first events so revocation/removal still commits. For privilege grants, if a required audit event cannot be safely constructed, the grant must not commit.

## 9. Failure Semantics

Security decisions must remain correct if audit persistence fails:

- A denied request must stay denied.
- A failed login must stay failed.
- `REGISTRATION_SUCCESS`: user + credential + required audit event may commit atomically. If audit insert fails, the user/credential transaction rolls back and the response is a safe existing internal failure.
- `ROLE_ASSIGNED`: privilege grant must not commit if its required audit event cannot persist safely.
- `REFRESH_REPLAY_DETECTED`: confirmed replay requires family/session revocation to commit even if audit insert fails.
- `ROLE_REMOVED`: privilege removal must commit even if audit insert fails.
- `LOGOUT_SUCCESS`: known active/current session revocation must commit even if audit insert fails; do not emit `LOGOUT_SUCCESS` if the session was never revoked.
- Post-commit durable best-effort audit failures must be logged through sanitized application logs with requestId, event type, and failure category only.
- Audit failure must not recursively emit another audit event.

## 10. Transaction Strategy Matrix

| Event | Security State Mutation? | Coupling Strategy | Audit Failure State Behavior | External Response Behavior |
| --- | --- | --- | --- | --- |
| `REGISTRATION_SUCCESS` | Creates user and credential | Transactionally coupled | Roll back user and credential with safe internal failure | Existing safe registration failure, no DB/audit internals |
| `LOGIN_SUCCESS` | No durable security-state mutation required by FEAT-004 | Best-effort after successful login | Login remains successful; sanitized operational log records audit failure | Existing successful login response |
| `LOGIN_FAILURE` | No grant; failed decision | Best-effort | Failure remains failed; sanitized operational log records audit failure | Existing uniform invalid-login response |
| `REFRESH_SUCCESS` | Refresh rotation already completed by FEAT-005 semantics | Best-effort after approved rotation | Rotation remains according to FEAT-005; sanitized operational log records audit failure | Existing refresh response |
| `REFRESH_FAILURE` | Failed decision or rejected request | Best-effort | Failure remains failed; sanitized operational log records audit failure | Existing safe refresh failure |
| `REFRESH_REPLAY_DETECTED` | Revokes refresh family/session security continuity | Security-state-first | Revocation commits; audit failure cannot roll back family/session revocation | Existing FEAT-005 replay-safe failure |
| `LOGOUT_SUCCESS` | Revokes known active/current refresh session | Security-state-first | Revocation commits; audit failure cannot keep session active | Existing FEAT-006 logout success if revocation succeeded |
| `AUTHENTICATION_FAILURE` | None in FEAT-009; reserved/deferred | Deferred, no generic middleware emission | No durable event emitted for arbitrary 401s | Existing 401 behavior unchanged |
| `AUTHORIZATION_DENIED` | Denied decision | Best-effort for approved admin denial only | Denial remains denied; sanitized operational log records audit failure | Existing 403 behavior unchanged |
| `ROLE_ASSIGNED` | Grants privilege | Transactionally coupled | Role grant does not commit if required audit insert fails | Safe operational failure, no untracked privilege grant |
| `ROLE_REMOVED` | Removes privilege | Security-state-first | Role removal commits; audit failure cannot preserve privilege | Safe existing provisioning result/failure according to operation boundary |

## 11. Dependencies

Required approved dependencies:

- FEAT-002 identity persistence and audit prerequisite.
- FEAT-003 registration/password security.
- FEAT-004 login/access token semantics.
- FEAT-005 refresh rotation/replay semantics.
- FEAT-006 logout/current-session semantics.
- FEAT-007 RBAC and server-side role provisioning.
- FEAT-008 admin authorization guard.

FEAT-010 remains blocked until FEAT-009 receives QA PASS and Human Final Gate approval.

## 12. Out Of Scope Reaffirmation

FEAT-009 must not implement rate limiting. Authentication endpoint rate limiting remains required before Phase 2 final completion and should be assigned by Human as a dedicated implementation feature before FEAT-010 or explicitly attached to another Human-approved feature.
