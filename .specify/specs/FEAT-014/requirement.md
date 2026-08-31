# Requirement: FEAT-014 Core Domain Constraint Baseline

**Status**: APPROVED FOR IMPLEMENTATION  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Feature Type**: Implementation feature  
**Implementation Agent**: Antigravity after Human approval  
**QA Owner**: Codex  

## 1. Context

FEAT-011 eliminated legacy mutable JSON persistence, FEAT-012 established reproducible Prisma/PostgreSQL migration governance, and FEAT-013 established shared repository and transaction patterns. FEAT-014 now defines reusable PostgreSQL/Prisma constraint standards for future core domain schemas.

This feature must not introduce speculative product-domain tables. It must establish standards, validation, and test evidence that future Academy, Simulation, Community, Subscription, AI, and other domain features can follow.

## 2. Goal

Define and validate the reusable database constraint baseline for future domain persistence so application validation, repository code, and PostgreSQL constraints work together to protect durable data integrity.

## 3. In Scope

- Reusable PostgreSQL/Prisma constraint standards.
- UUID primary key rules.
- Foreign key and relationship cardinality rules.
- `NOT NULL` rules for required invariants.
- Unique and composite unique constraint rules.
- Indexing standards.
- Timestamp standards.
- Enum/status integrity rules.
- Cascade, restrict, and set-null deletion policy standards.
- Boundary between application validation and database constraints.
- Concurrency and race-condition integrity expectations.
- Live PostgreSQL constraint verification strategy.
- Migration compatibility with FEAT-002 through FEAT-013.
- Static or test validation that rejects prohibited constraint-governance patterns where practical.
- Implementation evidence in `reports/implementation/phase-3/FEAT-014.md`.

## 4. Out of Scope

- Academy, Simulation, Community, Subscription, AI, or other concrete product-domain tables.
- Product-domain APIs, services, UI, or business workflows.
- Global soft-delete convention.
- Destructive migration without explicit Human approval.
- Seed strategy; FEAT-017 owns development seed and test data strategy.
- Redis health; FEAT-015 owns Redis health and transient state boundary.
- Product audit persistence table; FEAT-016 owns shared product audit governance only.
- Repository/transaction redesign; FEAT-013 owns shared repository and transaction pattern.
- Phase 4 planning or implementation.

## 5. Functional Requirements

- **FR-001**: FEAT-014 MUST document a reusable PostgreSQL/Prisma constraint baseline for future domain models.
- **FR-002**: The baseline MUST define UUID primary key rules for persistent domain records.
- **FR-003**: The baseline MUST define foreign key requirements and relationship cardinality rules.
- **FR-004**: The baseline MUST require database-level `NOT NULL` constraints for required durable invariants.
- **FR-005**: The baseline MUST define unique and composite unique constraint standards.
- **FR-006**: The baseline MUST define indexing standards for foreign keys, uniqueness, lookup fields, and query-path review.
- **FR-007**: The baseline MUST define timestamp standards for mutable records and immutable event-like records.
- **FR-008**: The baseline MUST define enum/status integrity standards using PostgreSQL/Prisma constraints where appropriate.
- **FR-009**: The baseline MUST define deletion relationship policies: cascade, restrict/no-action, and set-null.
- **FR-010**: The baseline MUST state that application validation is required but MUST NOT be treated as a replacement for PostgreSQL constraints.
- **FR-011**: The baseline MUST define concurrency/integrity expectations for uniqueness races, FK races, and transaction-protected writes.
- **FR-012**: FEAT-014 MUST provide live PostgreSQL validation proving representative approved-schema constraints are enforced.
- **FR-013**: FEAT-014 MUST verify migration compatibility with FEAT-002 through FEAT-013 and MUST NOT add product-domain schema.
- **FR-014**: FEAT-014 MUST use existing approved schema and/or dedicated test fixtures/helpers to prove constraint rules without introducing speculative product tables.
- **FR-015**: FEAT-014 MUST classify constraint rules as `MUST`, `SHOULD`, or `DOMAIN-SPECIFIC DECISION`.
- **FR-016**: FEAT-014 MUST define prohibited patterns and an exception/approval process.
- **FR-017**: Any destructive or data-loss migration remains prohibited unless explicitly Human-approved before implementation.
- **FR-018**: No global soft-delete convention may be introduced.
- **FR-019**: FEAT-014 MUST preserve FEAT-002 through FEAT-013 behavior and validation results.
- **FR-020**: Implementation evidence MUST include standards produced, validation commands, PostgreSQL evidence, migration compatibility evidence, limitations, and AC mapping.

## 6. Non-Functional Requirements

- Standards must be concise enough for future feature specs to reference directly.
- Tests must be deterministic and use isolated PostgreSQL databases.
- No raw database URLs, credentials, secrets, tokens, cookies, passwords, SQL values, or sensitive absolute local paths may be exposed in logs, test output, or reports.
- The baseline must not overfit to identity/security models, but it may use approved identity/security schema for validation evidence.
- Validation must follow FEAT-012 migration governance and FEAT-013 repository/transaction boundaries.

## 7. Dependencies

- FEAT-013 DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-012 migration governance.
- FEAT-011 persistence boundary.
- ADR-003 PostgreSQL/Prisma.
- Approved environment strategy and code standards.

## 8. Success Definition

FEAT-014 is successful when reusable constraint standards are documented, objectively testable, proven against live PostgreSQL where applicable, compatible with existing approved schema and migrations, and do not introduce product-domain schema or global soft-delete behavior.

## 9. Open Questions

None blocking for Human review.

Future domain features must still decide their own domain-specific constraint choices, including soft delete, domain enums, cascade behavior, and indexes tied to concrete query patterns.
