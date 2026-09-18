# Integration Gate Requirements Checklist: FEAT-040

**Purpose**: Review whether the FEAT-040 Phase 5 integration-gate requirements are complete, unambiguous, measurable, and ready for final QA execution after FEAT-039.
**Created**: 2026-09-17
**Feature**: [FEAT-040 spec](../spec.md)

**Note**: This custom checklist is generated from the FEAT-040 package and the Phase 5 pre-QA brief.
**Review Ownership**: This is a reviewer-owned requirements-quality artifact. Mark an item `[x]` only when the reviewer determines the requirement-quality criterion is satisfied.
**Marker Semantics**: `[x]` means the written requirement is adequate. It does not mean implementation or QA execution is complete.

## Requirement Completeness

- [ ] CHK001 Are final-gate entry conditions explicit that FEAT-038 and FEAT-039 reports, checkpoints, and evidence must exist before execution? [Completeness, Spec Scope, AC-001]
- [ ] CHK002 Is the full lifecycle requirement defined from session creation through activation, market reads, BUY, SELL, valuation, completion/cancellation, and reset? [Completeness, Spec Required End-to-End Flows, FR-005]
- [ ] CHK003 Are expected server and database states required at every lifecycle transition rather than only HTTP outcomes? [Completeness, Gap, FR-005]
- [ ] CHK004 Are the formulas and precision requirements for cash, average cost, realized PnL, unrealized PnL, market value, and equity fully referenced? [Completeness, FR-007, AC-009..AC-014]
- [ ] CHK005 Are all required concurrency scenarios documented, including identical replay, conflicting replay, transport retry, overspend, oversell, and scope isolation? [Completeness, FR-007, AC-012..AC-014]
- [ ] CHK006 Is the complete User A versus User B ownership matrix defined for sessions, portfolio, positions, orders, trades, and valuation? [Completeness, FR-008, AC-015]
- [ ] CHK007 Are FEAT-038 UI states, responsive behavior, accessibility, mandatory disclosures, and historical-chart absence all included? [Completeness, FR-011, AC-022]
- [ ] CHK008 Are FEAT-039 authorization, numeric abuse, rate limiting, Redis, audit deferral, and admin/support deferral checks all included? [Completeness, FR-008..FR-010]

## Requirement Clarity

- [ ] CHK009 Is "full learner Simulation lifecycle" decomposed into exact actions, expected responses, and durable state transitions? [Clarity, FR-005]
- [ ] CHK010 Is "current authoritative snapshot" identified by scenario, session current cycle, and asset without fallback ambiguity? [Clarity, Spec Scope, AC-006..AC-009]
- [ ] CHK011 Is Decimal handling defined with exact persistence and response scales plus rounding and negative-zero behavior? [Clarity, AC-009..AC-014]
- [ ] CHK012 Is the ownership/non-enumeration contract explicit for both unknown and foreign resources? [Clarity, FR-008, AC-015]
- [ ] CHK013 Is the order rate-limit contract quantified by scope, threshold, window, response code, `Retry-After`, and zero-mutation behavior? [Clarity, FR-009, AC-019]
- [ ] CHK014 Is "Redis transient-only" defined by an explicit prohibited-authority list covering all Simulation state? [Clarity, FR-009, AC-018]
- [ ] CHK015 Is the Phase 4-to-Phase 5 upgrade baseline distinguished clearly from a no-op compatibility check? [Clarity, Spec Validation Databases, AC-003]

## Requirement Consistency

