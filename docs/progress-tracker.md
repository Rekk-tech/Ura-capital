# Aura Capital - Greenfield Rebuild Progress Tracker

## 1. Strategy

Aura Capital is being rebuilt from the ground up.

The old codebase is retained only as:

- Functional reference
- Product reference
- UX reference
- Regression reference

We are **not** executing a file-by-file refactor of the old system.

## 2. Status Values

Allowed task states:

```text
TODO
IN_PROGRESS
BLOCKED
IN_REVIEW
PASSED
FAILED
DONE
```

Phase QA decisions:

```text
PASS
CONDITIONAL PASS
FAIL
```

## 3. Overall Status

```text
Legacy project review     DONE
Rebuild planning          DONE
Greenfield implementation IN_PROGRESS
Production readiness      NOT_STARTED
```

---

# Phase 0 - Rebuild Definition

## Goal

Lock the product scope, architecture principles, engineering rules, UI direction, and QA workflow before implementation.

## Deliverables

- [x] `project-overview.md`
- [x] `architecture-context.md`
- [x] `code-standards.md`
- [x] `ui-context.md`
- [x] `ai-workflow-rules.md`
- [x] `progress-tracker.md`
- [x] Final technology choices confirmed (`docs/final-technology-decisions.md`)
- [x] Repository baseline created (FEAT-001 QA PASS)
- [x] Environment strategy defined (`docs/environment-strategy.md`)
- [x] Initial ADRs created where required (`docs/adrs/`)
- [x] Phase 0 governance review completed (`docs/phase-0-governance-review.md`)

## Quality Gate

Phase 0 passes when:

- Architecture direction is agreed
- Greenfield strategy is explicit
- AI Agent rules are established
- Phase sequence is approved
- Repository can begin clean implementation

Status:

```text
PASS
```

Governance Decision:

```text
PASS
```

Notes:

- Phase 0 definition gaps are closed.
- Required ADRs are recorded.
- Repository baseline requirement is satisfied by FEAT-001, which has Codex QA PASS.
- FEAT-001 received Human Final Gate approval.
- Phase 2 may proceed to planning only when Human explicitly requests it.

---

# Phase 1 - Engineering Foundation

## Goal

Create a clean, production-oriented repository foundation.

## Scope

- Monorepo or agreed repository structure
- Frontend application bootstrap
- Backend application bootstrap
- Strict TypeScript
- Linting
- Formatting
- Environment validation
- Docker development baseline
- Testing framework
- CI pipeline
- Health endpoint
- Structured error format
- Structured logging baseline

## Expected Output

```text
apps/
  web/
  api/

packages/
  shared/
```

or an equivalent approved structure.

## Acceptance Criteria

- [x] Clean install succeeds
- [x] Lint passes
- [x] Typecheck passes
- [x] Unit test command passes
- [x] Build passes
- [x] API health check works
- [x] Required environment variables are validated
- [x] No hard-coded secrets
- [x] CI runs on pull requests

Status:

```text
DONE
```

QA:

```text
PASS
```

Final Decision:

```text
APPROVED by Human.
```

Artifacts:

- `.specify/specs/FEAT-001/requirement.md`
- `.specify/specs/FEAT-001/spec.md`
- `.specify/specs/FEAT-001/plan.md`
- `.specify/specs/FEAT-001/tasks.md`
- `.specify/specs/FEAT-001/acceptance.md`
- `reports/implementation/phase-1/FEAT-001.md`
- `reports/qa/phase-1/FEAT-001-QA.md`

---

# Phase 2 - Identity & Security

## Goal

Build authentication and authorization correctly before dependent features.

## Scope

- User model
- Registration
- Login
- Password hashing
- Short-lived access token
- Refresh-token strategy
- Logout/revocation
- Role-based authorization
- Admin guard
- Authentication audit events
- Security tests

## Acceptance Criteria

- [x] Invalid login rejected
- [x] Passwords hashed
- [x] Forged token rejected
- [x] Expired token rejected
- [x] Refresh flow works
- [x] Logout invalidates refresh session
- [x] Normal user cannot access admin API
- [x] Admin authorization is server-enforced
- [x] Secrets are environment-only
- [x] Critical auth tests pass

Status:

```text
DONE
```

QA:

```text
PASS
```

Human Final Gate:

```text
APPROVED
```

Features:

- FEAT-002: Identity Persistence & Auth Configuration — `DONE` (QA PASS; Human Final Gate APPROVED)
- FEAT-003: Registration & Password Security — `DONE` (QA PASS; Human Final Gate APPROVED)
- FEAT-004: Login & Access Token Issuance — `DONE` (QA PASS; Human Final Gate APPROVED)
- FEAT-005: Refresh Token Rotation & Revocation — `DONE` (QA PASS; Human Final Gate APPROVED)
- FEAT-006: Logout & Session Invalidation — `DONE` (QA PASS; Human Final Gate APPROVED)
- FEAT-007: RBAC Authorization Foundation — `DONE` (QA PASS; Human Final Gate APPROVED)
- FEAT-008: Admin Authorization Guard — `DONE` (QA PASS; Human Final Gate APPROVED)
- FEAT-009: Authentication Audit Events — `DONE` (QA PASS; Human Final Gate APPROVED)
- FEAT-010A: Authentication Endpoint Rate Limiting & Progressive Protection — `DONE` (QA PASS; Human Final Gate APPROVED)
- FEAT-010: Phase 2 Security Integration Gate — `DONE` (QA PASS; Human Final Gate APPROVED)

Current Phase 2 State:

