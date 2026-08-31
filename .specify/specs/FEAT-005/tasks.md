# Tasks: FEAT-005 Refresh Token Rotation & Revocation

**Feature ID**: FEAT-005  
**Status**: PROPOSED FOR HUMAN REVIEW  
**Prerequisites**: FEAT-002, FEAT-003, and FEAT-004 Human Final Gate approval  
**Tests**: Required. FEAT-005 is security-critical.

## Traceability Key

- Requirements: `FR-001` through `FR-028` in `spec.md`.
- Acceptance Criteria: `AC-001` through `AC-026` in `acceptance.md`.

## Phase 1: Context and Setup

- [ ] T001 Review approved FEAT-002, FEAT-003, FEAT-004 specs and QA reports. Maps to FR-001, FR-002, FR-027, AC-021, AC-025.
- [ ] T002 Review ADR-003, ADR-004, ADR-005, environment strategy, and code standards. Maps to FR-019, FR-020, FR-027, AC-017, AC-025.
- [ ] T003 Create `reports/implementation/phase-2/FEAT-005.md` skeleton. Maps to FR-028, AC-026.

## Phase 2: Schema and Repository Foundation

- [ ] T004 Design `RefreshSession` migration fields for token family, rotation/consumption, replacement linkage, replay metadata, and revocation reason. Maps to FR-007, AC-005, AC-011, AC-024.
- [ ] T005 Add Prisma migration for FEAT-005 refresh-session state while preserving existing identity tables. Maps to FR-007, FR-019, AC-005, AC-017, AC-024.
- [ ] T006 Regenerate Prisma Client and verify schema validation. Maps to FR-027, AC-021.
- [ ] T007 Extend refresh-session repository interface for active lookup, create replacement, conditional consume, revoke one session, revoke family, and expired cleanup as needed. Maps to FR-007, FR-010, FR-012, FR-013, FR-018, AC-005, AC-011, AC-013, AC-024.
- [ ] T008 Keep Prisma access isolated to repository/infrastructure modules. Maps to FR-019, AC-024.

## Phase 3: Token and Cookie Primitives

- [ ] T009 Implement refresh token generation with cryptographically secure random bytes. Maps to FR-003, AC-004.
- [ ] T010 Implement refresh-token verifier using `AUTH_REFRESH_TOKEN_SECRET` and HMAC-SHA-256 or approved equivalent. Maps to FR-005, FR-006, AC-004, AC-017.
- [ ] T011 Add tests proving verifier is deterministic for same token/secret and different across different secrets. Maps to FR-006, AC-004, AC-017.
- [ ] T012 Implement central refresh-cookie option builder with approved attributes. Maps to FR-016, FR-017, AC-002, AC-014.
- [ ] T013 Add cookie tests for name, HttpOnly, Secure, SameSite, Path, Max-Age/Expires, and Domain policy. Maps to FR-016, FR-017, AC-002, AC-014.

## Phase 4: Login Refresh Session Integration

- [ ] T014 Extend successful login flow to create a refresh session and set refresh cookie while preserving FEAT-004 access-token JSON contract. Maps to FR-001, FR-002, FR-004, AC-001, AC-003, AC-006, AC-021.
- [ ] T015 Ensure login does not return raw refresh token in JSON. Maps to FR-004, FR-022, AC-003, AC-016.
- [ ] T016 Ensure refresh-session creation failure does not return a partial session-continuity success. Maps to FR-001, FR-021, AC-001, AC-016.
- [ ] T017 Add API and DB-backed login tests for refresh cookie/session creation. Maps to FR-001, FR-025, FR-026, AC-001, AC-002, AC-003, AC-005, AC-021.

## Phase 5: Refresh Endpoint and Rotation

