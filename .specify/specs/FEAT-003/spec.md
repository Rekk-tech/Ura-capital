# Feature Specification: Registration & Password Security

**Feature ID**: FEAT-003  
**Feature Branch**: `N/A - repository is not initialized as git`  
**Created**: 2026-08-25  
**Status**: APPROVED  
**Input**: Human approved FEAT-002 and requested full spec package for FEAT-003.

## User Scenarios & Testing

### User Story 1 - Register a New Account (Priority: P1)

As a new user, I can submit valid registration details and receive a safe account creation response.

**Why this priority**: Registration is the first user-facing identity behavior and blocks login in FEAT-004.

**Independent Test**: Submit a valid registration request and verify the API creates exactly one user and one password credential record in the isolated test database.

**Acceptance Scenarios**:

1. **Given** a valid email and valid password, **When** registration is submitted, **Then** a user record and password credential record are created.
2. **Given** registration succeeds, **When** the response is returned, **Then** it contains only safe user/account fields and no password, password hash, tokens, refresh-session, role internals, or database internals.
3. **Given** a valid mixed-case email with surrounding spaces, **When** registration is processed, **Then** the stored identity identifier is normalized consistently.

---

### User Story 2 - Reject Invalid Registration Input (Priority: P1)

As a new user or API consumer, I receive clear validation failures when registration data is missing, malformed, or unsafe.

**Why this priority**: Input validation protects the identity boundary before data reaches password hashing or persistence.

**Independent Test**: Submit invalid registration payloads and verify stable error envelopes with no sensitive data.

**Acceptance Scenarios**:

1. **Given** missing email or password, **When** registration is submitted, **Then** the request is rejected before persistence.
2. **Given** malformed email, **When** registration is submitted, **Then** the request is rejected before persistence.
3. **Given** a password that violates policy, **When** registration is submitted, **Then** the request is rejected before password hashing or credential persistence.
4. **Given** invalid input is rejected, **When** the response and logs are inspected, **Then** plaintext password values and password hashes are absent.

---

### User Story 3 - Protect Passwords at Rest (Priority: P1)

As a security reviewer, I can verify passwords are never stored in plaintext and are protected with the approved password hashing strategy.

**Why this priority**: Password storage is security-critical and must be correct before login can be implemented.

**Independent Test**: Register a user and inspect the persisted credential record in an isolated database to verify the stored value is an Argon2id encoded hash, not the plaintext password.

**Acceptance Scenarios**:

1. **Given** a valid registration password, **When** the credential is persisted, **Then** the stored credential is an Argon2id hash.
2. **Given** the same password is used by two different registration attempts, **When** both credentials are persisted for different users, **Then** the stored hash strings are different because each password uses a unique salt.
3. **Given** registration completes or fails, **When** logs and responses are inspected, **Then** plaintext passwords and password hashes are not exposed.

---

### User Story 4 - Reject Duplicate Identity Safely (Priority: P2)

As a registration user, I receive a stable safe rejection if the email identity is already registered.

**Why this priority**: Duplicate handling must preserve database integrity and produce predictable API behavior without leaking raw database errors.

**Independent Test**: Register the same normalized email twice and verify the second request is rejected safely and only one user/credential pair exists.

**Acceptance Scenarios**:

1. **Given** an existing user email, **When** registration is submitted with the same email in any casing, **Then** the request is rejected.
2. **Given** a duplicate registration is rejected, **When** the response is returned, **Then** it uses a stable error envelope and does not expose raw Prisma/database errors.
3. **Given** duplicate registration is attempted, **When** database state is inspected, **Then** no extra credential or partial user record remains.

## Edge Cases

- Email normalization must trim whitespace and lowercase the identifier before lookup and persistence.
- Duplicate checks must not rely only on pre-check logic; database uniqueness remains authoritative.
- Duplicate races must be handled from the PostgreSQL uniqueness constraint; a pre-check alone may not be treated as sufficient protection.
- Registration must be atomic: user and credential are created together or neither is persisted.
- Password validation must happen before hashing to avoid wasting resources on invalid requests.
- Hashing failures must not persist partial credentials.
- Error responses must not include raw database errors, stack traces, password values, hash strings, or secret values.
- Logs must not include plaintext passwords or password hashes.
- Registration must not create tokens, refresh sessions, login state, audit events, RBAC decisions, or admin behavior.
- Email verification is intentionally out of scope.

## Requirements

### Functional Requirements

