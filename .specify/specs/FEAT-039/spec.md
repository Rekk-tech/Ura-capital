# FEAT-039 Spec: Simulation Authorization, Rate Limit & Audit-Deferral Hardening

## Rate Limit

- Scope: order submission route.
- Limit: 60 submissions / 10 minutes.
- Key: authenticated user + route scope. Simulation ID may be included for observability but must not weaken per-user protection.
- Storage: Redis transient counters only.
- Failure: `429 TOO_MANY_REQUESTS` with safe `Retry-After`.
- No Simulation business mutation on 429.

## Audit Deferral

Durable Simulation product audit is deferred for Phase 5.

Do not add:

- product audit table
- product audit migration
- public audit API
- audit UI
- Simulation product-event persistence
- `AuthSecurityAuditRecord` reuse

Accepted risk must be documented in the implementation report.

## Security Matrix

Verify IDOR, tampering, numeric abuse, replay, concurrency, Redis boundary, and no admin/support visibility.
