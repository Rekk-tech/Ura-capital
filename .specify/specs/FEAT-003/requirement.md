# Requirement: FEAT-003 Registration & Password Security

**Status**: APPROVED  
**Created**: 2026-08-25  
**Owner**: Codex as Planner + Architect + QA/QC Governance Owner  
**Implementation Agent**: Antigravity after Human approval  
**Phase**: Phase 2 - Identity & Security

## Source Context

This requirement is derived from:

- `docs/project-overview.md`
- `docs/architecture-context.md`
- `docs/final-technology-decisions.md`
- `docs/environment-strategy.md`
- `docs/adrs/ADR-003-postgresql-and-prisma.md`
- `docs/adrs/ADR-004-authentication-token-strategy.md`
- `docs/code-standards.md`
- `docs/ai-workflow-rules.md`
- `docs/progress-tracker.md`
- `docs/phase-2-feature-decomposition.md`
- `.specify/specs/FEAT-002/`
- `reports/qa/phase-2/FEAT-002-QA.md`
- OWASP Password Storage Cheat Sheet for Argon2id baseline guidance

Human decisions already approved:

- FEAT-002 is Human Final Gate APPROVED/PASS.
- FEAT-003 is the next active Phase 2 feature.
- Email verification is out of scope for Phase 2.
- Password hashing algorithm must be decided in FEAT-003.
- Preferred password hashing baseline is Argon2id.
- Hard account lockout is not required in Phase 2.
- Authentication endpoint rate limiting is required later in Phase 2, but FEAT-003 does not implement rate limiting unless a non-behavioral contract note is needed.

## Problem

Aura Capital cannot safely expose login or token issuance until the system can register users with validated input and secure password handling.

FEAT-002 established identity persistence, credential persistence boundaries, database constraints, auth configuration, and isolated database tests. FEAT-003 must add the first user-facing identity behavior: registration. The implementation must create users and password credentials safely without leaking passwords, hashes, database errors, or account internals.

The key risks are:

- Weak or ambiguous password hashing.
- Plaintext password persistence or accidental logging.
- Duplicate account handling that leaks implementation details or enables user enumeration beyond the registration context.
- Bypassing FEAT-002 repository boundaries.
- Scope creep into login, token issuance, refresh tokens, RBAC, admin guards, or audit event behavior.

## Goal

Define and implement a secure registration capability that:

- Accepts a public registration request.
- Validates request shape and input constraints.
- Normalizes the identity identifier consistently with FEAT-002.
- Enforces a clear password policy.
- Hashes passwords using Argon2id.
- Persists user and credential records through FEAT-002 repository boundaries.
- Rejects duplicate identities safely.
- Returns a safe registration response without tokens, password data, credential internals, role internals, or session data.
- Provides focused tests and validation evidence.

## In Scope

- Registration API contract.
- Request validation using Zod or the approved validation approach.
- Email identity normalization.
- Password policy definition and validation.
- Password hashing using Argon2id.
- Explicit Argon2id parameter baseline.
- Credential creation using FEAT-002 persistence model and repository boundary.
- Duplicate email/identity handling.
- Stable safe error responses.
- Tests for validation, normalization, hashing, duplicate rejection, persistence, safe response shape, and no sensitive logging.
- PostgreSQL-backed registration persistence test using isolated test database.
- Documentation/implementation report updates required for FEAT-003.

## Out of Scope

- Login.
- Access-token issuance or verification.
- Refresh-token issuance, rotation, reuse detection, revocation, or cookies.
- Logout.
- RBAC enforcement.
- Admin guard.
- Authentication audit event emission.
- Email verification.
- Account lockout.
- Authentication endpoint rate-limit enforcement.
- Password reset.
- Social/OAuth login.
- User profile management beyond fields required by registration.
- FEAT-004 or later work.

## Stakeholders

- Human/Product Owner: approves FEAT-003 spec before implementation and final result after QA.
- Codex: produces specification and later performs independent QA/QC.
- Antigravity: implements after Human approval.
- Future FEAT-004 login implementer: depends on secure credential records.
- Future FEAT-009 audit implementer: may later attach audit events to registration, but FEAT-003 must not emit them.

## Primary User Need

As a new Aura Capital user, I need to create an account safely so I can later log in and access the platform without my password being exposed, stored in plaintext, or returned by the system.

## Key Constraints

- FEAT-002 repository and database boundaries must be reused.
- PostgreSQL remains the durable source of truth.
- Prisma must remain hidden behind repository boundaries.
- Passwords must be hashed using Argon2id unless a blocking implementation constraint is discovered and escalated before coding.
- Passwords, password hashes, auth secrets, tokens, and raw database errors must not appear in responses or logs.
- Registration must not issue access tokens or refresh tokens.
- Registration must not automatically implement login.
- Duplicate identity rejection must use a stable safe error envelope.
- Validation must be explicit and tested.
- Database-backed tests must use isolated test database rules from FEAT-002.

## Assumptions

- Email is the registration identity identifier for FEAT-003.
- Email matching is case-insensitive through normalization to lowercase trimmed value.
- Display name is optional unless the implementation needs a profile-safe value for response shape.
- Password policy can be stricter than minimum UX expectations because this is a financial learning platform.
- Argon2id library choice is an implementation detail, but it must support the approved parameters and encoded hash verification by FEAT-004.
- Rate limiting will be implemented in a later Phase 2 feature, not FEAT-003.
