# Tasks: FEAT-009 Authentication Audit Events

**Status**: SPEC APPROVED FOR IMPLEMENTATION  
**Phase**: Phase 2 - Identity & Security  
**Implementation Rule**: Spec is Human-approved for implementation. Codex must not implement application code in this governance/planning turn; Antigravity may implement only after explicit implementation handoff.

## Phase 1: Setup And Context

- [ ] T001 Read FEAT-009 approved spec package in `.specify/specs/FEAT-009/`. Maps to FR-001 through FR-038, AC-001 through AC-040.
- [ ] T002 Read approved FEAT-002 through FEAT-008 specs, implementation reports, and QA reports. Maps to FR-033, AC-024, AC-028.
- [ ] T003 Confirm `docs/progress-tracker.md` still marks FEAT-008 DONE/PASS/Human approved, FEAT-009 SPEC APPROVED FOR IMPLEMENTATION with implementation not started, and FEAT-010 BLOCKED. Maps to AC-029.

## Phase 2: Foundational Audit Model And Boundaries

- [ ] T004 Define centralized audit event type constants/types in `apps/api/src/modules/auth/audit-event.constants.ts`. Maps to FR-002, AC-002.
- [ ] T005 Define centralized audit outcome constants/types in `apps/api/src/modules/auth/audit-event.constants.ts`. Maps to FR-003, AC-003.
- [ ] T006 Define audit event input/output types in `apps/api/src/modules/auth/audit-event.types.ts`. Maps to FR-006, FR-007, FR-008, AC-005, AC-006.
- [ ] T007 Non-destructively extend existing `AuthSecurityAuditRecord` / `auth_security_audit_records` in `apps/api/prisma/schema.prisma` and add a data-preserving migration under `apps/api/prisma/migrations/`; stop for Human approval if destructive drop/rename/replace appears necessary. Maps to FR-001, FR-036, AC-001, AC-031.
- [ ] T008 Add audit repository interface and Prisma implementation in `apps/api/src/modules/auth/audit.repository.ts`. Maps to FR-004, FR-005, AC-004, AC-006.
- [ ] T009 Add audit metadata validation/sanitization helpers in `apps/api/src/modules/auth/audit-event.schema.ts`, including no default `identityHash`, UA sanitization/truncation, requestId source validation, and 2 KiB flat metadata enforcement. Maps to FR-009, FR-010, FR-011, FR-012, FR-013, FR-037, AC-007, AC-008, AC-009, AC-010, AC-011, AC-030, AC-037.
- [ ] T010 Add central audit service/emitter in `apps/api/src/modules/auth/audit.service.ts` with best-effort, transactionally coupled, and security-state-first failure modes plus sanitized non-recursive failure logging. Maps to FR-004, FR-026, FR-027, FR-028, FR-029, FR-030, FR-038, AC-004, AC-021, AC-022, AC-023, AC-033, AC-034, AC-035, AC-036, AC-040.

## Phase 3: Unit And Security Tests

- [ ] T011 [P] Add taxonomy/outcome validation tests in `apps/api/tests/unit/audit-event.test.ts`. Maps to FR-002, FR-003, AC-002, AC-003.
- [ ] T012 [P] Add actor/subject mapping tests in `apps/api/tests/unit/audit-event.test.ts`. Maps to FR-006, AC-005.
- [ ] T013 [P] Add sensitive-field rejection, no raw email/no identityHash default, UA sanitization, requestId source, and metadata bounds tests in `apps/api/tests/unit/audit-event.test.ts`. Maps to FR-009, FR-010, FR-012, FR-013, FR-037, AC-007, AC-008, AC-010, AC-011, AC-030, AC-037.
- [ ] T014 [P] Add audit service failure behavior tests in `apps/api/tests/unit/audit.service.test.ts`. Maps to FR-026, FR-027, FR-028, FR-030, FR-038, AC-021, AC-022, AC-023, AC-033, AC-034, AC-035, AC-036, AC-040.
- [ ] T015 [P] Add repository boundary/import tests or static assertions in `apps/api/tests/integration/identity-schema.test.ts` or a dedicated audit boundary test. Maps to FR-004, FR-005, AC-004, AC-006.

## Phase 4: Authentication Flow Integration

- [ ] T016 Integrate `REGISTRATION_SUCCESS` into FEAT-003 registration success path transactionally in `apps/api/src/modules/auth/registration.service.ts`. Maps to FR-014, FR-029, FR-030, AC-012, AC-036.
- [ ] T017 Integrate `LOGIN_SUCCESS` and `LOGIN_FAILURE` in `apps/api/src/modules/auth/login.service.ts` without changing FEAT-004 responses and without default unknown-identity correlation. Maps to FR-015, FR-016, FR-017, AC-008, AC-013, AC-014.
- [ ] T018 Verify `AUTHENTICATION_FAILURE` remains reserved/deferred and no generic audit-on-every-401 middleware is introduced in `apps/api/src/middleware/authenticate.ts` or equivalent. Maps to FR-023, AC-032.
- [ ] T019 Add integration tests for registration/login/authentication audit scope in `apps/api/tests/integration/audit-auth.test.ts`. Maps to FR-014, FR-015, FR-016, FR-017, FR-023, AC-008, AC-012, AC-013, AC-014, AC-032.

## Phase 5: Refresh And Logout Integration

