# Implementation Plan: Registration & Password Security

**Feature ID**: FEAT-003  
**Branch**: `N/A - repository is not initialized as git`  
**Date**: 2026-08-25  
**Spec**: `spec.md`  
**Status**: APPROVED

## Summary

Implement secure public registration on top of FEAT-002 identity persistence. FEAT-003 adds request validation, email normalization, password policy enforcement, Argon2id hashing, duplicate identity handling, atomic user/credential persistence, and safe registration responses/errors.

FEAT-003 does not implement login, access-token issuance, refresh tokens, logout, RBAC enforcement, admin guard, audit event emission, email verification, account lockout, or FEAT-004 behavior.

## Technical Context

**Language/Version**: TypeScript on Node.js 22 baseline from FEAT-001.

**Primary Dependencies**: Express API foundation, Zod validation, FEAT-002 repositories/Prisma models, Argon2id-capable password hashing library.

**Storage**: PostgreSQL identity tables from FEAT-002.

**Testing**: Vitest for unit and integration tests, Supertest for API contract tests, PostgreSQL-backed DB tests for persistence and atomicity.

**Target Platform**: API workspace in the npm workspaces monorepo.

**Project Type**: Modular monolith with `apps/api`, `apps/web`, and `packages/shared`.

**Performance Goals**: Registration should complete within a practical interactive latency budget for a single user request while preserving secure hashing cost. Exact production tuning may be revisited after deployment benchmarking.

**Constraints**:

- Argon2id baseline must not be weakened below approved parameters.
- Password values and hashes must never be logged or returned.
- Registration persistence must be atomic.
- Database uniqueness remains authoritative for identity conflicts.
- Prisma remains behind repositories.
- No later Phase 2 behavior may be implemented.

## Architecture Decisions

### Decision 1: Registration Service Orchestrates Validation, Hashing, and Persistence

Use a registration service boundary to coordinate validation, email normalization, password hashing, duplicate handling, and repository calls.

**Rationale**: Controllers should parse/validate and delegate; repositories should persist. The service is the correct place for registration orchestration and transaction ownership.

**Rejected Alternatives**:

- Hash and persist directly in controller: rejected by code standards layering.
- Put registration business rules in repository: rejected because repositories should not own request-level behavior.

**Implications**:

- FEAT-004 login can reuse credential structures without inheriting registration controller logic.
- Tests can target validation, service behavior, and HTTP contract separately.

### Decision 2: Argon2id Baseline

Use Argon2id with at least memoryCost 19456 KiB, timeCost 2, parallelism 1, unique per-password salt, and encoded hash storage.

**Rationale**: Matches Human preference and current OWASP minimum Argon2id guidance while remaining practical for development and CI.

**Rejected Alternatives**:

- bcrypt: viable legacy option but not selected for greenfield Phase 2.
- PBKDF2: reserved for future compliance-driven requirements.
- Fast hashes such as SHA-256: rejected for password storage.

**Implications**:

- FEAT-003 may add an Argon2id dependency if no current package supports it.
- CI may need enough memory/time budget for password hashing tests.
- FEAT-004 must verify passwords using the same encoded hash format.

### Decision 3: Registration Does Not Authenticate the User

Successful registration creates identity and credentials only.

**Rationale**: FEAT-004 owns login and access-token issuance; FEAT-005 owns refresh tokens; separating them keeps QA boundaries small.

**Rejected Alternatives**:

- Auto-login after registration: rejected as FEAT-004/FEAT-005 scope creep.
- Issue refresh cookie on registration: rejected because refresh rotation belongs to FEAT-005.

**Implications**:

- Response contains safe user/account fields only.
- Frontend can later decide to route users to login after registration.

### Decision 4: Duplicate Handling Uses Pre-check Plus Database Constraint

Registration may pre-check for existing normalized email for clearer error handling, but database uniqueness remains the final authority.

**Rationale**: Prevents race conditions while allowing stable client-facing errors.

**Rejected Alternatives**:

- Pre-check only: race-prone.
- Raw database error passthrough: violates error handling standards.

**Implications**:

- Tests must cover duplicate requests and database conflict mapping.
- Error mapping must avoid raw Prisma/database leakage.

## Constitution Check

The `.specify/memory/constitution.md` file is still a placeholder, so no ratified constitution gates can be enforced from that file.

Applied governance from project context:

- Greenfield rebuild: PASS.
- Modular monolith first: PASS.
- PostgreSQL durable source of truth: PASS.
- Prisma behind repositories: PASS.
- Zod validation: PASS.
- No fallback secrets or credential leakage: PASS.
- Server trust boundary preserved: PASS.
- No scope creep into FEAT-004 through FEAT-010: PASS.
- No fake validation evidence: PASS.
- Human approval before implementation: REQUIRED.