- FEAT-002 PASS/DONE with Human Final Gate approval.
- FEAT-003 PASS/DONE with Human Final Gate approval.
- FEAT-004 PASS/DONE with Human Final Gate approval.
- FEAT-005 PASS/DONE with Human Final Gate approval.
- FEAT-006 PASS/DONE with Human Final Gate approval.
- FEAT-007 PASS/DONE with Human Final Gate approval.
- FEAT-008 PASS/DONE with Human Final Gate approval.
- FEAT-009 PASS/DONE with Human Final Gate approval.
- FEAT-010A PASS/DONE with Human Final Gate approval.
- FEAT-010 PASS/DONE with Human Final Gate approval.
- Phase 2 PASS/DONE with Human Final Gate approval.
- ADV-001 remains non-blocking technical debt for future maintenance/hardening.
- Phase 3 is DONE / QA PASS / Human Final Gate APPROVED; FEAT-018 is DONE / QA PASS / Human Final Gate APPROVED.

FEAT-005 QA History:

- QA Iteration 2: FAIL
- Rework Iteration 2: COMPLETE
- QA Iteration 3: FAIL
- Rework Iteration 3: COMPLETE
- QA Iteration 4: FAIL - governance-only DEF-006 after technical/security PASS
- Governance-only correction: COMPLETE by Codex
- QA Iteration 5: PASS - governance closure; FEAT-005 ready for Human Final Gate

FEAT-005 Governance Fields:

```text
Lifecycle State: DONE
Implementation: COMPLETE
Technical/Security Validation: PASS
Latest QA: PASS - governance closure
Governance Consistency: CONSISTENT
Human Final Gate: APPROVED
FEAT-006: DONE - QA PASS; Human Final Gate APPROVED
FEAT-007: DONE - QA PASS; Human Final Gate APPROVED
FEAT-008: DONE - QA PASS; Human Final Gate APPROVED
```

FEAT-007 Governance Fields:

```text
Lifecycle State: DONE
Implementation: COMPLETE
Technical/Security Validation: PASS
Latest QA: PASS - Codex QA Iteration 1
Governance Consistency: CONSISTENT
Human Final Gate: APPROVED
FEAT-008: DONE - QA PASS; Human Final Gate APPROVED
```

FEAT-008 Governance Fields:

```text
Lifecycle State: DONE
Implementation: COMPLETE
Latest QA: PASS - Codex QA Iteration 2
Rework Status: COMPLETE
Technical/Security Validation: PASS
DB Validation: PASS - fresh isolated PostgreSQL QA database verified
Runtime End-to-End Validation: PASS - full runtime smoke passed
Spec Package: APPROVED
Approved Route: GET /admin/ping
Route Composition: app.use(adminRouter) + router.get("/admin/ping", authenticate, requireAdmin, handler)
Admin Guard: requireAdmin delegates to FEAT-007 requireRole(ROLES.ADMIN)
Admin Authority: PostgreSQL only
JWT Roles: prohibited; JWT remains role-free
Allowed: ADMIN and USER+ADMIN
Denied: zero-role, USER-only, ROOT-only
Malformed Role Semantics: ROOT+ADMIN accepts canonical ADMIN
Failure Semantics: DB/repository failure safe fail-closed 5xx
Excluded: public role management, default admin credentials, FEAT-009 audit emission, rate limiting
Human Final Gate: APPROVED
FEAT-009: DONE - QA PASS; Human Final Gate APPROVED
FEAT-010A: DONE - QA PASS; Human Final Gate APPROVED
FEAT-010: DONE - QA PASS; Human Final Gate APPROVED
```

FEAT-009 Governance Fields:

```text
Lifecycle State: DONE
Planning Status: COMPLETED
Implementation: COMPLETE
Latest QA: PASS - Codex QA Iteration 3
Technical/Security Validation: PASS
DB Validation: PASS - fresh isolated PostgreSQL QA database verified
Migration Validation: PASS - deploy/status and existing-schema upgrade verified
Runtime End-to-End Validation: PASS - runtime smoke 21/21
Spec Package: APPROVED
Human Spec Approval: APPROVED
Human Final Gate: APPROVED
Audit Authority: PostgreSQL durable system of record
Redis Durable Audit Authority: PROHIBITED
Public Audit Read/Search API: OUT OF SCOPE
Rate Limiting: OUT OF SCOPE for FEAT-009; Option A selected for dedicated FEAT-010A before FEAT-010 final validation
FEAT-010A: DONE - QA PASS; Human Final Gate APPROVED
FEAT-010: DONE - QA PASS; Human Final Gate APPROVED
```

FEAT-009 QA History:

- QA Iteration 1: FAIL
- QA Iteration 2: FAIL
- QA Iteration 3: PASS
- Human Final Gate: APPROVED

FEAT-009 Artifacts:

- `.specify/specs/FEAT-009/requirement.md`
- `.specify/specs/FEAT-009/spec.md`
- `.specify/specs/FEAT-009/plan.md`
- `.specify/specs/FEAT-009/tasks.md`
- `.specify/specs/FEAT-009/acceptance.md`

FEAT-010 Governance Fields:

```text
Lifecycle State: DONE
Planning Status: SPEC APPROVED
Implementation: VALIDATION COMPLETE
Latest QA: PASS - Codex FEAT-010 Security Integration Gate
Spec Package: APPROVED
Human Spec Approval: APPROVED
Human Final Gate: APPROVED
Feature Type: Phase 2 validation gate only
Product Functionality: PROHIBITED
Phase 3: DONE - QA PASS; Human Final Gate APPROVED
Rate Limiting Decision: Option A selected - FEAT-010A required
Start Condition: SATISFIED - FEAT-010A QA PASS and Human Final Gate approval completed
Phase 2 Gate Decision: PASS - Human Final Gate APPROVED
Non-Blocking Technical Debt: ADV-001 - Express `res.clearCookie` deprecation warning
```

FEAT-010 Artifacts:

- `.specify/specs/FEAT-010/requirement.md`
- `.specify/specs/FEAT-010/spec.md`
- `.specify/specs/FEAT-010/plan.md`
- `.specify/specs/FEAT-010/tasks.md`
- `.specify/specs/FEAT-010/acceptance.md`

FEAT-010A Governance Fields:

```text
Lifecycle State: DONE
Planning Status: COMPLETED
Implementation: COMPLETE
Latest QA: PASS - Codex QA Iteration 2
Spec Package: APPROVED
Human Spec Approval: APPROVED
Human Final Gate: APPROVED
Feature Type: Authentication endpoint rate limiting implementation feature
Protected Endpoints: POST /auth/login, POST /auth/register, POST /auth/refresh and equivalent aliases
Redis Authority: transient counters only
PostgreSQL Authority: durable auth/security source of truth
Permanent Account Lockout: PROHIBITED
Approved Redis Failure Semantics: fail closed for login/register/refresh
Approved Limit Policy: proposed numeric baselines in FEAT-010A spec.md
Retry-After: required when deterministic
Durable Audit For Throttled Requests: NOT ADDED in FEAT-010A
FEAT-010 Dependency: SATISFIED - FEAT-010 completed QA PASS and Human Final Gate approval
```

FEAT-010A Artifacts:

- `.specify/specs/FEAT-010A/requirement.md`
- `.specify/specs/FEAT-010A/spec.md`
- `.specify/specs/FEAT-010A/plan.md`
- `.specify/specs/FEAT-010A/tasks.md`
- `.specify/specs/FEAT-010A/acceptance.md`

Governance Ownership Rule:

- Codex owns QA governance, progress tracking, feature lifecycle state, and Human Final Gate readiness state.
- Antigravity owns implementation completion and rework evidence.
- Antigravity does not own QA iteration lifecycle state.
- QA advancing from one iteration to the next must not by itself make the progress tracker stale.
- Human owns Final Gate approval.

Rate Limiting Governance Decision:

- Authentication endpoint rate limiting remains required during Phase 2.
- Human selected Option A: dedicated **FEAT-010A - Authentication Endpoint Rate Limiting & Progressive Protection** before FEAT-010 final validation.
- FEAT-004 excludes rate limiting by approved scope.
- FEAT-010 remains a security integration gate and must not introduce new implementation behavior.
- FEAT-010A has Codex QA PASS and Human Final Gate approval; FEAT-010 completed QA PASS and Human Final Gate approval.
- FEAT-010A approved decisions: fail-closed Redis outage behavior; proposed numeric limits/windows; Retry-After when deterministic; no new durable audit event for throttled requests.
- FEAT-010 Security Integration Gate PASS completed Phase 2 Identity & Security.
- ADV-001 remains non-blocking technical debt for future maintenance/hardening.

---

# Phase 3 - Data Foundation & Core Domain

## Goal

Establish production persistence and repository patterns.

## Scope

- PostgreSQL
- ORM/query strategy
- Migrations
- Repository layer
- Transaction pattern
- Redis integration
- Audit-log persistence
- Database constraints
- Development seed strategy

## Acceptance Criteria

- [x] No application dependency on `db.json`
- [x] Migrations are reproducible
- [x] Transactions verified
- [x] Redis health verified
- [x] Database constraints protect core integrity
- [x] Integration tests use isolated test database

Status:

```text
DONE
```

Planning:

```text
DONE
```

Implementation:

```text
DONE
```

Phase 3 Completion State:

- Phase 2 has Human Final Gate approval.
- Phase 3 Exit Gate: PASS.
- Phase 3 decomposition FEAT-011 through FEAT-018 is Human approved.
- FEAT-011 is DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-012 is DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-013 is DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-014 is DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-015 is DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-016 is DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-017 is DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-018 is DONE / QA PASS / Human Final Gate APPROVED.
- Phase 3 is DONE / QA PASS / Human Final Gate APPROVED.
- Phase 4 is IN_PROGRESS / PLANNING; implementation remains NOT_STARTED.
- FEAT-019 is APPROVED FOR IMPLEMENTATION; implementation remains NOT_STARTED.
- FEAT-020 through FEAT-030 remain BLOCKED by approved Phase 4 dependency order.

Feature Decomposition:

- FEAT-011: Persistence Boundary & Legacy Data Elimination - `DONE` (QA PASS; Human Final Gate APPROVED)
- FEAT-012: Migration Reproducibility & Schema Governance - `DONE` (QA PASS; Human Final Gate APPROVED)
- FEAT-013: Shared Repository & Transaction Pattern - `DONE` (QA PASS; Human Final Gate APPROVED)
- FEAT-014: Core Domain Constraint Baseline - `DONE` (QA PASS; Human Final Gate APPROVED)
- FEAT-015: Redis Health & Transient State Boundary - `DONE` (QA PASS; Human Final Gate APPROVED)
- FEAT-016: Product Audit Abstraction & Governance - `DONE` (QA PASS; Human Final Gate APPROVED)
- FEAT-017: Development Seed & Test Data Strategy - `DONE` (QA PASS; Human Final Gate APPROVED)
- FEAT-018: Phase 3 Data Foundation Integration Gate - `DONE` (QA PASS; Human Final Gate APPROVED)

FEAT-011 Governance Fields:

```text
Lifecycle State: DONE
Implementation: COMPLETE
Latest QA: PASS - Codex QA Iteration 2
Technical/Security Validation: PASS
Standard Validation: PASS - 41 files / 304 tests
DB Validation: PASS - 8 files / 40 tests
Redis Validation: PASS - 4 files / 40 tests
Persistence Guard: PASS - 1 file / 14 tests
Blocking Issues: NONE
Human Final Gate: APPROVED
FEAT-012: DONE - QA PASS; Human Final Gate APPROVED
FEAT-013: DONE - QA PASS; Human Final Gate APPROVED
FEAT-014: DONE - QA PASS; Human Final Gate APPROVED
FEAT-015: DONE - QA PASS; Human Final Gate APPROVED
FEAT-016: DONE - QA PASS; Human Final Gate APPROVED
```

FEAT-012 Governance Fields:

