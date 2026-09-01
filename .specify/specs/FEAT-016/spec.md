# Specification: FEAT-016 Product Audit Abstraction & Governance

**Status**: PROPOSED FOR HUMAN REVIEW  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Feature ID**: FEAT-016  
**Scope**: Product audit abstraction and governance only

## 1. User Stories

### Story 1 - Keep Security Audit Separate

As a security reviewer, I need FEAT-009 authentication/security audit semantics to remain unchanged so product-domain planning cannot weaken the security audit trail.

Independent test:

- Source/schema review confirms `AuthSecurityAuditRecord` remains auth/security scoped.
- No product-domain event names, metadata, or schema changes are added to `AuthSecurityAuditRecord`.

### Story 2 - Govern Future Product Audit Events

As an architect, I need future product domains to share audit rules for taxonomy, actors, metadata, transaction behavior, and retention decisions.

Independent test:

- A product audit governance document defines MUST, SHOULD, and DOMAIN-SPECIFIC rules.
- It includes event classification, actor/subject/object semantics, operation source, metadata rules, and transaction coupling policy.

### Story 3 - Avoid Premature Schema

As a product owner, I need Phase 3 to avoid speculative Academy, Simulation, Community, Subscription, AI, or product-audit schema until a real domain feature owns it.

Independent test:

- Prisma schema and migrations contain no new product-domain audit tables or placeholder domain tables.
- Runtime routes/controllers contain no product audit APIs or UI.

### Story 4 - Make Future Implementation Testable

As a QA reviewer, I need objective acceptance criteria and guardrails that can detect scope creep, unsafe metadata, and audit-authority mistakes.

Independent test:

- Static tests or guard tests prove prohibited schema/API/AuthSecurityAuditRecord changes are absent.
- Regression suites for FEAT-009 and FEAT-011 through FEAT-015 remain green.

## 2. Audit Boundary

### Auth/Security Audit

Owned by FEAT-009 and Phase 2 Identity & Security.

Examples:

- Registration success.
- Login success/failure.
- Refresh success/failure/replay.
- Logout success.
- Authentication failure taxonomy.
- Authorization denied for approved auth/admin boundary.
- Role assigned/removed.

Rules:

- Existing FEAT-009 semantics are preserved exactly.
- `AuthSecurityAuditRecord` must not become a generic product audit table.
- Auth/security audit writes retain FEAT-009 transactional strategy.

### Product-Domain Audit

Owned by future domain features.

Examples that may be considered later:

- Lesson progress changes.
- Simulation order placement.
- Portfolio or entitlement state transitions.
- Community moderation decisions.
- AI quota or prompt-policy decisions.

Rules:

- FEAT-016 defines governance only.
- Concrete product-domain audit table/schema is deferred.
- Future product audit persistence must be PostgreSQL-backed.
- Redis/in-memory/logs/files/client state are not durable audit authority.

## 3. Proposed Abstraction

FEAT-016 should define a shared conceptual contract for future product audit emitters without requiring runtime product behavior now.

Recommended future abstraction shape:

```text
ProductAuditEventDefinition
  eventType
  domain
  outcome
  actor
  subject
  object/resource
  operationSource
  requestId/correlationId
  metadataSchema
  couplingStrategy
  idempotencyPolicy
  retentionClass
```

Recommended future service boundary:

```text
Domain Service
  -> ProductAuditEmitter interface
      -> ProductAuditRepository interface
          -> PostgreSQL implementation in owning domain feature
```

FEAT-016 may add documentation and test-only/static governance checks for this abstraction. It must not add production product audit persistence.

## 4. Classification Rules

### MUST

- Keep auth/security audit separate from product-domain audit.
- Preserve FEAT-009 behavior exactly.
- Use PostgreSQL for future durable product audit persistence.
- Keep future audit writes behind service/repository boundaries.
- Use server-derived actor/subject/resource and request/correlation context.
- Use server-controlled operation source values.
- Use flat allowlisted sanitized metadata.
- Prohibit sensitive values in metadata, logs, responses, and reports.
- Classify each future event's transaction strategy before implementation.
- Require Human approval before concrete product audit schema activation.

