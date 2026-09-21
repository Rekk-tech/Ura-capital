# FEAT-052 Specification: Verified Provider Events & Idempotent Processing

Status: HUMAN MASTER PLANNING APPROVED / PLANNED / DEPENDENCY CONTROLLED

## Ingestion Pipeline

```text
bounded raw request
-> configured provider adapter
-> signature verification
-> strict normalization
-> durable idempotency claim
-> ordering/transition validation
-> Unit of Work state transition
-> safe provider response
```

No payload field is trusted before verification. The current phase uses only isolated mock/dev/test verification adapters or harnesses; no production route or dynamic production adapter loading exists.

## Idempotency And Concurrency

The first verified delivery claims `(providerKey, providerEventId)` in PostgreSQL. Processing and the provider-originated subscription mutation occur within the approved Unit of Work. A duplicate observed after commit returns the provider-approved successful replay response without a second transition. Concurrent duplicates converge through the unique constraint, not a pre-check or Redis lock.

If the first transaction fails, the event is not falsely acknowledged as processed; the provider receives a retryable safe failure. Processing outcome records distinguish processed, duplicate, stale, unsupported, and failed-safe states without raw error storage.

## Ordering

Adapters declare either a trustworthy monotonic sequence/version or a required canonical-fetch strategy. A lower/equal sequence is stale/duplicate. When no sequence exists, the processor fetches current provider state before mutation. `occurredAt` alone is informational unless the selected provider contract explicitly guarantees ordering.

## Transition And Audit Strategy

- FEAT-052 owns transition-record writing for provider-event-originated business transitions.
- Entitlement grant/upgrade: event, subscription mutation, and transition record commit together.
- Entitlement reduction/revocation: subscription/event state commits first with audit status; transition-audit failure cannot restore premium and is surfaced for later FEAT-055 audit-pending reconciliation.
- Informational duplicate/replay observations do not amplify durable product audit.

FEAT-055 is not required for the correctness of FEAT-052 event verification, idempotency, state mutation, or required origin transition evidence. It later hardens integrity and reconciles pending audit evidence.

## HTTP And Security

Invalid mock/test verification returns a safe failure with zero mutation. Transient provider-neutral/DB failure returns retryable 5xx in applicable harnesses. Duplicate committed delivery returns the approved idempotent outcome. Responses and logs exclude payload, signature material, provider secrets, payment data, customer identifiers, SQL, URLs, and paths. No production webhook contract is claimed.
