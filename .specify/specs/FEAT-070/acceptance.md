# FEAT-070 Acceptance Criteria: Application Shell, Navigation & Route Governance

Status: VERIFIED & APPROVED BY HUMAN FEATURE GATE (8/8 PASS)

- AC-001 A single canonical route registry drives navigation and route declarations without duplicate or ambiguous paths.
- AC-002 No current UI text claims a stale foundation phase or claims an unavailable domain is ready.
- AC-003 Desktop and mobile navigation are keyboard operable, focus-safe, responsive, and visibly identify the current route.
- AC-004 Unknown routes and route rendering failures produce safe, deterministic 404/error states without internal details.
- AC-005 Shared shell and page-state primitives are documented, reusable, semantic, and do not embed domain authority.
- AC-006 AuthProvider and QueryClient behavior remains compatible; no token is added to localStorage, sessionStorage, URL, DOM, or logs.
- AC-007 Hidden links never substitute for authorization and canonical server errors remain authoritative.
- AC-008 Targeted frontend tests and required repository validation pass with no Phase 7, API, schema, or migration regression.

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