```text
Lifecycle State: DONE
Planning Status: HUMAN APPROVED
Implementation: COMPLETE
Spec Package: HUMAN APPROVED
Feature Type: Migration reproducibility and schema governance implementation feature
Product-Domain Schema: PROHIBITED (0 product tables added)
Fresh DB Validation: PASS - aura_capital_test_feat012_fresh (3 migrations applied)
Existing-Schema Upgrade: PASS - aura_capital_test_feat012_upgrade (Representative Phase 2 rows preserved)
Applied Migration Integrity: PASS - live PostgreSQL _prisma_migrations checksum & drift detection verified
Standard Validation: PASS - 43 files / 347 tests
DB Validation: PASS - 9 files / 47 tests
Redis Validation: PASS - 4 files / 40 tests
Persistence Guard: PASS - 1 file / 14 tests
Migration Guard: PASS - CLI target guard + 29 unit tests
Defects: DEF-001..DEF-005 RESOLVED (Rework Iteration 1)
Latest QA: PASS - Codex QA Iteration 2
Human Final Gate: APPROVED
FEAT-013: DONE - QA PASS; Human Final Gate APPROVED
FEAT-014: DONE - QA PASS; Human Final Gate APPROVED
FEAT-015: DONE - QA PASS; Human Final Gate APPROVED
FEAT-016: DONE - QA PASS; Human Final Gate APPROVED
FEAT-017: DONE - QA PASS; Human Final Gate APPROVED
FEAT-018: DONE - QA PASS; Human Final Gate APPROVED
```

FEAT-013 Governance Fields:

```text
Lifecycle State: DONE
Planning Status: HUMAN APPROVED
Implementation: COMPLETE
Spec Package: HUMAN APPROVED
Feature Type: Shared repository and transaction pattern implementation feature
Product-Domain Schema: PROHIBITED (0 product tables added)
Public Product APIs: PROHIBITED (0 product APIs added)
Repository Factory: COMPLETE (PrismaClient & Prisma.TransactionClient support)
Transaction Runner / UnitOfWork: COMPLETE (AsyncLocalStorage, root run, commit, rollback, error propagation)
Locked Nested Transaction Policy: ENFORCED (fail-fast NestedTransactionError on accidental nested run)
Database Error Mapper: COMPLETE (safe AppErrors, masking secrets/URLs, generic "Database operation failed")
Diagnostics Sanitizer: ENFORCED (zero host/port/db/credential/path leaks across setup and test guards)
Static Boundary Guard: PASS (controllers=6, services=10, repositories=5; 21 unit tests)
Standard Validation: PASS - 45 files / 381 tests
DB Validation: PASS - 10 files / 54 tests (aura_capital_test_feat013_qa4)
Redis Validation: PASS - 4 files / 40 tests
Persistence Guard: PASS - 1 file / 14 tests
Migration Guard: PASS - 3 migrations / 29 unit tests
Latest QA: PASS - Codex QA Iteration 4
QA History: QA Iteration 1 FAIL; QA Iteration 2 FAIL; QA Iteration 3 FAIL; QA Iteration 4 PASS
Blocking Issues: NONE
Human Final Gate: APPROVED
FEAT-014: DONE - QA PASS; Human Final Gate APPROVED
FEAT-015: DONE - QA PASS; Human Final Gate APPROVED
FEAT-016: DONE - QA PASS; Human Final Gate APPROVED
FEAT-017: DONE - QA PASS; Human Final Gate APPROVED
FEAT-018: DONE - QA PASS; Human Final Gate APPROVED
```

FEAT-014 Governance Fields:

```text
Lifecycle State: DONE
Planning Status: HUMAN APPROVED
Implementation: COMPLETE
Spec Package: APPROVED FOR IMPLEMENTATION
Feature Type: Core domain constraint baseline implementation feature
Product-Domain Schema: PROHIBITED (no Academy, Simulation, Community, Subscription, AI, or placeholder product tables)
Constraint Standards: COMPLETE - `docs/data-constraint-standards.md`
Application Validation As DB Replacement: PROHIBITED
Global Soft Delete: PROHIBITED - deferred to later domain-specific decisions
Destructive Migration: PROHIBITED without explicit Human approval
Live PostgreSQL Constraint Verification: PASS - `aura_capital_test_feat014`, 1 file / 12 FEAT-014 DB tests
Migration Compatibility: PASS - 3 migrations deploy/status clean, no production schema migration added
Standard Validation: PASS - 46 files / 385 tests
DB Validation: PASS - 11 files / 66 tests
Redis Validation: PASS - 4 files / 40 tests
Persistence Guard: PASS - 1 file / 14 tests
Migration Guard: PASS - 3 migrations, 0 blocking risks
Repository Boundary Guard: PASS - controllers=6, services=10, repositories=5
Implementation Report: `reports/implementation/phase-3/FEAT-014.md`
Latest QA: PASS - Codex QA Iteration 2
QA History: QA Iteration 1 FAIL; Governance Rework Iteration 1 COMPLETE; QA Iteration 2 PASS
Rework Status: COMPLETE - Governance Rework Iteration 1
Technical Validation: PASS - QA Iteration 1 independently verified
Blocking Issues: NONE
Human Final Gate: APPROVED
FEAT-015: DONE - QA PASS; Human Final Gate APPROVED
FEAT-016: DONE - QA PASS; Human Final Gate APPROVED
FEAT-017: DONE - QA PASS; Human Final Gate APPROVED
FEAT-018: DONE - QA PASS; Human Final Gate APPROVED
```

FEAT-015 Governance Fields:

