# Product Audit Governance & Abstraction Standards

**Status**: ACTIVE GOVERNANCE  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Feature**: FEAT-016 — Product Audit Abstraction & Governance  
**Authority**: Human Approved (Phase 3 Feature Decomposition & FEAT-016 Spec Package)  

---

## 1. Executive Summary & Purpose

This document establishes the architecture, taxonomy, event semantics, metadata safety policies, transaction coupling strategies, and schema activation criteria for future **product-domain audit events** in Aura Capital.

It enforces a strict separation between:
1. **Authentication & Security Audit** (`AuthSecurityAuditRecord` / FEAT-009) — owned by Phase 2 Identity & Security.
2. **Product-Domain Audit** — owned by future domain-specific features (Academy, Simulation, Community, Subscriptions, AI, etc.).

---

## 2. Authority & Storage Boundary

### 2.1 Durable Authority: PostgreSQL Only
- **PostgreSQL** is the single approved durable system of record for future product audit records.
- All durable product audit records, once activated, must be stored in PostgreSQL tables managed via Prisma migrations adhering to FEAT-012 (migration governance) and FEAT-014 (constraint standards).

### 2.2 Prohibited Durable Authorities
The following technologies and storage mechanisms are **STRICTLY PROHIBITED** from being used as durable audit authority:
- **Redis**: Transient cache and distributed coordination only (ADR-005 / FEAT-015). Prohibited for durable business or audit records.
- **In-Memory State**: Volatile; lost on process restart or worker crash.
- **Application Logs / Stderr / Stdout**: Observability streams only; unindexed, subject to log rotation and non-deterministic retention.
- **Local File System / JSON dumps**: Non-transactional, uncoordinated in multi-instance deployments.
- **Client State / Browser Storage**: Untrusted and forgeable.

---

