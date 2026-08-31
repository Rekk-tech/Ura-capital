# Acceptance Criteria: FEAT-008 Admin Authorization Guard

**Status**: APPROVED  
**Created**: 2026-08-26  
**Feature Spec**: `spec.md`  
**Implementation Report Required**: `reports/implementation/phase-2/FEAT-008.md`  
**QA Report Required After Implementation**: `reports/qa/phase-2/FEAT-008-QA.md`

## Acceptance Matrix

| ID | Criterion | Verification Method | Required Evidence |
|---|---|---|---|
| AC-001 | Reusable ADMIN guard exists or `requireRole(ROLES.ADMIN)` is used directly as the canonical admin guard. | Source review and unit test | Guard source/tests recorded. |
| AC-002 | Admin guard reuses FEAT-007 `ROLES.ADMIN` and generic RBAC primitive without redefining role constants or duplicating role lookup. | Source review and unit test | Import/delegation evidence recorded. |
| AC-003 | Admin route flow is exactly `authenticate -> admin guard -> handler`, with server mounting `app.use(adminRouter)` and router declaring `router.get("/admin/ping", ...)`. | Source/route review and integration test | Route wiring evidence recorded. |
| AC-004 | Final URL is exactly `GET /admin/ping`; `/admin/admin/ping` and alternate FEAT-008 admin endpoints are not created. | Route/source review | Endpoint list recorded. |
| AC-005 | Successful admin ping returns exactly `{ "status": "ok", "scope": "admin" }` and no internal/user/email/role/role ID/token/database/infrastructure data. | Integration test | Response body evidence recorded. |
| AC-006 | Unauthenticated request to admin route returns `401 UNAUTHENTICATED`. | Integration test | Status/error envelope recorded. |
| AC-007 | Authenticated zero-role user receives `403 FORBIDDEN`. | Integration and DB-backed test | Status/error envelope recorded. |
| AC-008 | Authenticated USER-only user receives `403 FORBIDDEN`. | Integration and DB-backed test | Status/error envelope recorded. |
| AC-009 | Authenticated ADMIN user is allowed. | Integration and DB-backed test | Successful response recorded. |
| AC-010 | Authenticated USER+ADMIN user is allowed. | Integration/DB-backed test | Successful multi-role evidence recorded. |
| AC-011 | Client-supplied body/query/header role/admin values cannot grant admin access. | Negative security test | Spoofing attempts and denials recorded. |
| AC-012 | JWT role/admin/permissions claims remain prohibited and cannot become admin authority. | Token/security test and FEAT-004 regression | Token rejection/claim inspection recorded. |
| AC-013 | Direct API requests by non-admin users are denied even if UI controls are bypassed. | Integration test | Direct request 403 evidence recorded. |
| AC-014 | Role repository/PostgreSQL failure during ADMIN role evaluation fails closed with safe 5xx or approved service-unavailable category, not ordinary `403`; the test path must use a valid token, successful authentication, and failure in FEAT-007 role lookup. | Failure simulation/integration test | Error status/envelope/no-leak evidence recorded. |
| AC-015 | Malformed persisted role state follows FEAT-007 filtering semantics: `["ROOT"]` canonicalizes to `[]` and gets 403; `["ROOT", "ADMIN"]` canonicalizes to `["ADMIN"]` and gets 200; unknown roles never become trusted authority. | Unit/DB-backed test | Unknown/malformed role evidence recorded. |
| AC-016 | PostgreSQL remains the durable ADMIN authority. | Source/DB review | DB lookup/persistence evidence recorded. |
| AC-017 | Granting ADMIN in PostgreSQL affects the next admin authorization check with the same still-valid access token, with no token refresh, no re-login, and no JWT role modification. | PostgreSQL-backed test | Same-token grant evidence recorded. |
| AC-018 | Removing ADMIN in PostgreSQL affects the next admin authorization check with the same still-valid access token, with no token refresh, no re-login, and no JWT role modification. | PostgreSQL-backed test | Same-token removal evidence recorded. |
| AC-019 | Admin role changes do not affect unrelated users. | PostgreSQL-backed test | Unrelated-user isolation evidence recorded. |
| AC-020 | FEAT-008 reuses FEAT-007 server-side operational provisioning and does not introduce public role-granting behavior. | Source/route review and DB test | Provisioning route absence and helper usage recorded. |
| AC-021 | Admin controller/handler/guard does not import Prisma directly. | Source import review | Import search evidence recorded. |
| AC-022 | No hard-coded admin email, hard-coded user ID, environment admin list, in-memory allowlist, Redis admin authority, fallback admin behavior, or bypass flag exists. | Source/config/security review | Search evidence recorded. |
| AC-023 | No default admin account, default admin credential, users, credentials, or automatic privileged assignment is created by FEAT-008. | Source/DB-backed review | No-default evidence recorded. |
| AC-024 | FEAT-008 does not implement admin dashboard/UI, user-management CRUD, role-management HTTP API, grant-admin endpoint, admin self-upgrade, moderation/subscription/financial admin workflows, permission engine, ABAC, tenant authorization, FEAT-009 audit emission, or rate limiting. | Scope/source/route review | Scope search evidence recorded. |
| AC-025 | FEAT-001 through FEAT-007 regression validation and required validation suite pass. | Command execution | Clean/lint/typecheck/build/test/DB/runtime evidence recorded. |
| AC-026 | `reports/implementation/phase-2/FEAT-008.md` truthfully maps tasks, tests, validation, limitations, security notes, and acceptance criteria. | Documentation review | Report exists and is complete. |

