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
- HISTORICAL SNAPSHOT (at Phase 3 completion): Phase 4 was IN_PROGRESS / PLANNING; FEAT-019 was APPROVED FOR IMPLEMENTATION; FEAT-020 through FEAT-030 remained BLOCKED.
- CURRENT CANONICAL STATE: Phase 4 is DONE / QA PASS / Human Phase Final Gate APPROVED; FEAT-019 through FEAT-030 retain their approved Phase 4 states; Phase 5 is DONE / QA PASS / Human Phase Final Gate APPROVED; FEAT-031 through FEAT-040 are DONE / QA PASS; Phase Checkpoint: phase-5-approved PUBLISHED; Phase 6 planning is HUMAN MASTER PLANNING APPROVED; Phase 6 implementation is IN_PROGRESS / BLOCKED BY FEAT-047 QA; FEAT-041 is DONE / QA PASS / Human Final Gate APPROVED (Checkpoint: feat-041-approved PUBLISHED); FEAT-042 is DONE / INTERNAL FEATURE GATE PASS (Checkpoint: feat-042-approved PUBLISHED); FEAT-043 is DONE / INTERNAL FEATURE GATE PASS (Checkpoint: feat-043-approved PUBLISHED); FEAT-044 is DONE / INTERNAL FEATURE GATE PASS (Checkpoint: feat-044-approved PUBLISHED); FEAT-045 is DONE / INTERNAL FEATURE GATE PASS (Checkpoint: feat-045-approved PUBLISHED); FEAT-046 is DONE / INTERNAL FEATURE GATE PASS (Checkpoint: feat-046-approved PUBLISHED); FEAT-047 is QA FAIL - Iteration 1; Human Phase Final Gate is NOT READY; Phase 7 remains BLOCKED.

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
Phase 4: IN_PROGRESS (HISTORICAL SNAPSHOT at Phase 3 completion: PLANNING / Implementation NOT_STARTED)
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
Phase 4: IN_PROGRESS (HISTORICAL SNAPSHOT at Phase 3 completion: PLANNING / Implementation NOT_STARTED)
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

- [x] Correct answers are not exposed before submission
- [x] Server validates submitted answers
- [x] XP is not duplicated by repeat submission
- [x] Progress is persisted per user
- [x] Academy APIs are authenticated as required
- [x] Unit/integration tests pass

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
COMPLETE
```

QA:

```text
PASS
```

Human Phase Final Gate:

```text
APPROVED
```

Phase 4 Planning & Implementation State:

```text
Phase 3: DONE / QA PASS / Human Final Gate APPROVED
Phase 4: DONE / QA PASS / Human Phase Final Gate APPROVED
Implementation: COMPLETE
Phase 4 QA: PASS
Human Phase Final Gate: APPROVED
FEAT-019: DONE (QA PASS — Emergency QA Ownership Transfer, Human Dual Review APPROVED, Human Final Gate APPROVED)
FEAT-020: DONE (QA PASS — Antigravity QA with Human Dual Review, Human Final Gate APPROVED)
FEAT-021: DONE (QA PASS — QA Iteration 2, Human Final Gate APPROVED)
FEAT-022: DONE (QA PASS — QA Iteration 2, Human Final Gate APPROVED)
FEAT-023: DONE (QA PASS, Human Final Gate APPROVED)
FEAT-024: DONE (QA PASS — QA Iteration 1, Human Final Gate APPROVED)
FEAT-025: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS)
FEAT-026: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS)
FEAT-027: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS)
FEAT-028: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS)
FEAT-029: IMPLEMENTATION COMPLETE / DEFER CLOSURE VERIFIED
FEAT-030: DONE / QA PASS
HISTORICAL SNAPSHOT (at Phase 4 completion): Phase 5 was MASTER PLANNING APPROVED; Phase 5 Implementation was NOT_STARTED
CURRENT CANONICAL STATE: Phase 5 is DONE / QA PASS / Human Phase Final Gate APPROVED; FEAT-031 through FEAT-040 are DONE / QA PASS; Phase Checkpoint: phase-5-approved PUBLISHED; Phase 6 planning is HUMAN MASTER PLANNING APPROVED; Phase 6 implementation is IN_PROGRESS / BLOCKED BY FEAT-047 QA; FEAT-041 is DONE / QA PASS / Human Final Gate APPROVED (Checkpoint: feat-041-approved PUBLISHED); FEAT-042 is DONE / INTERNAL FEATURE GATE PASS (Checkpoint: feat-042-approved PUBLISHED); FEAT-043 is DONE / INTERNAL FEATURE GATE PASS (Checkpoint: feat-043-approved PUBLISHED); FEAT-044 is DONE / INTERNAL FEATURE GATE PASS (Checkpoint: feat-044-approved PUBLISHED); FEAT-045 is DONE / INTERNAL FEATURE GATE PASS (Checkpoint: feat-045-approved PUBLISHED); FEAT-046 is DONE / INTERNAL FEATURE GATE PASS (Checkpoint: feat-046-approved PUBLISHED); FEAT-047 is QA FAIL - Iteration 1; Human Phase Final Gate is NOT READY; Phase 7 remains BLOCKED
```

Feature Decomposition:

- FEAT-019: Academy Domain Schema & Persistence Foundation - `DONE` (QA PASS — Emergency QA Ownership Transfer, Human Dual Review APPROVED, Human Final Gate APPROVED)
- FEAT-020: Course & Lesson Read Model APIs - `DONE` (QA PASS — Antigravity QA with Human Dual Review, Human Final Gate APPROVED)
- FEAT-021: Academy Learner Course/Lesson UI - `DONE` (QA PASS — QA Iteration 2, Human Final Gate APPROVED)
- FEAT-022: Flashcards Domain & Review Flow - `DONE` (QA PASS — QA Iteration 2, Human Final Gate APPROVED)
- FEAT-023: Quiz Definition & Safe Projection - `DONE` (QA PASS, Human Final Gate APPROVED)
- FEAT-024: Quiz Attempt Lifecycle - `DONE` (QA PASS — QA Iteration 1, Human Final Gate APPROVED)
- FEAT-025: Server-Side Quiz Evaluation & Secure Submission - `DONE` (Implementation: COMPLETE, Internal Feature Gate: PASS)
- FEAT-026: Academy Progression & Completion Tracking - `DONE` (Implementation: COMPLETE, Internal Feature Gate: PASS)
- FEAT-027: XP & Idempotent Reward Ledger - `DONE` (Implementation: COMPLETE, Internal Feature Gate: PASS)
- FEAT-028: Academy Authorization & Ownership Hardening - `DONE` (Implementation: COMPLETE, Internal Feature Gate: PASS)
- FEAT-029: Academy Product Audit Decision & Integration - `IMPLEMENTATION COMPLETE / DEFER CLOSURE VERIFIED`
- FEAT-030: Phase 4 Academy Integration Gate - `DONE / QA PASS`

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
FEAT-020: DONE (Human Final Gate APPROVED)
HISTORICAL SNAPSHOT (after FEAT-020 approval): FEAT-021 was UNBLOCKED FOR PLANNING (Implementation: NOT_STARTED); FEAT-022 through FEAT-030 were BLOCKED.
```

FEAT-020 Governance Fields:

