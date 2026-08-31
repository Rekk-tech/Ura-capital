# Specification: FEAT-009 Authentication Audit Events

**Status**: SPEC APPROVED FOR IMPLEMENTATION  
**Phase**: Phase 2 - Identity & Security  
**Feature ID**: FEAT-009

## User Stories

### US1 - Persist Structured Security Audit Events (P1)

As a security reviewer, I need security-significant auth events stored durably in a structured form so investigations do not depend on volatile console output or application logs.

**Independent Test**: Trigger a representative audited event and verify a PostgreSQL record exists with canonical event type, outcome, timestamp, safe actor/subject fields, request correlation, and no sensitive values.

### US2 - Audit Authentication Outcomes Safely (P1)

As a security reviewer, I need registration, login, refresh, replay, and logout outcomes to create safe audit events so account and session activity can be reconstructed without exposing credentials or tokens.

**Independent Test**: Execute registration success, login success, login failure, refresh success/failure, refresh replay, and active-session logout, then verify expected audit records and unchanged external API responses.

### US3 - Audit Authorization And Role Security Events (P2)

As an operator, I need admin authorization denial and server-side role assignment/removal to be auditable so privileged access changes and blocked admin attempts are traceable.

**Independent Test**: Deny a non-admin request to `GET /admin/ping`, assign ADMIN, remove ADMIN, and verify canonical audit records without introducing public role-management endpoints.

### US4 - Preserve Existing Auth Semantics Under Audit Failure (P1)

As a platform owner, I need audit persistence failures to be handled predictably so security decisions remain correct and audit failure does not become either a bypass or an accidental outage beyond approved critical transactions.

**Independent Test**: Simulate audit repository failure in post-commit and transactionally coupled paths and verify approved fail-safe behavior, sanitized operational logging, and no recursive audit attempts.

## Functional Requirements

