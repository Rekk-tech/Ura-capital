# Specification: FEAT-010 Phase 2 Security Integration Gate

**Status**: DONE - QA PASS - HUMAN FINAL GATE APPROVED  
**Feature ID**: FEAT-010  
**Feature Type**: Gate / validation feature  
**Phase**: Phase 2 - Identity & Security

## 1. User Stories

### Story 1 - Integrated Identity Flow Validation

As a platform owner, I need the complete auth session lifecycle to be validated as one flow so that registration, login, refresh, replay detection, logout, and audit behavior do not only work in isolation.

**Independent Test**: Run the mandatory auth session flow against an isolated PostgreSQL database and verify responses, database state, cookies, tokens, and audit rows.

### Story 2 - Integrated Authorization Validation

As a platform owner, I need RBAC and admin authorization to be validated with the same access token before and after role changes so that PostgreSQL remains the only privilege authority.

**Independent Test**: Run zero-role denial, server-side ADMIN grant, same-token allow, server-side ADMIN removal, and same-token denial with no client role/admin trust.

### Story 3 - Security Evidence Validation

As a QA governance owner, I need one final Phase 2 evidence package so that Human can decide whether Identity & Security is safe enough to unblock later product phases.

**Independent Test**: Execute clean, lint, Prisma validation, typecheck, build, standard tests, DB-backed tests, migration validation, runtime smoke, sensitive-data sentinel checks, and report review.

### Story 4 - Rate-Limiting Dependency Verification

As a Human/Product Owner, I need FEAT-010 final validation blocked until the dedicated rate-limiting feature is complete so that Phase 2 is not accidentally marked complete while authentication endpoint abuse protection is missing.

**Independent Test**: QA report must record FEAT-010A Codex QA PASS and Human Final Gate approval before FEAT-010 proceeds.

## 2. Functional Requirements

- **FR-001**: FEAT-010 MUST be a validation gate and MUST NOT introduce new product functionality.
- **FR-002**: FEAT-010 MUST validate registration behavior from FEAT-003, including normalized identity persistence, password policy, Argon2id hashing, no plaintext password storage, and safe duplicate handling.
- **FR-003**: FEAT-010 MUST validate login behavior from FEAT-004, including valid login, unknown user rejection, wrong-password rejection, and uniform invalid-login response semantics.
- **FR-004**: FEAT-010 MUST validate strict short-lived access-token behavior from FEAT-004, including approved claims, 5-15 minute lifetime, required environment secret, issuer/audience checks, HS256 allowlist, malformed/forged/expired rejection, and role-free JWT payload.
- **FR-005**: FEAT-010 MUST validate refresh-token rotation and replay behavior from FEAT-005, including HttpOnly cookie delivery, PostgreSQL session authority, token hashing, rotation, old-token rejection, replay detection, and family revocation.
- **FR-006**: FEAT-010 MUST validate logout/session invalidation from FEAT-006, including current-session revocation, cookie clearing, idempotent safe behavior, DB failure false-success protection, and stateless access-token-after-logout semantics.
- **FR-007**: FEAT-010 MUST validate RBAC from FEAT-007, including PostgreSQL role authority, zero-role semantics, canonical role filtering, immediate grant/removal effect, no JWT/client role authority, and no default role assignment during registration.
- **FR-008**: FEAT-010 MUST validate admin guard from FEAT-008, including `GET /admin/ping`, unauthenticated 401, non-admin 403, ADMIN 200, USER+ADMIN 200, ROOT-only 403, ROOT+ADMIN accepted through ADMIN, safe fail-closed DB failure, no default admin credentials, and no public privilege-management endpoint.
- **FR-009**: FEAT-010 MUST validate authentication audit events from FEAT-009, including durable PostgreSQL persistence, approved taxonomy, no raw email persistence, no default identityHash, no IP persistence as authority, sanitized bounded User-Agent/metadata, transaction-coupled/security-state-first/best-effort behavior, and no public audit endpoint.
- **FR-010**: FEAT-010 MUST validate sensitive-data sanitization in responses, logs, and persisted audit rows.
- **FR-011**: FEAT-010 MUST validate PostgreSQL migrations from zero-state using a fresh isolated test database.
- **FR-012**: FEAT-010 MUST validate existing-schema migration compatibility by applying the latest migrations over a representative pre-FEAT-010 Phase 2 schema with existing identity/session/audit rows.
- **FR-013**: FEAT-010 MUST run or require the full validation suite: `npm run clean`, `npm run lint`, `npx prisma validate --schema=apps/api/prisma/schema.prisma`, `npm run typecheck`, `npm run build`, `npm run test`, `npm run test:db`, and runtime smoke/E2E validation.
- **FR-014**: FEAT-010 MUST validate regression coverage for FEAT-001 through FEAT-009.
- **FR-015**: FEAT-010 MUST prove no Redis, JWT, request body, query string, browser state, or client header acts as privilege authority.
- **FR-016**: FEAT-010 MUST prove no public role escalation surface exists.
- **FR-017**: FEAT-010 MUST define severity rules for P0, P1, P2, and P3 findings.
- **FR-018**: FEAT-010 MUST define Phase 2 PASS, CONDITIONAL PASS, and FAIL criteria.
- **FR-019**: FEAT-010 MUST not implement rate limiting.
- **FR-020**: FEAT-010 MUST verify completed FEAT-010A evidence before FEAT-010 implementation/final validation starts.
- **FR-021**: FEAT-010 MUST require a QA report that maps every acceptance criterion to evidence and states whether FEAT-010 is ready for Human Final Gate.
- **FR-022**: FEAT-010 MUST keep Phase 3 blocked until Phase 2 receives Human-approved PASS or Human-approved conditional progression.

