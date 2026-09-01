# Requirement: FEAT-016 Product Audit Abstraction & Governance

**Status**: PROPOSED FOR HUMAN REVIEW  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Feature Type**: Implementation feature  
**Implementation Agent**: Antigravity after Human approval  
**QA Owner**: Codex  

## 1. Context

FEAT-009 created the approved authentication/security audit system for Phase 2. Its `AuthSecurityAuditRecord` semantics are intentionally scoped to identity, authentication, authorization, roles, and session security events. Human has explicitly locked that FEAT-016 must not extend `AuthSecurityAuditRecord` for product-domain events and must preserve FEAT-009 authentication/security audit semantics exactly.

Phase 3 now needs a shared product audit abstraction and governance model for future Academy, Simulation, Community, Subscription, AI, and other product-domain features. FEAT-016 defines how those future domains should decide event taxonomies, actor/subject semantics, metadata rules, transactional coupling, retention, and repository/service boundaries without creating a concrete product audit table yet.

## 2. Goal

Define a product-domain audit governance contract that future domain features can implement consistently, while keeping authentication/security audit records separate and unchanged.

## 3. In Scope

- Separation between auth/security audit and product-domain audit.
- Product audit event taxonomy governance.
- Actor, subject, object, and resource semantics for future product events.
- Request/correlation ID propagation rules.
- Operation source rules.
- Metadata allowlist, sanitization, and size governance.
- Append-only expectations for future durable product audit records.
- Transactional coupling policy.
- Best-effort versus state-first audit policy.
- Sensitive-data and PII prohibitions.
- Retention/deletion governance.
- Idempotency and duplicate event considerations.
- Observability logs versus durable audit distinction.
- Repository/service abstraction expectations.
- Future domain extensibility and schema activation criteria.
- Documentation and tests/guards that prove the governance boundary without creating concrete product-domain tables.
- Implementation evidence in `reports/implementation/phase-3/FEAT-016.md`.

## 4. Out of Scope

- Modifying `AuthSecurityAuditRecord` semantics.
- Extending auth/security audit taxonomy beyond FEAT-009.
- Creating product-domain audit tables or Prisma models.
- Creating Academy, Simulation, Community, Subscription, AI, or placeholder product-domain schemas.
- Creating product APIs, audit read/search/update/delete APIs, or audit UI.
- Emitting product-domain audit events from runtime behavior.
- Changing FEAT-009 auth/security audit behavior.
- Redis-backed durable audit authority.
- Global soft-delete policy.
- FEAT-017 seed strategy.
- FEAT-018 Phase 3 final gate.
- Phase 4 implementation.

## 5. Functional Requirements

