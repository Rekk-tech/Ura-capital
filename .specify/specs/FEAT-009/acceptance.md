# Acceptance Criteria: FEAT-009 Authentication Audit Events

**Status**: SPEC APPROVED FOR IMPLEMENTATION  
**Phase**: Phase 2 - Identity & Security

## Acceptance Criteria Matrix

| AC | Criterion | Verification Method | Evidence Required |
| --- | --- | --- | --- |
| AC-001 | Durable PostgreSQL audit persistence exists and is not replaced by logs, Redis, or in-memory state. | Schema/source/DB-backed test | Migration/model/repository evidence and DB row evidence. |
| AC-002 | Canonical centralized event taxonomy exists and all emitted events use it. | Unit/source review | Constants/types and rejection/search evidence. |
| AC-003 | Canonical centralized outcome taxonomy exists and all emitted outcomes use it. | Unit/source review | Constants/types and rejection/search evidence. |
| AC-004 | Audit event creation uses a central service/emitter boundary. | Source/import review | Controllers/routes do not directly write audit records. |
| AC-005 | Actor/subject attribution follows approved nullable actorUserId/subjectUserId model and does not fabricate users. | Unit/integration test | Event rows for known and unknown identity cases. |
| AC-006 | Prisma/database access stays behind repositories; controllers and route handlers remain Prisma-free. | Import/source review | Search results recorded. |
| AC-007 | Audit persistence never stores passwords, password hashes, tokens, raw JWTs, refresh verifiers, secrets, Cookie/Authorization headers, DB credentials, stack traces, raw DB errors, or full request bodies. | Security/DB-backed test | Sentinel values absent from persisted audit rows and logs. |
| AC-008 | Raw email is not persisted and FEAT-009 does not persist `identityHash` by default. Unknown login failure uses `actorUserId = null` and `subjectUserId = null` unless Human later approves HMAC identity correlation. | DB-backed/security test | Failed-login audit rows inspected; raw email and identity hash absent by default. |
| AC-009 | IP address is not persisted in Phase 2 and `X-Forwarded-For` is not trusted for audit authority. | Source/DB review | No IP persisted unless Human changes policy. |
| AC-010 | User agent, if persisted, is treated as attacker-controlled, sanitized before persistence/logging, control characters are neutralized where relevant, truncated to max 256 characters, and may be absent. | Unit/DB-backed test | Oversized/malicious/absent UA handling evidence. |
| AC-011 | Metadata is flat, allowlisted, sanitized, and bounded to max 2 KiB serialized. | Unit/DB-backed test | Oversized/nested/secret metadata rejection, reduction, or drop evidence. |
| AC-012 | Successful registration emits `REGISTRATION_SUCCESS` only after durable user + credential creation succeeds. | Integration/DB-backed test | Registration event row and transaction evidence. |
| AC-013 | Login success emits `LOGIN_SUCCESS` without changing FEAT-004 response semantics. | Integration test | Login response and audit row evidence. |
| AC-014 | Login failure emits `LOGIN_FAILURE` without account-enumeration leakage or different external response for unknown user vs wrong password. | Integration/security test | Response comparison and safe audit metadata evidence. |
| AC-015 | Refresh success/failure emits `REFRESH_SUCCESS`/`REFRESH_FAILURE` without token/verifier leakage. | Integration/DB-backed test | Refresh event rows and leakage checks. |
| AC-016 | Confirmed refresh replay emits `REFRESH_REPLAY_DETECTED` with safe server identifiers only. | DB-backed replay test | Replay event, family/session state, no raw token/verifier. |
| AC-017 | Active current-session logout emits `LOGOUT_SUCCESS` when the session is actually revoked. | Integration/DB-backed test | Logout event and revocation state. |
| AC-018 | Missing/malformed/unknown/expired/already inactive logout attempts do not emit `LOGOUT_SUCCESS` in FEAT-009. | Integration/DB-backed test | No false logout success events. |
| AC-019 | `GET /admin/ping` ADMIN authorization denial emits `AUTHORIZATION_DENIED`; successful admin ping and generic/future 403 responses are not audited in FEAT-009 without explicit scope extension. | Integration/DB-backed test | Denial event exists for admin ping; success and generic 403 audit events absent. |
| AC-020 | Role assignment and removal emit `ROLE_ASSIGNED` and `ROLE_REMOVED` without exposing public role-management APIs. | Integration/DB-backed/source review | Operational provisioning events and route absence. |
| AC-021 | Audit failure never makes an authentication or authorization denial permissive. | Failure simulation test | Denials remain 401/403 or safe existing failure. |
| AC-022 | Best-effort audit failure is surfaced through sanitized application logs and does not recursively emit audit events. | Unit/integration/log capture | Log event contains safe category, eventType, and requestId only. |
| AC-023 | `ROLE_ASSIGNED` is transactionally coupled: if its required audit insert fails, the role grant does not commit. | PostgreSQL-backed failure injection | Target user does not receive ADMIN/USER role after audit insert failure. |
| AC-024 | Audit records are append-only from application behavior; no public or normal app update/delete audit API exists. | Source/route/repository review | No mutation endpoint and no normal update/delete path. |
| AC-025 | FEAT-009 exposes no audit read/search/dashboard/user-facing endpoint. | Route/source review | Endpoint absence evidence. |
| AC-026 | FEAT-009 does not implement rate limiting and documents audit amplification risk. | Scope/source/doc review | No Redis/rate-limit implementation; risk note present. |
| AC-027 | Redis is not used as durable audit authority. | Source/config review | Redis audit search evidence. |
| AC-028 | FEAT-001 through FEAT-008 regression validation passes. | Command execution | Clean/lint/typecheck/build/test/DB/runtime evidence. |
| AC-029 | `reports/implementation/phase-2/FEAT-009.md` maps tasks, tests, validation, limitations, security notes, and acceptance criteria truthfully. | Documentation review | Report exists and evidence is not overstated. |
| AC-030 | If Human later enables identity correlation, it uses HMAC-SHA-256 over normalized email with a dedicated environment-only audit identity secret; raw SHA-256(email) and auth/JWT/refresh secret reuse are prohibited. | Config/unit/security test | Construction, secret separation, and raw email absence evidence. |
| AC-031 | Existing `AuthSecurityAuditRecord` / `auth_security_audit_records` migration is non-destructive. | Migration review/PostgreSQL test | Existing rows preserved; no unapproved drop/rename/replace; fresh and existing-schema migrations pass. |
| AC-032 | `AUTHENTICATION_FAILURE` remains reserved/deferred and FEAT-009 does not create durable audit rows for every missing bearer token, expired token, malformed Authorization header, or arbitrary unauthenticated request. | Integration/source review | No generic every-401 middleware audit; volume rationale documented. |
| AC-033 | Confirmed refresh replay revocation survives audit persistence failure. | PostgreSQL-backed failure injection | Family/session remains revoked even when replay audit insert fails. |
| AC-034 | `ROLE_REMOVED` is security-state-first: role removal survives audit persistence failure. | PostgreSQL-backed failure injection | Removed role remains absent even when audit insert fails. |
| AC-035 | Active current-session logout revocation follows security-state-first behavior and survives audit persistence failure. | PostgreSQL-backed failure injection | Session remains revoked even when logout audit insert fails; no `LOGOUT_SUCCESS` if revocation never occurred. |
| AC-036 | `REGISTRATION_SUCCESS` remains transactionally coupled: audit insert failure rolls back user + credential and returns a safe internal failure. | PostgreSQL-backed failure injection | No partial user/credential persists; no DB/audit internals exposed. |
| AC-037 | Malformed or oversized optional metadata cannot defeat replay revocation, role removal, or logout revocation; optional metadata is sanitized, dropped, or reduced. | Unit/PostgreSQL-backed failure test | Security state commits while unsafe metadata is absent or bounded. |
| AC-038 | `requestId` is server-derived from existing request context and body/query requestId values cannot become audit authority. | Unit/integration test | Body/query spoof attempts ignored. |
| AC-039 | DB validation runs in the required order: PostgreSQL start, fresh isolated DB, `prisma migrate deploy`, migration status verification, then DB suites. | QA validation evidence | Command order and migration status recorded. |
| AC-040 | Audit failure operational logs are sanitized and non-recursive: no audit payload, metadata blob, actor email, token, cookie, raw Prisma error, DB URL, or unsafe production stack trace is logged. | Log capture/security test | Only requestId/eventType/failure category appear. |

