# Tasks: FEAT-028 Academy Authorization & Ownership Hardening

**Status**: PLANNED / BLOCKED BY FEAT-027 IMPLEMENTATION GATE  

| ID | Task | Depends On | AC Mapping |
| --- | --- | --- | --- |
| T001 | Record Human-approved admin/support visibility deferral. | FEAT-027 gate | AC-001, AC-017, AC-018, AC-022 |
| T002 | Inventory actual Academy routes and produce authorization matrix. | T001 | AC-002 |
| T003 | Add cross-user read tests for attempts, results, progress, XP/rewards. | T002 | AC-003, AC-004, AC-005, AC-006 |
| T004 | Add cross-user mutation tests for answers, submit, completion, reward operations. | T002 | AC-007, AC-008, AC-009 |
| T005 | Harden service/repository ownership checks where needed. | T003, T004 | AC-003 through AC-009 |
| T006 | Add JWT/client role/userId spoofing tests. | T005 | AC-010, AC-011 |
| T007 | Verify non-enumerating 403/404 semantics. | T005 | AC-012, AC-013 |
| T008 | Verify DTO secrecy and FEAT-023/024/025 regressions. | T005 | AC-014, AC-015, AC-016 |
| T009 | Run canonical validation and guards. | T006, T007, T008 | AC-017 through AC-021 |
| T010 | Write implementation report and keep FEAT-030 blocked. | T009 | AC-022 |
