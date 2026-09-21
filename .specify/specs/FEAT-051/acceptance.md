# FEAT-051 Acceptance Criteria

Status: HUMAN MASTER PLANNING APPROVED / PLANNED / DEPENDENCY CONTROLLED

- AC-001 D1 deferral is enforced: no production provider SDK/adapter is selected or implemented and no provider is silently assumed.
- AC-002 D10 deferral is enforced: no real production checkout/cancel flow exists.
- AC-003 Domain code depends only on the provider port and canonical contracts.
- AC-004 Port exposes no unapproved provider/payment operation and has no production checkout/cancel implementation.
- AC-005 External responses/events are validated and normalized before domain use.
- AC-006 Provider mode/configuration is startup-validated with no fallback.
- AC-007 Missing/misconfigured production adapter fails safely and never activates mock.
- AC-008 Local mock requires development environment, explicit mock mode, and approved local target.
- AC-009 Test/CI mock requires test mode and isolated test/CI target.
- AC-010 Test/CI mock state is deterministic and isolated by run/worker.
- AC-011 Concurrent mock instances do not leak state across runs.
- AC-012 Staging, production, production-like, unknown, or conflicting activation fails before DB/provider mutation.
- AC-013 No public mock upgrade/set-premium endpoint or production build backdoor exists.
- AC-014 Timeout/unavailability maps to a stable sanitized retryable contract where applicable.
- AC-015 Logs/errors expose no provider key, signature secret, URL, raw payload/error, customer/payment identifier, token, or path.
- AC-016 No card number, CVV, raw payment credential, or full webhook payload is persisted.
- AC-017 Mock/Redis/in-memory state is not durable subscription authority.
- AC-018 FEAT-051 adds zero schema, migration, webhook route, lifecycle mutation, premium guard, or UI.
- AC-019 Canonical validation, guards, and Phase 2-6/FEAT-048 regressions pass.
- AC-020 Report and traceability evidence are truthful; FEAT-052 remains correctly gated.

Hard fail: production mock activation, implicit fallback, unverified payload authority, payment-data persistence, or provider secret leakage.