## PASS Criteria

FEAT-009 may receive PASS only when:

- AC-001 through AC-040 pass, or any exception is explicitly waived by Human.
- Durable audit events persist in PostgreSQL.
- Canonical event/outcome taxonomy is enforced.
- Sensitive values are not persisted or logged.
- FEAT-004 invalid login uniformity is preserved.
- Refresh replay, logout success, admin denial, and role assignment/removal semantics are audited as approved.
- Audit failure behavior matches the approved best-effort, transactionally coupled, and security-state-first policy.
- No public audit read/search/mutation API is introduced.
- No rate limiting is implemented in FEAT-009.
- FEAT-001 through FEAT-008 regressions pass.

## FAIL Conditions

FEAT-009 must FAIL QA if any of the following occur:

- Audit persistence is only console/application logs, Redis, memory, or log files.
- Raw passwords, password hashes, tokens, raw JWTs, refresh verifiers, secrets, headers, raw DB errors, stack traces, or database credentials persist.
- Raw email is persisted contrary to the approved PII policy.
- Client-provided actor/subject/role/admin data can override server-derived audit attribution.
- Login failure audit changes the external uniform invalid-login contract.
- Refresh replay is not auditable.
- Role assignment/removal is not auditable if included in Human-approved taxonomy.
- Audit write failure permits an otherwise denied request.
- `REGISTRATION_SUCCESS` or `ROLE_ASSIGNED` can complete without its required audit event.
- Replay revocation, role removal, or logout revocation is rolled back or weakened because audit persistence fails.
- Generic every-401 audit emission is introduced.
- Existing FEAT-002 audit table is destructively dropped/replaced/renamed without explicit Human approval and migration evidence.
- Public audit read/search/update/delete API is introduced.
- Public role-management API is introduced.
- Rate limiting is silently implemented in FEAT-009.
- Required DB-backed tests are skipped or not executed without Human-approved waiver.