- **FR-001**: The feature MUST expose a registration API contract for account creation.
- **FR-002**: The registration request MUST validate email, password, and optional display name fields before persistence.
- **FR-003**: The feature MUST normalize the email identity identifier by trimming surrounding whitespace and lowercasing before lookup and persistence.
- **FR-004**: The feature MUST define and enforce a password policy before password hashing.
- **FR-005**: The password policy MUST require at least 12 characters and must reject passwords from a small explicit denylist of common/demo passwords.
- **FR-006**: The feature MUST hash accepted passwords using Argon2id.
- **FR-007**: Argon2id parameters MUST be at least memoryCost 19456 KiB, timeCost 2, parallelism 1, with encoded hash output retaining algorithm, version, salt, and parameters.
- **FR-008**: The feature MUST use a unique salt per password hash as provided by the approved Argon2id implementation.
- **FR-009**: The feature MUST persist user and credential records using FEAT-002 repository/model boundaries.
- **FR-010**: Registration user + credential persistence MUST be atomic and must not leave partial records on failure.
- **FR-011**: Duplicate normalized email registration MUST be rejected safely.
- **FR-012**: Duplicate handling MUST preserve the FEAT-002 database uniqueness constraint as the final integrity boundary.
- **FR-013**: Successful registration response MUST include only safe user/account fields.
- **FR-014**: Registration response MUST NOT include plaintext password, password hash, credential internals, roles, access token, refresh token, refresh session, or auth secrets.
- **FR-015**: Error responses MUST use the stable error envelope pattern and MUST NOT expose raw database/Prisma errors.
- **FR-016**: Logs MUST NOT include plaintext passwords, password hashes, auth tokens, auth secrets, or raw credential payloads.
- **FR-017**: The feature MUST include unit and integration tests for validation, normalization, hashing, duplicate handling, persistence, response safety, and log safety.
- **FR-018**: Database-backed registration tests MUST run against an isolated test database and must preserve FEAT-002 guard behavior.
- **FR-019**: The feature MUST preserve FEAT-001 and FEAT-002 validation categories: clean, lint, typecheck, build, standard tests, DB-backed tests, Prisma validation, and runtime health where applicable.
- **FR-020**: The implementation report MUST map completed work to FEAT-003 requirements, tasks, tests, validation, and acceptance criteria.
- **FR-021**: The feature MUST NOT implement login, access-token issuance, refresh tokens, logout, RBAC enforcement, admin guard, audit event emission, email verification, account lockout, or FEAT-004 behavior.

### Key Entities

- **RegistrationRequest**: Public input containing email, password, and optional display name.
- **NormalizedEmail**: Canonical email identity used for uniqueness and lookup.
- **PasswordPolicyResult**: Validation result for password length and denied weak values.
- **PasswordHash**: Argon2id encoded hash persisted in Credential storage.
- **RegisteredUserResponse**: Safe response shape returned after account creation.
- **RegistrationService Boundary**: Orchestrates validation, normalization, hashing, and atomic persistence.
- **CredentialRepository Boundary**: FEAT-002 persistence boundary reused to store password hash only.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of valid registration requests create exactly one user and one credential record.
- **SC-002**: 100% of malformed or policy-invalid registration requests are rejected before database persistence.
- **SC-003**: 100% of stored registration credentials are Argon2id hashes, never plaintext passwords.
- **SC-004**: 100% of duplicate normalized email attempts are rejected without creating extra user or credential records.
- **SC-005**: 100% of registration responses and tested logs contain no plaintext password, password hash, token, or secret.
- **SC-006**: FEAT-001 and FEAT-002 regression validation remains green after implementation.

## Password Hashing Decision

Selected algorithm: Argon2id.

Baseline parameters:

- memoryCost: 19456 KiB (19 MiB)
- timeCost: 2 iterations
- parallelism: 1
- hash length: implementation default is acceptable if at least 32 bytes; shorter output requires QA justification.
- salt: unique random salt per password, generated by the Argon2id library.
- encoded format: persisted hash must include algorithm, version, parameters, salt, and derived hash.

Rationale:

- Argon2id is the approved Phase 2 baseline and balances GPU resistance with side-channel resistance.
- The baseline matches OWASP's current minimum recommendation for Argon2id password storage.
- Parameters may be increased later after benchmarking, but may not be weakened below this baseline without Human-approved security review.

Rejected alternatives:

- Plain hashing with SHA-family algorithms: rejected because fast hashes are not appropriate for passwords.
- bcrypt: acceptable legacy fallback in some systems, but not selected for this greenfield feature.
- PBKDF2: reserved only if future compliance requirements force it.

## Assumptions

- Registration endpoint path and HTTP method may follow existing API conventions, but the contract must be documented and tested.
- User status defaults from FEAT-002 may be reused without adding account lifecycle behavior.
- Registration does not require email verification in Phase 2.
- Rate limiting is tracked for later Phase 2 work and is not implemented in FEAT-003.
