# Feature Specification: Identity Persistence & Auth Configuration

**Feature ID**: FEAT-002  
**Feature Branch**: `N/A - repository is not initialized as git`  
**Created**: 2026-08-25  
**Status**: PROPOSED FOR HUMAN REVIEW  
**Input**: Human approved Phase 2 decomposition and requested full spec package for FEAT-002.

## User Scenarios & Testing

### User Story 1 - Persist Identity Records Safely (Priority: P1)

As a future authentication implementer, I can rely on durable identity records with database-enforced uniqueness and relationships.

**Why this priority**: Registration, login, refresh sessions, RBAC, admin authorization, and audit events cannot be safely implemented until identity data has a durable and constrained foundation.

**Independent Test**: Apply the identity migration to an isolated test database and verify user, credential, role, user-role, refresh-session, and audit-prerequisite structures exist with the required uniqueness and foreign-key constraints.

**Acceptance Scenarios**:

1. **Given** an isolated test database, **When** the FEAT-002 migration is applied, **Then** identity-scoped tables and constraints are created successfully.
2. **Given** two user records with the same normalized identity identifier, **When** both are persisted, **Then** the database rejects the duplicate.
3. **Given** a credential, role assignment, refresh session, or audit-prerequisite record references a missing user, **When** it is persisted, **Then** the database rejects the orphaned record.
4. **Given** future Phase 2 features need durable auth records, **When** they access identity persistence, **Then** they can use repository boundaries instead of direct database internals.

---

### User Story 2 - Validate Auth Configuration at Startup (Priority: P1)

As an operator or QA reviewer, I can trust the API to fail before serving traffic when required identity, database, or auth security configuration is missing or unsafe.

**Why this priority**: The legacy system had unsafe fallback-secret behavior. Phase 2 must close this class of risk before auth endpoints exist.

**Independent Test**: Start the API configuration loader with missing, invalid, and valid auth/database settings and verify deterministic startup behavior without exposing secret values.

**Acceptance Scenarios**:

1. **Given** required auth secrets are missing, **When** API configuration is loaded, **Then** startup fails before serving requests.
2. **Given** required auth token lifetimes are outside approved ranges, **When** API configuration is loaded, **Then** startup fails with an actionable non-secret error.
3. **Given** a production-like environment has insecure refresh-cookie settings, **When** API configuration is loaded, **Then** startup fails or refuses the unsafe setting.
4. **Given** valid local/test configuration with safe dummy values, **When** API configuration is loaded, **Then** startup validation passes.

---

### User Story 3 - Keep Database Environments Isolated (Priority: P2)

As a QA reviewer, I can verify FEAT-002 tests and CI use isolated databases and cannot accidentally mutate local, staging, or production data.

**Why this priority**: Identity data is security-sensitive. Automated tests must be trustworthy before later auth flows mutate real records.

**Independent Test**: Run the documented FEAT-002 database test setup in test/CI mode and verify it targets an isolated test database or cleanup-safe database namespace.

**Acceptance Scenarios**:

1. **Given** tests run with `NODE_ENV=test`, **When** database-backed tests execute, **Then** they use a test database or isolated schema/namespace.
2. **Given** test configuration points to a local, staging, or production database, **When** tests start, **Then** test startup fails before mutation.
3. **Given** CI runs FEAT-002 validation, **When** migrations/tests execute, **Then** no developer-local, staging, or production database is required.
4. **Given** Redis is not required by FEAT-002 behavior, **When** FEAT-002 tests run, **Then** Redis is not used as a durable store.

## Edge Cases

- Duplicate identity identifiers must be rejected by database constraints, not only application logic.
- Identifier normalization rules must be compatible with future registration/login behavior but must not implement those user-facing flows.
- Missing auth secrets must fail startup; fallback secrets are forbidden.
- Secret validation errors must not print secret values.
- Production-like environments must not silently accept insecure refresh-cookie defaults.
- Tests must fail fast if configured against non-test data sources.
- Prisma client/types may be generated for repository use, but Prisma details must not leak into controllers or future services.
- Refresh-session tables may exist before refresh behavior is implemented; no rotation, refresh, or logout behavior is accepted in FEAT-002.
- Audit persistence prerequisites may exist before audit event emission behavior; no event emission behavior is accepted in FEAT-002.
- Password credential storage boundaries may exist before password hashing is implemented; no password hashing algorithm behavior is accepted in FEAT-002.

## Requirements

### Functional Requirements