## 3. Security Validation Matrix

| Area | Required Proof | Failure Severity |
| --- | --- | --- |
| Password storage | Argon2id hash only, no plaintext/hash leakage | P0 if plaintext stored; P1 if hash leaked |
| Login enumeration | Unknown user and wrong password externally uniform | P1 |
| Access token | Strict claims, short TTL, role-free, HS256-only, secret required | P0/P1 depending bypass/leak |
| Refresh sessions | Rotation, hashed verifier, replay family revocation | P0 if replay bypasses revocation |
| Logout | Current refresh session revoked, no false 204 on DB failure | P0/P1 |
| RBAC | PostgreSQL only, client/JWT roles ignored | P0 if privilege bypass |
| Admin guard | `/admin/ping` enforced server-side | P0 if non-admin allowed |
| Audit | Durable rows for required events without sensitive data | P1 if missing critical event; P0 if secrets persisted |
| Logs/errors | Stable safe envelopes and sanitized logs | P1/P2 |
| Migrations | Fresh and existing-schema migration pass | P1 if unreproducible |
| Public surfaces | No role/audit management endpoints introduced | P0 if public escalation exists |
| Rate limiting | Completed FEAT-010A evidence recorded before Phase 2 PASS | P1 governance/security blocker if FEAT-010A is incomplete or not Human-approved |

## 4. Cross-Feature Runtime Flow

The canonical runtime flow must include:

1. Health check.
2. Register a unique user.
3. Confirm stored password is not plaintext where DB access is available.
4. Login and capture access token plus refresh cookie.
5. Call `/auth/me` with access token.
6. Refresh successfully and confirm refresh cookie rotates.
7. Replay old refresh token and verify rejection plus family revocation.
8. Login again to establish a fresh session.
9. Logout active session.
10. Confirm old refresh is rejected after logout.
11. Confirm stateless access-token behavior remains per FEAT-006 until natural expiry.
12. Verify required audit events for the flow.
13. Verify no sensitive data appears in responses, logs, or audit rows.

## 5. Cross-Feature RBAC/Admin Flow

The canonical RBAC/admin flow must include:

1. New registered user has zero roles.
2. Same user's valid JWT receives 403 on `GET /admin/ping`.
3. Server-side operational provisioning grants ADMIN in PostgreSQL.
4. Same still-valid JWT receives 200 on `GET /admin/ping`.
5. Response body is exactly the approved safe admin ping payload.
6. Server-side removal of ADMIN in PostgreSQL.
7. Same still-valid JWT receives 403 on `GET /admin/ping`.
8. Client body/query/header role or admin spoofing remains denied.
9. JWT remains role-free throughout.
10. Audit rows exist for approved authorization/role events only.

## 6. Migration / Database Validation

FEAT-010 validation must use isolated PostgreSQL databases.

Fresh migration validation:

```text
create fresh test DB
set DATABASE_URL and TEST_DATABASE_URL to that DB
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
npx prisma migrate status --schema=apps/api/prisma/schema.prisma
npm run test:db
```

Existing-schema validation:

```text
create representative pre-FEAT-010 Phase 2 DB
apply prior Phase 2 migrations as needed
insert representative user, credential, role, refresh-session, and audit rows
apply current migrations
verify prior rows preserved
verify new operations still work
```

The test database name must include an explicit test marker and must not target local development, staging, or production databases.

## 7. Rate-Limiting Gate Rule

FEAT-010 final QA may PASS the validation feature only if the test plan and existing Phase 2 behavior pass. Phase 2 final PASS must remain blocked unless FEAT-010A is QA PASS and Human-approved.

Human selected the dedicated implementation path:

```text
Create FEAT-010A - Authentication Endpoint Rate Limiting & Progressive Protection
before FEAT-010 final gate.
```

Minimum FEAT-010A scope should include:

- `/auth/login`
- `/auth/register`
- `/auth/refresh`
- progressive protection without hard permanent account lockout
- Redis transient counters with safe fallback behavior
- PostgreSQL/audit consistency expectations

## 8. Success Criteria

- All FEAT-010 acceptance criteria pass.
- All validation commands pass with current evidence.
- Runtime smoke/E2E validates mandatory cross-feature flows.
- No unresolved P0/P1 Identity & Security defect remains.
- Rate-limiting dependency is satisfied by completed FEAT-010A evidence.
- Phase 2 recommendation is clearly PASS, CONDITIONAL PASS, or FAIL.

## 9. Constraints

- No application implementation code may be changed during planning.
- FEAT-010 implementation, if later approved, must be validation-only.
- Do not start Phase 3 from FEAT-010.
- Do not alter Human-approved semantics of FEAT-002 through FEAT-009.
