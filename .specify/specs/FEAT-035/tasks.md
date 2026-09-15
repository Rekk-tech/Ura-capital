# FEAT-035 Tasks

| Task | Description | Maps To |
| --- | --- | --- |
| T001 | Implement strict order request schema. | FR-001..FR-004, AC-001..AC-004 |
| T002 | Implement canonical request fingerprinting. | FR-009..FR-011, AC-005 |
| T003 | Enforce idempotency uniqueness in PostgreSQL. | FR-012, AC-006 |
| T004 | Implement same-key same-payload replay. | FR-010, AC-007 |
| T005 | Implement same-key conflicting-payload rejection. | FR-011, AC-008 |
| T006 | Implement current snapshot execution price lookup. | FR-005, AC-009 |
| T007 | Implement BUY transaction with portfolio lock and cash re-check. | FR-006, FR-008, AC-010..AC-012 |
| T008 | Implement SELL transaction with position lock and quantity re-check. | FR-007, FR-008, AC-013..AC-015 |
| T009 | Add safe response DTO. | FR-014, AC-016 |
| T010 | Add forbidden authority field tests. | FR-003, AC-017 |
| T011 | Add rollback/no-partial-state tests. | FR-008, AC-018 |
| T012 | Verify Redis is not authority. | FR-013, AC-019 |
| T013 | Add DB tests for overspend/oversell minimum concurrency. | FR-006, FR-007, AC-020..AC-021 |
| T014 | Verify unsupported scope remains absent. | AC-022..AC-025 |
| T015 | Run canonical validation and regression. | AC-026..AC-027 |
| T016 | Write implementation report. | FR-015, AC-028 |