- [ ] T018 Add canonical `POST /auth/refresh` route and optional tested `/api/auth/refresh` alias. Maps to FR-008, AC-006.
- [ ] T019 Validate refresh request source from cookie only; reject or ignore body identity/session/role/admin values. Maps to FR-009, AC-006, AC-015, AC-020.
- [ ] T020 Implement refresh service valid-token flow: verify session, user status, expiry, revocation state, rotate token, mint access token, set new cookie. Maps to FR-010, FR-013, FR-014, FR-015, AC-006, AC-007, AC-008, AC-009, AC-012.
- [ ] T021 Reuse FEAT-004 access-token service for refreshed access tokens. Maps to FR-002, FR-010, AC-007, AC-021.
- [ ] T022 Ensure previous token/session becomes unusable after successful refresh. Maps to FR-011, AC-008, AC-009.
- [ ] T023 Add unit/API tests for valid refresh and old-token rejection. Maps to FR-010, FR-011, FR-025, AC-006, AC-007, AC-008, AC-009.

## Phase 6: Replay, Revocation, Expiration, and Error Safety

- [ ] T024 Implement known replay/reuse detection for consumed/revoked refresh tokens. Maps to FR-012, AC-010.
- [ ] T025 Implement token-family revocation on known replay/reuse. Maps to FR-012, AC-010, AC-011.
- [ ] T026 Implement internal revocation primitives required by FEAT-005 tests without public logout endpoint. Maps to FR-013, FR-023, FR-024, AC-011, AC-019.
- [ ] T027 Reject expired refresh sessions without minting access tokens. Maps to FR-014, FR-015, AC-012.
- [ ] T028 Add safe error handling for missing cookie, malformed token, unknown session, expired session, revoked session, reused token, and database failure. Maps to FR-021, FR-022, AC-010, AC-011, AC-012, AC-013, AC-016.
- [ ] T029 Add tests proving no raw token/hash/session internals/secrets/raw errors leak in responses or logs. Maps to FR-022, AC-003, AC-016.

## Phase 7: Concurrency and PostgreSQL Authority

- [ ] T030 Implement transaction/conditional-update or row-lock strategy for rotation. Maps to FR-018, FR-019, AC-013, AC-017.
- [ ] T031 Add concurrent refresh test proving at most one same-token request succeeds. Maps to FR-018, FR-025, FR-026, AC-013.
- [ ] T032 Add DB-backed tests proving PostgreSQL is authoritative for active, consumed, revoked, expired, and family-revoked state. Maps to FR-019, FR-026, AC-005, AC-010, AC-011, AC-012, AC-017.
- [ ] T033 Confirm Redis is not used for authoritative FEAT-005 behavior. Maps to FR-020, AC-018.

## Phase 8: Scope Control and Regression

- [ ] T034 Verify no public logout endpoint or cookie clearing behavior is implemented. Maps to FR-024, AC-019.
- [ ] T035 Verify no RBAC, admin guard, audit emission, email verification, account lockout, rate limiting, or FEAT-006 behavior is implemented. Maps to FR-024, AC-020.
- [ ] T036 Run FEAT-001 through FEAT-004 regression suites. Maps to FR-027, AC-021.
- [ ] T037 Run validation suite: clean, lint, Prisma validate, typecheck, build, standard tests, DB tests. Maps to FR-027, AC-021, AC-022.
- [ ] T038 Run packaged API runtime smoke for health, login refresh cookie, refresh rotation, old-token rejection, and protected endpoint with refreshed access token. Maps to FR-025, FR-027, AC-006, AC-007, AC-008, AC-009, AC-021.

## Phase 9: Documentation and Handoff

- [ ] T039 Update implementation report with files changed, migration impact, token verifier, cookie contract, rotation, replay, concurrency, tests, validation, and known limitations. Maps to FR-028, AC-026.
- [ ] T040 Map every completed task to requirements and acceptance criteria in implementation report. Maps to FR-028, AC-026.
- [ ] T041 Mark implementation ready for Codex QA only after validation evidence is real and complete. Maps to FR-028, AC-021, AC-022, AC-026.

## Dependency Notes

- T004-T008 must precede service-level rotation work.
- T009-T013 must precede login cookie integration and refresh endpoint behavior.
- T014-T017 must preserve FEAT-004 login behavior.
- T018-T023 implement happy-path refresh rotation.
- T024-T032 harden replay, revocation, expiration, concurrency, and PostgreSQL authority.
- T034-T038 must be completed before implementation report finalization.

## Handoff Rule

Implementation must not begin until Human marks this spec package as APPROVED and separately hands FEAT-005 to Antigravity.