### SHOULD

- Use domain-qualified event names.
- Use explicit outcome enums.
- Prefer immutable event definitions once released.
- Include idempotency keys for externally retried or at-least-once workflows.
- Include safe correlation IDs to connect durable audit records with observability logs.
- Define retention class before broad event volume grows.

### DOMAIN-SPECIFIC DECISION

- Exact event taxonomy.
- Whether actor, subject, and object are nullable.
- Which resource identifiers are stored.
- Which metadata fields are allowed.
- Which indexes are needed.
- Whether duplicate events are acceptable.
- Whether an event is transactionally coupled, state-first, or best-effort.
- Retention duration and deletion/anonymization process.
- Whether future read/search APIs exist and who may access them.

## 5. Event Taxonomy Governance

Future product audit event names must be:

- Canonical constants, not scattered strings.
- Domain-owned.
- Stable after release unless migration/governance explicitly approves a change.
- Descriptive enough to avoid collision with auth/security events.
- Reviewed with the owning feature's requirement/spec/acceptance package.

Recommended pattern:

```text
<DOMAIN>_<RESOURCE>_<ACTION>_<OUTCOME>
```

Example only, not implemented in FEAT-016:

```text
SIMULATION_ORDER_SUBMITTED
ACADEMY_LESSON_COMPLETED
```

These examples must not appear as persisted production event records until their owning domain features approve them.

## 6. Actor / Subject / Object Semantics

Future product audit event definitions must identify:

- **Actor**: the authenticated user, service account, system job, or operational actor that initiated the operation.
- **Subject**: the user or principal affected by the operation, if different from actor.
- **Object/resource**: the product entity affected by the operation.
- **Request/correlation ID**: server-derived request or job context for investigation.

Rules:

- Public client-provided user IDs, roles, admin flags, request IDs, or operation sources are not audit authority.
- Null actor/subject may be valid only when explicitly justified by the owning domain feature.
- Stored identifiers are snapshots for audit investigation, not mandatory authorization authority.

## 7. Operation Source

Allowed operation sources must be server-controlled values such as:

- `USER_REQUEST`
- `SYSTEM_JOB`
- `ADMIN_OPERATION`
- `INTERNAL_MAINTENANCE`
- `TEST_FIXTURE`

Future features may add values only through their approved spec.

Public request bodies, query parameters, headers, or client claims must not directly set `operationSource`.

## 8. Metadata Governance

Metadata must be:

- Event-specific.
- Flat.
- Allowlisted.
- Sanitized before persistence.
- Bounded to maximum 2 KiB serialized size by default.
- Safe for security review and operational support.

Prohibited metadata:

- Passwords or password hashes.
- Access tokens, refresh tokens, JWTs, token verifiers, cookies, Authorization headers.
- Secrets, API keys, database URLs, Redis URLs, credentials.
- Raw request bodies.
- Raw stack traces or raw Prisma/database errors.
- Raw SQL with values.
- Unapproved raw email, phone, address, full name, financial account identifiers, or other sensitive PII.
- Client-provided role/admin claims.

Future features must document any PII field before implementation and include privacy/risk rationale.

## 9. Transaction Strategy

Each future product audit event must be classified before implementation.

### Transactionally Coupled

Use when the business state and audit record must either both commit or both roll back.

Required for:

- Privilege/entitlement grants where missing audit would make investigation unacceptable.
- Financial/order/state transitions where audit absence would create material integrity risk.
- Human-approved domain events that require strict audit completeness.

If audit persistence fails, the related business mutation must roll back and return a safe error.

### State-First

Use when the security/data-integrity state must commit even if audit persistence fails.

