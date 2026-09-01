# Acceptance Criteria: FEAT-016 Product Audit Abstraction & Governance

**Status**: PROPOSED FOR HUMAN REVIEW

## 1. Acceptance Matrix

| ID | Criterion | Verification |
|----|-----------|--------------|
| AC-001 | Product audit governance explicitly separates auth/security audit from product-domain audit. | Docs review. |
| AC-002 | FEAT-009 authentication/security audit semantics, taxonomy, and transaction strategy remain unchanged. | Source/schema/test review. |
| AC-003 | `AuthSecurityAuditRecord` is not extended, renamed, repurposed, or used for product-domain events. | Prisma/schema/source review. |
| AC-004 | No product-domain audit event names are added to FEAT-009 auth/security audit taxonomy. | Source/test review. |
| AC-005 | Future durable product audit authority is defined as PostgreSQL. | Docs review. |
| AC-006 | Redis, in-memory state, logs, files, and client state are explicitly prohibited as durable product audit authority. | Docs/source review. |
| AC-007 | Product audit event taxonomy governance is defined and requires owning feature approval before implementation. | Docs review. |
| AC-008 | Event naming rules require canonical, stable, domain-owned constants and avoid collision with auth/security events. | Docs/tests review. |
| AC-009 | Actor, subject, object/resource, outcome, occurredAt, and request/correlation ID semantics are defined. | Docs review. |
| AC-010 | Actor/subject/resource and role/admin identity data are server-derived and not trusted from public client input. | Docs/source review. |
| AC-011 | Request/correlation IDs come from server request or infrastructure context, not body/query authority. | Docs/tests review. |
| AC-012 | `operationSource` uses approved server-controlled values only. | Docs/tests review. |
| AC-013 | Metadata governance requires flat, event-specific, allowlisted, sanitized metadata. | Docs/tests review. |
| AC-014 | Metadata maximum serialized size strategy is defined with 2 KiB default baseline. | Docs/tests review. |
| AC-015 | Future durable product audit records are append-only under normal application behavior. | Docs review. |
| AC-016 | Transactionally coupled audit policy is defined and identifies when audit failure must roll back business state. | Docs/tests review. |
| AC-017 | Best-effort audit policy is defined and identifies when audit failure may not block business success. | Docs/tests review. |
| AC-018 | State-first audit policy is defined and identifies when audit failure must not roll back risk-reducing state. | Docs/tests review. |
| AC-019 | Sensitive values are prohibited from product audit metadata, including passwords, hashes, tokens, cookies, Authorization headers, secrets, credentials, URLs, raw request bodies, raw stack traces, raw Prisma/database errors, and raw SQL values. | Docs/tests review. |
| AC-020 | PII handling requires explicit future feature approval before sensitive product/user PII is persisted in audit metadata. | Docs review. |
| AC-021 | Each future product audit event must be classified as transactionally coupled, state-first, or best-effort before implementation. | Docs/tests review. |
| AC-022 | Audit failure can never make auth, authorization, entitlement, financial, or other security-sensitive denial permissive. | Docs/tests review. |
| AC-023 | Product audit emission/persistence is required to go through service/repository abstractions; controllers must not write durable audit records directly. | Docs/source review. |
| AC-024 | Future product audit repositories must follow FEAT-013 transaction boundaries and raw SQL containment rules. | Docs/source review. |
| AC-025 | Operational logs/metrics/traces are distinguished from durable audit records and do not satisfy durable audit requirements. | Docs/tests review. |
| AC-026 | Retention/deletion governance is defined as deferred and requires explicit Human-approved future policy before implementation. | Docs review. |
| AC-027 | Future product audit schema activation criteria are defined and require owning domain feature approval, migration review, constraint review, metadata/PII review, retention posture, tests, and Human approval. | Docs review. |
| AC-028 | Idempotency and duplicate-event governance is defined for future domain events. | Docs/tests review. |
| AC-029 | Product audit governance supports future domain extensibility without requiring a single global taxonomy for all domains. | Docs review. |
| AC-030 | Deterministic tests or guards verify governance document coverage, metadata prohibited fields, transaction-strategy classification, and audit boundary rules. | Test/guard evidence. |
| AC-031 | No product-domain audit table/model/migration is created in FEAT-016. | Prisma/migration review. |
| AC-032 | No Academy, Simulation, Community, Subscription, AI, placeholder product schema, product API, public audit API, audit UI, seed behavior, FEAT-017 behavior, FEAT-018 gate behavior, or Phase 4 behavior is introduced. | Source/schema review. |
| AC-033 | FEAT-009 auth/security audit regression tests remain green. | Test evidence. |
| AC-034 | FEAT-001 through FEAT-015 regression validation remains green. | Full validation evidence. |
| AC-035 | `reports/implementation/phase-3/FEAT-016.md` exists and truthfully records governance decisions, files changed, tests, limitations, no schema creep, no FEAT-017 start, and AC mapping. | Report review. |
| AC-036 | Governance state remains consistent: FEAT-016 in QA/review after implementation, FEAT-017+ blocked as applicable, Phase 3 in progress, Phase 4 blocked. | Tracker/report review. |

## 2. PASS Requirements

FEAT-016 may receive QA PASS only when:

- AC-001 through AC-036 pass.
- FEAT-009 auth/security audit behavior is unchanged.
- Product audit governance is documented and objectively testable.
- No product audit table, product-domain schema, public audit API, audit UI, or FEAT-017 behavior is introduced.
- Regression validation for FEAT-001 through FEAT-015 remains green.
- No unresolved P0/P1 security, privacy, governance, or data-integrity defect remains.

## 3. FAIL Conditions

FEAT-016 must fail QA if any of the following are true:

- `AuthSecurityAuditRecord` is modified or repurposed for product-domain events.
- A product audit table/model/migration is introduced without explicit Human approval.
- Academy, Simulation, Community, Subscription, AI, or placeholder product schema is introduced.
- Product audit persistence is implemented using Redis, in-memory state, logs, JSON files, or client state as durable authority.
- Metadata rules allow passwords, tokens, cookies, secrets, raw URLs, raw request bodies, raw stack traces, raw database errors, or unapproved PII.
- Transaction strategy can remain implicit for future product audit events.
- Audit failure can make a denial or risk-reducing state change permissive.
- Public audit read/search/update/delete APIs or audit UI are introduced.
- FEAT-009 or FEAT-011 through FEAT-015 regress.
- Implementation evidence overclaims validation or hides limitations.

## 4. Required Validation Suite

Expected validation:

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

If implementation adds a product audit governance guard command, QA must run it independently.

## 5. Human Review Checklist

- [ ] FEAT-016 keeps auth/security audit and product audit separate.
- [ ] FEAT-009 semantics are preserved.
- [ ] `AuthSecurityAuditRecord` is not extended for product-domain events.
- [ ] No product audit table/schema is specified.
- [ ] Metadata and PII rules are strict enough for future domains.
- [ ] Transaction strategy rules are explicit.
- [ ] Retention/deletion remains deferred and requires future approval.
- [ ] Acceptance criteria are independently testable.
- [ ] FEAT-017 remains blocked until FEAT-016 receives Human Final Gate approval.

## 6. Final Gate

Implementation may begin only after Human approval of this spec package. FEAT-017 must not begin until FEAT-016 receives QA PASS and Human Final Gate approval.