## Required Validation

Implementation QA must include:

- `npm run clean`
- `npm run lint`
- `npx prisma validate --schema=apps/api/prisma/schema.prisma`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:db`
- Fresh isolated PostgreSQL migration deploy from zero-state.
- PostgreSQL migration deploy from the repository's existing FEAT-008 schema.
- Runtime smoke for audited flows where practical.
- Security search for sensitive persistence and scope creep.

If PostgreSQL is unavailable, implementation must report DB criteria as `NOT VERIFIED`. QA may not mark DB-dependent ACs PASS without equivalent live PostgreSQL evidence.

## Traceability

| Story | Acceptance Criteria |
| --- | --- |
| US1 - Persist Structured Security Audit Events | AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-011, AC-024, AC-025, AC-027, AC-031, AC-038, AC-039 |
| US2 - Audit Authentication Outcomes Safely | AC-008, AC-012, AC-013, AC-014, AC-015, AC-016, AC-017, AC-018, AC-030, AC-032, AC-033, AC-035, AC-036 |
| US3 - Audit Authorization And Role Security Events | AC-019, AC-020, AC-023, AC-024, AC-034 |
| US4 - Preserve Existing Auth Semantics Under Audit Failure | AC-021, AC-022, AC-037, AC-040 |
| Cross-cutting | AC-026, AC-028, AC-029 |

## Human Approval Checklist

- [x] Final event taxonomy is approved.
- [x] No raw email and no default identityHash policy is approved.
- [x] HMAC-only identity correlation rule is approved if identityHash is ever enabled later.
- [x] No IP storage for Phase 2 is approved.
- [x] Truncated user-agent policy is approved.
- [x] Flat allowlisted metadata policy is approved.
- [x] Security-state-first audit failure semantics are approved.
- [x] REGISTRATION_SUCCESS transactional coupling is approved.
- [x] ROLE_ASSIGNED transactional coupling is approved.
- [x] REFRESH_REPLAY_DETECTED revocation-wins behavior is approved.
- [x] ROLE_REMOVED removal-wins behavior is approved.
- [x] LOGOUT_SUCCESS revocation-wins behavior is approved.
- [x] ADMIN denial auditing is approved.
- [x] Successful ADMIN authorization is intentionally not audited.
- [x] Logout success-only audit semantics are approved.
- [x] Role assignment/removal audit inclusion is approved.
- [x] Actor/subject no-hard-FK snapshot strategy is approved.
- [x] Non-destructive existing audit table migration strategy is approved.
- [x] AUTHENTICATION_FAILURE deferred/no every-401 policy is approved.
- [x] Retention is deferred.
- [x] Rate limiting remains outside FEAT-009.