- [ ] CHK016 Are the E2E lifecycle requirements consistent with FEAT-033 transition rules and reset semantics? [Consistency, FR-005, AC-005, AC-008]
- [ ] CHK017 Are financial formulas consistent with FEAT-034 accounting and FEAT-037 current valuation contracts? [Consistency, FR-007, AC-009..AC-014]
- [ ] CHK018 Are idempotency scope and replay/conflict semantics consistent with FEAT-035 and FEAT-036? [Consistency, FR-007, AC-012..AC-014]
- [ ] CHK019 Are UI-authority requirements consistent with the strict order DTO and server-owned financial values? [Consistency, FR-008, FR-011, AC-009, AC-022]
- [ ] CHK020 Are product-audit deferral requirements consistent with FEAT-016 governance and FEAT-039 without reusing auth audit storage? [Consistency, FR-010, AC-020..AC-021]
- [ ] CHK021 Are the conditional-PASS exclusions consistent between requirement.md, acceptance.md, and Phase 5 decomposition? [Consistency, FR-013, AC-027..AC-028]

## Acceptance Criteria Quality

- [ ] CHK022 Can each AC be evaluated independently with a named evidence source and objective PASS/FAIL condition? [Measurability, Acceptance AC-001..AC-028]
- [ ] CHK023 Does AC-001 require truthful report content and checkpoint identity, not only file presence? [Measurability, AC-001]
- [ ] CHK024 Do AC-002 and AC-003 require independent databases, exact migration inventory/digests, and zero mandatory skips? [Measurability, AC-002..AC-003]
- [ ] CHK025 Does AC-004 require all 14 commands to be executed after FEAT-039 integration rather than reusing feature-local evidence? [Measurability, AC-004]
- [ ] CHK026 Does AC-014 require database-backed contention evidence that proves final state invariants, not only request-level outcomes? [Measurability, AC-014]
- [ ] CHK027 Does AC-022 define an objective accessibility/responsive baseline and the exact required simulation disclosures? [Measurability, AC-022]
- [ ] CHK028 Do AC-026..AC-028 require defect ownership, unresolved-risk disposition, and a verdict consistent with severity policy? [Measurability, AC-026..AC-028]

## Scenario And Edge-Case Coverage

- [ ] CHK029 Are zero-state cases specified for no sessions, empty positions, no orders, and no trades? [Coverage, Gap]
- [ ] CHK030 Are recovery cases specified for transport retry after commit, Redis recovery, and safe database failure behavior? [Coverage, Recovery]
- [ ] CHK031 Are numeric boundary cases specified for zero, negative, fractional, scientific notation, precision overflow, NaN, and Infinity? [Coverage, AC-016]
- [ ] CHK032 Are stale, completed, cancelled, and foreign session order attempts covered? [Coverage, Exception Flow]
- [ ] CHK033 Are missing current-cycle snapshots and archived/missing assets covered without unsafe fallback? [Coverage, Exception Flow]
- [ ] CHK034 Are canonical and alias route behaviors required to preserve the same authorization and rate-limit policy where aliases exist? [Coverage, Assumption]

## Dependencies And Gate Readiness

- [ ] CHK035 Are FEAT-038 and FEAT-039 explicitly treated as incomplete evidence until their final implementation reports and checkpoints exist? [Dependency, AC-001]
- [ ] CHK036 Are fresh and upgrade database names required to be independent from implementation databases and protected by the approved safety classifier? [Dependency, Spec Validation Databases]
- [ ] CHK037 Are PostgreSQL, Redis, frontend runtime, and CI availability requirements documented as mandatory execution dependencies? [Dependency, FR-002..FR-004, FR-011]
- [ ] CHK038 Is the response to unavailable mandatory infrastructure defined as NOT VERIFIED/FAIL rather than PASS or CONDITIONAL PASS? [Clarity, Conditional PASS Policy]
- [ ] CHK039 Is Phase 6 progression explicitly blocked until FEAT-040 QA and Human Phase Final Gate complete? [Dependency, Gap]
- [ ] CHK040 Is reduced QA independence for Codex-owned features identified for compensating Phase-level review? [Risk, Assumption]

## Notes

- Leave all items unchecked during pre-QA preparation.
- Mark items only after a reviewer assesses the written FEAT-040 requirements.
- `/speckit-implement` may read this checklist but must not modify reviewer markers.
- Final implementation verification belongs in `reports/qa/phase-5/PHASE-5-QA.md` after FEAT-039 is complete.