```text
Lifecycle State: DONE
Planning Status: HUMAN APPROVED
Implementation: COMPLETE
Spec Package: HUMAN APPROVED
Feature Type: Redis health and transient state boundary implementation feature
Redis Authority: TRANSIENT ONLY (0 durable entities in Redis)
PostgreSQL Authority: DURABLE BUSINESS SOURCE OF TRUTH (users, credentials, sessions, roles, audit)
Redis Health Scope: INTERNAL READINESS / VALIDATION ONLY (bounded PING probe)
Public Redis Detail Exposure: PROHIBITED (0 Redis host/port/secrets exposed)
Liveness Decoupling: ENFORCED (GET /health does not depend on Redis)
Auth Rate-Limit Fail-Closed: PRESERVED (503 on outage with 0 DB mutations and 0 audit amplification)
Key Namespace & Safety: COMPLETE ({app}:{env}:{feature}:{version}:{scope}:{id} unified production format)
Test/CI Worker Isolation: COMPLETE (buildTestIsolatedRedisPrefix with runId/workerId scoping)
Diagnostic Sanitizer: EXTENDED (10 sentinel tests covering URLs, host:port, tokens, cookies, paths, DB names, dotted IPv4 keys)
Transient TTL Policy: COMPLETE (all transient keys enforce positive TTL)
Multi-Instance Coordination: COMPLETE (shared Redis state across independent clients)
Static Validation: PASS - clean, lint (0 errors), prisma validate, typecheck (3 workspaces), build (3 packages)
Standard Validation: PASS - 49 files / 429 tests
DB Validation: PASS - 10 files / 54 tests (aura_capital_test_feat015_qa3)
Redis Validation: PASS - 5 files / 50 tests
Persistence Guard: PASS - 1 file / 14 tests
Migration Guard: PASS - 3 migrations / 29 unit tests
Static Boundary Guard: PASS (controllers=6, services=10, repositories=5; 21 unit tests)
Latest QA: PASS - Codex QA Iteration 3
QA History: QA Iteration 1 FAIL; Rework Iteration 1 COMPLETE; QA Iteration 2 FAIL; Rework Iteration 2 COMPLETE; QA Iteration 3 PASS
Human Final Gate: APPROVED
Ready for QA: COMPLETED - Human Final Gate APPROVED
FEAT-016: DONE - QA PASS; Human Final Gate APPROVED
FEAT-017: DONE - QA PASS; Human Final Gate APPROVED
FEAT-018: DONE - QA PASS; Human Final Gate APPROVED
```

FEAT-016 Governance Fields:

```text
Lifecycle State: DONE
Planning Status: HUMAN APPROVED
Implementation: COMPLETE
Spec Package: HUMAN APPROVED
Feature Type: Product audit abstraction and governance implementation feature
Auth/Security Audit Boundary: PRESERVED (FEAT-009 untouched)
AuthSecurityAuditRecord Product Extension: PROHIBITED (0 product events added)
Product Audit Table/Schema: DEFERRED to future domain features (0 product tables added)
Product-Domain Schema: PROHIBITED in FEAT-016 (0 domain tables added)
Public Audit API/UI: PROHIBITED (0 audit APIs/UI added)
Durable Product Audit Authority: PostgreSQL future authority only
Redis Durable Audit Authority: PROHIBITED
Metadata Policy: flat, event-specific, allowlisted, sanitized, max 2 KiB baseline (DEF-001 resolved)
Transaction Strategy: mandatory single classification (DEF-002 resolved)
Scope Guard: PASS - guard:audit-governance (DEF-003 resolved)
Static Validation: PASS - clean, lint (0 errors), prisma validate, typecheck (3 workspaces), build (3 packages)
Standard Validation: PASS - 50 files / 451 tests
DB Validation: PASS - 10 files / 54 tests (aura_capital_test_feat016_qa3; 0 skips)
Redis Validation: PASS - 5 files / 50 tests (0 skips)
Persistence Guard: PASS - 1 file / 14 tests
Migration Guard: PASS - 3 migrations / 29 unit tests
Static Boundary Guard: PASS (controllers=6, services=10, repositories=5; 21 unit tests)
Audit Governance Guard: PASS (0 violations; all negative probes pass)
Latest QA: PASS - Codex QA Iteration 3
Rework: COMPLETE - Rework Iteration 2
QA History: QA Iteration 1 FAIL; Rework Iteration 1 COMPLETE; QA Iteration 2 FAIL; Rework Iteration 2 COMPLETE; QA Iteration 3 PASS
Blocking Issues: NONE
Human Final Gate: APPROVED
Ready for QA: COMPLETED - Human Final Gate APPROVED
FEAT-017: DONE - QA PASS; Human Final Gate APPROVED
FEAT-018: DONE - QA PASS; Human Final Gate APPROVED
```

FEAT-017 Governance Fields:

```text
Lifecycle State: DONE
Planning Status: HUMAN APPROVED
Implementation: COMPLETE
Spec Package: HUMAN APPROVED
Feature Type: Development and test seed strategy implementation feature
Allowed Seed Environments: local development, automated test, CI isolated test only
Prohibited Seed Environments: staging, production, production-like, unknown, ambiguous, conflicting
Default ADMIN Credentials: PROHIBITED
Public Role/Admin Assignment API: PROHIBITED
ADMIN Provisioning: server-controlled operational behavior only
Product-Domain Seed Data: PROHIBITED in FEAT-017
Durable Seed Authority: PostgreSQL only
Redis Durable Seed Authority: PROHIBITED
Seed Data In Migrations: PROHIBITED
Normal Registration Role Semantics: PRESERVED - zero roles by default
Seed Safety Guard: PASS - guard:seed-safety (0 violations; structured logger & env secret probes pass)
Static Validation: PASS - clean, lint (0 errors), prisma validate, typecheck (3 workspaces), build (3 packages)
Standard Validation: PASS - 480 tests passed across all workspaces
Unit Validation: PASS - 343 unit tests passed (30 API files / 321 tests, 1 Web file / 2 tests, 1 Shared file / 20 tests)
Live DB Validation: PASS - 11 files / 58 tests passed in PostgreSQL aura_capital_test_feat017_rework1 (0 skips)
Live Redis Validation: PASS - 5 files / 50 tests passed in Redis localhost:6379 (0 skips)
Persistence Guard: PASS - 1 file / 14 tests
Migration Guard: PASS - 3 migrations, 6 review risks, 0 blocking risks
Boundary Guard: PASS - controllers=6, services=10, repositories=5; 21 unit tests
Audit Governance Guard: PASS - 0 violations
Latest QA: PASS - Codex QA Iteration 4
Rework: COMPLETE - Rework Iteration 2
Governance Closure: COMPLETE
QA History: QA Iteration 1 FAIL; Rework Iteration 1 COMPLETE; QA Iteration 2 FAIL; Rework Iteration 2 COMPLETE; QA Iteration 3 FAIL; Governance Closure COMPLETE; QA Iteration 4 PASS
Blocking Issues: NONE
Human Final Gate: APPROVED
Ready for QA: COMPLETED - Human Final Gate APPROVED
FEAT-018: DONE - QA PASS; Human Final Gate APPROVED
Phase 3: DONE - QA PASS; Human Final Gate APPROVED
Phase 4: IN_PROGRESS / PLANNING; Implementation NOT_STARTED
```