## QA Decision Rules

### PASS

FEAT-008 may receive PASS only when:

- AC-001 through AC-026 pass, or any exception is explicitly waived by Human.
- ADMIN authority comes only from FEAT-007 PostgreSQL-backed RBAC context.
- The admin guard does not duplicate FEAT-007 authorization logic.
- `GET /admin/ping` has correct 401/403/allowed behavior.
- Final route composition is exactly `app.use(adminRouter)` plus `router.get("/admin/ping", ...)`, producing `GET /admin/ping` and not `/admin/admin/ping`.
- Direct API access by non-admin users is denied.
- Client role/admin spoofing cannot elevate privileges.
- JWT role/admin claims remain prohibited.
- DB/repository failure fails closed and is not mislabeled as ordinary `403`.
- DB/repository failure coverage occurs during FEAT-007 role lookup after successful authentication, not through handler throws, unrelated DB failures, or authentication failure.
- Malformed role coverage proves both `["ROOT"] -> [] -> 403` and `["ROOT", "ADMIN"] -> ["ADMIN"] -> 200`.
- ADMIN grant/removal is reflected immediately with the same still-valid JWT.
- No public role management, self-upgrade, default admin credential, audit emission, rate limiting, or admin product behavior is introduced.
- FEAT-001 through FEAT-007 regressions pass.

### CONDITIONAL PASS

FEAT-008 may receive CONDITIONAL PASS only when no P0/P1 authorization or security issue exists, the admin bypass surface is closed, and Human explicitly accepts any tracked non-blocking condition.

### FAIL

FEAT-008 must receive FAIL if any of the following are true:

- Non-admin user can access admin route.
- Missing authentication is authorized.
- Zero-role or USER-only users are authorized.
- Client/admin/JWT claims grant admin access.
- ADMIN authority uses hard-coded email/user ID, env allowlist, Redis, in-memory list, or fallback bypass.
- DB/repository failure allows access or is hidden as ordinary `403`.
- ADMIN removal is not reflected until token refresh/re-login.
- Public role management, grant-admin, self-upgrade, default admin credential, admin product behavior, audit emission, rate limiting, permission engine, ABAC, or tenant authorization is introduced.
- Raw tokens, secrets, password hashes, raw DB/Prisma errors, role IDs, stack traces, or DB credentials leak.
- Required validation or DB tests fail without Human-approved waiver.
- Implementation report is missing or materially inaccurate.

## Required Validation Commands

Implementation must run and report:

- `npm run clean`
- `npm run lint`
- `npx prisma validate --schema=apps/api/prisma/schema.prisma`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:db`
- Fresh isolated PostgreSQL migration deploy/status if migrations or DB-backed tests require it.
- Runtime/API smoke for admin route denial/grant/removal behavior.

## Acceptance Traceability

| User Story | Acceptance Criteria |
|---|---|
| US1 - Reuse RBAC Foundation for Admin Guard | AC-001, AC-002, AC-003, AC-021 |
| US2 - Enforce Admin API Boundary | AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013 |
| US3 - Preserve PostgreSQL Admin Authority and Immediacy | AC-016, AC-017, AC-018, AC-019, AC-020 |
| US4 - Fail Closed and Avoid Scope Creep | AC-014, AC-015, AC-022, AC-023, AC-024 |
| Cross-cutting | AC-025, AC-026 |

## Human Review Checklist

- [ ] `GET /admin/ping` is acceptable as the representative production admin boundary route.
- [ ] `requireAdmin` as a thin wrapper over FEAT-007 `requireRole(ROLES.ADMIN)` is acceptable.
- [ ] PostgreSQL remains the sole ADMIN authority.
- [ ] No public role-management or grant-admin endpoint is included.
- [ ] No default admin account or credential is included.
- [ ] No audit emission or rate limiting is included.
- [ ] Rate limiting remains a separate governance decision.
- [ ] Acceptance criteria are independently testable.

## Handoff Rule

Implementation must not begin until Human marks this spec package as APPROVED and separately hands FEAT-008 to Antigravity.
