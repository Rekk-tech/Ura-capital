# FEAT-040 Requirement: Phase 5 Simulation Integration Gate

Status: PLANNED / BLOCKED BY FEAT-039
Phase: Phase 5 - Simulation Engine
Type: Validation gate

## Goal

Validate the integrated Phase 5 Simulation Engine end-to-end before the Phase 5 Human Final Gate.

FEAT-040 is validation only. It must not add product behavior, schema, API, UI, seed behavior, or durable audit persistence.

## Functional Requirements

- FR-001 Validate FEAT-031 through FEAT-039 implementation evidence and checkpoints.
- FR-002 Validate fresh zero-state PostgreSQL migration deploy/status.
- FR-003 Validate upgrade from the approved Phase 4 baseline with representative prior rows and constraints preserved.
- FR-004 Run canonical validation and all Phase 5 Simulation validation suites with no mandatory skips.
- FR-005 Validate the full learner Simulation lifecycle: create, start, read state, place orders, value portfolio, complete, reset.
- FR-006 Validate fixed mock asset universe and deterministic market snapshot/cycle behavior.
- FR-007 Validate server-authoritative order execution, accounting, idempotency, and concurrency.
- FR-008 Validate ownership, authorization, IDOR protection, numeric safety, and safe diagnostics.
- FR-009 Validate Redis is transient-only and order rate limiting follows FEAT-039.
- FR-010 Validate durable Simulation product audit remains deferred and `AuthSecurityAuditRecord` is not reused.
- FR-011 Validate Simulation UI critical journey and mandatory simulated/not financial advice copy.
- FR-012 Validate no Phase 6 or Phase 7 behavior is introduced.
- FR-013 Produce `reports/qa/phase-5/PHASE-5-QA.md` with PASS / CONDITIONAL PASS / FAIL.

## Conditional PASS Policy

CONDITIONAL PASS is prohibited for failures involving:

- security boundary
- ownership / IDOR
- migration integrity
- database integrity
- transaction behavior
- order execution/accounting
- idempotency/concurrency
- Redis authority/fail-closed behavior
- rate limiting
- answer to real-money/brokerage boundary
- durable audit misuse
- mandatory validation not executed

CONDITIONAL PASS may be considered only for clearly documented non-blocking advisories with no security, integrity, migration, or user-money-simulation correctness impact.

## Out Of Scope

Implementation fixes, new Simulation features, Phase 6 implementation, Phase 7 behavior, historical valuation APIs, leaderboards, competitions, real brokerage integration, durable product audit persistence, and production hardening outside the Phase 5 gate.