- [ ] T020 Integrate `REFRESH_SUCCESS`, `REFRESH_FAILURE`, and `REFRESH_REPLAY_DETECTED` in `apps/api/src/modules/auth/refresh-token.service.ts`. Maps to FR-018, FR-019, FR-020, AC-015, AC-016.
- [ ] T021 Ensure `REFRESH_REPLAY_DETECTED` follows security-state-first behavior: confirmed family/session revocation commits even if audit persistence fails. Maps to FR-020, FR-029, FR-030, AC-016, AC-033.
- [ ] T022 Integrate `LOGOUT_SUCCESS` only for active known current-session revocation and preserve security-state-first revocation on audit failure in `apps/api/src/modules/auth/logout.service.ts`. Maps to FR-021, FR-022, FR-029, FR-030, AC-017, AC-018, AC-035.
- [ ] T023 Add integration tests for refresh/replay/logout audit behavior in `apps/api/tests/integration/audit-session.test.ts`. Maps to FR-018, FR-019, FR-020, FR-021, FR-022, AC-015, AC-016, AC-017, AC-018, AC-033, AC-035.

## Phase 6: Authorization And Role Event Integration

- [ ] T024 Integrate `AUTHORIZATION_DENIED` for FEAT-008 `GET /admin/ping` admin denial without auditing successful admin ping or generic 403 responses in `apps/api/src/modules/admin/admin.guard.ts` or FEAT-007 authorization middleware boundary. Maps to FR-024, AC-019.
- [ ] T025 Integrate `ROLE_ASSIGNED` and `ROLE_REMOVED` in server-side operational role provisioning/removal boundaries with `operationSource` allowlist and no public client source in `apps/api/src/modules/auth/role.seed.ts` or repository/service equivalent. Maps to FR-025, FR-029, FR-030, AC-020, AC-023, AC-034.
- [ ] T026 Add integration tests for admin denial and role assignment/removal audit events in `apps/api/tests/integration/audit-authorization.test.ts`. Maps to FR-024, FR-025, AC-019, AC-020, AC-023, AC-034.
- [ ] T027 Verify no public role-management or audit read/write endpoint is introduced. Maps to FR-031, FR-032, AC-020, AC-024, AC-025, AC-027.

## Phase 7: PostgreSQL-Backed Audit Validation

- [ ] T028 Add PostgreSQL-backed audit persistence tests in `apps/api/tests/integration/audit-db.test.ts`. Maps to FR-001, AC-001.
- [ ] T029 Add PostgreSQL-backed no-sensitive-data inspection tests in `apps/api/tests/integration/audit-db.test.ts`. Maps to FR-009, FR-010, FR-011, FR-012, FR-013, AC-007, AC-008, AC-009, AC-010, AC-011, AC-030.
- [ ] T030 Add PostgreSQL-backed failure-injection tests proving registration audit failure rolls back user/credential, role assignment audit failure leaves privilege ungranted, role removal audit failure leaves privilege removed, refresh replay audit failure leaves family/session revoked, and logout audit failure leaves session securely revoked. Maps to FR-014, FR-020, FR-021, FR-025, FR-029, FR-030, AC-023, AC-033, AC-034, AC-035, AC-036, AC-037.
- [ ] T030A Add migration tests for both fresh zero-state database and repository's existing FEAT-008 schema before DB suites run. Maps to FR-034, FR-036, AC-031, AC-039.
- [ ] T031 Add PostgreSQL-backed append-only application behavior tests or source assertions. Maps to FR-031, AC-024.
- [ ] T032 Run PostgreSQL validation in required order: start PostgreSQL, create/use fresh isolated DB, run `npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma`, verify migration status, then run `npm run test:db`. Maps to FR-034, AC-028, AC-039.

## Phase 8: Regression, Runtime, And Reporting

- [ ] T033 Run `npm run clean`. Maps to FR-034, AC-028.
- [ ] T034 Run `npm run lint`. Maps to FR-034, AC-028.
- [ ] T035 Run `npx prisma validate --schema=apps/api/prisma/schema.prisma`. Maps to FR-034, AC-028.
- [ ] T036 Run `npm run typecheck`. Maps to FR-034, AC-028.
- [ ] T037 Run `npm run build`. Maps to FR-034, AC-028.
- [ ] T038 Run `npm run test`. Maps to FR-034, AC-028.
- [ ] T039 Run runtime smoke covering audited auth/session/admin flows where practical. Maps to FR-034, AC-028.
- [ ] T040 Search source and tests for sensitive audit persistence, raw email/IP storage, default identityHash, Redis durable audit use, public audit endpoints, generic every-401 audit, and rate-limit scope creep. Maps to FR-009, FR-010, FR-011, FR-023, FR-032, FR-035, AC-007, AC-008, AC-025, AC-026, AC-027, AC-032.
- [ ] T041 Update `reports/implementation/phase-2/FEAT-009.md` with files changed, migrations, event taxonomy, actor/subject model, identity correlation policy, failure semantics, transaction strategy, tests, validation, limitations, and AC mapping. Maps to FR-034, AC-029.

## Dependencies

- T001-T010 must complete before integration work.
- T011-T015 should be written before or alongside implementation of audit primitives.
- T016-T019 depend on FEAT-003/004 integration points.
- T020-T023 depend on FEAT-005/006 integration points.
- T024-T027 depend on FEAT-007/008 integration points.
- T028-T032 depend on schema/repository/service foundation and integration points; T030A and migration status evidence must complete before DB suites can be accepted.
- T033-T041 are final validation and reporting.

## Implementation Notes

- Keep external API responses unchanged unless the approved spec explicitly permits a failure due to registration or role-assignment transactionally coupled audit insert.
- Audit failure must not undo replay revocation, role removal, or logout revocation.
- Do not expose audit read/search/mutation APIs.
- Do not add Redis durable audit behavior.
- Do not implement rate limiting in FEAT-009.
- Do not add generic audit-on-every-401 middleware.
- Do not log or persist raw credentials, tokens, headers, or DB internals.
