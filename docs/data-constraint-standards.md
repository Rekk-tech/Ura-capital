# Aura Capital Data Constraint Standards

**Status**: APPROVED BASELINE  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Source Feature**: FEAT-014 - Core Domain Constraint Baseline  

## 1. Purpose

These standards define the reusable PostgreSQL/Prisma constraint baseline for future Aura Capital domain schemas.

They do not create product-domain tables and do not approve Academy, Simulation, Community, Subscription, AI, or placeholder domain schema. Concrete domain schemas must be specified and approved in their owning future phases.

Application validation is required for clean request contracts and user-facing errors, but it must never be treated as a replacement for PostgreSQL constraints that protect durable data integrity.

## 2. Rule Classes

- **MUST**: Required for all future domain schemas unless a feature receives explicit Human approval for an exception.
- **SHOULD**: Default expectation; deviations require written rationale in the feature spec and implementation report.
- **DOMAIN-SPECIFIC DECISION**: Must be decided by the owning domain feature because the correct answer depends on product semantics, retention, access patterns, or legal/security context.

## 3. UUID Primary Keys

MUST:

- Persistent application records use server-controlled UUID primary keys unless explicitly Human-approved otherwise.
- Externally exposed durable record identifiers must not be sequential integers.
- Public clients must not be trusted as ID authority unless a later feature explicitly approves client-supplied idempotency keys.
- UUID behavior must be covered by live PostgreSQL or repository-backed tests for new domain tables.

SHOULD:

- Use consistent Prisma naming: `id`.
- Prefer Prisma/PostgreSQL UUID generation patterns consistent with the approved schema.

DOMAIN-SPECIFIC DECISION:

- Whether a domain also needs slugs, opaque public IDs, idempotency keys, or composite natural keys.

## 4. Foreign Keys

MUST:

- Durable same-boundary relationships use PostgreSQL foreign keys.
- Required relationships use non-null foreign keys.
- Optional relationships document why missing parent context is meaningful.
- Foreign-key violations are handled from database constraint errors, not only from pre-checks.
- Every relationship documents its deletion policy.

SHOULD:

- Index foreign keys used for joins, authorization checks, cleanup, or common query filters.
- Keep foreign key names and relation fields consistent with Prisma conventions.

DOMAIN-SPECIFIC DECISION:

- Cross-boundary references may be hard foreign keys, nullable snapshots, or immutable denormalized fields. Audit/event records may intentionally avoid hard user foreign keys when approved by their feature.

## 5. Relationship Cardinality

MUST:

- One-to-one relationships enforce uniqueness on the dependent side.
- One-to-many relationships enforce the required parent relationship with a foreign key.
- Many-to-many relationships use a join table with a composite unique constraint, or an explicitly approved equivalent.
- Cardinality choices must be visible in the feature spec and implementation report.

SHOULD:

- Keep join tables narrow and avoid business state in join rows unless the relationship itself has a domain lifecycle.

DOMAIN-SPECIFIC DECISION:

- Whether the relationship has independent lifecycle, ordering, status, history, or metadata.

## 6. Required Fields And NOT NULL

MUST:

- Required durable invariants use PostgreSQL `NOT NULL`.
- Application validation must reject missing required request fields before persistence, but PostgreSQL remains the final authority.
- Nullable columns must have a documented semantic meaning.

SHOULD:

- Avoid nullable booleans.
- Avoid nullable status columns unless the domain has a clear unknown or pending state.

DOMAIN-SPECIFIC DECISION:

- Whether optional values belong in nullable columns, separate detail tables, or derived views.

## 7. Unique Constraints

MUST:

- Durable uniqueness invariants use PostgreSQL unique constraints or unique indexes.
- Application pre-checks must not be considered race protection.
- Duplicate races must be handled from database constraint errors and mapped safely.

SHOULD:

- Store and constrain normalized identity-like values.
- Keep uniqueness scopes narrow and aligned with product rules.

DOMAIN-SPECIFIC DECISION:

- Whether uniqueness is global, per-user, per-tenant, per-status, time-bounded, or case-insensitive.

## 8. Composite Unique Constraints

MUST:

- Pairing or scoped uniqueness invariants use composite unique constraints.
- Many-to-many join tables must prevent duplicate pairings.
- Composite uniqueness must be covered by live database tests for new domain schema.

SHOULD:

- Order composite columns to match common lookup paths where possible.

DOMAIN-SPECIFIC DECISION:

- Which scope columns define the business invariant.

## 9. Indexes

MUST:

- Integrity-driven unique constraints are explicit.
- Each future domain feature reviews indexes for foreign keys, authorization checks, and expected query paths.
- Index changes that may affect existing data or large tables are reviewed under migration governance.

SHOULD:

- Avoid speculative indexes without a known query path.
- Prefer composite indexes that match actual filter and sort order.

DOMAIN-SPECIFIC DECISION:

- Reporting, feed, leaderboard, search, and time-series indexes.

## 10. Timestamps

MUST:

- Mutable durable records define creation and update timestamps unless the owning feature explicitly documents why they are not useful.
- Immutable event-like records define a creation or occurrence timestamp and must not pretend to mutate historical facts.
- Server-side code owns persisted timestamps unless a feature explicitly approves imported historical timestamps.

SHOULD:

- Use consistent names such as `createdAt` and `updatedAt` in Prisma and mapped snake_case database columns.
- Use domain-specific lifecycle timestamps only when they express product meaning.

DOMAIN-SPECIFIC DECISION:

- Submitted, settled, published, canceled, archived, deleted, or retention timestamps.

## 11. Enum And Status Integrity

MUST:

- Closed-set durable statuses use Prisma enum, PostgreSQL enum/check constraint, or an explicitly approved database-level equivalent.
- Application validation must not be the only protection against invalid stored status values.
- Service/domain logic owns transition rules, while the database constrains allowed stored values.

SHOULD:

- Keep canonical status values stable and project-consistent.
- Avoid free-text status fields for closed taxonomies.

DOMAIN-SPECIFIC DECISION:

- The allowed status taxonomy and transition graph for each domain.

## 12. Delete Policies

MUST:

- Every relationship explicitly chooses restrict/no-action, cascade, set-null, or a Human-approved domain-specific policy.
- Restrict/no-action is the default for independently meaningful or high-value records.
- Cascade is allowed only for dependent records with no independent lifecycle.
- Set-null is allowed only for optional historical references where retaining the child record without the parent is meaningful.
- Deletion policy must be tested for new domain relationships.

SHOULD:

- Prefer explicit service workflows for complex deletion, archival, or retention behavior.

DOMAIN-SPECIFIC DECISION:

- Soft delete, archive, legal retention, erasure, restoration, and cleanup workflows.

## 13. Cascade

MUST:

- Cascade must be limited to strictly dependent records.
- Cascade behavior must be named in the feature spec and verified with live database tests.

SHOULD:

- Avoid cascade chains that make data loss hard to reason about.

DOMAIN-SPECIFIC DECISION:

- Whether child records are disposable implementation detail or independently meaningful domain history.

## 14. Restrict / No-Action

MUST:

- Restrict/no-action is the default for valuable parent records when deleting the parent would orphan or destroy meaningful child state.
- The service layer must surface safe errors for rejected deletes.

SHOULD:

- Use explicit archival or status transitions when users need to hide data without deleting it.

DOMAIN-SPECIFIC DECISION:

- Which parent records may be deleted, archived, retained, or blocked by dependent state.

## 15. Set-Null

MUST:

- Set-null requires a nullable FK and documented historical meaning.
- Set-null must not be used to hide missing required ownership or authorization context.

SHOULD:

- Prefer snapshots for audit/event history that must outlive the referenced record.

DOMAIN-SPECIFIC DECISION:

- Which historical references may be nullable after parent removal.

## 16. Concurrency And Integrity

MUST:

- Concurrent writes are expected and must be protected by PostgreSQL constraints and FEAT-013 transaction boundaries.
- Unique races are resolved by database uniqueness, not by pre-checks alone.
- Multi-write invariants use the approved TransactionRunner/UnitOfWork pattern.
- Constraint failures are mapped or handled safely.

SHOULD:

- Add idempotency keys, optimistic versioning, row locks, or advisory locks only when a domain feature needs them and tests them.

DOMAIN-SPECIFIC DECISION:

- Domain-specific conflict behavior, retry rules, locking strategy, and idempotency scope.

## 17. DB Constraints Vs Application Validation

MUST:

- Validate requests at the application boundary.
- Normalize values before persistence where approved.
- Enforce durable requiredness, uniqueness, cardinality, and relationship integrity in PostgreSQL.
- Treat PostgreSQL as the final source of integrity truth.

SHOULD:

- Map known constraint errors to stable application errors.
- Keep user-facing validation errors safe and non-enumerating where relevant.

DOMAIN-SPECIFIC DECISION:

- User-facing copy, retry strategy, and conflict-resolution flow.

## 18. Prohibited Patterns

The following are prohibited unless explicitly approved by Human in a later feature:

- Academy, Simulation, Community, Subscription, AI, demo, sample, or placeholder product-domain tables in FEAT-014.
- Global soft-delete convention.
- Application-validation-only durable invariants.
- Required durable fields stored nullable without rationale.
- Relationships without explicit cardinality and deletion policy.
- Unique business invariants without database uniqueness.
- Redis, JWT, client state, logs, files, or cache entries as durable integrity authority.
- `prisma db push` as migration governance.
- Destructive or data-loss migration without explicit Human approval.
- Raw SQL outside approved infrastructure, migrations, repositories, tests, or documented validation helpers.

## 19. Exception Process

Any exception to a MUST rule requires:

1. Feature-specific written rationale.
2. Security and data-integrity risk assessment.
3. Tests proving the alternative protects integrity.
4. Explicit Human approval before implementation.

Destructive or data-loss migrations require explicit Human approval before implementation or deployment.

Soft delete is not approved globally and must be decided by the owning domain feature.
