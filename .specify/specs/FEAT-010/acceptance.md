# Acceptance Criteria: FEAT-010 Phase 2 Security Integration Gate

**Status**: DONE - QA PASS - HUMAN FINAL GATE APPROVED  
**Feature ID**: FEAT-010  
**Gate Type**: Phase 2 integration validation

## 1. Acceptance Criteria

| AC | Criterion | Verification |
| --- | --- | --- |
| AC-001 | FEAT-010 remains validation-only and introduces no product functionality. | Source/diff/report review |
| AC-002 | Approved FEAT-002 through FEAT-009 artifacts and QA reports are reviewed. | QA evidence |
| AC-003 | FEAT-002 through FEAT-009 are DONE / QA PASS / Human Final Gate APPROVED before FEAT-010 validation proceeds. | Progress tracker review |
| AC-004 | Valid registration still creates a normalized user and credential through approved repository boundaries. | Integration/DB/runtime |
| AC-005 | Password policy and Argon2id password hashing remain enforced; plaintext password is never persisted. | Unit/integration/DB |
| AC-006 | Duplicate normalized identity is rejected safely with no partial records. | Integration/DB |
| AC-007 | Valid login succeeds and returns only approved safe response fields. | Integration/runtime |
| AC-008 | Unknown user and wrong password are rejected with externally uniform safe failure. | Integration/security |
| AC-009 | Access tokens remain short-lived within approved 5-15 minute range and use only approved minimal claims. | Unit/integration |
| AC-010 | JWT verification rejects forged, malformed, expired, wrong-algorithm, wrong-issuer, wrong-audience, and extra-claim tokens. | Unit/integration |
| AC-011 | JWT remains role-free and carries no password, credential, session, role, admin, permission, or secret data. | Token inspection |
| AC-012 | Refresh token is delivered only through approved HttpOnly cookie behavior and is never returned in JSON. | Integration/runtime |
| AC-013 | Refresh rotates tokens; old refresh token cannot be reused. | Integration/DB/runtime |
| AC-014 | Confirmed refresh replay revokes the token family and mints no access token. | DB/runtime |
| AC-015 | Logout revokes the active current refresh session and clears the cookie. | Integration/DB/runtime |
| AC-016 | Refresh after logout is rejected and no false-success logout occurs on DB failure. | Integration/DB |
| AC-017 | Existing access-token-after-logout semantics remain stateless until natural expiry. | Integration/runtime |
| AC-018 | Newly registered zero-role user is denied admin access. | Runtime/DB |
| AC-019 | PostgreSQL ADMIN grant allows the same still-valid JWT to access `GET /admin/ping`. | Runtime/DB |
| AC-020 | PostgreSQL ADMIN removal makes the same still-valid JWT denied on `GET /admin/ping`. | Runtime/DB |
| AC-021 | Client body/query/header/JWT role or admin spoofing cannot influence RBAC/admin authorization. | Integration/runtime |
| AC-022 | Required authentication/security audit events are durably persisted in PostgreSQL for approved high-value events. | DB/runtime |
| AC-023 | Audit event scope remains approved: no generic every-401 audit, no successful admin ping audit, no public audit API. | Source/integration |
| AC-024 | Audit transaction semantics remain approved for registration, role assignment, replay, role removal, logout, login, refresh, and denial paths. | DB failure injection |
| AC-025 | Responses, logs, JWTs, cookies, and audit rows do not expose passwords, password hashes, raw email, raw JWTs, access tokens, refresh tokens, token hashes, cookies, secrets, DB URLs, raw Prisma errors, stack traces, or full request bodies. | Sentinel/security review |
| AC-026 | No public role-management, role-escalation, audit read/search/update/delete, or default admin credential surface exists. | Route/source review |
| AC-027 | PostgreSQL remains durable authority for users, credentials, refresh sessions, roles, admin authority, and audit records; Redis/JWT/client state is not durable privilege authority. | Source/DB review |
| AC-028 | Standard validation suite passes: clean, lint, Prisma validate, typecheck, build, and standard tests. | Command evidence |
| AC-029 | Exact standard and DB test file/test counts are recorded with no hidden skips. | Command evidence |
| AC-030 | Test and CI database validation uses isolated DB names with explicit test markers and never targets local dev, staging, or production. | Command/config review |
| AC-031 | Fresh zero-state PostgreSQL migration deploy and migration status pass. | Migration evidence |
| AC-032 | PostgreSQL-backed DB test suite passes against the fresh isolated DB. | DB command evidence |
| AC-033 | Existing-schema migration compatibility is verified and preserves representative Phase 2 rows. | Migration/DB evidence |
| AC-034 | FEAT-010 does not implement authentication endpoint rate limiting. | Source/diff review |
| AC-035 | Phase 2 final PASS is blocked unless FEAT-010A is completed with Codex QA PASS and Human Final Gate approval. | Governance review |
| AC-036 | FEAT-010 implementation report maps files, tests, validation, limitations, security notes, and all ACs truthfully. | Report review |
| AC-037 | Any discovered issue is classified using P0/P1/P2/P3 severity rules. | QA report |
| AC-038 | Phase 2 gate recommendation is explicitly PASS, CONDITIONAL PASS, or FAIL. | QA report |
| AC-039 | Phase 3 is not started by FEAT-010 and remains blocked until Human approves Phase 2 progression. | Progress tracker/source review |

## 2. Mandatory PASS Conditions

FEAT-010 may receive QA PASS only when:

- AC-001 through AC-039 pass.
- The validation suite passes with current evidence.
- Fresh PostgreSQL migration and DB suite pass.
- Existing-schema migration compatibility passes.
- Runtime smoke/E2E validates mandatory auth session and RBAC/admin flows.
- No P0 or P1 Identity & Security defect remains unresolved.
- Rate limiting is completed in FEAT-010A with Codex QA PASS and Human Final Gate approval.

## 3. Conditional PASS Conditions

CONDITIONAL PASS may be considered only when:

- no P0 issue exists
- no authn/authz bypass exists
- no sensitive secret/token/password exposure exists
- remaining issue is non-blocking
- Human explicitly accepts the condition
- FEAT-010A completion evidence exists and is accepted by QA/Human

## 4. Mandatory FAIL Conditions

FEAT-010 must FAIL if any of the following occur:

- Any non-admin can access admin-only behavior.
- Any client-provided role/admin/permission value influences authorization.
- Any JWT role/admin/permission claim is trusted.
- Plaintext password is persisted.
- Token, cookie, secret, password, raw email, raw DB error, or stack trace leaks in responses/logs/audit rows.
- Refresh replay does not revoke the token family.
- Logout false-success occurs when active-session revocation fails.
- Required audit event persistence fails for high-value actions without approved degraded behavior.
- Fresh migration or DB-backed validation is skipped without Human waiver.
- Existing-schema migration loses Phase 2 data.
- Public role-management or audit read/write endpoints are introduced.
- FEAT-010A is missing, fails QA, or lacks Human Final Gate approval at Phase 2 final PASS time.
- Phase 3 starts before Human approves Phase 2 progression.

## 5. FEAT-010A Dependency

Before FEAT-010 can support a final Phase 2 PASS decision:

1. FEAT-010 remains validation-only and adds no product behavior.
2. FEAT-010 implementation/final validation starts only after FEAT-010A receives Codex QA PASS and Human Final Gate approval.
3. AC-035 is satisfied only by completed FEAT-010A evidence.
