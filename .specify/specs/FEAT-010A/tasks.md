# Tasks: FEAT-010A Authentication Endpoint Rate Limiting & Progressive Protection

**Status**: DONE - QA PASS - HUMAN FINAL GATE APPROVED  
**Implementation Rule**: Authentication rate limiting only. Do not implement FEAT-010 final validation and do not begin Phase 3.

## 1. Governance And Context

- [ ] T001 Read FEAT-010A approved spec package, `docs/AGENT_WORKFLOW.md`, and project governance docs. Maps to FR-001 through FR-028, AC-001.
- [ ] T002 Review FEAT-002 through FEAT-009 approved specs, implementation reports, and QA reports. Maps to FR-004, FR-023, FR-026, AC-002, AC-022.
- [ ] T003 Confirm FEAT-010 was blocked pending FEAT-010A completion, then is unblocked only after FEAT-010A QA PASS and Human Final Gate approval. Maps to AC-027.
- [ ] T004 Confirm Human-approved fail-closed Redis outage behavior and approved numeric policy from `spec.md`. Maps to FR-018, FR-019, FR-025, AC-005, AC-015, AC-016, AC-017.

## 2. Configuration And Key Strategy

- [ ] T005 Add validated rate-limit configuration with no fallback secrets. Maps to FR-012, FR-025, AC-017.
- [ ] T006 Add dedicated rate-limit identity HMAC secret validation. Maps to FR-011, FR-012, AC-010, AC-017.
- [ ] T007 Implement non-sensitive key builder for endpoint/source/identity scopes. Maps to FR-010, FR-011, AC-009, AC-010.
- [ ] T008 Implement source resolver with default no-trust proxy behavior. Maps to FR-016, AC-013.
- [ ] T009 Implement explicit trusted proxy behavior only if approved/configured. Maps to FR-017, AC-014.

## 3. Redis Rate-Limit Boundary

- [ ] T010 Add Redis transient counter repository/client wrapper. Maps to FR-003, FR-024, AC-003, AC-004.
- [ ] T011 Implement atomic increment/TTL/cool-down behavior. Maps to FR-003, FR-005, FR-024, AC-004, AC-006.
- [ ] T012 Implement endpoint-specific policy evaluator. Maps to FR-006, AC-005.
- [ ] T013 Implement Redis failure classification and fail-safe response path. Maps to FR-018, FR-019, FR-020, AC-015, AC-016, AC-019.

## 4. Endpoint Integration

- [ ] T014 Apply login rate limiting to canonical and alias login routes. Maps to FR-001, FR-002, FR-007, AC-006, AC-011, AC-012.
- [ ] T015 Apply registration rate limiting to canonical and alias registration routes. Maps to FR-001, FR-002, FR-008, AC-006, AC-011, AC-012.
- [ ] T016 Apply refresh rate limiting to canonical and alias refresh routes. Maps to FR-001, FR-002, FR-009, AC-006, AC-011, AC-012.
- [ ] T017 Ensure throttled response contract uses safe `TOO_MANY_REQUESTS` envelope and safe `Retry-After`. Maps to FR-013, FR-014, FR-015, AC-007, AC-008.
- [ ] T018 Preserve FEAT-003 through FEAT-005 non-throttled behavior. Maps to FR-004, FR-023, AC-020, AC-022.

## 5. Audit And Logging

- [ ] T019 Ensure rate-limited requests do not create durable audit amplification. Maps to FR-021, FR-022, AC-021.
- [ ] T020 Preserve FEAT-009 audit semantics for non-throttled flows. Maps to FR-023, AC-022.
- [ ] T021 Add sanitized operational logging for rate-limit decisions/failures. Maps to FR-020, FR-021, AC-019, AC-023.

## 6. Tests

- [ ] T022 Add unit tests for policy evaluation. Maps to FR-006, AC-005.
- [ ] T023 Add unit tests for HMAC key construction and sensitive-data exclusion. Maps to FR-010, FR-011, FR-012, AC-009, AC-010, AC-023.
- [ ] T024 Add unit tests for source/proxy resolution and spoofed header behavior. Maps to FR-016, FR-017, AC-013, AC-014.
- [ ] T025 Add unit tests for `Retry-After` calculation and response safety. Maps to FR-013, FR-014, FR-015, AC-007, AC-008.
- [ ] T026 Add integration tests for login throttling and enumeration safety. Maps to FR-001, FR-007, AC-006, AC-011.
- [ ] T027 Add integration tests for registration throttling and duplicate-contract preservation. Maps to FR-001, FR-008, AC-006, AC-012, AC-020.
- [ ] T028 Add integration tests for refresh throttling and replay semantic preservation. Maps to FR-001, FR-009, AC-006, AC-020.
- [ ] T029 Add alias route protection tests. Maps to FR-002, AC-012.
- [ ] T030 Add Redis-backed tests for shared counters, TTL, cool-down, and multi-instance behavior. Maps to FR-003, FR-024, FR-027, AC-003, AC-004, AC-018.
- [ ] T031 Add Redis unavailable/failure tests. Maps to FR-018, FR-019, FR-020, AC-015, AC-016, AC-019.
- [ ] T032 Add regression tests or validation evidence for FEAT-001 through FEAT-009. Maps to FR-026, AC-024.

## 7. Validation And Reporting

- [ ] T033 Run clean, lint, Prisma validate, typecheck, build, standard tests, DB tests, Redis-backed tests, and runtime smoke. Maps to FR-026, FR-027, AC-024, AC-025.
- [ ] T034 Verify test/CI Redis isolation and no silent pass when Redis is required. Maps to FR-027, AC-018, AC-025.
- [ ] T035 Update `reports/implementation/phase-2/FEAT-010A.md` with files changed, config, key strategy, limit policy, Redis failure semantics, proxy policy, audit interaction, tests, validation, and AC mapping. Maps to FR-028, AC-026.
- [ ] T036 Stop for Codex QA; do not start FEAT-010 final validation. Maps to AC-027.

## 8. Explicit Non-Tasks

- Do not implement permanent account lockout.
- Do not implement CAPTCHA.
- Do not implement public rate-limit status API.
- Do not add public role/audit/admin management behavior.
- Do not make Redis durable auth/security authority.
- Do not add audit-on-every-429 durable events.
- Do not implement FEAT-010 validation gate in this feature.
- Do not begin Phase 3.