```text
Lifecycle State: DONE
Implementation: COMPLETE
Planning Status: HUMAN APPROVED
Human Planning Approval: APPROVED
QA Status: PASS — Antigravity QA with Human Dual Review
Human Dual Review: APPROVED
Human Final Gate: APPROVED
QA Independence Note: Antigravity was both implementation owner and QA executor; Human Dual Review applied as compensating governance control.
Planning Owner: Antigravity — Temporary Planning Ownership Transfer
Implementation Owner: Antigravity
QA Executor: Antigravity (QA Iteration 1)
Spec Package: HUMAN APPROVED (.specify/specs/FEAT-020/)
Human Planning Decision (Auth): APPROVED (Courses & Course Detail = PUBLIC; Lesson Detail = AUTHENTICATED)
Feature Type: Course and lesson read model API implementation feature
Scope Boundaries: Read-only course and lesson APIs; zero UI; zero flashcard review; zero quiz projection; zero progress mutation; zero XP/rewards; zero schema changes; zero Redis authority/cache
Endpoints Implemented:
  - GET /api/academy/courses (Public, paginated, PUBLISHED only)
  - GET /api/academy/courses/:slug (Public, course outline with PUBLISHED lesson summaries)
  - GET /api/academy/courses/:courseSlug/lessons/:lessonSlug (Authenticated, PUBLISHED only, cross-course ownership check)
DTOs & Projections: Whitelist-only safe learner DTOs; zero internal metadata or raw Prisma leaks
Layering: Controller -> Service -> Repository -> PostgreSQL (Boundary Guard compliant)
Audit Policy: Zero product audit records for ordinary read traffic
Redis Policy: ZERO Redis usage / state
Tasks: 7 implementation tasks completed in dependency order
Acceptance Criteria: 16 deterministic criteria (AC-001..AC-016) mapped and passing
Validation:
  - Clean, lint (0 errors/warnings), prisma validate, typecheck, build PASS
  - Standard test suite: PASS (56 test files, 519 tests, 0 skips)
  - Unit test suite: PASS (35 test files, 373 tests, 0 skips)
  - Live PostgreSQL DB test suite: PASS (13 test files, 113 tests, 0 skips)
  - Redis test suite: PASS (5 test files, 50 tests, 0 skips)
  - Persistence Guard: PASS (14 tests)
  - Migration Guard: PASS (4 migrations, 0 blocking risks)
  - Static Boundary Guard: PASS (controllers=7, services=11, repositories=6)
  - Product Audit Governance Guard: PASS
  - Seed Safety Guard: PASS
Next Action: FEAT-021 implemented and ready for independent QA
```

FEAT-021 Governance Fields:

```text
Lifecycle State: DONE
Implementation: COMPLETED
Implementation Owner: Antigravity
QA Status: PASS — QA Iteration 2
Human Final Gate: APPROVED
Planning Status: APPROVED
Planning Owner: Antigravity — Temporary Planning Ownership Transfer
Human Planning Approval: APPROVED
Feature Type: Learner-facing Web UI implementation
Scope Boundaries: Course catalog, course detail, and lesson detail UI in apps/web consuming FEAT-020 APIs; zero UI for quizzes/flashcards/progress/XP; zero backend changes; zero schema changes
Spec Package: .specify/specs/FEAT-021/
Tasks: 12 implementation tasks completed
Acceptance Criteria: 17 deterministic criteria (AC-001..AC-017) PASS
Defects:
  - DEF-021-01 (P1 Open Redirect Security Defect): FIXED / VERIFIED
  - DEF-021-02 (P2 Accessibility Heading Hierarchy Defect): FIXED / VERIFIED
Evidence Gap:
  - GAP-021-01 (Client-Side Logout Query Cache Invalidation): OPEN / NON-BLOCKING
Validation (Latest QA Iteration 2):
  - Clean: PASS
  - Lint: PASS (0 errors, 0 warnings)
  - Prisma Schema Validation: PASS
  - Typecheck: PASS
  - Monorepo Build: PASS (Vite web bundle + API/shared tsc)
  - Monorepo Test: PASS (62 files, 602 tests)
  - Unit Test: PASS (41 files, 456 tests)
  - Database Test: PASS (13 files, 113 tests)
  - Redis Test: PASS (5 files, 50 tests)
  - Static Boundary Guard: PASS (controllers=7, services=11, repositories=6)
  - Migration Guard: PASS (4 migrations, 0 blocking risks)
  - Persistence Guard: PASS (14 tests)
  - Product Audit Governance Guard: PASS
  - Seed Safety Guard: PASS
Implementation Report: reports/implementation/phase-4/FEAT-021.md
QA Report: reports/qa/phase-4/FEAT-021-QA.md
Next Action: FEAT-022 in planning review (implementation NOT_STARTED)
```

FEAT-022 Governance Fields:

```text
Lifecycle State: DONE
Implementation: COMPLETE
Implementation Owner: Antigravity
QA Status: PASS (QA Iteration 2: DEF-022-01 & GOV-022-01 FIXED VERIFIED)
Human Final Gate: APPROVED
Planning Status: APPROVED
Planning Owner: Antigravity — Temporary Planning Ownership Transfer
Human Planning Approval: APPROVED
Human Product Decision: APPROVED (Transient Client-Side Review Session Only; Persistence DEFERRED)
Human Answer-Secrecy Decision: APPROVED (Option A — UI Reveal Only)
Feature Type: Backend API Read Model & Frontend Interactive Flashcard Review UI
Scope Boundaries: Lesson-attached flashcard read API and interactive frontend review container in apps/web; zero DB review persistence; zero spaced repetition; zero progress/XP mutation; zero Redis state; zero schema drift
Spec Package: .specify/specs/FEAT-022/
Tasks: 12 implementation tasks (T1..T12) completed; Rework Iteration 1 verified
Acceptance Criteria: 18 deterministic criteria (AC-001..AC-018) VERIFIED PASS
Validation:
  - Clean: PASS
  - Lint: PASS (0 errors, 0 warnings)
  - Prisma Schema Validation: PASS
  - Typecheck: PASS
  - Monorepo Build: PASS (Vite web bundle + API/shared tsc)
  - Monorepo Test: PASS (64 files, 623 tests)
  - Unit Test: PASS (43 files, 472 tests)
  - Database Test: PASS (14 files, 121 tests)
  - Redis Test: PASS (5 files, 50 tests)
  - Persistence Guard: PASS (14 tests)
  - Migration Guard: PASS (4 migrations, 0 blocking risks)
  - Static Boundary Guard: PASS (controllers=7, services=11, repositories=6)
  - Product Audit Governance Guard: PASS
  - Seed Safety Guard: PASS
Implementation Report: reports/implementation/phase-4/FEAT-022.md
QA Report: reports/qa/phase-4/FEAT-022-QA.md
Next Action: FEAT-022 complete. FEAT-023 APPROVED FOR IMPLEMENTATION (Implementation: NOT_STARTED).
```

FEAT-023 Status Fields:

```text
Lifecycle State: DONE
Planning Status: COMPLETE (HUMAN APPROVED)
Planning Owner: Antigravity — Temporary Planning Ownership Transfer
Human Planning Approval: APPROVED
Human Decisions:
  - Question Type: SINGLE_CHOICE ONLY — APPROVED
  - Primary Quiz Read Policy: Lowest-order PUBLISHED quiz — APPROVED
  - Identifier Strategy: Stable opaque UUIDs (quiz.id, question.id, option.id) — APPROVED
  - passingScore: Safe pre-submission quiz metadata — APPROVED
Implementation: COMPLETE
QA Status: PASS (QA Iteration 1)
Human Final Gate: APPROVED
Feature Type: Backend API Read Model & Safe Projection Contract
Scope Boundaries: Lesson-attached primary quiz definition endpoint; safe whitelist DTOs; zero correct-answer exposure; zero attempt creation; zero answer submission; zero scoring; zero progress/XP mutation; zero Redis state; zero schema drift
Spec Package: .specify/specs/FEAT-023/
Acceptance Criteria: 18 deterministic criteria (AC-001..AC-018) with CRITICAL HARD GATE on Pre-Submission Correct Answer Secrecy — ALL PASS
Tasks: 11 implementation tasks defined (T1..T11) — ALL COMPLETE
Implementation Report: reports/implementation/phase-4/FEAT-023.md
QA Report: reports/qa/phase-4/FEAT-023-QA.md
Next Action: FEAT-023 complete. FEAT-024 UNBLOCKED FOR PLANNING (Implementation: NOT_STARTED).
```

FEAT-024 Status Fields:

```text
Lifecycle State: DONE
Planning Status: COMPLETE (HUMAN APPROVED)
Planning Owner: Antigravity — Temporary Planning Ownership Transfer
Human Planning Approval: APPROVED
Human Decisions:
  - Active Attempt Policy: One active IN_PROGRESS attempt per (user, quiz) tuple — APPROVED BY HUMAN
  - Database Enforcement: PostgreSQL partial unique index UNIQUE (quiz_id, user_id) WHERE status = 'IN_PROGRESS' — APPROVED BY HUMAN
  - CREATED State Policy: Start creates IN_PROGRESS directly; CREATED schema-reserved and not active — APPROVED BY HUMAN
  - Repeated Start Behavior: Idempotent return-existing active attempt (200 OK existing vs 201 Created new) — APPROVED BY HUMAN
  - Concurrency Strategy: Layered defense (DB partial unique index + transaction advisory lock + P2002 race recovery) — APPROVED BY HUMAN
  - Draft Answer Persistence Scope: Included in FEAT-024 with zero evaluation/scoring — APPROVED BY HUMAN
  - Content Continuation & Historical Read: IN_PROGRESS unpublished rejected; SUBMITTED/GRADED owner safe read allowed — APPROVED BY HUMAN
  - Strict Start Request Body: Empty object {} strictly enforced (authoritative fields rejected with 400) — APPROVED BY HUMAN
  - Schema Migration Strategy: Minimal constraint-only migration (forward-only, preflight duplicate check) — APPROVED BY HUMAN
Implementation: COMPLETE (Rework Iteration 1)
QA Status: QA PASS (QA Iteration 1 + Report Closure)
QA Report: reports/qa/phase-4/FEAT-024-QA.md
Human Final Gate: APPROVED
Feature Type: Backend Domain Lifecycle, State Foundation & Constraint Migration
Scope Boundaries: Authenticated attempt start/read endpoints; active attempt invariant; draft answer persistence; minimal partial unique index migration; zero correctness leakage; zero scoring/grading; zero progress/XP/reward mutation; zero Redis authority
Spec Package: .specify/specs/FEAT-024/
Implementation Report: reports/implementation/phase-4/FEAT-024.md
Acceptance Criteria: 20 deterministic criteria (AC-001..AC-020) with CRITICAL HARD GATE on Pre-Submission Correct Answer Secrecy
Tasks: 11 implementation tasks completed (T1..T11)
Next Action: FEAT-024 DONE. FEAT-025 APPROVED FOR IMPLEMENTATION (Implementation: NOT_STARTED).
```

FEAT-025 Status Fields:

```text
Lifecycle State: DONE
Planning Status: COMPLETE (HUMAN APPROVED)
Planning Owner: Antigravity — Temporary Planning Ownership Transfer
Human Planning Approval: APPROVED
Human Decisions:
  - Lifecycle Transition: Two-stage transition IN_PROGRESS -> SUBMITTED -> GRADED inside ONE atomic transaction — APPROVED BY HUMAN
  - Repeated Submit: Idempotent return of existing graded result with 200 OK — APPROVED BY HUMAN
  - Unanswered Questions: Strict completion requirement rejecting submission with 400 UNANSWERED_QUESTIONS — APPROVED BY HUMAN
  - Score Rounding: Integer percentage Math.round((C / N) * 100) — APPROVED BY HUMAN
  - Zero-Question Quiz: Reject with 400 INVALID_QUIZ_STATE — APPROVED BY HUMAN
  - Result Visibility: Score, pass/fail, and per-question correctness; explanations deferred — APPROVED BY HUMAN
  - Result Endpoint: Dedicated GET .../result endpoint — APPROVED BY HUMAN
  - Retry Policy: Unlimited retry via new attempt once current is GRADED — APPROVED BY HUMAN
  - Evaluation Source: Current live quiz definition with atomic snapshot writing — APPROVED BY HUMAN
  - Schema Migration: Minimal additive check-constraint migration for score range and graded-state coherence — APPROVED BY HUMAN
  - Historical passingScore: Omitted from QuizResultDto (Option B); persisted passed boolean is sole authority — APPROVED BY HUMAN
Implementation: COMPLETE
Implementation Owner: DEV-A
QA Status: READY FOR QA
Feature-Level Human Final Gate: REMOVED for FEAT-025 under phase-owned workflow
Internal Feature Quality Gate: PASS
Planning Status: HUMAN APPROVED
Human Planning Approval: APPROVED
QA Status: PASS — Antigravity QA with Human Dual Review
Human Dual Review: APPROVED
Human Final Gate: APPROVED
QA Independence Note: Antigravity was both implementation owner and QA executor; Human Dual Review applied as compensating governance control.
Planning Owner: Antigravity — Temporary Planning Ownership Transfer
Implementation Owner: Antigravity
QA Executor: Antigravity (QA Iteration 1)
Spec Package: HUMAN APPROVED (.specify/specs/FEAT-020/)
Human Planning Decision (Auth): APPROVED (Courses & Course Detail = PUBLIC; Lesson Detail = AUTHENTICATED)
Feature Type: Course and lesson read model API implementation feature
Scope Boundaries: Read-only course and lesson APIs; zero UI; zero flashcard review; zero quiz projection; zero progress mutation; zero XP/rewards; zero schema changes; zero Redis authority/cache
Endpoints Implemented:
  - GET /api/academy/courses (Public, paginated, PUBLISHED only)
  - GET /api/academy/courses/:slug (Public, course outline with PUBLISHED lesson summaries)
  - GET /api/academy/courses/:courseSlug/lessons/:lessonSlug (Authenticated, PUBLISHED only, cross-course ownership check)
DTOs & Projections: Whitelist-only safe learner DTOs; zero internal metadata or raw Prisma leaks
Layering: Controller -> Service -> Repository -> PostgreSQL (Boundary Guard compliant)
Audit Policy: Zero product audit records for ordinary read traffic
Redis Policy: ZERO Redis usage / state
Tasks: 7 implementation tasks completed in dependency order
Acceptance Criteria: 16 deterministic criteria (AC-001..AC-016) mapped and passing
Validation:
  - Clean, lint (0 errors/warnings), prisma validate, typecheck, build PASS
  - Standard test suite: PASS (56 test files, 519 tests, 0 skips)
  - Unit test suite: PASS (35 test files, 373 tests, 0 skips)
  - Live PostgreSQL DB test suite: PASS (13 test files, 113 tests, 0 skips)
  - Redis test suite: PASS (5 test files, 50 tests, 0 skips)
  - Persistence Guard: PASS (14 tests)
  - Migration Guard: PASS (4 migrations, 0 blocking risks)
  - Static Boundary Guard: PASS (controllers=7, services=11, repositories=6)
  - Product Audit Governance Guard: PASS
  - Seed Safety Guard: PASS
Next Action: FEAT-021 implemented and ready for independent QA
```

FEAT-021 Governance Fields:

```text
Lifecycle State: DONE
Implementation: COMPLETED
Implementation Owner: Antigravity
QA Status: PASS — QA Iteration 2
Human Final Gate: APPROVED
Planning Status: APPROVED
Planning Owner: Antigravity — Temporary Planning Ownership Transfer
Human Planning Approval: APPROVED
Feature Type: Learner-facing Web UI implementation
Scope Boundaries: Course catalog, course detail, and lesson detail UI in apps/web consuming FEAT-020 APIs; zero UI for quizzes/flashcards/progress/XP; zero backend changes; zero schema changes
Spec Package: .specify/specs/FEAT-021/
Tasks: 12 implementation tasks completed
Acceptance Criteria: 17 deterministic criteria (AC-001..AC-017) PASS
Defects:
  - DEF-021-01 (P1 Open Redirect Security Defect): FIXED / VERIFIED
  - DEF-021-02 (P2 Accessibility Heading Hierarchy Defect): FIXED / VERIFIED
Evidence Gap:
  - GAP-021-01 (Client-Side Logout Query Cache Invalidation): OPEN / NON-BLOCKING
Validation (Latest QA Iteration 2):
  - Clean: PASS
  - Lint: PASS (0 errors, 0 warnings)
  - Prisma Schema Validation: PASS
  - Typecheck: PASS
  - Monorepo Build: PASS (Vite web bundle + API/shared tsc)
  - Monorepo Test: PASS (62 files, 602 tests)
  - Unit Test: PASS (41 files, 456 tests)
  - Database Test: PASS (13 files, 113 tests)
  - Redis Test: PASS (5 files, 50 tests)
  - Static Boundary Guard: PASS (controllers=7, services=11, repositories=6)
  - Migration Guard: PASS (4 migrations, 0 blocking risks)
  - Persistence Guard: PASS (14 tests)
  - Product Audit Governance Guard: PASS
  - Seed Safety Guard: PASS
Implementation Report: reports/implementation/phase-4/FEAT-021.md
QA Report: reports/qa/phase-4/FEAT-021-QA.md
Next Action: FEAT-022 in planning review (implementation NOT_STARTED)
```

