# FEAT-043 Plan: Comments API

Status: PLANNED / HUMAN MASTER PLANNING APPROVED / BLOCKED BY FEAT-041 + FEAT-042

## Delivery Sequence

1. Freeze flat comment routes, DTO, cursor, and unavailable-resource semantics.
2. Extend comment repository reads/create/conditional removal.
3. Implement service parent-visibility and ownership policies through repositories/UoW.
4. Add validation, controller, and exact authenticated routes.
5. Integrate visible comment aggregate into post projection.
6. Add unit/API/live DB/security tests and canonical regression.

## Schema Impact

Zero. Any required schema change returns to FEAT-041 governance and Human review.

## Test Strategy

Unit cursor/validation/DTO tests; authenticated API contracts; live DB FK/visibility/order/count/removal/rollback tests; IDOR and spoofing tests; canonical regression.

## Risks

Flat comments must not accidentally expose reply semantics. Removed content must not leak through comments or post counts. Aggregate count and list visibility must share the same status predicate.

## Completion Gate

All three routes, flat semantics, parent visibility, ownership, relational counts, live DB evidence, and canonical validation pass with no migration or scope creep.
