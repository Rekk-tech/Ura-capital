# Tasks: FEAT-010 Phase 2 Security Integration Gate

**Status**: DONE - QA PASS - HUMAN FINAL GATE APPROVED  
**Implementation Rule**: Validation-only. Do not add product functionality. Do not begin Phase 3.

## 1. Governance And Context

- [ ] T001 Read `docs/AGENT_WORKFLOW.md`, `docs/progress-tracker.md`, `docs/phase-2-feature-decomposition.md`, and FEAT-010 approved spec package. Maps to FR-001, FR-021, AC-001.
- [ ] T002 Review approved FEAT-002 through FEAT-009 spec packages, implementation reports, and QA reports. Maps to FR-014, AC-002.
- [ ] T003 Confirm FEAT-002 through FEAT-009 are DONE / QA PASS / Human Final Gate APPROVED and Phase 3 is not started. Maps to FR-022, AC-003.
- [ ] T004 Confirm FEAT-010A has Codex QA PASS and Human Final Gate approval before FEAT-010 final validation starts. Maps to FR-019, FR-020, AC-034, AC-035.

## 2. Static Security Review

- [ ] T005 Review registration/password paths for normalized identity, password policy, Argon2id hashing, duplicate handling, and no plaintext persistence. Maps to FR-002, AC-004, AC-005, AC-006.
- [ ] T006 Review login paths for valid login, uniform invalid-login behavior, and no enumeration leakage. Maps to FR-003, AC-007, AC-008.
- [ ] T007 Review access-token signing/verification for strict claims, short lifetime, issuer/audience, HS256 allowlist, no fallback secret, and role-free JWT. Maps to FR-004, AC-009, AC-010, AC-011.
- [ ] T008 Review refresh-token/session paths for cookie security, token hashing, rotation, replay detection, and PostgreSQL authority. Maps to FR-005, AC-012, AC-013, AC-014.
- [ ] T009 Review logout paths for current-session revocation, cookie clearing, idempotent safe behavior, DB failure handling, and stateless access-token behavior. Maps to FR-006, AC-015, AC-016, AC-017.
- [ ] T010 Review RBAC/admin paths for PostgreSQL authority, zero-role semantics, same-token immediacy, canonical roles, safe failure, and no client/JWT privilege authority. Maps to FR-007, FR-008, FR-015, FR-016, AC-018, AC-019, AC-020, AC-021.
- [ ] T011 Review audit paths for event taxonomy, durable PostgreSQL persistence, privacy rules, failure semantics, append-only behavior, and no public audit API. Maps to FR-009, AC-022, AC-023, AC-024.
- [ ] T012 Review logging/error handling for password/token/cookie/secret/DB-error sanitization. Maps to FR-010, AC-025.
- [ ] T013 Search for public role escalation, public audit mutation/read APIs, Redis durable privilege authority, and JWT/client role trust. Maps to FR-015, FR-016, AC-026, AC-027.

## 3. Standard Validation Suite

- [ ] T014 Run `npm run clean`. Maps to FR-013, AC-028.
- [ ] T015 Run `npm run lint`. Maps to FR-013, AC-028.
- [ ] T016 Run `npx prisma validate --schema=apps/api/prisma/schema.prisma`. Maps to FR-013, AC-028.
- [ ] T017 Run `npm run typecheck`. Maps to FR-013, AC-028.
- [ ] T018 Run `npm run build`. Maps to FR-013, AC-028.
- [ ] T019 Run `npm run test` and record exact file/test counts. Maps to FR-013, FR-014, AC-028, AC-029.

## 4. PostgreSQL And Migration Validation

- [ ] T020 Create fresh isolated FEAT-010 QA database with explicit test marker. Maps to FR-011, AC-030.
- [ ] T021 Set `DATABASE_URL` and `TEST_DATABASE_URL` to the fresh isolated DB and verify test DB guard accepts it. Maps to FR-011, AC-030.
- [ ] T022 Run `npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma` from zero-state. Maps to FR-011, AC-031.
- [ ] T023 Run `npx prisma migrate status --schema=apps/api/prisma/schema.prisma`. Maps to FR-011, AC-031.
- [ ] T024 Run `npm run test:db` and record exact file/test counts and skips. Maps to FR-011, FR-013, FR-014, AC-029, AC-032.
- [ ] T025 Create representative existing-schema DB with pre-existing user, credential, role, refresh-session, and audit rows. Maps to FR-012, AC-033.
- [ ] T026 Apply current migrations to the existing-schema DB and verify rows are preserved. Maps to FR-012, AC-033.
- [ ] T027 Verify new auth/session/audit operations still work after existing-schema migration. Maps to FR-012, AC-033.

## 5. Cross-Feature Runtime Validation

- [ ] T028 Run the mandatory auth session runtime flow: register -> login -> `/auth/me` -> refresh -> replay old refresh -> family revocation -> login again -> logout -> old refresh rejected. Maps to FR-002 through FR-006, FR-009, AC-004 through AC-017, AC-022 through AC-025.
- [ ] T029 Run the mandatory RBAC/admin runtime flow: zero-role denial -> server-side ADMIN grant -> same-JWT allow -> ADMIN removal -> same-JWT denial. Maps to FR-007, FR-008, FR-015, FR-016, AC-018 through AC-021, AC-026.
- [ ] T030 Verify audit records exist for approved high-value events and exclude passwords, tokens, cookies, secrets, raw email, raw JWTs, DB URLs, raw Prisma errors, stack traces, and full request bodies. Maps to FR-009, FR-010, AC-022 through AC-025.
- [ ] T031 Verify no generic `AUTHENTICATION_FAILURE` every-401 audit and no unauthorized audit amplification behavior. Maps to FR-009, AC-023, AC-024.
- [ ] T032 Verify runtime flow uses PostgreSQL as durable identity/session/role/audit authority and Redis remains non-authoritative. Maps to FR-015, AC-027.

## 6. Reporting And Gate Decision

- [ ] T033 Produce `reports/implementation/phase-2/FEAT-010.md` with validation evidence and proof no product functionality was added. Maps to FR-021, AC-036.
- [ ] T034 Map every FEAT-010 acceptance criterion to evidence. Maps to FR-021, AC-036.
- [ ] T035 Classify any findings using P0/P1/P2/P3 severity rules. Maps to FR-017, AC-037.
- [ ] T036 State Phase 2 recommendation as PASS, CONDITIONAL PASS, or FAIL according to gate criteria. Maps to FR-018, AC-038.
- [ ] T037 Stop after FEAT-010 validation report and wait for Codex QA/Human review; do not begin Phase 3. Maps to FR-022, AC-039.

## 7. Dependencies

- T001 through T004 must complete before validation work is accepted.
- T005 through T013 may run in parallel.
- T014 through T019 should run before DB/runtime validation to catch fast failures.
- T020 through T027 must run sequentially.
- T028 through T032 require successful build, migrations, and isolated PostgreSQL.
- T033 through T037 require all validation evidence.

## 8. Explicit Non-Tasks

- Do not add rate limiting in FEAT-010; FEAT-010A owns implementation.
- Do not add public admin/product APIs.
- Do not change auth/token/session/audit semantics.
- Do not create Phase 3 persistence models.
- Do not alter approved acceptance criteria from FEAT-002 through FEAT-009.