FEAT-022 Governance Fields:

```text
Lifecycle State: DONE
Implementation: COMPLETE
Implementation Owner: Antigravity
QA Status: PASS (QA Iteration 2: DEF-022-01 & GOV-022-01 FIXED VERIFIED)
Human Final Gate: APPROVED
Planning Status: APPROVED
Planning Owner: Antigravity — Temporary Planning Ownership Transfer
Human Planning Approval: APPROVED
Human Product Decision: APPROVED (Transient Client-Side Review Session Only; Persistence DEFERRED)
Human Answer-Secrecy Decision: APPROVED (Option A — UI Reveal Only)
Feature Type: Backend API Read Model & Frontend Interactive Flashcard Review UI
Scope Boundaries: Lesson-attached flashcard read API and interactive frontend review container in apps/web; zero DB review persistence; zero spaced repetition; zero progress/XP mutation; zero Redis state; zero schema drift
Spec Package: .specify/specs/FEAT-022/
Tasks: 12 implementation tasks (T1..T12) completed; Rework Iteration 1 verified
Acceptance Criteria: 18 deterministic criteria (AC-001..AC-018) VERIFIED PASS
Validation:
  - Clean: PASS
  - Lint: PASS (0 errors, 0 warnings)
  - Prisma Schema Validation: PASS
  - Typecheck: PASS
  - Monorepo Build: PASS (Vite web bundle + API/shared tsc)
  - Monorepo Test: PASS (64 files, 623 tests)
  - Unit Test: PASS (43 files, 472 tests)
  - Database Test: PASS (14 files, 121 tests)
  - Redis Test: PASS (5 files, 50 tests)
  - Persistence Guard: PASS (14 tests)
  - Migration Guard: PASS (4 migrations, 0 blocking risks)
  - Static Boundary Guard: PASS (controllers=7, services=11, repositories=6)
  - Product Audit Governance Guard: PASS
  - Seed Safety Guard: PASS
Implementation Report: reports/implementation/phase-4/FEAT-022.md
QA Report: reports/qa/phase-4/FEAT-022-QA.md
Next Action: FEAT-022 complete. FEAT-023 APPROVED FOR IMPLEMENTATION (Implementation: NOT_STARTED).
```

FEAT-023 Status Fields:

```text
Lifecycle State: DONE
Planning Status: COMPLETE (HUMAN APPROVED)
Planning Owner: Antigravity — Temporary Planning Ownership Transfer
Human Planning Approval: APPROVED
Human Decisions:
  - Question Type: SINGLE_CHOICE ONLY — APPROVED
  - Primary Quiz Read Policy: Lowest-order PUBLISHED quiz — APPROVED
  - Identifier Strategy: Stable opaque UUIDs (quiz.id, question.id, option.id) — APPROVED
  - passingScore: Safe pre-submission quiz metadata — APPROVED
Implementation: COMPLETE
QA Status: PASS (QA Iteration 1)
Human Final Gate: APPROVED
Feature Type: Backend API Read Model & Safe Projection Contract
Scope Boundaries: Lesson-attached primary quiz definition endpoint; safe whitelist DTOs; zero correct-answer exposure; zero attempt creation; zero answer submission; zero scoring; zero progress/XP mutation; zero Redis state; zero schema drift
Spec Package: .specify/specs/FEAT-023/
Acceptance Criteria: 18 deterministic criteria (AC-001..AC-018) with CRITICAL HARD GATE on Pre-Submission Correct Answer Secrecy — ALL PASS
Tasks: 11 implementation tasks defined (T1..T11) — ALL COMPLETE
Implementation Report: reports/implementation/phase-4/FEAT-023.md
QA Report: reports/qa/phase-4/FEAT-023-QA.md
Next Action: FEAT-023 complete. FEAT-024 UNBLOCKED FOR PLANNING (Implementation: NOT_STARTED).
```

FEAT-024 Status Fields:

```text
Lifecycle State: DONE
Planning Status: COMPLETE (HUMAN APPROVED)
Planning Owner: Antigravity — Temporary Planning Ownership Transfer
Human Planning Approval: APPROVED
Human Decisions:
  - Active Attempt Policy: One active IN_PROGRESS attempt per (user, quiz) tuple — APPROVED BY HUMAN
  - Database Enforcement: PostgreSQL partial unique index UNIQUE (quiz_id, user_id) WHERE status = 'IN_PROGRESS' — APPROVED BY HUMAN
  - CREATED State Policy: Start creates IN_PROGRESS directly; CREATED schema-reserved and not active — APPROVED BY HUMAN
  - Repeated Start Behavior: Idempotent return-existing active attempt (200 OK existing vs 201 Created new) — APPROVED BY HUMAN
  - Concurrency Strategy: Layered defense (DB partial unique index + transaction advisory lock + P2002 race recovery) — APPROVED BY HUMAN
  - Draft Answer Persistence Scope: Included in FEAT-024 with zero evaluation/scoring — APPROVED BY HUMAN
  - Content Continuation & Historical Read: IN_PROGRESS unpublished rejected; SUBMITTED/GRADED owner safe read allowed — APPROVED BY HUMAN
  - Strict Start Request Body: Empty object {} strictly enforced (authoritative fields rejected with 400) — APPROVED BY HUMAN
  - Schema Migration Strategy: Minimal constraint-only migration (forward-only, preflight duplicate check) — APPROVED BY HUMAN
Implementation: COMPLETE (Rework Iteration 1)
QA Status: QA PASS (QA Iteration 1 + Report Closure)
QA Report: reports/qa/phase-4/FEAT-024-QA.md
Human Final Gate: APPROVED
Feature Type: Backend Domain Lifecycle, State Foundation & Constraint Migration
Scope Boundaries: Authenticated attempt start/read endpoints; active attempt invariant; draft answer persistence; minimal partial unique index migration; zero correctness leakage; zero scoring/grading; zero progress/XP/reward mutation; zero Redis authority
Spec Package: .specify/specs/FEAT-024/
Implementation Report: reports/implementation/phase-4/FEAT-024.md
Acceptance Criteria: 20 deterministic criteria (AC-001..AC-020) with CRITICAL HARD GATE on Pre-Submission Correct Answer Secrecy
Tasks: 11 implementation tasks completed (T1..T11)
Next Action: FEAT-024 DONE. FEAT-025 APPROVED FOR IMPLEMENTATION (Implementation: NOT_STARTED).
```

FEAT-025 Status Fields:

```text
Lifecycle State: DONE
Planning Status: COMPLETE (HUMAN APPROVED)
Planning Owner: Antigravity — Temporary Planning Ownership Transfer
Human Planning Approval: APPROVED
Human Decisions:
  - Lifecycle Transition: Two-stage transition IN_PROGRESS -> SUBMITTED -> GRADED inside ONE atomic transaction — APPROVED BY HUMAN
  - Repeated Submit: Idempotent return of existing graded result with 200 OK — APPROVED BY HUMAN
  - Unanswered Questions: Strict completion requirement rejecting submission with 400 UNANSWERED_QUESTIONS — APPROVED BY HUMAN
  - Score Rounding: Integer percentage Math.round((C / N) * 100) — APPROVED BY HUMAN
  - Zero-Question Quiz: Reject with 400 INVALID_QUIZ_STATE — APPROVED BY HUMAN
  - Result Visibility: Score, pass/fail, and per-question correctness; explanations deferred — APPROVED BY HUMAN
  - Result Endpoint: Dedicated GET .../result endpoint — APPROVED BY HUMAN
  - Retry Policy: Unlimited retry via new attempt once current is GRADED — APPROVED BY HUMAN
  - Evaluation Source: Current live quiz definition with atomic snapshot writing — APPROVED BY HUMAN
  - Schema Migration: Minimal additive check-constraint migration for score range and graded-state coherence — APPROVED BY HUMAN
  - Historical passingScore: Omitted from QuizResultDto (Option B); persisted passed boolean is sole authority — APPROVED BY HUMAN
Implementation: COMPLETE
Implementation Owner: DEV-A
QA Status: READY FOR QA
Feature-Level Human Final Gate: REMOVED for FEAT-025 under phase-owned workflow
Internal Feature Quality Gate: PASS
Feature Type: Backend Domain Evaluation, Lifecycle Finalization & Result Projection
Scope Boundaries: Authenticated attempt submit/result endpoints; server-authoritative evaluation; score and pass/fail derivation; answer correctness snapshot persistence; zero progress/XP/reward mutations; zero Redis authority
Spec Package: .specify/specs/FEAT-025/
Implementation Report: reports/implementation/phase-4/FEAT-025.md
Acceptance Criteria: 20 deterministic criteria (AC-001..AC-020) with CRITICAL HARD GATES on Server-Authoritative Evaluation and Secrecy Regression (All 20 VERIFIED)
Tasks: 11 implementation tasks completed (T1..T11)
```

