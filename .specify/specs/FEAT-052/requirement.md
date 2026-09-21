# FEAT-052 Requirement: Verified Provider Events & Idempotent Processing

Status: HUMAN MASTER PLANNING APPROVED / PLANNED / DEPENDENCY CONTROLLED / IMPLEMENTATION NOT_STARTED
Phase: Phase 7 - Subscription / Premium
Type: Security and provider-event integration

## Goal

Accept only cryptographically verified provider events and apply each provider-originated subscription transition exactly once despite duplicate, concurrent, replayed, or out-of-order delivery.

## Functional Requirements

- FR-001 D1 is approved as deferred: FEAT-052 MUST implement provider-neutral verification/idempotency architecture and mock/test verified events only; production provider-specific signature adapter is prohibited.
- FR-002 No production webhook route is introduced. Provider-neutral processing is exercised through isolated mock/dev/test adapters or test harnesses; any future production route requires a new Human decision.
- FR-003 Signature verification MUST use the exact raw request bytes required by the provider before parsing fields as authority.
- FR-004 Invalid/missing signature, wrong provider, oversized body, malformed payload, and unsupported event MUST fail safely with zero mutation.
- FR-005 Verified payload MUST be normalized through FEAT-051 before domain processing.
- FR-006 `(providerKey, providerEventId)` PostgreSQL uniqueness MUST be the final idempotency authority.
- FR-007 Sequential and concurrent duplicate delivery MUST produce one event record and at most one business transition.
- FR-008 Event receipt, provider-originated subscription mutation, and core processing result MUST use FEAT-013 transaction orchestration.
- FR-009 FEAT-052 MUST write provider-event-originated activation/upgrade transition history using the approved transactionally coupled policy.
- FR-010 FEAT-052 MUST write provider-event-originated downgrade/revocation evidence state-first and leave durable audit-pending/reconciliation evidence if separate audit persistence fails.
- FR-011 Out-of-order events MUST use trusted provider sequence/version or canonical provider fetch; timestamp-only authority is prohibited when ordering is ambiguous.
- FR-012 Stale/impossible transitions MUST not overwrite newer state and MUST record a safe processing outcome.
- FR-013 Duplicate/replay response semantics MUST prevent unnecessary provider retry while never acknowledging an uncommitted first event.
- FR-014 Raw payload, signature, payment data, provider secret, and sensitive identifiers MUST not be persisted or logged.
- FR-015 Redis MUST NOT be idempotency/event authority; webhook abuse controls must preserve provider retry semantics.
- FR-016 Provider/repository failure MUST return a safe retryable failure and leave no partial transition.
- FR-017 Tests MUST cover signatures, concurrency, replay, ordering, atomicity, audit strategies, and sanitization against live PostgreSQL.
- FR-018 FEAT-052 MUST add no migration, checkout/cancel command, UI, admin override, or existing-domain premium gate.

## Dependencies

FEAT-048, FEAT-049, and FEAT-051 gates; approved D1 deferral and D6 audit strategy. Production route/signature work is out of scope; FEAT-055 is not a prerequisite for FEAT-052 basic transition correctness.

## Out Of Scope

Checkout/cancel APIs, scheduled reconciliation, public event reads, raw payload retention, refund/invoice/tax events, UI, and Phase 8.
