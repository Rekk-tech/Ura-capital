# FEAT-039 Requirement: Simulation Authorization, Rate Limit & Audit-Deferral Hardening

Status: PLANNED / BLOCKED BY FEAT-038
Phase: Phase 5 - Simulation Engine
Type: Hardening / governance feature

## Human Decisions

HUMAN APPROVED: durable Simulation product audit DEFERRED FOR PHASE 5; admin/support Simulation visibility DEFERRED; dedicated order submission rate limiting INCLUDED for abuse/resource protection only.

## Goal

Harden integrated Simulation behavior and close the approved audit-deferral governance state without adding product audit persistence.

## Functional Requirements

- FR-001 Verify all private Simulation resources are owner-scoped.
- FR-002 Verify IDOR protection for sessions, portfolio, positions, orders, trades, and current valuation.
- FR-003 Verify client authority tampering is rejected.
- FR-004 Verify numeric abuse is rejected.
- FR-005 Verify FEAT-035/036 idempotency and concurrency remain intact.
- FR-006 Add order submission rate limit: 60 order submissions per authenticated user per 10 minutes per order route.
- FR-007 Rate-limit failure returns safe `429 TOO_MANY_REQUESTS` with `Retry-After`.
- FR-008 Rate-limit failure must not mutate Simulation business state.
- FR-009 Redis stores transient counters only and is not order/portfolio/idempotency authority.
- FR-010 Document durable Simulation product audit deferral and accepted risk.
- FR-011 Prohibit product audit table/migration/API/UI/event persistence.
- FR-012 Prohibit `AuthSecurityAuditRecord` reuse.
- FR-013 Verify no admin/support Simulation API exists.
- FR-014 Record implementation evidence in `reports/implementation/phase-5/FEAT-039.md`.