- **FR-001**: FEAT-009 MUST implement durable audit event persistence in PostgreSQL and MUST NOT use Redis, in-memory arrays, or log files as the durable audit system of record.
- **FR-002**: FEAT-009 MUST define a centralized canonical event taxonomy with no scattered free-form event strings.
- **FR-003**: FEAT-009 MUST define a centralized canonical outcome taxonomy.
- **FR-004**: Audit event creation MUST go through a central service/emitter interface; controllers MUST NOT write Prisma audit records directly.
- **FR-005**: Audit persistence MUST remain behind repository boundaries. Controllers and route handlers MUST remain Prisma-free.
- **FR-006**: Audit events MUST support nullable `actorUserId` and nullable `subjectUserId` according to the approved actor/subject model.
- **FR-007**: Audit events MUST include `requestId` when available.
- **FR-008**: Audit events MUST include server-generated `occurredAt` timestamps.
- **FR-009**: Audit events MUST NOT persist passwords, password hashes, refresh tokens, access tokens, raw JWTs, refresh verifiers, auth secrets, Cookie headers, Authorization headers, database credentials, full request bodies, stack traces, or raw Prisma/database errors.
- **FR-010**: Raw email MUST NOT be persisted in audit records. FEAT-009 MUST NOT persist `identityHash` by default; unknown login failures MUST use nullable actor/subject IDs without identity correlation. If Human later enables identity correlation, it MUST use HMAC-SHA-256 over normalized email with a dedicated environment-only audit identity secret, never raw SHA-256(email), JWT access secret, refresh secret, or auth secret reuse.
- **FR-011**: FEAT-009 MUST NOT store IP addresses in Phase 2 unless Human changes the IP policy. It MUST NOT trust `X-Forwarded-For` as an audit authority.
- **FR-012**: FEAT-009 MAY store user agent only as an optional attacker-controlled string sanitized before persistence, stripped of control characters where relevant, and truncated to max length 256. User-agent absence MUST be valid.
- **FR-013**: Audit metadata MUST be flat, allowlisted per event type, sanitized, and limited to max 2 KiB serialized size. Arbitrary request bodies and nested arbitrary JSON MUST NOT be copied into metadata.
- **FR-014**: `REGISTRATION_SUCCESS` MUST be emitted only after durable user and credential creation succeeds and MUST be transactionally coupled with user + credential creation. If required audit insert fails, user + credential creation MUST roll back and return a safe existing internal failure.
- **FR-015**: `LOGIN_SUCCESS` MUST be emitted after successful credential verification without changing FEAT-004 response shape.
- **FR-016**: `LOGIN_FAILURE` MUST be emitted for unknown-user, wrong-password, or inactive/no-credential failures without changing FEAT-004 uniform external invalid-login behavior.
- **FR-017**: Internal login failure reason MAY be stored only as an approved safe metadata enum and MUST NOT leak to clients.
- **FR-018**: `REFRESH_SUCCESS` MUST be emitted after successful refresh rotation without storing raw refresh token or verifier.
- **FR-019**: `REFRESH_FAILURE` MUST be emitted for safe refresh failures when the event can be classified without sensitive data.
- **FR-020**: `REFRESH_REPLAY_DETECTED` MUST be emitted for confirmed known replay/reuse and include safe server-side session/family identifiers if approved. Confirmed replay family/session revocation MUST commit even if audit persistence fails.
- **FR-021**: `LOGOUT_SUCCESS` MUST be emitted only when a known active/current refresh session is actually revoked. Session revocation MUST commit even if audit persistence fails; do not emit `LOGOUT_SUCCESS` if revocation did not occur.
- **FR-022**: Missing, malformed, unknown, expired, already revoked, or consumed logout attempts MUST NOT emit `LOGOUT_SUCCESS` in FEAT-009.
- **FR-023**: `AUTHENTICATION_FAILURE` is reserved in the canonical taxonomy but generic protected-endpoint 401 emission is deferred in FEAT-009. FEAT-009 MUST NOT add audit-on-every-401 middleware for missing bearer tokens, expired tokens, malformed Authorization headers, or arbitrary unauthenticated requests.
- **FR-024**: `AUTHORIZATION_DENIED` MUST be emitted for FEAT-008 `GET /admin/ping` ADMIN authorization denial in FEAT-009. It MUST NOT become universal auditing for all 403 responses or future admin guards without explicit scope extension. Successful admin pings MUST NOT be audited in FEAT-009.
- **FR-025**: `ROLE_ASSIGNED` and `ROLE_REMOVED` MUST be emitted for server-side operational role provisioning and removal. FEAT-009 MUST NOT introduce public role-management APIs. `ROLE_ASSIGNED` MUST be transactionally coupled and fail safely without granting privilege if its required audit event cannot persist. `ROLE_REMOVED` MUST be security-state-first: role removal commits even if audit persistence fails.
- **FR-026**: Audit failure MUST NOT make an authentication or authorization denial permissive.
- **FR-027**: Post-commit durable best-effort audit write failure MUST produce a sanitized application log with requestId, event type, and failure category only.
- **FR-028**: Audit write failure MUST NOT recursively emit another audit event.
- **FR-029**: State-changing events MUST follow the explicit transaction strategy matrix. A single generic rollback rule MUST NOT be applied to all security transitions.
- **FR-030**: For transactionally coupled events, audit insert failure MUST fail or roll back the related grant/creation. For security-state-first revocations/removals, audit insert failure MUST NOT roll back the revocation/removal.
- **FR-031**: Audit records MUST be append-only from application behavior. FEAT-009 MUST NOT expose update/delete audit APIs.
- **FR-032**: FEAT-009 MUST NOT add audit read/search UI or API.
- **FR-033**: FEAT-009 MUST preserve FEAT-003 through FEAT-008 response contracts and security semantics.
- **FR-034**: FEAT-009 MUST include unit, integration, PostgreSQL-backed, security, and regression tests. DB-backed validation MUST run migration deployment before DB suites and must test both fresh isolated migration and migration from the existing FEAT-008 schema.
- **FR-035**: FEAT-009 MUST document rate-limit audit-amplification risk but MUST NOT implement rate limiting.
- **FR-036**: FEAT-009 MUST extend the existing FEAT-002 `AuthSecurityAuditRecord` / `auth_security_audit_records` persistence non-destructively. It MUST NOT drop, replace, or rename the existing table without explicit Human approval, row-preserving mapping, fresh migration tests, and existing-schema migration tests. Antigravity must stop if an unexpected destructive migration is required.
- **FR-037**: `requestId` MUST be server-derived from the existing request context and MUST NOT trust body/query request IDs as audit authority.
- **FR-038**: Best-effort audit failure logs MUST include only safe operational fields such as requestId, eventType, and failure category. They MUST NOT log audit payloads, metadata blobs, actor email, tokens, cookies, raw Prisma errors, DB URLs, or unsafe production stack traces.