Required for:

- Revocations, removals, denials, invalidations, or risk-reducing operations where rolling back due to audit failure would leave unsafe state.

If audit persistence fails, the state change remains committed and a sanitized operational log is allowed.

### Best-Effort

Use when audit absence is acceptable and the primary operation should not be blocked.

Allowed for:

- Low-risk informational events.
- User-visible operations where audit is useful but not required for correctness.

Best-effort audit failure must be logged safely and must not recursively emit audit events.

## 10. Retention And Deletion Governance

FEAT-016 does not implement retention/deletion behavior.

Future features must define:

- Retention class.
- Legal/privacy rationale.
- Whether deletion, anonymization, aggregation, or archival is required.
- Impact on append-only audit expectations.
- Human approval before production activation.

Audit retention remains deferred until an owning domain feature or production-hardening phase requires concrete implementation.

## 11. Idempotency And Duplicate Events

Future event definitions must state whether duplicate audit records are:

- Prohibited and guarded by idempotency key.
- Acceptable because each attempt is meaningful.
- Collapsed by downstream reporting, not persistence.

External retries, provider callbacks, background jobs, and financial/order-like operations SHOULD use idempotency keys or deterministic event correlation where applicable.

## 12. Observability Versus Durable Audit

Operational logs, metrics, traces, and health signals are not durable audit records.

Rules:

- Logs may help diagnose audit write failures but do not satisfy audit persistence requirements.
- Durable product audit, when activated, must be PostgreSQL-backed.
- Logs must not contain sensitive metadata or full audit payloads.
- Audit failures must use sanitized operational categories and correlation IDs.

## 13. Schema Activation Criteria

A future feature may activate product audit persistence only when it includes:

- Owning domain and event taxonomy.
- Concrete Prisma/PostgreSQL schema proposal.
- Migration review under FEAT-012.
- Constraint review under FEAT-014.
- Repository/transaction design under FEAT-013.
- Metadata allowlist and PII review.
- Retention/deletion posture.
- Transaction strategy per event.
- Unit, integration, PostgreSQL-backed, security, and regression tests.
- Human approval.

## 14. Validation Strategy

FEAT-016 implementation must provide:

- Documentation for product audit governance and abstraction.
- Tests or static checks proving no product-domain audit table/schema/migration/API/UI was introduced.
- Tests or source review evidence proving `AuthSecurityAuditRecord` semantics remain unchanged.
- Tests for metadata policy examples/sentinels and maximum-size strategy.
- Tests for transaction-strategy classification rules.
- Regression validation for FEAT-009 and FEAT-011 through FEAT-015.

Required validation commands:

```text
npm run clean
npm run lint
npx prisma validate --schema=apps/api/prisma/schema.prisma
npm run typecheck
npm run build
npm run test
npm run test:db
npm run test:redis
npm run guard:persistence
npm run guard:migration
npm run guard:boundary
```

If a product audit governance guard is added, it must run deterministically from repository root.

## 15. Regression Boundary

FEAT-016 must preserve:

- FEAT-009 auth/security audit semantics, taxonomy, transaction strategy, metadata policy, and PostgreSQL authority.
- FEAT-011 persistence guard.
- FEAT-012 migration governance.
- FEAT-013 repository/transaction boundary.
- FEAT-014 constraint standards.
- FEAT-015 Redis transient boundary.
- FEAT-001 through FEAT-010A behavior.

## 16. Acceptance Mapping

- Audit boundary and FEAT-009 preservation: AC-001 through AC-006
- Product audit governance and abstraction: AC-007 through AC-018
- Security/privacy/retention/idempotency: AC-019 through AC-026
- Scope guards, tests, regression, and governance: AC-027 through AC-036

## 17. Human Review Notes

FEAT-016 is a foundation feature for future audit work. It may add documentation, shared abstractions, and guard/tests, but it must not create durable product audit storage or start any product domain.