## Project Structure

Expected source areas, subject to existing FEAT-001/FEAT-002 layout:

```text
apps/api/
  src/
    modules/
      auth/
        registration.controller.ts
        registration.route.ts
        registration.schema.ts
        registration.service.ts
        password-hashing.service.ts
        password-policy.ts
    shared/
      errors/
  tests/
    unit/
    integration/
packages/shared/
  src/
    schemas/
    types/
```

Rules:

- Public API contract schemas may live in `packages/shared` only if they are truly cross-boundary contracts.
- Domain orchestration belongs in `apps/api/src/modules/auth`.
- Prisma access remains in FEAT-002 repository modules.
- Registration routes must attach to existing Express app conventions without disrupting health/logging/error middleware.

## API Contract

Conceptual route:

```text
POST /auth/register
```

The exact prefix may follow current API routing conventions, but it must be documented and tested.

Request:

```json
{
  "email": "user@example.com",
  "password": "correct horse battery staple",
  "displayName": "Optional Name"
}
```

Validation:

- `email`: required, syntactically valid email, trimmed, lowercased before persistence.
- `password`: required, at least 12 characters, denied if it matches explicit common/demo password denylist.
- `displayName`: optional, trimmed if supplied, bounded length, response-safe.

Success response:

```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "displayName": "Optional Name",
    "status": "ACTIVE",
    "createdAt": "..."
  }
}
```

Forbidden response fields:

- password
- passwordHash
- credential ID
- role/user-role internals
- access token
- refresh token
- refresh session
- auth secret values
- raw database error details

Errors must use the existing stable error envelope.

## Password Policy

Minimum policy:

- At least 12 characters.
- Maximum length should be bounded to prevent abuse; 128 characters is the recommended upper bound unless implementation constraints justify another value.
- Reject a small explicit denylist such as `password`, `password123`, `123456789012`, `qwerty123456`, `aura123456789`, and other obvious demo/common values.
- Do not require composition rules if length and denylist are enforced; composition rules often reduce usability without reliably improving strength.
- Do not log or echo rejected password values.

## Data and Transaction Strategy

FEAT-003 reuses FEAT-002 models:

- `User`
- `Credential`

Registration transaction requirements:

- Normalize email.
- Hash password.
- Create user and credential atomically.
- If credential creation fails, user creation must not remain committed.
- If duplicate normalized email is detected, no credential must be created.
- Database uniqueness must still protect races.
- Duplicate race handling must map the PostgreSQL unique constraint failure to a safe registration conflict; pre-check logic alone is not sufficient protection.

Implementation may add a transaction-capable repository method or unit-of-work helper if existing FEAT-002 boundaries do not support atomic multi-record creation. Any such helper must keep Prisma hidden from controllers.

## Validation Strategy

Implementation must provide evidence for:

- Request schema validation.
- Email normalization.
- Password policy validation.
- Argon2id hash format and parameters.
- Unique salt behavior.
- Successful user + credential persistence.
- Duplicate identity rejection.
- Atomic rollback on persistence/hash failure where practically testable.
- Safe response shape.
- Safe error envelope.
- No password/hash logging.
- No token/session/RBAC/admin/audit behavior.
- FEAT-001 and FEAT-002 regression validation.

Required commands:

```text
npm run clean
npm run lint
npm run typecheck
npm run build
npm run test
npm run test:db
npx prisma validate --schema=apps/api/prisma/schema.prisma
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```

Database-backed registration tests must target an isolated test database under FEAT-002 guard rules.

## Risks

- Argon2id native dependency may require build tooling or CI compatibility checks.
- Hashing cost may slow tests if parameters are over-tuned without test strategy.
- Duplicate handling may accidentally expose account enumeration details.
- Transaction boundaries may leak Prisma internals if not carefully placed.
- Auto-login or token issuance may slip into registration if scope is not enforced.
- Passwords or hashes may leak through debug logs or error serialization.

## Quality Gates

FEAT-003 cannot pass QA unless:

- Every acceptance criterion in `acceptance.md` is PASS or explicitly waived by Human.
- Registration creates secure password credentials with Argon2id.
- No plaintext password is persisted, returned, or logged.
- No password hash is returned or logged.
- Duplicate identity handling is stable and safe.
- DB-backed registration persistence is verified against isolated PostgreSQL.
- FEAT-001 and FEAT-002 regression checks pass.
- Implementation remains within FEAT-003 scope.
- `reports/implementation/phase-2/FEAT-003.md` exists and maps requirements, tasks, tests, validation, and acceptance.