FEAT-026 Governance Fields:

```text
Lifecycle State: DONE
Implementation: COMPLETE
Implementation Owner: Antigravity / DEV-A
Planning Owner: Codex
Internal Feature Quality Gate: PASS
QA Status: READY FOR QA
Feature Type: Backend progression, completion tracking, and learner progress presentation
Scope Boundaries: Authenticated learner progress read; informational lesson completion proposal; FEAT-025 post-grade progress reconciliation; course rollup; completion fact contract for FEAT-027; zero XP/reward/audit mutation; zero Redis durable progress authority
Human Decisions: APPROVED
  - Quiz pass automatically completes lesson
  - Informational lesson completion by explicit learner action
  - Lesson completion monotonicity
  - Historical course completion monotonicity
  - New published lesson after completion preserves historical completion while current coverage recalculates
  - Draft/archived lesson denominator policy
  - Zero published lesson semantics
  - Progress percentage rounding
Unresolved Human Decisions: ZERO
Spec Package: .specify/specs/FEAT-026/
Implementation Report: reports/implementation/phase-4/FEAT-026.md
Human-Approved Migration Decision: ZERO production migration based on existing Academy progress tables and constraints
Acceptance Criteria: 20 deterministic criteria (AC-001..AC-020) with CRITICAL HARD GATES on Server-Authoritative Progression and Progress/Quiz Correctness Secrecy Regression (All 20 VERIFIED)
Tasks: 11 implementation tasks completed (T001..T011)
Git Checkpoint: PUBLISHED (commit a711ab4)
CI: GREEN (Run 34493917371 / Job 102927429466)
Tag: feat-026-approved
FEAT-027: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS)
FEAT-028: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS)
FEAT-029: IMPLEMENTATION COMPLETE / DEFER CLOSURE VERIFIED
Next Action: Phase 5 is unblocked for implementation / next approved planning step.
```

FEAT-027 Governance Fields:

```text
Lifecycle State: DONE
Planning Status: HUMAN APPROVED
Planning Owner: Codex
Implementation: COMPLETE
Implementation Owner: Antigravity / DEV-A
Internal Feature Gate: PASS
Canonical 14 Validation: PASS (14/14 commands with no skips)
Implementation Report: reports/implementation/phase-4/FEAT-027.md
Feature Type: XP and idempotent reward ledger implementation feature
Dependencies: FEAT-026 DONE / Internal Feature Gate PASS / Git checkpoint PUBLISHED / CI GREEN / tag feat-026-approved
Scope Boundaries: FEAT-026 AcademyCompletionFact consumption; lesson/course XP rewards; AcademyRewardLedger idempotency; AcademyUserXp aggregate; zero Redis durable authority; zero product audit activation; zero subscription/badge behavior
Human Decisions:
  - lesson first completion reward = 10 XP
  - course first completion reward = 50 XP
  - failed quiz = 0 XP
  - repeated quiz attempt = 0 additional XP
  - historical automatic reward backfill = DEFERRED
  - current-user XP read API = INCLUDED
  - lightweight learner XP display = INCLUDED
  - badges = OUT OF SCOPE
  - premium/subscription = OUT OF SCOPE
  - level mechanics = DEFERRED
Reward Recovery Decision: `AcademyCompletionFact.isFirstCompletion` is informational only; durable reward eligibility is authenticated user + persisted completion state + deterministic reward identity + RewardLedger absence/presence. Progression-commit/reward-failure retry must award missing reward exactly once.
Spec Package: .specify/specs/FEAT-027/
Acceptance Criteria: 27 deterministic criteria (AC-001..AC-027, ALL VERIFIED PASS)
Tasks: 12 implementation tasks completed (T001..T012)
Git Checkpoint: PUBLISHED (commit f1b1290)
CI: GREEN (Run 34757868281 / Job 103725282868)
Tag: feat-027-approved
FEAT-028: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS)
FEAT-029: IMPLEMENTATION COMPLETE / DEFER CLOSURE VERIFIED
Next Action: Phase 5 is unblocked for implementation / next approved planning step. Phase 4 is DONE / QA PASS / Human Phase Final Gate APPROVED.
```

FEAT-028 Governance Fields:

```text
Lifecycle State: DONE
Planning Status: CODEX UPFRONT PLANNING COMPLETE
Planning Owner: Codex
Implementation: COMPLETE
Implementation Owner: Antigravity / DEV-A
Internal Feature Gate: PASS
Implementation Report: reports/implementation/phase-4/FEAT-028.md
Feature Type: Academy authorization and ownership hardening
Scope Boundaries: endpoint authorization matrix; IDOR tests; owner-scoped attempts/results/progress/XP/rewards; JWT role spoof rejection; zero new admin/support Academy routes
Human Decision: ADMIN / SUPPORT learner visibility DEFERRED; learner ownership hardening only.
Spec Package: .specify/specs/FEAT-028/
Acceptance Criteria: 22 deterministic criteria (AC-001..AC-022) - ALL PASS
Tasks: 10 implementation tasks (T001..T010) - ALL COMPLETE
Start Condition: FEAT-027 implementation complete, Internal Feature Gate PASS, checkpoint PUBLISHED, CI GREEN, tag feat-027-approved
FEAT-030: DONE / QA PASS
```

FEAT-029 Governance Fields:

```text
Lifecycle State: IMPLEMENTATION COMPLETE / DEFER CLOSURE VERIFIED
Planning Status: CODEX UPFRONT PLANNING COMPLETE
Planning Owner: Codex
Implementation: COMPLETE
Implementation Owner: Codex (governance / verification closure only)
Feature Type: Academy product audit deferral governance / verification closure
Scope Boundaries: FEAT-016 product audit governance; DEFER branch; no product audit table/migration/API/UI/event persistence; no AuthSecurityAuditRecord misuse; no grading/progress/reward semantic change
Human Decision: Durable Academy product audit DEFERRED for Phase 4 with accepted risk.
Spec Package: .specify/specs/FEAT-029/
Acceptance Criteria: 24 deterministic criteria (AC-001..AC-024) - ALL PASS after clean integration re-validation
Tasks: 10 implementation tasks (T001..T010) - COMPLETE
Start Condition: FEAT-027 implementation complete, Internal Feature Gate PASS, checkpoint PUBLISHED, CI GREEN, tag feat-027-approved
Audit Decision: DEFERRED FOR PHASE 4
Self-Verification: PASS AFTER CLEAN INTEGRATION RE-VALIDATION
Historical Contaminated FAIL: PRESERVED in reports/implementation/phase-4/FEAT-029.md
QA Independence: REDUCED - Codex implemented the defer closure; Human Dual Review remains the compensating control at Phase 4 Final Gate.
FEAT-030: DONE / QA PASS
```

Artifacts:

- `docs/phase-4-feature-decomposition.md`
- `docs/master-roadmap.md`
- `docs/cross-phase-contracts.md`
- `docs/integration-strategy.md`
- `.specify/specs/FEAT-019/`
- `reports/qa/phase-4/FEAT-019-QA.md`
- `.specify/specs/FEAT-020/`
- `reports/qa/phase-4/FEAT-020-QA.md`
- `.specify/specs/FEAT-021/`
- `reports/qa/phase-4/FEAT-021-QA.md`
- `.specify/specs/FEAT-022/`
- `reports/qa/phase-4/FEAT-022-QA.md`
- `.specify/specs/FEAT-023/`
- `reports/qa/phase-4/FEAT-023-QA.md`
- `.specify/specs/FEAT-024/`
- `reports/qa/phase-4/FEAT-024-QA.md`
- `.specify/specs/FEAT-025/`
- `reports/implementation/phase-4/FEAT-025.md`
- `.specify/specs/FEAT-026/`
- `reports/implementation/phase-4/FEAT-026.md`
- `.specify/specs/FEAT-027/`
- `reports/implementation/phase-4/FEAT-027.md`
- `.specify/specs/FEAT-028/`
- `reports/implementation/phase-4/FEAT-028.md`
- `.specify/specs/FEAT-029/`
- `reports/implementation/phase-4/FEAT-029.md`
- `reports/qa/phase-4/PHASE-4-QA.md`
---

# Phase 5 - Simulation Engine

## Goal

Build a server-authoritative individual financial simulation with fixed mock equities, deterministic persisted market snapshots, USD-only simulated money, and no real-money/brokerage behavior.

## Scope

- SimulationScenario
- SimulationAsset
- SimulationMarketSnapshot
- SimulationSession
- SimulationPortfolio
- SimulationPosition
- SimulationOrder
- SimulationTrade
- Order rate limiting for abuse/resource protection
- Durable Simulation product audit deferral governance

## Architecture Rules

```text
Server owns cycle.
Server owns price.
Server owns lifecycle state.
Server owns balance.
Client submits strict market order request.
PostgreSQL is durable Simulation authority.
Redis is transient rate-limit/coordination only.
```

## Acceptance Criteria

- [x] User sessions are isolated
- [x] PostgreSQL-backed schema/migrations are reproducible
- [x] Client cannot manipulate scenario cycle, price, balance, position, PnL, or lifecycle state
- [x] MARKET orders execute at authoritative current snapshot price
- [x] Insufficient cash is rejected
- [x] Overselling is rejected
- [x] Idempotent replay and conflicts are deterministic
- [x] Concurrent order behavior is safe
- [x] Current valuation is derived from current snapshot only
- [x] Simulation rate limiting is transient Redis-only
- [x] Durable Simulation product audit remains deferred
- [x] Simulation integration gate passes

Status:

```text
DONE
```

Planning:

```text
COMPLETE / HUMAN MASTER PLANNING APPROVED
```

Implementation:

```text
COMPLETE
```

QA:

```text
PASS
```

Human Phase Final Gate:

```text
APPROVED
```

Phase Checkpoint:

```text
phase-5-approved — PUBLISHED
```

Phase 5 State:

```text
Baseline: phase-4-approved
Phase Checkpoint: phase-5-approved — PUBLISHED
Owner: DEV-A / Antigravity
FEAT-031: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS, Git Checkpoint: PUBLISHED, CI: GREEN, Tag: feat-031-approved)
FEAT-032: DONE / INTEGRATED (Self-Verification: PASS; QA Independence: REDUCED)
FEAT-033: DONE / INTEGRATED (Internal Feature Gate: PASS)
FEAT-034: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS)
FEAT-035: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS, Git Checkpoint: PUBLISHED, CI: GREEN, Tag: feat-035-approved)
FEAT-036: DONE (Implementation: COMPLETE, Self-Verification: PASS, QA Independence: REDUCED, Git Checkpoint: PUBLISHED, CI: GREEN, Tag: feat-036-approved)
FEAT-037: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS)
FEAT-038: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS)
FEAT-039: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS)
FEAT-040: DONE / QA PASS
FEAT-040 QA History: QA Iteration 1 FAIL; Rework Iteration 1 COMPLETE; QA Iteration 2 FAIL; Rework Iteration 2 COMPLETE; QA Iteration 3 FAIL; Final DEF-005 Governance Correction COMPLETE; Human Governance Review PASS; Human Phase Final Gate APPROVED
FEAT-040 Defects: DEF-001 FIXED; DEF-002 FIXED; DEF-003 FIXED; DEF-004 FIXED; DEF-005 CLOSED (P0=0, P1=0, P2=0, P3=0)
FEAT-040 Acceptance Criteria: AC-001..AC-028 ALL 28 ACs PASS
Human Phase Final Gate: APPROVED
Phase 5: DONE / QA PASS / HUMAN PHASE FINAL GATE APPROVED
Phase 5 QA: PASS
Phase Checkpoint: phase-5-approved PUBLISHED
Phase 6: UNBLOCKED
Application code changes: FEAT-031 persistence complete; FEAT-032 read model integrated; FEAT-033 session lifecycle integrated; FEAT-034 accounting foundation complete; FEAT-035 order execution complete; FEAT-036 adversarial hardening complete; FEAT-037 valuation read model complete; FEAT-038 frontend UI complete; FEAT-039 security & rate limit complete; FEAT-040 complete with zero application/test/schema/migration/CI changes
Governance Note: Phase 5 completion APPROVED by Human Phase Final Gate.
Blocking evidence: ZERO (all defects closed, Phase 5 complete, Phase 6 unblocked)
Unresolved Human decisions: ZERO
```

Planning Artifacts:

- `docs/phase-5-feature-decomposition.md`
- `.specify/specs/FEAT-031/`
- `.specify/specs/FEAT-032/`
- `.specify/specs/FEAT-033/`
- `.specify/specs/FEAT-034/`
- `.specify/specs/FEAT-035/`
- `.specify/specs/FEAT-036/`
- `.specify/specs/FEAT-037/`
- `.specify/specs/FEAT-038/`
- `.specify/specs/FEAT-039/`
- `.specify/specs/FEAT-040/`

Planned Implementation Reports:

- `reports/implementation/phase-5/FEAT-031.md`
- `reports/implementation/phase-5/FEAT-032.md`
- `reports/implementation/phase-5/FEAT-033.md`
- `reports/implementation/phase-5/FEAT-034.md`
- `reports/implementation/phase-5/FEAT-035.md`
- `reports/implementation/phase-5/FEAT-036.md`
- `reports/implementation/phase-5/FEAT-037.md`
- `reports/implementation/phase-5/FEAT-038.md`
- `reports/implementation/phase-5/FEAT-039.md`

Planned Phase QA:

- `reports/qa/phase-5/PHASE-5-QA.md`

---

# Phase 6 - Community

## Goal

Deliver a safe authenticated learner Community with durable posts, flat comments, relational post likes, moderation/abuse boundaries, learner UI, and a final integration gate.

## Scope

- Posts
- Comments
- Likes
- Moderation baseline
- Community learner UI
- Authorization and Redis-backed write abuse protection
- Phase integration validation

## Acceptance Criteria

- [ ] Likes are per user
- [ ] Duplicate likes are prevented
- [ ] Unlike only affects current user
- [ ] Authorization is enforced
- [ ] Community state is correctly persisted
- [ ] Feed/comments are bounded and deterministically paginated
- [ ] Public moderation/admin surface is absent unless Human later approves it
- [ ] Redis remains transient and PostgreSQL remains durable authority
- [ ] Phase 2-5 regressions remain green

Planning Status:

```text
HUMAN MASTER PLANNING APPROVED
```

Implementation:

```text
IN_PROGRESS
```

Phase 6 State:

```text
Baseline: phase-5-approved
Planning / Architecture Owner: Codex
Implementation Owner: DEV-B / Antigravity
FEAT-041: DONE / QA PASS / HUMAN TARGETED GOVERNANCE REVIEW APPROVED (Checkpoint: feat-041-approved PUBLISHED)
FEAT-042: DONE / INTERNAL FEATURE GATE PASS (Checkpoint: feat-042-approved PUBLISHED)
FEAT-043: DONE / INTERNAL FEATURE GATE PASS (Checkpoint: feat-043-approved PUBLISHED)
FEAT-044: DONE / INTERNAL FEATURE GATE PASS (Checkpoint: feat-044-approved PUBLISHED)
Parallel Integration Gate (FEAT-043 + FEAT-044): PASS
FEAT-045: DONE / INTERNAL FEATURE GATE PASS (Checkpoint: feat-045-approved PUBLISHED)
FEAT-046: DONE / INTERNAL FEATURE GATE PASS (Checkpoint: feat-046-approved PUBLISHED)
FEAT-047: QA FAIL - ITERATION 1 / BLOCKING DEFECTS OPEN
Phase 6: IN_PROGRESS / BLOCKED
Human Phase Final Gate: NOT READY / NOT APPROVED
Phase 7: BLOCKED
Application code changes: FEAT-041 Community persistence foundation complete; FEAT-042 Community posts API & feed read models complete; FEAT-043 Community comments API complete; FEAT-044 Community post likes complete; FEAT-045 Community moderation baseline & write abuse protection complete; FEAT-046 Community learner UI complete
```

FEAT-041 Governance Fields:

```text
Lifecycle State: DONE / APPROVED FOR CHECKPOINT
Planning Status: HUMAN MASTER PLANNING APPROVED
Planning Owner: Codex
Implementation: COMPLETE
Implementation Owner: DEV-B / Antigravity
Internal Feature Gate: PASS
Latest QA: QA Iteration 2 (Technical evidence authoritative: DEF-001..DEF-003 FIXED; DEF-004 closed by Human Targeted Governance Review)
QA Report: reports/qa/phase-6/FEAT-041-QA.md
Defects: DEF-001 P1 FIXED; DEF-002 P2 FIXED; DEF-003 P2 FIXED; DEF-004 P2 CLOSED (P0=0, P1=0, P2=0, P3=0)
Human Final Gate: APPROVED (Human Targeted Governance Review)
Canonical 14 Validation: PASS (14/14 commands with no skips)
Implementation Report: reports/implementation/phase-6/FEAT-041.md
Checkpoint Tag: feat-041-approved
Migration: 20260919201500_feat041_community_foundation
Models: CommunityPost, CommunityComment, CommunityPostLike
Constraints: Content lengths (post: 1..5000, comment: 1..2000, whitespace-trimmed), closed status ('VISIBLE', 'HIDDEN', 'REMOVED'), removal timestamp coherence, unique (user_id, post_id)
Indexes: Composite feed (status, created_at DESC, id DESC), comments (post_id, created_at ASC, id ASC), author posts (author_id, created_at DESC, id DESC), author comments (author_id, created_at DESC, id DESC), post likes (post_id, created_at DESC), user likes (user_id, created_at DESC)
Repository Interfaces: ICommunityPostRepository, ICommunityCommentRepository, ICommunityPostLikeRepository (Zero physical delete methods)
Repository Implementations: Prisma implementations wired in repository-factory.ts with root/transaction client support; markPostRemoved & markCommentRemoved atomic logical removal
Fresh DB Validation: PASS (aura_capital_test_feat041_fresh deployed from zero, 30 tables)
Phase 5 Upgrade DB Validation: PASS (aura_capital_test_feat041_upgrade preserved 100% representative rows, 30 tables)
Live DB Tests: 37 tests in community-persistence-db.test.ts (31 test files, 426 tests in test:db PASS)
Redis Durable Authority: ZERO
Product Audit Persistence: DEFERRED (ZERO schema/migration/API)
Scope Boundary: ZERO Community HTTP routes, controllers, or frontend UI; ZERO FEAT-042 application changes
Spec Package: .specify/specs/FEAT-041/
Acceptance Criteria: 28 PASS / 0 FAIL (AC-001..AC-028 PASS)
Tasks: 20 PASS / 0 FAIL (T001..T020 PASS)
Dependencies: FEAT-042 UNBLOCKED FOR IMPLEMENTATION
```

FEAT-042 Governance Fields:

```text
Lifecycle State: DONE / APPROVED FOR CHECKPOINT
Planning Status: HUMAN MASTER PLANNING APPROVED
Planning Owner: Codex
Implementation: COMPLETE
Implementation Owner: DEV-B / Antigravity
Internal Feature Gate: PASS
Latest QA: FAST-TRACK DELIVERY (Internal Feature Gate PASS; Zero blocking defects; Canonical 14 PASS)
Canonical 14 Validation: PASS (14/14 commands with no skips)
Implementation Report: reports/implementation/phase-6/FEAT-042.md
Checkpoint Tag: feat-042-approved
Routes: GET /api/community/posts, GET /api/community/posts/:postId, POST /api/community/posts, DELETE /api/community/posts/:postId (4 exact routes, authenticated only)
Ordering: Deterministic (createdAt DESC, id DESC) with opaque versioned cursor (v: 1)
Safe DTO: CommunityPostDto (exact 8 fields, fallback to 'Aura Learner', zero sensitive/security leaks)
Visibility: Normal learner feed returns only VISIBLE; HIDDEN and REMOVED return safe non-enumerating 404
Removal: Atomic logical removal via markPostRemoved / removePostIfOwner; zero physical deletions
Ownership: Strict owner authorization; foreign delete attempts return safe 404 NOT_FOUND
Relational Counts: likeCount, commentCount, likedByCurrentUser derived relationally from PostgreSQL
Migration: ZERO new migrations (remains 9 migrations)
Redis Durable Authority: ZERO (no feed cache, no durable state)
Product Audit Persistence: DEFERRED (zero schema/API changes)
Boundary Guard: PASS (17 controllers, 22 services, 8 repositories clean)
Spec Package: .specify/specs/FEAT-042/
Acceptance Criteria: 28 PASS / 0 FAIL (AC-001..AC-028 PASS)
Tasks: 19 PASS / 0 FAIL (T001..T019 PASS)
Dependencies: FEAT-043 UNBLOCKED FOR IMPLEMENTATION
```

FEAT-043 Governance Fields:

```text
Lifecycle State: DONE / APPROVED FOR CHECKPOINT
Planning Status: HUMAN MASTER PLANNING APPROVED
Planning Owner: Codex
Implementation: COMPLETE
Implementation Owner: DEV-B / Antigravity
Internal Feature Gate: PASS
Latest QA: FAST-TRACK DELIVERY (Internal Feature Gate PASS; Zero blocking defects; Canonical 14 PASS)
Canonical 14 Validation: PASS (14/14 commands with no skips)
Implementation Report: reports/implementation/phase-6/FEAT-043.md
Checkpoint Tag: feat-043-approved
Routes: GET /api/community/posts/:postId/comments, POST /api/community/posts/:postId/comments, DELETE /api/community/comments/:commentId (3 exact routes, authenticated only)
Ordering: Deterministic ascending (createdAt ASC, id ASC) with opaque versioned cursor (v: 1)
Safe DTO: CommunityCommentDto (exact 5 fields, fallback to 'Aura Learner', zero sensitive/security leaks)
Parent Visibility Gate: Missing, hidden, or removed parent posts return safe uniform 404 NOT_FOUND
Removal: Atomic logical removal via removeCommentIfOwner; zero physical deletions
Ownership: Strict owner authorization; foreign delete attempts return safe 404 NOT_FOUND
Relational Counts: Post commentCount dynamically reflects visible comments only; increments on create and decrements on logical removal
Migration: ZERO new migrations (remains 9 migrations)
Redis Durable Authority: ZERO (no comment cache, no durable state)
Product Audit Persistence: DEFERRED (zero schema/API changes)
Boundary Guard: PASS (17 controllers, 22 services, 8 repositories clean)
Spec Package: .specify/specs/FEAT-043/
Acceptance Criteria: 26 PASS / 0 FAIL (AC-001..AC-026 PASS)
Tasks: 17 PASS / 0 FAIL (T001..T017 PASS)
Dependencies: FEAT-044 UNBLOCKED FOR IMPLEMENTATION
```

FEAT-044 Governance Fields:

```text
Lifecycle State: DONE / APPROVED FOR CHECKPOINT
Planning Status: HUMAN MASTER PLANNING APPROVED
Planning Owner: Codex
Implementation: COMPLETE
Implementation Owner: Codex (Temporary Implementation Owner)
Internal Feature Gate: PASS
Latest QA: FAST-TRACK DELIVERY (Internal Feature Gate PASS; Zero blocking defects; Canonical 14 PASS)
QA Independence: REDUCED (Compensating control: FEAT-047 independent Phase integration QA)
Canonical 14 Validation: PASS (14/14 commands with no skips)
Implementation Report: reports/implementation/phase-6/FEAT-044.md
Checkpoint Tag: feat-044-approved
Routes: PUT /api/community/posts/:postId/like, DELETE /api/community/posts/:postId/like (2 exact routes, authenticated only)
Semantics: Naturally idempotent post likes via atomic PostgreSQL upsert on UNIQUE(userId, postId)
Safe DTO: { postId: string, likedByCurrentUser: boolean, likeCount: number }
Visibility: Normal learner can only like VISIBLE posts; HIDDEN and REMOVED return safe uniform 404 NOT_FOUND
Isolation: User cannot manipulate another user's like; unlike uses caller-scoped deleteMany
Relational Counts: likeCount derived relationally from count of active likes
Migration: ZERO new migrations (remains 9 migrations)
Redis Durable Authority: ZERO (no like counters in Redis, no cache)
Product Audit Persistence: DEFERRED (zero schema/API changes)
Boundary Guard: PASS (17 controllers, 22 services, 8 repositories clean)
Spec Package: .specify/specs/FEAT-044/
Acceptance Criteria: PASS
Dependencies: Parallel Integration Gate PASS; FEAT-045 UNBLOCKED FOR IMPLEMENTATION
```

FEAT-045 Governance Fields:

```text
Lifecycle State: DONE / APPROVED FOR CHECKPOINT
Planning Status: HUMAN MASTER PLANNING APPROVED
Planning Owner: Codex
Implementation: COMPLETE
Implementation Owner: DEV-B / Antigravity
Internal Feature Gate: PASS
Latest QA: FAST-TRACK DELIVERY (Internal Feature Gate PASS; Zero blocking defects; Canonical 14 PASS)
Canonical 14 Validation: PASS (14/14 commands with no skips)
Implementation Report: reports/implementation/phase-6/FEAT-045.md
Checkpoint Tag: feat-045-approved
Moderation Baseline: Option A (server-side status state and transitions: VISIBLE, HIDDEN, REMOVED; zero public moderation admin API/UI)
Rate Limiting: Write mutation surfaces protected: post create (10/user, 60/source), comment create (30/user, 180/source), post delete (30/user, 180/source), comment delete (60/user, 300/source), combined like/unlike (120/user, 600/source) per 10-minute window (600s)
Key Privacy: HMAC-SHA-256 with required COMMUNITY_RATE_LIMIT_KEY_SECRET (>= 32 chars, no fallback, anti-secret-reuse). Zero raw identifiers/IPs/PII in Redis keys or logs
Redis Authority: Transient counter authority only; PostgreSQL remains durable authority; writes fail-closed (503 SERVICE_UNAVAILABLE, zero DB mutation); reads remain available during Redis outage
Zero DB Mutation: Verified across all 429 throttled and 503 Redis-failed write mutations
Migration: ZERO new migrations (remains 9 migrations)
Product Audit Persistence: DEFERRED (zero schema/migration/API changes)
UI Changes: ZERO FEAT-046 Community UI changes
Boundary Guard: PASS (18 controllers, 23 services, 8 repositories clean)
Spec Package: .specify/specs/FEAT-045/
Acceptance Criteria: 33 PASS / 0 FAIL (AC-001..AC-033 PASS)
Tasks: 19 PASS / 0 FAIL (T001..T019 PASS)
Dependencies: FEAT-046 UNBLOCKED FOR IMPLEMENTATION
```

FEAT-046 Governance Fields:

```text
Lifecycle State: DONE / APPROVED FOR CHECKPOINT
Planning Status: HUMAN MASTER PLANNING APPROVED
Planning Owner: Codex
Implementation: COMPLETE
Implementation Owner: DEV-B / Antigravity
Internal Feature Gate: PASS
Latest QA: FAST-TRACK DELIVERY (Internal Feature Gate PASS; Zero blocking defects; Canonical 14 PASS)
Canonical 14 Validation: PASS (14/14 commands with no skips)
Implementation Report: reports/implementation/phase-6/FEAT-046.md
Checkpoint Tag: feat-046-approved
Routes: /community, /community/posts/:postId
Surfaces: Feed, Post Composer, Post Cards, Post Detail, Comments List, Comment Composer, Like/Unlike, Owner Removal Controls
Server Authority: Strict server authority; zero optimistic count mutations; authoritative counts refreshed from server
Security & Rendering: User content plain text only; zero dangerouslySetInnerHTML; zero XSS
Resilience & Errors: Safe 401 auth-required (zero requests), 404 not-found, 429 rate-limited banner with Retry-After, 503 fail-closed write outage guidance
Database / Migrations: ZERO new migrations (remains 9 migrations total); ZERO Prisma schema changes
Redis Usage: ZERO frontend Redis code/imports
Product Audit: DEFERRED (zero schema/migration/API/UI changes)
Admin UI: ZERO admin moderation UI
Spec Package: .specify/specs/FEAT-046/
Acceptance Criteria: 31 PASS / 0 FAIL (AC-001..AC-031 PASS)
Tasks: 19 PASS / 0 FAIL (T001..T019 PASS)
Dependencies: FEAT-047 UNBLOCKED FOR INDEPENDENT PHASE QA
```

Planning Artifacts:

- `docs/phase-6-feature-decomposition.md`
- `.specify/specs/FEAT-041/`
- `.specify/specs/FEAT-042/`
- `.specify/specs/FEAT-043/`
- `.specify/specs/FEAT-044/`
- `.specify/specs/FEAT-045/`
- `.specify/specs/FEAT-046/`
- `.specify/specs/FEAT-047/`

Implementation Artifacts:

- `reports/implementation/phase-6/FEAT-041.md`
- `reports/implementation/phase-6/FEAT-042.md`
- `reports/implementation/phase-6/FEAT-043.md`
- `reports/implementation/phase-6/FEAT-044.md`
- `reports/implementation/phase-6/FEAT-045.md`
- `reports/implementation/phase-6/FEAT-046.md`

Human Decision State: HUMAN MASTER PLANNING APPROVED. FEAT-041 Human Targeted Governance Review APPROVED (Checkpoint: feat-041-approved). FEAT-042 Fast-Track Implementation COMPLETE / Internal Feature Gate PASS (Checkpoint: feat-042-approved). FEAT-043 Fast-Track Implementation COMPLETE / Internal Feature Gate PASS (Checkpoint: feat-043-approved). FEAT-044 Fast-Track Implementation COMPLETE / Internal Feature Gate PASS (Checkpoint: feat-044-approved). Parallel Feature Integration (FEAT-043 + FEAT-044) PASS. FEAT-045 Fast-Track Implementation COMPLETE / Internal Feature Gate PASS (Checkpoint: feat-045-approved). FEAT-046 Fast-Track Implementation COMPLETE / Internal Feature Gate PASS (Checkpoint: feat-046-approved). FEAT-047 QA Iteration 1 is FAIL with blocking defects open. Phase 6 remains IN_PROGRESS / BLOCKED. Human Phase Final Gate is NOT READY / NOT APPROVED. Phase 7 remains BLOCKED.

FEAT-047 Governance Fields:

```text
Lifecycle State: QA FAIL / BLOCKED
QA Owner: Codex
QA Iteration: 1
Final Verdict: FAIL
Integrated Commit: c12c6ace95f8314d5d464646d444045eb5e04e2e
Local Canonical 14: PASS
Exact-Commit CI: FAILURE - GitHub Actions run #53, PostgreSQL DB test step
Acceptance Criteria: 36 PASS / 4 FAIL (AC-001, AC-026, AC-035, AC-039 FAIL)
Blocking Defects: DEF-001..DEF-004 P1 OPEN; DEF-005 P2 OPEN
QA Report: reports/qa/phase-6/PHASE-6-QA.md
Human Phase Final Gate: NOT READY / NOT APPROVED
Phase 6: IN_PROGRESS / BLOCKED
Phase 7: BLOCKED
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
