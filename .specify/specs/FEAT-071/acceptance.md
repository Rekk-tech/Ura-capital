# FEAT-071 Acceptance Criteria: Authentication Entry & Account Experience

Status: DONE / HUMAN FEATURE GATE APPROVED (8/8 PASS, 2026-09-25)

- AC-001 [PASS] `/login`, `/register`, and authenticated `/account` resolve through the canonical shell with deterministic auth-required states.
- AC-002 [PASS] Requests use only approved `/api/auth/*` contracts; no duplicate auth implementation or quota-bypass alias behavior is introduced.
- AC-003 [PASS] Client guidance matches approved normalization/password rules and server rejections remain authoritative.
- AC-004 [PASS] Unknown user and wrong password are externally indistinguishable; rate-limit/outage errors are safe and actionable.
- AC-005 [PASS] No password, password hash, access token, refresh token, cookie, or secret is persisted, rendered, placed in URLs, or logged.
- AC-006 [PASS] External, protocol-relative, malformed, or unsafe return targets are rejected to a safe internal default.
- AC-007 [PASS] Account data is server-derived and read-only; logout clears in-memory state and no client role value grants access.
- AC-008 [PASS] Targeted unit/component/browser tests and required regressions pass with zero backend/schema/migration change.

## Traceability Matrix

| Requirement | Task | Acceptance |
|---|---|---|
| FR-001 | T001 | AC-001 |
| FR-002 | T002 | AC-002 |
| FR-003 | T003 | AC-003 |
| FR-004 | T004 | AC-004 |
| FR-005 | T005 | AC-005 |
| FR-006 | T006 | AC-006 |
| FR-007 | T007 | AC-007 |
| FR-008 | T008 | AC-008 |

## Verdict Rule

PASS requires AC-001 through AC-008 with no mandatory skip, no P0/P1, no scope expansion, truthful evidence, and exact-source CI green. Otherwise FAIL and map each defect to the owning requirement.

