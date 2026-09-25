# FEAT-077 Acceptance Criteria: Admin Access Boundary & Existing Capability Surface

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW

- AC-001 `/admin` exists only under the Human-approved minimal scope and contains no unapproved operation.
- AC-002 Authentication occurs first and allowed state requires a successful existing server-admin contract response.
- AC-003 Missing auth returns safe auth-required UI, non-admin returns safe denied UI, and repository/DB failure returns safe unavailable UI.
- AC-004 Client role/admin claims, route state, storage, query parameters, ROOT-only, USER-only, and zero-role states cannot authorize.
- AC-005 With one still-valid access token, server-side ADMIN grant allows and ADMIN removal denies on the next authoritative check.
- AC-006 No public role management, CMS, moderation, subscription override, audit viewer, reconciliation, or repair surface exists.
- AC-007 The minimal admin state page is responsive, keyboard operable, focus-safe, and accessible.
- AC-008 Targeted tests and Phase 2 RBAC/admin regressions prove PostgreSQL authority, role-free JWT, fail-closed behavior, and zero backend/schema change.

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

