# Specification: FEAT-011 Persistence Boundary & Legacy Data Elimination

**Status**: APPROVED FOR IMPLEMENTATION  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Scope**: Persistence-boundary validation and legacy JSON persistence elimination only

## 1. User Stories

### Story 1 - Runtime Persistence Boundary

As an architect, I need the rebuilt application to have no runtime dependency on `db.json` so that durable data integrity depends on PostgreSQL rather than legacy file storage.

Independent test:

- A repository-wide guard detects prohibited runtime `db.json` reads/writes/imports.
- Approved documentation and fixture references do not fail the guard.

### Story 2 - Evidence-Based Legacy Inventory

As a QA reviewer, I need implementation evidence listing all legacy persistence references and their classification so QA can independently verify that no runtime dependency remains hidden.

Independent test:

- `reports/implementation/phase-3/FEAT-011.md` lists search patterns, discovered references, classifications, and validation results.

### Story 3 - Phase 2 Regression Protection

As a platform owner, I need FEAT-011 to preserve all approved Phase 2 auth/security behavior while establishing the Phase 3 data boundary.

Independent test:

- Existing standard, PostgreSQL-backed, and Redis-backed regression suites pass.

## 2. Functional Specification

### 2.1 Legacy Persistence Inventory

Implementation must search for:

- `db.json`
- JSON-file persistence reads/writes in runtime code
- filesystem persistence helpers that emulate application database behavior
- legacy storage modules or imports

The search should cover:

- `apps/`
- `packages/`
- project scripts
- tests
- docs
- `.specify/`
- reports when relevant for classification

### 2.2 Classification Rules

Prohibited:

- Runtime API/web/shared code reading or writing mutable JSON files as application persistence.
- Runtime fallback from PostgreSQL to JSON files.
- Test setup that silently exercises JSON persistence while claiming PostgreSQL coverage.
- Any feature implementation report claiming durable persistence while relying on JSON files.

Allowed:

- Documentation describing `db.json` as legacy/rejected architecture.
- Static test fixtures that do not act as runtime persistence.
- Generated reports mentioning prior defects or historical decisions.
- Build/package metadata JSON files that are not application data stores.

### 2.3 Runtime Boundary

Runtime application behavior must use approved persistence authorities:

- PostgreSQL for durable application/auth/security data.
- Redis only for transient/distributed behavior such as rate-limit counters.

There must be no runtime behavior that stores user, auth, role, audit, session, academy, simulation, community, subscription, AI, or other application state in `db.json`.

### 2.4 Guard Validation

The implementation must add a deterministic guard test or validation script.

The guard must:

- fail on prohibited runtime `db.json` dependency
- allow explicitly documented references
- run from repository root or through an existing validation command
- be included in FEAT-011 validation evidence
- avoid exposing sensitive local paths or secrets in failure messages

### 2.5 Regression Boundary

FEAT-011 must not alter approved Phase 2 behavior. In particular:

- user/credential/role/refresh-session/auth-audit persistence remains PostgreSQL-backed
- rate limiting remains Redis-backed transient state
- no auth/security feature is redesigned
- no public role/audit/admin management endpoint is introduced

## 3. Out-of-Scope Confirmation

FEAT-011 must not implement:

- product-domain schemas
- product APIs
- seed data
- migration governance beyond what is necessary for inventory/guard
- Redis health
- product audit table
- Phase 4 Academy behavior

## 4. Security Requirements

- No sensitive values in reports, logs, or guard output.
- No fallback persistence that masks PostgreSQL/Redis failure.
- No mutable local file can become source of truth for identity/security or future domain data.
- Guard allowlists must be explicit and narrow.

## 5. Acceptance Mapping

- Runtime boundary: AC-001, AC-002, AC-003, AC-004
- Allowed reference classification: AC-005, AC-006, AC-007
- Guard validation: AC-008, AC-009, AC-010
- Phase 2 regression: AC-011, AC-012, AC-013
- Evidence/reporting: AC-014, AC-015, AC-016

## 6. Human Review Notes

The spec intentionally does not require database migrations. If implementation discovers a prohibited runtime dependency that requires schema change to remove safely, Antigravity must document the finding and stop for Human/Codex review before expanding FEAT-011.
