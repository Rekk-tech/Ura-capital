# FEAT-031 Tasks

| Task | Description | Maps To |
| --- | --- | --- |
| T001 | Record Human-approved Phase 5 MVP constants in implementation report. | FR-014, AC-001 |
| T002 | Add exact `SimulationScenario` model and constraints. | FR-001, FR-010, AC-002 |
| T003 | Add exact `SimulationAsset` model and constraints. | FR-001, FR-008, AC-003 |
| T004 | Add exact `SimulationMarketSnapshot` model and constraints. | FR-001, FR-009, AC-004 |
| T005 | Add exact `SimulationSession` model and active-session partial unique protection. | FR-001, FR-005, FR-010, AC-005, AC-012 |
| T006 | Add exact `SimulationPortfolio` model and one-portfolio invariant. | FR-001, FR-006, AC-006 |
| T007 | Add exact `SimulationPosition` model and unique portfolio/asset invariant. | FR-001, FR-007, AC-007 |
| T008 | Add exact `SimulationOrder` model and idempotency uniqueness. | FR-001, FR-011, FR-013, AC-008 |
| T009 | Add exact `SimulationTrade` model and order/trade relation. | FR-001, FR-012, AC-009 |
| T010 | Add migration with actual timestamp naming and no historical migration edits. | FR-002, FR-003, FR-004, AC-010 |
| T011 | Add Simulation repository interfaces and Prisma implementations. | FR-016, AC-016 |
| T012 | Extend repository factory/UoW container. | FR-017, AC-017 |
| T013 | Add fresh/upgrade/constraint DB tests and guard validation. | FR-018..FR-022, AC-018..AC-023 |
| T014 | Write implementation report with exact AC evidence. | FR-023, AC-024 |
