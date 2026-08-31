# Implementation Plan: FEAT-009 Authentication Audit Events

**Status**: SPEC APPROVED FOR IMPLEMENTATION  
**Phase**: Phase 2 - Identity & Security  
**Implementation Rule**: Spec is Human-approved for implementation. Codex must not implement application code in this governance/traceability turn; Antigravity may implement only after explicit implementation handoff.

## 1. Summary

FEAT-009 adds durable PostgreSQL-backed security audit events for authentication and authorization flows built in FEAT-003 through FEAT-008. It introduces a central audit taxonomy, outcome taxonomy, repository boundary, audit service/emitter, safe metadata policy, and integration points without changing existing external auth response semantics.

## 2. Technical Context

- Backend: Node.js + TypeScript + Express.
- Database: PostgreSQL.
- ORM: Prisma behind repositories.
- Validation: Zod.
- Tests: Vitest, Supertest, PostgreSQL-backed DB tests, runtime smoke.
- Redis: not used for durable audit events.
- Existing prerequisite: FEAT-002 `AuthSecurityAuditRecord` table/model exists and must be extended non-destructively unless Human explicitly approves a data-preserving replacement.

## 3. Architecture Decisions

### Decision 1 - PostgreSQL Is Durable Audit Authority

Use PostgreSQL for durable audit persistence. Redis, logs, and memory are rejected as audit authority.

Implication: audit schema/migration and DB-backed tests are mandatory.

### Decision 2 - Central Audit Service Boundary

Use a central audit service/emitter such as `AuditService.record(event)` plus typed event factories.

Implication: controllers/routes do not write Prisma directly; auth services integrate through the audit boundary.

### Decision 3 - Canonical Taxonomy

Use centralized constants/types for event types and outcomes.

Implication: tests must fail for unknown/free-form event types or outcomes.

### Decision 4 - PII-Minimal Audit Payload

Do not store raw email or IP address in Phase 2. Do not persist `identityHash` in FEAT-009 by default. If Human later requires identity correlation, use HMAC-SHA-256 over normalized email with a dedicated environment-only audit identity secret, never raw SHA-256(email) or token secrets. Store optional user agent only after sanitization/truncation to 256 chars.

Implication: tests must inspect database rows for absence of raw emails, IPs, tokens, and credentials.

### Decision 5 - Flat Allowlisted Metadata

Metadata is event-specific, flat, sanitized, and max 2 KiB. Invalid optional metadata is dropped or reduced for replay revocation, logout revocation, and role removal so security state still commits. For role assignment, if the required audit event cannot be safely constructed, the privilege grant does not commit.

Implication: no arbitrary request body persistence and no nested unbounded JSON blobs.

### Decision 6 - Mixed Transaction Strategy

Transactionally coupled grant/creation events:

- `REGISTRATION_SUCCESS`
- `ROLE_ASSIGNED`

Security-state-first revocation/removal events:

- `REFRESH_REPLAY_DETECTED`
- `LOGOUT_SUCCESS`
- `ROLE_REMOVED`

Post-commit durable best-effort:

- `LOGIN_SUCCESS`
- `LOGIN_FAILURE`
- `REFRESH_SUCCESS`
- `REFRESH_FAILURE`
- `AUTHORIZATION_DENIED`

Deferred/reserved:

- `AUTHENTICATION_FAILURE`

Implication: privilege creation does not silently complete without required audit records, but audit failure never rolls back replay revocation, logout revocation, or role removal.

### Decision 7 - Append-Only Application Model

FEAT-009 exposes no update/delete/read/search audit API.

Implication: QA should reject public audit mutation/read endpoints unless Human changes scope.

## 4. Proposed Data Model

Domain event name: `AuthenticationAuditEvent`.

Persistence strategy: extend existing FEAT-002 `AuthSecurityAuditRecord` / `auth_security_audit_records` non-destructively. Do not drop, replace, or rename the existing table without explicit Human approval, row-preserving mapping, fresh migration tests, and existing-schema migration tests. Antigravity must stop if an unexpected destructive migration is required.

Fields:

- `id`: durable primary ID.
- `eventType`: canonical event type.
- `outcome`: canonical outcome.
- `actorUserId`: nullable user ID snapshot.
- `subjectUserId`: nullable user ID snapshot.
- `requestId`: nullable request correlation ID.
- `sessionId`: nullable server-side session ID.
- `identityHash`: disabled by default; only allowed if Human later approves HMAC-based identity correlation.
- `userAgent`: nullable, attacker-controlled, sanitized and truncated to max 256 characters.
- `metadata`: nullable JSON, flat allowlisted object, max 2 KiB serialized.
- `occurredAt`: server-generated timestamp.

