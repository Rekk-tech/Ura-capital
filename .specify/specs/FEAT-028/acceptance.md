# Acceptance Criteria: FEAT-028 Academy Authorization & Ownership Hardening

**Status**: PLANNED / BLOCKED BY FEAT-027 IMPLEMENTATION GATE  
**Unresolved Human Decision**: ZERO  

| ID | Acceptance Criterion |
| --- | --- |
| AC-001 | Human-approved admin/support visibility deferral is recorded before implementation. |
| AC-002 | Every Academy endpoint has a canonical authorization classification. |
| AC-003 | User A cannot read User B quiz attempts. |
| AC-004 | User A cannot read User B graded results. |
| AC-005 | User A cannot read User B progress. |
| AC-006 | User A cannot read User B XP/reward history if exposed. |
| AC-007 | User A cannot mutate User B draft answers. |
| AC-008 | User A cannot submit User B attempt or trigger User B progression. |
| AC-009 | User A cannot mutate User B XP/rewards. |
| AC-010 | Client-supplied `userId` has no authority. |
| AC-011 | JWT role/admin spoofing is rejected; PostgreSQL remains role authority. |
| AC-012 | Ownership failures avoid cross-user existence enumeration. |
| AC-013 | Malformed identifiers use safe canonical errors. |
| AC-014 | Pre-submission quiz secrecy remains intact. |
| AC-015 | Graded result visibility remains owner-scoped. |
| AC-016 | Progress and reward DTOs expose no sensitive/internal fields. |
| AC-017 | No admin/support Academy route, admin content-authoring surface, or support read API is introduced. |
| AC-018 | ADMIN/SUPPORT learner visibility remains deferred and cannot bypass learner ownership boundaries. |
| AC-019 | No XP/reward/grading/progression semantics are redefined. |
| AC-020 | Repository/UoW boundaries and guard compliance are preserved. |
| AC-021 | No unapproved schema migration or Redis durable authority is introduced. |
| AC-022 | Canonical 14 validation commands pass and implementation report maps AC-001..AC-022. |