- **FR-001**: FEAT-016 MUST define auth/security audit and product-domain audit as separate audit categories with separate ownership and lifecycle.
- **FR-002**: FEAT-016 MUST preserve FEAT-009 authentication/security audit semantics exactly.
- **FR-003**: FEAT-016 MUST NOT extend `AuthSecurityAuditRecord` for product-domain events.
- **FR-004**: FEAT-016 MUST NOT create a concrete product-domain audit table, Prisma model, migration, API, or UI.
- **FR-005**: Product audit persistence, when activated by a future domain feature, MUST use PostgreSQL as durable system of record.
- **FR-006**: Redis, in-memory state, logs, files, or client state MUST NOT be durable product audit authority.
- **FR-007**: Product audit event taxonomy MUST be domain-owned, canonical, centrally registered, and reviewed through the owning feature spec before implementation.
- **FR-008**: Product audit event names MUST be stable, explicit, and domain-qualified enough to avoid collision with auth/security audit events.
- **FR-009**: Product audit events MUST define actor, subject, object/resource, operation source, request/correlation ID, outcome, occurredAt, and metadata expectations before implementation.
- **FR-010**: Actor and subject IDs for future product events MUST be server-derived snapshots and MUST NOT trust public client-provided identity or role claims.
- **FR-011**: Request/correlation IDs MUST come from server request context or trusted infrastructure context, not request body/query authority.
- **FR-012**: `operationSource` MUST use approved server-controlled values only.
- **FR-013**: Metadata MUST be flat, event-specific, allowlisted, sanitized, and size-limited.
- **FR-014**: Product audit metadata MUST NOT persist passwords, password hashes, access tokens, refresh tokens, cookies, Authorization headers, secrets, credentials, database URLs, Redis URLs, raw request bodies, raw stack traces, raw Prisma/database errors, or unapproved sensitive PII.
- **FR-015**: Metadata maximum serialized size strategy MUST be defined. Baseline maximum is 2 KiB unless a later Human-approved domain spec explicitly changes it.
- **FR-016**: Product audit records, once implemented by a future feature, MUST be append-only under normal application behavior.
- **FR-017**: FEAT-016 MUST define when transactional coupling is required.
- **FR-018**: FEAT-016 MUST define when best-effort audit is acceptable.
- **FR-019**: FEAT-016 MUST define when state-first behavior is required and when audit failure must not roll back business state.
- **FR-020**: Audit failure MUST never make authorization, authentication, entitlement, financial, or other security-sensitive denial permissive.
- **FR-021**: Future domain features MUST explicitly classify each product audit event as transactionally coupled, state-first, or best-effort.
- **FR-022**: Future product audit abstractions MUST stay behind service/repository boundaries; controllers MUST NOT write durable audit rows directly.
- **FR-023**: Future product audit repositories MUST use FEAT-013 transaction/context conventions and FEAT-014 constraint standards.
- **FR-024**: Raw SQL for audit work, if ever required, MUST be contained to approved repository/infrastructure/migration/test locations and justified by the owning feature.
- **FR-025**: Product audit retention/deletion policy MUST be deferred to explicit Human-approved retention governance and MUST NOT be implemented silently.
- **FR-026**: FEAT-016 MUST define idempotency and duplicate-event considerations for future events, including when duplicate audit records are acceptable versus when idempotency keys are required.
- **FR-027**: FEAT-016 MUST clearly distinguish operational observability logs from durable audit records.
- **FR-028**: Future product audit schema activation requires an owning domain feature, explicit Human approval, migration review, retention posture, sensitive-data review, and QA validation.
- **FR-029**: FEAT-016 MUST include deterministic tests or static checks proving no `AuthSecurityAuditRecord` product-domain extension, no product audit table/migration/API/UI, and no product-domain schema creep.
- **FR-030**: FEAT-016 MUST preserve FEAT-001 through FEAT-015 behavior.
- **FR-031**: Implementation evidence MUST record the abstraction/governance decisions, files changed, test evidence, AC mapping, limitations, and confirmation that FEAT-017 was not started.

## 6. Non-Functional Requirements

- Product audit guidance must be precise enough for later features to implement without re-litigating shared policy.
- The abstraction must not force a single global taxonomy across unrelated product domains.
- The governance model must support PostgreSQL transactions, append-only auditability, and future privacy/retention decisions.
- Public clients must not be able to create, mutate, read, or delete audit records through FEAT-016.
- Documentation and tests must be independently reviewable by Codex QA.

## 7. Dependencies

- FEAT-009 DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-011 DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-012 DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-013 DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-014 DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-015 DONE / QA PASS / Human Final Gate APPROVED.
- ADR-003 PostgreSQL/Prisma repository boundary.
- Approved Phase 3 feature decomposition.

## 8. Success Definition

FEAT-016 succeeds when the repository contains a clear, enforceable product audit abstraction/governance baseline that future domain features can adopt, while proving that FEAT-009 auth/security audit semantics and existing runtime behavior remain unchanged.

## 9. Open Questions

None blocking for spec review.

Future domain features must still decide concrete event taxonomy, persistence schema, indexes, retention posture, idempotency keys, read access, and transaction coupling for their own product audit events.
