# FEAT-044 Plan: Like/Unlike Relational Semantics

Status: PLANNED / HUMAN MASTER PLANNING APPROVED / BLOCKED BY FEAT-041 + FEAT-042

## Delivery Sequence

1. Freeze PUT/DELETE and canonical state contracts.
2. Extend like repository with idempotent create, caller-scoped delete, and count/state queries.
3. Implement service post-visibility and race handling.
4. Add strict validation, controller, and routes.
5. Add live PostgreSQL concurrency and isolation tests.
6. Revalidate feed/detail projection and canonical suites.

## Schema Impact

Zero; FEAT-041 owns the composite unique constraint. Any new schema proposal blocks implementation pending review.

## Test Strategy

Unit validation/service-race mapping; API idempotency/security; live DB same-user and multi-user concurrency; feed/detail consistency; canonical regression.

## Risks

Read-before-write races must not escape as 500. Broad delete predicates could remove foreign likes. Count responses must be queried after the durable state settles.

## Completion Gate

All idempotency, concurrency, ownership, visibility, count, and safe-error cases pass on live PostgreSQL with no migration or comment-like scope creep.