## 3. Separation of Auth/Security Audit vs Product Audit

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Database                             │
├───────────────────────────────────┬────────────────────────────────────┤
│   AUTH / SECURITY AUDIT (FEAT-009)│    PRODUCT-DOMAIN AUDIT (FUTURE)   │
│   Table: auth_security_audit_records│   Table: (Deferred to Domain)     │
│   - Registration success          │    - Lesson progress / completion  │
│   - Login success / failure       │    - Simulation order submission   │
│   - Refresh rotation / replay     │    - Portfolio state transitions   │
│   - Logout success                │    - Community moderation actions  │
│   - Role assigned / revoked       │    - AI prompt quota / governance  │
│   - Admin boundary access denial  │                                    │
│   [PRESERVED & IMMUTABLE]         │    [DEFINED BY OWNING FEATURES]    │
└───────────────────────────────────┴────────────────────────────────────┘
```

### Core Invariants:
1. `AuthSecurityAuditRecord` **MUST NOT** be renamed, repurposed, or extended with product-domain event names.
2. Product-domain events **MUST NOT** be written to the `auth_security_audit_records` table.
3. Auth/security audit write paths and transaction semantics remain strictly governed by FEAT-009.

---

## 4. Product Audit Event Semantics & Structure

Every future product audit event must conform to the following conceptual structure:

| Field | Type / Contract | Trust Level | Description |
|---|---|---|---|
| `eventId` | UUIDv4 | Server-Generated | Unique immutable event identifier. |
| `eventType` | String (Constant) | Domain-Owned | Domain-qualified event constant (e.g. `SIMULATION_ORDER_SUBMITTED`). |
| `domain` | String | Domain-Owned | Business domain name (`ACADEMY`, `SIMULATION`, `COMMUNITY`, `AI`, etc.). |
| `outcome` | Enum (`SUCCESS`, `FAILURE`, `DENIED`, `ERROR`) | Server-Derived | Final outcome of the business operation. |
| `actorId` | UUID / String (Nullable) | Server-Derived | Authenticated user ID or service principal that initiated the action. |
| `subjectId` | UUID / String (Nullable) | Server-Derived | Target principal affected by the action (if different from actor). |
| `resourceType`| String | Domain-Owned | Target resource entity type (e.g. `SIMULATION_ORDER`, `COURSE_LESSON`). |
| `resourceId` | String / UUID (Nullable) | Server-Derived | Unique identifier of the affected business entity. |
| `operationSource`| Enum | Server-Controlled | Trusted channel / trigger for the operation. |
| `requestId` | UUID / String | Server-Derived | Correlation / request ID from HTTP header `X-Request-ID` or job runner. |
| `occurredAt` | ISO-8601 Timestamp | Server-Generated | Monotonically recorded server timestamp. |
| `metadata` | JSON Object (Flat) | Allowlisted | Event-specific sanitized key-value data ($\le 2\text{ KiB}$). |
| `transactionStrategy` | Enum | Architecture | `TRANSACTIONALLY_COUPLED`, `STATE_FIRST`, or `BEST_EFFORT`. |

### 4.1 Server Trust Rules
- **Actor ID, Roles, and Permissions**: MUST be extracted from validated session tokens (JWT claims verified against server secret) or internal worker context. Public client request bodies or query parameters are **NEVER** trusted as actor identity.
- **Request / Correlation ID**: MUST be server-derived from request context (`req.id` / `X-Request-ID`) or generated by internal job dispatchers.
- **Operation Source**: MUST be selected by server route handlers or background workers; client requests cannot specify or override this field.

---

## 5. Operation Source Model

Allowed server-controlled values:
- `USER_REQUEST`: Direct synchronous authenticated API request initiated by a human user.
- `SYSTEM_JOB`: Asynchronous scheduled cron job, background queue worker, or automated trigger.
- `ADMIN_OPERATION`: Action executed within the protected administrative boundary by an authorized admin.
- `INTERNAL_MAINTENANCE`: Internal script, database repair task, or infrastructure operator action.
- `TEST_FIXTURE`: Integration test or automated testing harness. **Strictly prohibited from being selected by client requests in production.**

---

## 6. Metadata Governance & Data Privacy

### 6.1 Requirements
- **Flat Structure**: Metadata must be a single-level key-value dictionary (no nested objects/arrays) to simplify querying and prevent unbounded payload growth.
- **Allowlisted Keys**: Owning feature specifications must explicitly enumerate allowable metadata keys.
- **Bounded Size**: The JSON-serialized metadata string must not exceed **2 KiB (2048 bytes)** by default.
- **Sanitization**: All metadata fields must be passed through sanitization filters before persistence.

### 6.2 Prohibited Metadata Fields (Strict Security Denylist)
The following fields are strictly prohibited from appearing in product audit metadata:
1. Passwords, cleartext credentials, or password hashes (`bcrypt`, `argon2`, etc.).
2. Access tokens, refresh tokens, JWT strings, HMAC signatures, or token secrets.
3. Session cookies or raw cookie headers (`Cookie`, `Set-Cookie`, `aura_refresh_token`).
4. Authorization headers (`Bearer ...`, `Basic ...`).
5. Database connection strings (`postgresql://...`) or Redis URLs (`redis://...`).
6. API keys, third-party secrets, or encryption keys.
7. Raw, unparsed HTTP request bodies.
8. Raw stack traces, unhandled exceptions, or raw database/Prisma error objects.
9. Raw SQL statements containing parameter values.
10. Unapproved sensitive PII (Social Security Numbers, national IDs, credit card numbers, bank accounts, unapproved personal phone numbers).
11. Client-supplied role, permission, or administrative claims.

---

## 7. Transaction Strategy Classification

Every future product audit event must explicitly declare and implement exactly one of the three approved transaction strategies:

### 7.1 `TRANSACTIONALLY_COUPLED`
- **Definition**: The business state mutation and the audit record write occur within the same database transaction (`UnitOfWork` / `TransactionRunner`).
- **Rule**: If the audit write fails, the entire transaction **MUST ROLL BACK** and return a safe generic error (`Database operation failed` / HTTP 500).
- **Applicable To**:
  - Financial transactions, account balance adjustments, and order placements.
  - Privilege/entitlement grants (e.g. subscribing to paid tier, granting course access).
  - High-integrity operations where lack of an audit trail invalidates the legitimacy of the operation.

### 7.2 `STATE_FIRST`
- **Definition**: The business mutation or security/risk-reducing state change commits first. If the subsequent audit write fails, the business state **REMAINS COMMITTED**.
- **Rule**: Audit write failure **MUST NOT** roll back the state change. A sanitized operational error log is recorded.
- **Applicable To**:
  - Revocations, access denials, session invalidations, content takedowns, or risk-reducing administrative bans.
  - Operations where rolling back due to audit write failure would leave an unauthorized, risky, or invalid state active.

