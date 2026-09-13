# Tasks: FEAT-027 XP & Idempotent Reward Ledger

**Status**: APPROVED FOR IMPLEMENTATION  
**Implementation Status**: NOT_STARTED  

| ID | Task | Depends On | AC Mapping |
| --- | --- | --- | --- |
| T001 | Record locked Human XP/reward policy decisions and freeze constants. | Human approval | AC-001, AC-004, AC-005, AC-010, AC-011, AC-024 |
| T002 | Define reward types, deterministic identity, DTOs, and metadata allowlist. | T001 | AC-002, AC-003, AC-012, AC-016 |
| T003 | Implement reward repository methods using FEAT-013 boundaries. | T002 | AC-006, AC-007, AC-008, AC-017 |
| T004 | Implement reward reconciliation service consuming FEAT-026 completion/progression facts. | T003 | AC-001, AC-002, AC-003, AC-004, AC-005, AC-010 |
| T005 | Implement atomic ledger + XP aggregate transaction. | T004 | AC-006, AC-007, AC-008, AC-009 |
| T006 | Implement duplicate/replay/reconciliation idempotent return path. | T005 | AC-003, AC-008, AC-010, AC-025 |
| T007 | Implement canonical current-user XP read API and lightweight read-only learner display. | T005 | AC-013, AC-014, AC-015, AC-026, AC-027 |
| T008 | Add unit tests for identity, policy, validation, and metadata. | T002, T004 | AC-001 through AC-005, AC-012, AC-016 |
| T009 | Add live PostgreSQL transaction/concurrency/recovery tests. | T005, T006 | AC-006 through AC-011, AC-017, AC-025 |
| T010 | Add security/regression tests for client authority, Redis, audit, FEAT-026. | T007 | AC-018 through AC-023 |
| T011 | Run canonical 14 validation commands. | T008, T009, T010 | AC-024 |
| T012 | Write implementation report and update tracker without starting FEAT-028/029. | T011 | AC-024 |

Every AC-001..AC-027 must have implementation and test evidence.