FEAT-018 Governance Fields:

```text
Lifecycle State: DONE
Planning Status: HUMAN APPROVED
Implementation: COMPLETE
Spec Package: APPROVED FOR IMPLEMENTATION
Feature Type: Phase 3 validation / integration gate only
Product Functionality: PROHIBITED — zero product code introduced
Product-Domain Schema: PROHIBITED — zero schema changes
Fresh DB Strategy: aura_capital_test_feat018_rework2_fresh — zero-state deploy PASS (3 migrations)
Upgrade DB Strategy: aura_capital_test_feat018_rework2_upgrade — existing-schema no-op compatibility PASS (representative rows and constraints preserved)
Redis Strategy: live Redis localhost:6379 with isolated run/worker namespace
Mandatory Guards: guard:persistence, guard:migration, guard:boundary, guard:audit-governance, guard:seed-safety — ALL PASS
Static Validation: PASS — clean, lint (0 errors), prisma validate, typecheck (3 workspaces), build (3 packages)
Standard Validation: PASS — 52 files / 480 tests (0 skips)
Unit Validation: PASS — 32 files / 343 tests (0 skips)
Live DB Validation: PASS — 11 files / 58 tests in aura_capital_test_feat018_rework2_fresh (0 skips)
Live Redis Validation: PASS — 5 files / 50 tests in Redis localhost:6379 (0 skips)
Persistence Guard: PASS — 14 tests, zero violations
Migration Guard: PASS — 3 migrations, 3 digests, 6 review risks, 0 blockers
Boundary Guard: PASS — controllers=6, services=10, repositories=5
Audit Governance Guard: PASS — zero premature product audit
Seed Safety Guard: PASS — zero unsafe seed scripts or default admin backdoors
Conditional PASS Policy: HUMAN APPROVED; prohibited for security boundary, migration integrity, DB integrity, transaction behavior, Redis authority/fail-closed behavior, seed safety, authentication/RBAC regression, or mandatory validation not executed
QA History: QA Iteration 1 FAIL; Rework Iteration 1 COMPLETE; QA Iteration 2 FAIL; Rework Iteration 2 COMPLETE; QA Iteration 3 FAIL; Governance Closure COMPLETE; QA Iteration 4 PASS
Latest QA: PASS - Codex QA Iteration 4
Rework Status: COMPLETE - Governance Closure after QA Iteration 3 (DEF-004 only)
Defects: DEF-001 FIXED; DEF-002 FIXED; DEF-003 FIXED; DEF-004 FIXED after governance cleanup
Technical Debt: ADV-001 (Phase 2 Express clearCookie deprecation), ADV-002 (P3 / advisory: Prisma version upgrade deferred — non-blocking)
Blocking Issues: NONE
Ready for QA: COMPLETED - Human Final Gate APPROVED
Human Final Gate: APPROVED
Phase 3: DONE - QA PASS; Human Final Gate APPROVED
Phase 4: IN_PROGRESS / PLANNING; Implementation NOT_STARTED
```

Human Approved Phase 3 Decisions:

- FEAT-014 defines reusable PostgreSQL constraint standards only; no Academy, Simulation, Community, Subscription, or AI domain tables.
- FEAT-016 preserves FEAT-009 auth audit semantics and defines product-audit abstraction/governance only; concrete product audit tables are deferred.
- FEAT-015 Redis health is internal readiness/validation only; public health responses must not expose sensitive Redis details.
- FEAT-017 may allow dev/test seed users, but no default ADMIN credentials, no production/staging seed execution, and admin provisioning remains server-controlled.
- No global Phase 3 soft-delete convention; decide soft delete per later domain feature.

Artifacts:

- `docs/phase-3-feature-decomposition.md`
- `.specify/specs/FEAT-011/`
- `.specify/specs/FEAT-012/`
- `.specify/specs/FEAT-013/`
- `.specify/specs/FEAT-014/`
- `.specify/specs/FEAT-015/`
- `.specify/specs/FEAT-016/`
- `.specify/specs/FEAT-017/`
- `.specify/specs/FEAT-018/`
- `docs/data-constraint-standards.md`
- `reports/implementation/phase-3/FEAT-014.md`
- `reports/implementation/phase-3/FEAT-015.md`
- `reports/implementation/phase-3/FEAT-016.md`
- `reports/implementation/phase-3/FEAT-017.md`
- `reports/implementation/phase-3/FEAT-018.md`
- `reports/qa/phase-3/FEAT-015-QA.md`
- `reports/qa/phase-3/FEAT-016-QA.md`
- `reports/qa/phase-3/FEAT-017-QA.md`
- `reports/qa/phase-3/FEAT-018-QA.md`

---

# Phase 4 - Academy

## Goal

Rebuild education features on the new architecture.

## Scope