- **FR-001**: The feature MUST add an identity-scoped PostgreSQL/Prisma persistence foundation without adding non-identity product-domain tables.
- **FR-002**: The feature MUST define a `User` model with a durable primary identifier and timestamps.
- **FR-003**: The feature MUST define a normalized identity identifier, such as normalized email, with a database uniqueness constraint.
- **FR-004**: The feature MUST define a credential persistence boundary associated with a user without implementing registration or password hashing behavior.
- **FR-005**: The feature MUST define role persistence and user-role assignment structures required by later RBAC features.
- **FR-006**: The feature MUST define refresh-session persistence prerequisites required by later refresh-token rotation/revocation features.
- **FR-007**: The feature MAY define authentication/security audit persistence prerequisites only if needed structurally for later audit behavior.
- **FR-008**: The feature MUST enforce referential integrity between users and identity-scoped dependent records.
- **FR-009**: The feature MUST define repository interfaces or repository modules for user, credential, role, refresh-session, and audit-prerequisite persistence where applicable.
- **FR-010**: Controllers and services MUST NOT directly depend on Prisma internals for identity persistence.
- **FR-011**: The feature MUST define a reproducible migration strategy for identity-scoped schema changes.
- **FR-012**: The feature MUST document and enforce test database isolation rules.
- **FR-013**: The feature MUST validate required database configuration at startup.
- **FR-014**: The feature MUST validate required auth secrets at startup.
- **FR-015**: The feature MUST reject missing auth/JWT secrets and MUST NOT provide fallback secrets.
- **FR-016**: The feature MUST validate access-token TTL configuration against the approved short-lived token range.
- **FR-017**: The feature MUST validate refresh-session or refresh-token lifetime configuration needed by later refresh features.
- **FR-018**: The feature MUST validate refresh-cookie security configuration needed by later refresh features.
- **FR-019**: The feature MUST keep `.env.example` limited to safe dummy values.
- **FR-020**: The feature MUST avoid logging secrets, tokens, password hashes, or raw database credentials.
- **FR-021**: The feature MUST include unit and/or integration tests proving schema, repository boundary, config validation, and test isolation behavior.
- **FR-022**: The feature MUST preserve FEAT-001 lint, typecheck, test, and build validation categories.
- **FR-023**: The implementation report MUST map completed work to FEAT-002 requirements, tasks, tests, validation, and acceptance criteria.
- **FR-024**: The feature MUST NOT implement public registration, login, token issuance, refresh rotation, logout, RBAC enforcement, admin guard, audit event emission, email verification, or hard account lockout.

### Key Entities

- **User**: Durable identity record for a person or account in Aura Capital.
- **Credential**: Persistence boundary for authentication credentials associated with a user. FEAT-002 defines storage shape only; FEAT-003 defines password hashing behavior.
- **Role**: Server-side role record for future authorization.
- **UserRole**: Relationship assigning server-owned roles to users.
- **RefreshSession**: Durable prerequisite record for future refresh-token rotation, revocation, and logout.
- **AuthSecurityAuditRecord**: Optional persistence prerequisite for future authentication/security audit events. FEAT-002 may define structure, but FEAT-009 owns event behavior.
- **IdentityRepository Boundary**: Repository layer that hides Prisma/database details from controllers and services.
- **AuthConfiguration**: Validated runtime settings for database access, auth secrets, token lifetimes, refresh-cookie behavior, and future rate-limit configuration placeholders.
- **TestDatabaseBoundary**: Rules and safeguards ensuring tests run only against isolated test data stores.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Applying the FEAT-002 migration to an isolated test database succeeds from documented commands.
- **SC-002**: Attempting to insert duplicate normalized identity identifiers is rejected 100% of the time by the database.
- **SC-003**: Missing required auth secrets cause startup/config validation failure 100% of the time before serving requests.
- **SC-004**: Invalid token lifetime or cookie security configuration is rejected 100% of the time during startup/config validation.
- **SC-005**: Database-backed tests refuse to run against non-test database targets.
- **SC-006**: Repository boundary tests or code review confirm identity persistence access is routed through repositories, not controllers/services using Prisma directly.
- **SC-007**: Lint, typecheck, test, and build commands pass after implementation.
- **SC-008**: No hard-coded auth secret, fallback auth/JWT secret, plaintext password behavior, or token issuance behavior exists in FEAT-002.

## Assumptions

- FEAT-002 follows the approved Phase 2 feature decomposition.
- Email is the initial identity identifier unless Human later approves additional identifiers.
- Credential storage can include fields needed by future password hashing, but the algorithm and hashing implementation belong to FEAT-003.
- Rate-limit enforcement is handled later in Phase 2; FEAT-002 may define validated config placeholders only.
- FEAT-009 owns actual audit event emission behavior.
- FEAT-010 owns integrated Phase 2 security gate validation.

