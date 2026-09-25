# FEAT-075 Acceptance Criteria: Community Experience Integration & Polish

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW

- AC-001 Community feed/detail routes use the shared shell and issue no protected request before authenticated readiness.
- AC-002 Cursors remain opaque, ordering remains server-defined, and bounded load-more produces no duplicate UI rows.
- AC-003 Post/comment mutations show only server-confirmed success; non-owner controls do not grant or imply authorization.
- AC-004 Like/unlike prevents duplicate pending actions and final count/current-user state matches canonical refetched data.
- AC-005 User content executes no HTML/script and hidden/removed/moderation internals are not disclosed.
- AC-006 All approved state/error cases are deterministic; 429/503 honor safe server contracts and never report false success.
- AC-007 Feed, composers, actions, and detail flows are responsive and accessible across required viewports.
- AC-008 Targeted tests and Phase 6 regressions prove IDOR protection, concurrency semantics, sanitization, rate limits, and zero backend/schema change.

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