- Courses
- Lessons
- Flashcards
- Quizzes
- Quiz attempts
- XP/progression
- Idempotent rewards

## Acceptance Criteria

- [ ] Correct answers are not exposed before submission
- [ ] Server validates submitted answers
- [ ] XP is not duplicated by repeat submission
- [ ] Progress is persisted per user
- [ ] Academy APIs are authenticated as required
- [ ] Unit/integration tests pass

Status:

```text
IN_PROGRESS
```

Planning:

```text
IN_PROGRESS
```

Implementation:

```text
IN_PROGRESS
```

Phase 4 Planning & Implementation State:

```text
Phase 3: DONE / QA PASS / Human Final Gate APPROVED
Phase 4: IN_PROGRESS
Implementation: IN_PROGRESS
FEAT-019: DONE (QA PASS — Emergency QA Ownership Transfer, Human Dual Review APPROVED, Human Final Gate APPROVED)
FEAT-020: UNBLOCKED FOR PLANNING (Implementation: NOT_STARTED)
FEAT-021: BLOCKED by FEAT-020
FEAT-022: BLOCKED by FEAT-019 / FEAT-020
FEAT-023: BLOCKED by FEAT-019 / FEAT-020
FEAT-024: BLOCKED by FEAT-023
FEAT-025: BLOCKED by FEAT-024
FEAT-026: BLOCKED by FEAT-020 / FEAT-024 / FEAT-025
FEAT-027: BLOCKED by FEAT-025 / FEAT-026
FEAT-028: BLOCKED by FEAT-020 through FEAT-027
FEAT-029: BLOCKED by FEAT-025 / FEAT-027 and Human product-audit decision
FEAT-030: BLOCKED by FEAT-019 through FEAT-029 as applicable
Phase 5: BLOCKED
```

Feature Decomposition:

- FEAT-019: Academy Domain Schema & Persistence Foundation - `DONE` (QA PASS — Emergency QA Ownership Transfer, Human Dual Review APPROVED, Human Final Gate APPROVED)
- FEAT-020: Course & Lesson Read Model APIs - `UNBLOCKED FOR PLANNING` (Implementation: `NOT_STARTED`)
- FEAT-021: Academy Learner Course/Lesson UI - `BLOCKED`
- FEAT-022: Flashcards Domain & Review Flow - `BLOCKED`
- FEAT-023: Quiz Definition & Safe Projection - `BLOCKED`
- FEAT-024: Quiz Attempt Lifecycle - `BLOCKED`
- FEAT-025: Server-Side Quiz Evaluation & Secure Submission - `BLOCKED`
- FEAT-026: Academy Progression & Completion Tracking - `BLOCKED`
- FEAT-027: XP & Idempotent Reward Ledger - `BLOCKED`
- FEAT-028: Academy Authorization & Ownership Hardening - `BLOCKED`
- FEAT-029: Academy Product Audit Decision & Integration - `BLOCKED`
- FEAT-030: Phase 4 Academy Integration Gate - `BLOCKED`

FEAT-019 Governance Fields:

```text
Lifecycle State: DONE
Planning Status: HUMAN APPROVED
Implementation: COMPLETE
QA Iteration 1: FAIL (DEF-001 through DEF-006 identified by Codex QA)
Rework Iteration 1: COMPLETE (DEF-001 through DEF-006 resolved and verified)
QA Iteration 2: FAIL (DEF-007 through DEF-011 identified by Codex QA)
Rework Iteration 2: COMPLETE (DEF-007 through DEF-011 resolved and verified)
QA Iteration 3: Emergency QA Execution — Antigravity (Evidence Status: NO BLOCKER OBSERVED)
Human Dual Review: APPROVED
Latest QA: QA PASS — Emergency QA Ownership Transfer (Human Dual Review APPROVED)
Human Final Gate: APPROVED
Spec Package: HUMAN APPROVED
Feature Type: Academy domain schema & persistence foundation implementation feature
Scope Boundaries: Zero learner APIs, zero UI, zero quiz evaluation, zero progress mutation, zero XP reward granting, zero durable Redis keys
Domain Models: 12 canonical models (AcademyCourse, AcademyLesson, AcademyFlashcard, AcademyQuiz, AcademyQuizQuestion, AcademyQuizOption, AcademyQuizAttempt, AcademyQuizAnswer, AcademyUserCourseProgress, AcademyUserLessonProgress, AcademyUserXp, AcademyRewardLedger)
Migration: 20260903000000_feat019_academy_foundation (Forward-only, non-destructive, zero seed data)
Uniqueness & Indexes: Course slug, lesson composite, ordering scopes, partial unique index, reward idempotency, progress facts, composite attempt/question unique keys for same-quiz integrity
Constraints & Triggers: Total XP non-negative (CHECK total_xp >= 0), exactly 1 correct option per single-choice question (deferred constraint triggers trg_academy_quiz_options_exactly_one_correct / trg_academy_quiz_questions_has_correct_option + partial unique index), closed-set CHECK constraints across all 10 domain status/type columns, progress completedAt CHECK constraints, same-quiz composite foreign keys (attempt_id, quiz_id), (question_id, quiz_id), (selected_option_id, question_id)
Delete Policy: RESTRICT / NO ACTION on parent entities and User learning history
Repositories: IAcademyCourseRepository, IAcademyQuizRepository, IAcademyProgressRepository, IAcademyRewardRepository (with atomic createQuestionWithOptions UoW)
Unit of Work: Dual container binding (root PrismaClient & Prisma.TransactionClient with PrismaTransactionRunner)
Fresh DB Validation: PASS - aura_capital_test_feat019_rework2_fresh (4 migrations applied cleanly)
Upgrade DB Validation: PASS - aura_capital_test_feat019_rework2_upgrade (100% Phase 2/3 rows preserved, 131 new constraints/triggers, 47 new indexes)
Static Validation: PASS - clean, lint (0 errors), prisma validate, typecheck (3 workspaces), build (3 packages)
Standard Validation: PASS - 53 files / 487 tests (0 skips)
Unit Validation: PASS - 33 files / 350 tests (0 skips)
Live DB Validation: PASS - 12 files / 89 tests in PostgreSQL aura_capital_test_feat019_rework2_fresh (0 skips)
Live Redis Validation: PASS - 5 files / 50 tests in Redis localhost:6379 (0 skips)
Persistence Guard: PASS - 14 tests, zero violations
Migration Guard: PASS - 4 migrations, 0 blocking risks
Static Boundary Guard: PASS - controllers=6, services=10, repositories=6
Audit Governance Guard: PASS - zero premature product audit schemas/APIs
Seed Safety Guard: PASS - zero unsafe seed scripts, credentials, or default admin backdoors
Blocking Issues: NONE
FEAT-020: UNBLOCKED FOR PLANNING (Implementation: NOT_STARTED)
FEAT-021 through FEAT-030: BLOCKED
```

