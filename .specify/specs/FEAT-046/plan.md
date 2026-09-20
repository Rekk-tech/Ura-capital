# FEAT-046 Plan: Community UI

Status: PLANNED / HUMAN MASTER PLANNING APPROVED / BLOCKED BY FEAT-042..FEAT-045

## Delivery Sequence

1. Freeze frontend DTO/client contracts from FEAT-042..045.
2. Add centralized Community API client and TanStack Query hooks.
3. Build feed, composer, post card, detail, comments, and state components.
4. Register authenticated routes/navigation.
5. Add unit/component/routing/accessibility tests.
6. Run authenticated runtime smoke and canonical validation.

## Backend/Schema Impact

Zero. Any backend contract gap returns to its owning feature rather than being worked around in the UI.

## Test Strategy

- Unit: API request paths/bodies/auth/error normalization.
- Component: states, content, controls, pending behavior, pagination, invalidation, accessibility.
- Runtime: authenticated create/read/comment/like/unlike/remove journey against actual API/PostgreSQL/Redis.
- Regression: auth client plus Academy/Simulation frontend suites and canonical 14.

## Risks

UI-only owner hiding must not be mistaken for authorization. Optimistic counts could drift under concurrency, so they are prohibited. User content must remain plain text to avoid XSS.

## Completion Gate

The full learner journey and all states pass with server-authoritative counts and zero backend/schema scope creep.
