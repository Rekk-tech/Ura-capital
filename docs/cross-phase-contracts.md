# Aura Capital - Cross-Phase Contracts

Status: HUMAN APPROVED  
Date: 2026-09-07  
Purpose: Freeze contracts that allow DEV-B to work safely before DEV-A completes Phase 4/5.

Human Approval:

```text
CROSS-PHASE CONTRACT GOVERNANCE: APPROVED
```

## 1. Contract Status

- FROZEN: downstream development may rely on this contract.
- PROVISIONAL: downstream may mock it, but integration requires producer confirmation.
- INTERNAL: not safe for cross-phase dependency.

Frozen contract change policy:

```text
CONTRACT CHANGE REQUEST
-> Codex architecture impact review
-> affected Phase impact analysis
-> Human approval if behavior/security/product semantics change
```

A FROZEN contract cannot be changed independently by a Phase developer. Downstream developers must not invent upstream behavior.

## 2. Frozen Contracts

### Authenticated User Context

Producer Phase: Phase 2  
Consumer Phases: Phase 4, Phase 5, Phase 6, Phase 7, Phase 8  
Status: FROZEN

Schema/type:

- Server-derived user id from verified access token.
- Roles are not trusted from JWT or client input.
- PostgreSQL is role authority.

Error behavior:

- Missing/invalid/expired token: safe authentication failure.
- Forbidden role/ownership: safe authorization failure.

Ownership:

- Auth module owns authentication.
- Domain modules own domain-specific ownership checks.

Lifecycle semantics:

- Access tokens are short-lived.
- Refresh/session lifecycle remains Phase 2-owned.

Version/change policy:

- Any change to token claims, role authority, or error envelope requires Codex architecture review.

### Repository and Unit of Work

Producer Phase: Phase 3  
Consumer Phases: Phase 4, Phase 5, Phase 6, Phase 7  
Status: FROZEN

Schema/type:

- Controllers do not import Prisma.
- Services orchestrate repositories and transactions.
- Repositories may use Prisma and approved raw SQL.
- Transaction context must be propagated; nested transaction misuse fails fast.

Error behavior:

- Database errors map to safe application errors.
- No raw SQL, credentials, URLs, or internal paths in responses/logs.

Ownership:

- Shared infrastructure is protected.
- Domain phases own their repositories.

Version/change policy:

- Changes to `TransactionRunner`, repository factory, or guard boundaries require Codex architecture review.

### Migration Governance

Producer Phase: Phase 3  
Consumer Phases: Phase 4, Phase 5, Phase 6, Phase 7  
Status: FROZEN

Schema/type:

- Use Prisma migrations with `migrate deploy`, `migrate status`, and `prisma validate`.
- No `db push` as governance.
- Fresh DB and upgrade DB validation are mandatory for schema phases.

Error behavior:

- Unsafe DB targets fail closed before mutation.
- Destructive/data-loss migrations require Human approval.

Ownership:

- Each phase owns only its domain migration files.
- Applied approved migrations are immutable.

Version/change policy:

- Migration ordering ranges are reserved per phase in `docs/phase-ownership-matrix.md`.

### Redis Boundary

Producer Phase: Phase 3  
Consumer Phases: Phase 5, Phase 6, Phase 7, Phase 8  
Status: FROZEN

Schema/type:

- Redis is transient/distributed state only.
- Keys must be namespaced, TTL-bound where applicable, and sanitized in diagnostics.

Error behavior:

- Outage behavior must be feature-defined.
- Redis must not be the only durable authority for business state.

Ownership:

- Shared Redis infrastructure is protected.
- Domain modules own feature-specific key prefixes.

Version/change policy:

- Any durable Redis proposal requires new Human-approved architecture decision.

### Product Audit Governance

Producer Phase: Phase 3  
Consumer Phases: Phase 4, Phase 5, Phase 6, Phase 7  
Status: FROZEN

Schema/type:

- Auth/security audit remains separate from product-domain audit.
- Product audit event metadata is allowlisted, sanitized, flat, and size-limited.
- Transaction strategy must be exactly one of: `TRANSACTIONALLY_COUPLED`, `STATE_FIRST`, `BEST_EFFORT`.

Error behavior:

- Audit failure must never make security denial permissive.
- Transactionally coupled audit may block business state when absence of audit invalidates the mutation.

Ownership:

- Each domain owns event taxonomy proposals.
- Concrete product audit persistence requires Human approval.

Version/change policy:

- `AuthSecurityAuditRecord` must not be repurposed.

## 3. Provisional Contracts

### Simulation Read Context for AI

Producer Phase: Phase 5  
Consumer Phase: Phase 8  
Status: PROVISIONAL

Schema/type:

- Read-only `SimulationContextSnapshot` containing session id, simulated status, portfolio summary, recent trades/events, and explicit simulated-data marker.

Change policy:

- May change during Phase 5. Phase 8 may mock it, but cannot integrate until FEAT-040 freezes it.

### Academy Learning Context for AI

Producer Phase: Phase 4  
Consumer Phase: Phase 8  
Status: PROVISIONAL

Schema/type:

- Read-only learning context with course/lesson progress, quiz outcomes, and no pre-submission correct answers.

Change policy:

- May change until FEAT-030.

### Entitlement Check

Producer Phase: Phase 7  
Consumer Phases: Phase 5, Phase 6, Phase 8  
Status: PROVISIONAL until FEAT-051, then FROZEN

Schema/type:

- `assertEntitlement(userId, entitlementKey)` or middleware equivalent.
- Server-derived user only.

Error behavior:

- Missing entitlement returns safe 403/entitlement-required envelope.

Change policy:

- Consumers may mark premium gates as TODO until FEAT-051 freezes enforcement.

## 4. Internal Contracts

Domain internals such as simulation pricing algorithms, community moderation scoring, provider-specific subscription payloads, and AI prompt templates are INTERNAL until their owning feature freezes them.
