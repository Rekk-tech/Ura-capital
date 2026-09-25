# Phase 9 Master Planning Report

Status: READY FOR HUMAN MASTER PLANNING REVIEW
Planning Owner: Codex
Planning Branch: `planning/phase-9-master`
Baseline Tag: `feat-056-approved`
Baseline Commit: `413dec9a54c1a5a0437b016232e6eeedcbf2ca73`
Implementation: NOT STARTED

## 1. Baseline and Isolation

Planning was prepared in the isolated worktree `D:/project/ura-capital/.tmp/phase9-planning`. The active Phase 7 integration worktree and FEAT-057 QA worktree were not modified. The baseline is the latest published checkpoint that contains the approved learner-facing Subscription UI and all earlier integrated web experiences needed to inspect Phase 9.

## 2. Canonical Scope Finding

The Human-approved master roadmap identifies Phase 9 as `UI Integration & Product Polish`, but it does not contain an approved feature decomposition. This package is therefore a proposal, not an implementation authorization.

The actual roadmap names Academy, Simulation, Community, Subscription, profile, admin, and AI experiences, plus responsive UX, accessibility, complete async states, and critical E2E journeys. Existing application inspection confirms Academy, Simulation, Community, and Subscription UIs exist; the root shell is stale; no user-facing login/register, dashboard, profile, admin, or AI route exists.

## 3. Phase 8 Dependency Analysis

Phase 9 cannot fully close before Phase 8 if Aura Intelligence remains in the Production MVP cut. ADR-006 requires all AI interactions to pass through the internal AI gateway, and Phase 8 has not yet been decomposed or implemented.

Non-AI Phase 9 work is independent from Phase 8 after its own upstream gates. The proposed FEAT-078 and final FEAT-080 gate are HARD-blocked by Phase 8 only when AI is included. Human may instead explicitly defer AI from the Phase 9 MVP; the deferral must be recorded and cannot be inferred by implementation agents.

Phase 7 is a HARD prerequisite for Subscription UI integration and the common Phase 9 implementation baseline. Phase 7 remains IN_PROGRESS until FEAT-057 passes and Human approves its final gate.

## 4. Proposed Feature Set

This plan proposes FEAT-070 through FEAT-080. FEAT-058 through FEAT-069 are reserved for the earlier, still-unplanned Phase 8 to prevent ID collision. The proposed features are:

1. FEAT-070 Application Shell, Navigation & Route Governance.
2. FEAT-071 Authentication Entry & Account Experience.
3. FEAT-072 Learner Dashboard & Cross-Domain Summary.
4. FEAT-073 Academy Experience Integration & Polish.
5. FEAT-074 Simulation & Portfolio Experience Integration.
6. FEAT-075 Community Experience Integration & Polish.
7. FEAT-076 Subscription Experience Integration & Polish.
8. FEAT-077 Admin Access Boundary & Existing Capability Surface.
9. FEAT-078 Aura Intelligence UI Integration.
10. FEAT-079 Accessibility, Responsive & Async-State Hardening.
11. FEAT-080 Phase 9 Product Integration & Browser E2E Gate.

All IDs and reservation boundaries require Human approval.

## 5. Architecture Review

No new server architecture, datastore, migration, or external service is proposed. Phase 9 consumes approved APIs and preserves all authority boundaries. The only proposed tool activation is Playwright for the final browser E2E gate, consistent with the selected testing stack in final technology decisions.

The following tempting assumptions were rejected:

- No profile editing without an approved mutation API.
- No dashboard aggregate endpoint without an owning backend spec.
- No admin operation beyond the existing guarded capability.
- No direct Gemini/provider invocation or mocked production AI.
- No client-derived role, entitlement, grading, progress, price, PnL, ownership, or durable state.
- No new premium gate without explicit Human approval.

## 6. Database, API, and Migration Ownership

Every proposed Phase 9 feature has migration ownership `ZERO`. No product persistence is required by this plan. Existing APIs are consumed by domain-specific clients. If Human selects profile mutation, a dashboard aggregate API, new admin operations, or AI persistence beyond Phase 8 contracts, those changes require separately owned and approved features before the affected Phase 9 package can implement them.

## 7. Quality Strategy

- Feature-level targeted tests cover API mapping, components, interaction, security boundaries, async states, responsive behavior, and accessibility.
- Fast-Track Internal Feature Gates may be used for implementation checkpoints, but self-verification is not independent QA.
- Every checkpoint requires exact-source CI green before publication.
- FEAT-079 performs integrated cross-cutting hardening after domain feature merges.
- FEAT-080 is validation-only and performs independent real-browser desktop/mobile E2E and Phase regression.
- Human Final Gate is required after FEAT-080 PASS.

## 8. Traceability Result

Each feature package defines eight functional requirements, eight implementation tasks, and eight acceptance criteria with direct `FR-00N -> T00N -> AC-00N` mapping. FEAT-080 uses the same explicit mapping for gate work. No task is orphaned and no acceptance criterion lacks an implementation or validation task.

## 9. Planning Validation

| Check | Result |
|---|---|
| Feature IDs unique inside repository | PASS for proposed FEAT-070..080 |
| ID collision risk with Phase 8 | CONTROLLED by proposed reservation; Human approval pending |
| Dependency graph acyclic | PASS |
| FR to Task to AC traceability | PASS |
| Migration ownership explicit | PASS: ZERO for all proposed Phase 9 features |
| Unapproved backend behavior introduced | NONE |
| Phase 7 application changes | ZERO |
| Phase 8 application changes | ZERO |
| Phase 9 application changes | ZERO |
| `docs/progress-tracker.md` changed | NO |
| Active Phase 7 QA reports changed | NO |

## 10. Human Decisions Required

- P9-D01 feature ID reservation/allocation.
- P9-D02 whether AI is included in the Production MVP cut.
- P9-D03 read-only or editable profile.
- P9-D04 client-composed or server-aggregated dashboard.
- P9-D05 minimal status-only or broader admin surface.
- P9-D06 existing-domain premium gate policy.
- P9-D07 Playwright/browser accessibility activation.
- P9-D08 Phase 8/9 implementation and QA ownership.

## 11. Proposed Tracker Changes - Do Not Apply Yet

After Human Master Planning Approval only:

```text
Phase 9:
PLANNING APPROVED / IMPLEMENTATION NOT STARTED

FEAT-070:
NEXT / APPROVED FOR IMPLEMENTATION after Phase 7 Human Final Gate

FEAT-071..FEAT-077:
DEPENDENCY BLOCKED

FEAT-078:
BLOCKED BY PHASE 8 HUMAN FINAL GATE

FEAT-079:
BLOCKED BY INCLUDED PHASE 9 IMPLEMENTATION FEATURES

FEAT-080:
BLOCKED / FINAL VALIDATION GATE

Phase 10:
BLOCKED
```

No tracker change is authorized by this planning report.

## 12. Readiness Verdict

READY FOR HUMAN MASTER PLANNING REVIEW

Implementation: NOT STARTED