Recommended indexes:

- `occurredAt`
- `eventType`
- `actorUserId`
- `subjectUserId`
- `requestId`

Foreign key strategy:

- Recommended: actor/subject IDs are stored as nullable snapshots without hard FK to `User`.
- Rationale: audit records should survive account deletion/anonymization lifecycle. FEAT-002 `userId` relation can remain for backward compatibility only if implementation migrates safely and does not lose records.

## 5. Event Taxonomy And Metadata

| Event Type | Outcome | Actor | Subject | Coupling | Metadata Allowlist |
| --- | --- | --- | --- | --- | --- |
| `REGISTRATION_SUCCESS` | `SUCCESS` | new user | new user | Transactionally coupled | none by default |
| `LOGIN_SUCCESS` | `SUCCESS` | user | user | Best-effort | `sessionId` if safe |
| `LOGIN_FAILURE` | `FAILURE` | null or known user | null or known user | Best-effort | `reasonCode`; no `identityHash` by default |
| `REFRESH_SUCCESS` | `SUCCESS` | user | user | Best-effort | `sessionId`, `familyId` if safe |
| `REFRESH_FAILURE` | `FAILURE` | null or known user | null or known user | Best-effort | `reasonCode`, `sessionId` if known |
| `REFRESH_REPLAY_DETECTED` | `DETECTED` | user if known | user if known | Security-state-first | `sessionId`, `familyId` |
| `LOGOUT_SUCCESS` | `SUCCESS` | user | user | Security-state-first | `sessionId` |
| `AUTHENTICATION_FAILURE` | `FAILURE` | null or known user | null or known user | Deferred in FEAT-009 | none |
| `AUTHORIZATION_DENIED` | `DENIED` | denied user | denied user | Best-effort admin denial only | `route`, `requiredRole` |
| `ROLE_ASSIGNED` | `SUCCESS` | operator/system/null | target user | Transactionally coupled | `roleCode`, `operationSource` |
| `ROLE_REMOVED` | `SUCCESS` | operator/system/null | target user | Security-state-first | `roleCode`, `operationSource` |

Allowed safe reason codes may include:

- `UNKNOWN_USER`
- `BAD_PASSWORD`
- `INACTIVE_USER`
- `MISSING_REFRESH_COOKIE`
- `UNKNOWN_REFRESH_SESSION`
- `EXPIRED_REFRESH_SESSION`
- `REVOKED_REFRESH_SESSION`
- `INSUFFICIENT_ROLE`

Reason codes are internal audit metadata only and must never change the external response contract. `AUTHENTICATION_FAILURE` must not be wired as generic audit-on-every-401 middleware in FEAT-009, so missing/malformed/expired bearer-token reason codes are intentionally excluded from this feature.

## 5.1 Transaction Strategy Matrix

| Event | Security State Mutation? | Coupling Strategy | Audit Failure State Behavior | External Response Behavior |
| --- | --- | --- | --- | --- |
| `REGISTRATION_SUCCESS` | Creates user and credential | Transactionally coupled | Roll back user and credential | Safe internal registration failure |
| `LOGIN_SUCCESS` | No durable mutation required by FEAT-004 | Best-effort | Login remains successful | Existing login success |
| `LOGIN_FAILURE` | No grant | Best-effort | Failure remains failed | Existing uniform invalid login |
| `REFRESH_SUCCESS` | Rotation follows FEAT-005 | Best-effort | Refresh result remains as FEAT-005 defines | Existing refresh response |
| `REFRESH_FAILURE` | Failed decision | Best-effort | Failure remains failed | Existing refresh failure |
| `REFRESH_REPLAY_DETECTED` | Revokes family/session continuity | Security-state-first | Revocation commits | Existing replay-safe failure |
| `LOGOUT_SUCCESS` | Revokes known active/current session | Security-state-first | Revocation commits | Existing FEAT-006 logout response |
| `AUTHENTICATION_FAILURE` | None in FEAT-009 | Deferred | No generic audit row | Existing 401 |
| `AUTHORIZATION_DENIED` | Denied decision | Best-effort for `GET /admin/ping` denial | Denial remains denied | Existing 403 |
| `ROLE_ASSIGNED` | Grants privilege | Transactionally coupled | Grant does not commit | Safe operational failure |
| `ROLE_REMOVED` | Removes privilege | Security-state-first | Removal commits | Existing provisioning behavior |

## 6. Integration Map

FEAT-003:

- Emit `REGISTRATION_SUCCESS` after atomic user + credential creation.

FEAT-004:

- Emit `LOGIN_SUCCESS`.
- Emit `LOGIN_FAILURE` while preserving uniform invalid login response.
- Do not emit generic `AUTHENTICATION_FAILURE` for protected endpoint token failures in FEAT-009; the event remains reserved/deferred to prevent every-401 audit amplification.

FEAT-005:

- Emit `REFRESH_SUCCESS`.
- Emit `REFRESH_FAILURE`.
- Emit `REFRESH_REPLAY_DETECTED` during confirmed known replay/family revocation.

FEAT-006:

- Emit `LOGOUT_SUCCESS` only when an active known current session is durably revoked.

FEAT-007:

- Emit `ROLE_ASSIGNED`.
- Emit `ROLE_REMOVED`.
- Keep operational provisioning server-side only.

FEAT-008:

- Emit `AUTHORIZATION_DENIED` for `GET /admin/ping` admin denial only.
- Do not emit successful admin ping audit events in FEAT-009.

## 7. Failure Semantics

Best-effort audit failures:

- Do not change auth/authz outcome.
- Log sanitized operational failure with requestId, eventType, and failure category only.
- Do not recursively audit audit failure.

Transactionally coupled audit failures:

- Roll back the coupled creation/grant when audit event is required.
- Return the existing safe failure family for that operation.
- Do not leak audit DB internals.

Security-state-first audit failures:

- Do not roll back replay revocation, logout revocation, or role removal.
- Sanitize/drop invalid optional metadata instead of blocking the security revocation/removal.
- Log only safe operational failure metadata.
- Do not recursively emit audit failure events.

Authorization/authentication denial:

- Denial must remain denial even if audit persistence fails.

## 8. Test Strategy

Unit tests:

- Event taxonomy validation.
- Outcome taxonomy validation.
- Event factory actor/subject mapping.
- Metadata allowlist and max-size behavior.
- Sensitive-field rejection/sanitization.
- Audit service failure semantics.
- No recursive audit failure behavior.
- RequestId source validation: server-derived context only, no body/query trust.
- User-agent sanitization/truncation and control-character handling.

Integration tests:

- Registration success emits event.
- Login success emits event.
- Login failure emits safe event and keeps uniform external response.
- Refresh success/failure emits events.
- Refresh replay emits `REFRESH_REPLAY_DETECTED`; replay revocation survives audit insert failure.
- Logout active-session revocation emits `LOGOUT_SUCCESS`; revocation survives audit insert failure.
- Missing/malformed/already-inactive logout does not emit `LOGOUT_SUCCESS`.
- `GET /admin/ping` admin denial emits `AUTHORIZATION_DENIED`; successful admin ping and generic 403 responses are not audited in FEAT-009.
- Role assignment/removal emits events; role grant fails if audit insert fails, role removal survives audit insert failure.

PostgreSQL-backed tests:

- Migration deploys from zero-state.
- Migration deploys from repository's existing FEAT-008 schema.
- Events persist durably with indexes/constraints.
- No sensitive fields persist.
- Registration + audit insert failure rolls back user/credential.
- Role assignment + audit insert failure leaves privilege ungranted.
- Role removal + audit insert failure leaves privilege removed.
- Refresh replay + audit insert failure leaves family/session revoked.
- Logout active session + audit insert failure leaves session securely revoked.
- Append-only application behavior: no update/delete audit API or repository methods for normal app flow.

Regression:

- FEAT-001 through FEAT-008 validation passes.
- Existing registration/login/refresh/logout/RBAC/admin contracts remain unchanged.

## 9. Validation Suite

Required implementation validation:

```text
npm run clean
npm run lint
npx prisma validate --schema=apps/api/prisma/schema.prisma
npm run typecheck
npm run build
npm run test
npm run test:db
runtime smoke covering audited flows where practical
```

DB-backed tests must use an isolated PostgreSQL test database and must not silently skip.

Database validation order is mandatory:

1. Start PostgreSQL.
2. Create/use a fresh isolated test database.
3. Run `npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma`.
4. Verify migration status.
5. Run DB suites.

QA must reject DB evidence if suites start before migration deploy completes or if migration from the existing FEAT-008 schema is not covered.

## 10. Risks

- Audit writes can create latency or availability coupling if too many events are transactionally required.
- Authorization-denied events can create audit volume amplification without rate limiting.
- Metadata can leak secrets if not allowlisted and tested.
- Storing raw email/IP would expand privacy obligations.
- Retrofitting audit into previous auth flows can accidentally change response semantics.

## 11. Rate-Limit Risk Note

Authentication endpoint rate limiting remains unresolved and must be resolved before Phase 2 final integration gate. FEAT-009 documents audit amplification risk but does not implement rate limiting.