## Key Entities

### AuthenticationAuditEvent

Durable security audit event.

Candidate fields:

- `id`
- `eventType`
- `outcome`
- `actorUserId`
- `subjectUserId`
- `requestId`
- `sessionId`
- `identityHash` disabled by default; only allowed if Human later approves HMAC-based identity correlation
- `userAgent`
- `metadata`
- `occurredAt`

Recommended indexes:

- `occurredAt`
- `eventType`
- `actorUserId`
- `subjectUserId`
- `requestId`

### Audit Metadata

Flat event-specific allowlisted metadata. It must be sanitized before persistence and bounded to 2 KiB serialized size. Invalid or oversized optional metadata is dropped or reduced for security-state-first events so replay revocation, role removal, and logout revocation still commit. For privilege grants, if the required audit event cannot be safely constructed, the grant must not commit.

### Transaction Strategy Matrix

| Event | Coupling Strategy | Audit Failure State Behavior |
| --- | --- | --- |
| `REGISTRATION_SUCCESS` | Transactionally coupled | User + credential roll back. |
| `LOGIN_SUCCESS` | Best-effort | Login remains successful. |
| `LOGIN_FAILURE` | Best-effort | Failure remains failed. |
| `REFRESH_SUCCESS` | Best-effort | Refresh result follows FEAT-005. |
| `REFRESH_FAILURE` | Best-effort | Failure remains failed. |
| `REFRESH_REPLAY_DETECTED` | Security-state-first | Family/session revocation commits. |
| `LOGOUT_SUCCESS` | Security-state-first | Active/current session revocation commits. |
| `AUTHENTICATION_FAILURE` | Deferred in FEAT-009 | No generic durable row for arbitrary 401s. |
| `AUTHORIZATION_DENIED` | Best-effort for admin denial only | Denial remains 403. |
| `ROLE_ASSIGNED` | Transactionally coupled | Role grant does not commit. |
| `ROLE_REMOVED` | Security-state-first | Role removal commits. |

## Success Criteria

- **SC-001**: All approved audit event types can be persisted durably and queried by tests from PostgreSQL.
- **SC-002**: Each audited auth/security flow produces exactly the expected canonical event(s), without duplicate noise for normal idempotent cases.
- **SC-003**: Security tests find no persisted password, password hash, access token, refresh token, raw JWT, verifier, Cookie header, Authorization header, secret, raw DB error, or full request body.
- **SC-004**: FEAT-004 invalid login responses remain externally uniform while audit records remain safe.
- **SC-005**: FEAT-005 replay detection emits a durable replay event without storing raw token material.
- **SC-006**: FEAT-007 role assignment/removal emits durable events without creating public role-management behavior.
- **SC-007**: FEAT-008 admin denial emits a durable event and successful admin ping does not create audit noise.
- **SC-008**: Required validation suite and FEAT-001 through FEAT-008 regressions pass.

## Assumptions

- Existing `AuthSecurityAuditRecord` must be extended non-destructively unless Human explicitly approves a data-preserving replacement migration.
- PostgreSQL remains durable source of truth.
- Redis is not needed for FEAT-009.
- Retention and audit read APIs are deferred.
- Rate limiting is still unresolved and must be handled before Phase 2 final gate.