### 7.3 `BEST_EFFORT`
- **Definition**: The business operation executes independently, and the audit write is attempted asynchronously or in a separate catch block.
- **Rule**: Audit write failure is logged safely and does not affect the business outcome or user response.
- **Applicable To**:
  - Informational / telemetry-style events (e.g. lesson started, non-critical view counters, UI interaction checkpoints).

### 7.4 Core Safety Invariant
> **CRITICAL INVARIANT**: An audit recording failure MUST NEVER make any authentication denial, authorization denial, entitlement denial, financial check, or risk-reducing security state change more permissive.

---

## 8. Layering & Architectural Boundaries

```text
HTTP Controller
  │
  ▼
Domain Application Service
  │
  ├──> Calls Domain Repositories (FEAT-013 TransactionRunner / UoW)
  │
  └──> Calls ProductAuditService (Port/Interface)
         │
         └──> ProductAuditRepository (PostgreSQL Implementation)
                │
                └──> Prisma Client / TransactionClient (FEAT-014 Data Constraints)
```

### Architectural Rules:
1. **Controllers must NOT write directly to audit repositories.** Audit emission is orchestrated by domain application services.
2. **Audit repositories must follow FEAT-013**: Support both standalone `PrismaClient` and transactional `Prisma.TransactionClient`.
3. **Audit repositories must follow FEAT-014**: Respect unique constraints, foreign keys, not-null constraints, and immutable append-only guarantees.
4. **Append-Only Invariant**: Under normal application operations, audit records are strictly `INSERT` only. `UPDATE` and `DELETE` queries on audit tables are prohibited.

---

## 9. Schema Activation Gate (10-Point Checklist)

No Prisma model, table, or migration for product audit may be introduced until the owning feature meets all 10 activation criteria:

1. **Owning Domain Feature**: A specific domain feature (e.g. FEAT-021 Simulation, FEAT-030 Academy) explicitly claims ownership.
2. **Event Taxonomy Specification**: Event names are fully specified using canonical constants.
3. **Transaction Strategy Defined**: Each event is explicitly categorized (`TRANSACTIONALLY_COUPLED`, `STATE_FIRST`, or `BEST_EFFORT`).
4. **Metadata Schema & Allowlist**: Allowed metadata keys and types are documented with size bounds.
5. **Data Privacy & PII Review**: Documented justification for any stored user attributes.
6. **Constraint & Schema Review**: Foreign keys, index strategies, and UUID primary keys conform to FEAT-014.
7. **Migration Governance**: Migration plan conforms to FEAT-012 guidelines.
8. **Retention Posture**: Explicit retention classification approved.
9. **Automated Test Coverage**: Unit, integration, and PostgreSQL-backed tests provided.
10. **Human Approval**: Explicit Human Final Gate approval received for the feature spec package.

---

## 10. Retention, Deletion & Idempotency Governance

### 10.1 Retention & Deletion
- Implementation of automated retention cleanup, archival, or soft-deletion is **DEFERRED** in Phase 3.
- No background cron jobs, TTL triggers, or bulk deletion scripts may be introduced without Human approval.

### 10.2 Idempotency & Duplicate Handling
- Future domain features must specify whether duplicate events from retried operations or background queues are:
  - Deduplicated via an `idempotencyKey` unique index.
  - Stored as distinct historical attempts.
  - Correlated via `requestId`.
- No single global duplicate policy is imposed; each domain must evaluate based on its integrity requirements.

---

## 11. Observability vs Durable Audit Boundary

| Property | Observability Logs (Pino / Winston / Stdout) | Durable Product Audit (PostgreSQL) |
|---|---|---|
| **Primary Purpose** | Operational debugging, performance monitoring, infrastructure health. | Legal compliance, business accountability, state verification, security forensics. |
| **Durability** | Ephemeral (log rotation, stream buffers). | Persistent, transactional, ACID-backed in PostgreSQL. |
| **Queryability** | Log aggregation (Elasticsearch, Loki, CloudWatch). | Indexed relational SQL queries joined on domain entities. |
| **Transaction Coupling** | Never transactionally coupled with business state. | Can be coupled in same ACID transaction (`TRANSACTIONALLY_COUPLED`). |
| **Authority** | **NEVER** durable audit authority. | **OFFICIAL SYSTEM OF RECORD**. |
