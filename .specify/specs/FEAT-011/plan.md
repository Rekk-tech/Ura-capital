# Plan: FEAT-011 Persistence Boundary & Legacy Data Elimination

**Status**: APPROVED FOR IMPLEMENTATION  
**Planning Mode**: Specification only  
**Implementation**: Not started

## 1. Technical Approach

FEAT-011 should be implemented as a narrow persistence-boundary hardening feature:

1. Inventory legacy JSON persistence references.
2. Classify each finding.
3. Remove/quarantine prohibited runtime dependencies if any exist.
4. Add deterministic guard validation.
5. Run full regression.
6. Report evidence.

No product functionality should be added.

## 2. Architecture Decisions

### Decision 1 - PostgreSQL Durable Boundary

Selected:

- PostgreSQL remains the durable source of truth for application state.

Rationale:

- ADR-003 already accepts PostgreSQL/Prisma.
- Phase 2 already proved PostgreSQL-backed identity/security behavior.

Rejected:

- JSON-file persistence as runtime fallback.

Implication:

- Runtime fallback to `db.json` is a blocking defect.

### Decision 2 - Guard Instead of Manual Promise

Selected:

- Add a deterministic guard test or validation script for prohibited runtime `db.json` usage.

Rationale:

- Manual source review alone becomes stale quickly.

Rejected:

- Documentation-only declaration.

Implication:

- Future implementation work receives fast feedback if legacy persistence returns.

### Decision 3 - No Product-Domain Schema in FEAT-011

Selected:

- FEAT-011 creates no Academy, Simulation, Community, Subscription, or AI tables.

Rationale:

- Human approved FEAT-014 as constraint-standards-only and later phases own concrete domain schemas.

Rejected:

- Using FEAT-011 to start product-domain persistence.

Implication:

- FEAT-011 remains independently QA-able and low blast radius.

## 3. Implementation Boundaries

Allowed implementation areas:

- validation scripts or tests
- docs/reporting updates
- removal/quarantine of prohibited legacy persistence references if found
- package script integration if needed to run the guard

Disallowed implementation areas:

- product-domain schemas
- product APIs/UI
- auth feature redesign
- Redis behavior changes
- seed data implementation
- Phase 4 work

## 4. Validation Strategy

Required validation:

```text
npm run clean
npm run lint
npx prisma validate --schema=apps/api/prisma/schema.prisma
npm run typecheck
npm run build
npm run test
npm run test:db
npm run test:redis
```

If local PostgreSQL or Redis is unavailable, the implementation report must state `NOT VERIFIED` for affected live validation. QA may not mark related regression ACs PASS without equivalent evidence.

## 5. Test Strategy

Unit/guard coverage:

- prohibited runtime `db.json` dependency fails
- allowed docs/test fixture references do not fail
- guard failure output is safe

Integration/regression coverage:

- existing PostgreSQL-backed auth/security DB tests
- existing Redis-backed rate-limit tests
- standard application tests

## 6. Migration Plan

No migration is expected.

If implementation discovers a real runtime legacy persistence dependency that cannot be removed without schema changes, implementation must stop and report the required design decision. FEAT-011 must not silently introduce product-domain migrations.

## 7. Risks

- Overly broad guard may fail on approved documentation references.
- Overly narrow guard may miss runtime file persistence.
- Removing a legacy helper could accidentally affect tests if fixtures are not classified carefully.

## 8. Done Criteria

FEAT-011 is ready for QA when:

- all tasks in `tasks.md` are complete or explicitly marked not applicable with rationale
- acceptance criteria in `acceptance.md` are mapped in the implementation report
- validation evidence is current and truthful
- no implementation code outside FEAT-011 scope is changed