Artifacts:

- `docs/phase-4-feature-decomposition.md`
- `.specify/specs/FEAT-019/`
- `reports/implementation/phase-4/FEAT-019.md`
- `reports/qa/phase-4/FEAT-019-QA.md`
- `reports/qa/phase-4/FEAT-019-QA3-TEMP-EVIDENCE.md`

---

# Phase 5 - Simulation Engine

## Goal

Build a server-authoritative individual financial simulation.

## Scope

- SimulationSession
- Assets
- Market engine
- Phase engine
- Orders
- Trades
- Positions
- Portfolio
- Settlement
- Market snapshots
- Event history
- Leaderboard strategy

## Architecture Rules

```text
Server owns clock.
Server owns price.
Server owns phase.
Server owns balance.
Client submits intent.
```

## Acceptance Criteria

- [ ] User sessions are isolated
- [ ] GET does not mutate market state
- [ ] Client cannot manipulate phase using time input
- [ ] Client cannot manipulate price/balance
- [ ] Insufficient balance is rejected
- [ ] Overselling is rejected
- [ ] Invalid order types are rejected
- [ ] Concurrent trade behavior is safe
- [ ] Settlement is deterministic/testable
- [ ] Simulation integration tests pass

Status:

```text
TODO
```

---

# Phase 6 - Community

## Goal

Rebuild multi-user community behavior correctly.

## Scope

- Posts
- Comments
- Likes
- Moderation baseline

## Acceptance Criteria

- [ ] Likes are per user
- [ ] Duplicate likes are prevented
- [ ] Unlike only affects current user
- [ ] Authorization is enforced
- [ ] Community state is correctly persisted

Status:

```text
TODO
```

---

# Phase 7 - Subscription / Premium

## Goal

Implement entitlement-based premium access.

## Scope

- Subscription entity
- Plans
- Status
- Entitlement checks
- Provider abstraction
- Mock provider only if clearly isolated for development

## Acceptance Criteria

- [ ] User cannot self-upgrade through an unverified endpoint
- [ ] Premium feature checks use entitlement
- [ ] Subscription transitions are auditable
- [ ] Duplicate provider events are idempotent

Status:

```text
TODO
```

---

# Phase 8 - Aura Intelligence

## Goal

Transform Aura Intelligence from generic chat into a context-aware learning assistant.

## Scope

- AI gateway
- Gemini provider
- Prompt versioning
- Intent classification
- Context resolver
- Portfolio context
- Simulation context
- Academy context
- RAG
- Structured output
- Guardrails
- Quotas
- Rate limiting
- AI observability

## Acceptance Criteria

- [ ] AI endpoint requires authentication
- [ ] Per-user rate limit works
- [ ] Daily quota works
- [ ] Provider timeout is handled
- [ ] Provider error is handled
- [ ] Output schema is validated
- [ ] Simulation context is clearly identified as simulated
- [ ] AI answers can reference current user context
- [ ] Prompt/model usage is observable

Status:

```text
TODO
```

---

# Phase 9 - UI Integration & Product Polish

## Goal

Integrate all production-backed domains into the final product experience.

## Scope

- Dashboard
- Academy flows
- Simulation UI
- Portfolio UI
- Community UI
- Profile
- Admin
- AI assistant
- Responsive behavior
- Accessibility
- Loading/error/empty states

## Acceptance Criteria

- [ ] Critical flows work on desktop
- [ ] Critical flows work on mobile
- [ ] Async states are complete
- [ ] Accessibility baseline passes
- [ ] Simulation data cannot be mistaken for live market data
- [ ] UI does not rely on hidden controls as authorization

Status:

```text
TODO
```

---

# Phase 10 - Production Hardening

## Goal

Prepare the system for controlled production deployment.

## Scope

- OpenTelemetry
- Metrics
- Traces
- Structured logs
- Audit review
- Security review
- Dependency scanning
- Performance testing
- E2E suite
- Backup/recovery plan
- Deployment pipeline
- Operational runbook

## Acceptance Criteria

- [ ] No unresolved P0
- [ ] Critical P1 issues resolved or explicitly accepted
- [ ] CI/CD green
- [ ] E2E critical journeys pass
- [ ] Observability works in deployment environment
- [ ] Security checklist passes
- [ ] Database backup/restore is tested
- [ ] Rollback procedure documented

Status:

```text
TODO
```

---

# QA Task Template

```md
## TASK-ID - Task Name

Status: IN_REVIEW

### Goal
...

### Acceptance Criteria
- [ ] ...

### Changes
- ...

### Files Changed
- `...`

### Tests
- [ ] Unit
- [ ] Integration
- [ ] E2E

### Validation
- lint:
- typecheck:
- test:
- build:

### Risks / Known Limitations
...

### QA Decision
PENDING
```

# Progression Rule

Do not begin the next phase until the current phase receives:

```text
PASS
```

A `CONDITIONAL PASS` allows progression only when explicitly approved by QA with tracked follow-up items.
