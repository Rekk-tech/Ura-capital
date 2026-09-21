# FEAT-057 Requirement: Phase 7 Independent Integration QA

Status: HUMAN MASTER PLANNING APPROVED / PLANNED / DEPENDENCY CONTROLLED / IMPLEMENTATION NOT_STARTED
Phase: Phase 7 - Subscription / Premium
Type: Final validation and integration gate

## Goal

Independently validate the integrated Phase 7 subscription system and governance without introducing or repairing product behavior inside the gate.

## Functional Requirements

- FR-001 FEAT-057 MUST remain validation-only and MUST not add product behavior, schema, migration, API, UI, provider implementation, or test-only production bypass.
- FR-002 All Human decisions D1..D10 MUST be resolved, and FEAT-048..FEAT-056 MUST be implemented, feature-gated under approved Phase 7 Fast-Track governance, CI-green, checkpointed, integrated, and eligible for independent Phase QA before final execution. Individual independent feature QA is required only by escalation policy.
- FR-003 Fresh zero-state PostgreSQL migration validation MUST apply the full ordered migration history including the sole FEAT-048 Phase 7 migration.
- FR-004 Existing-schema upgrade MUST start from the exact approved Phase 6 checkpoint, preserve representative Phase 2-6 rows/constraints, then apply the real FEAT-048 migration.
- FR-005 PostgreSQL model, FK, uniqueness, lifecycle, event-idempotency, ordering, transition-history, and historical-preservation constraints MUST be live-verified.
- FR-006 Plan catalog and entitlement resolution MUST prove server authority, no-record FREE semantics, closed-set status/plan handling, and same-token immediacy.
- FR-007 Read APIs MUST prove ownership, safe DTOs, stable serialization, and enumeration resistance.
- FR-008 Approved D1 deferral MUST be validated: production provider adapter/webhook/signature surface is absent and provider-neutral mock/dev/test behavior is isolated, verified, idempotent, ordered, sanitized, and unable to grant production authority.
- FR-009 Approved D10 deferral MUST be validated: production checkout/cancellation APIs and commerce CTAs are absent; isolated mock/dev/test lifecycle behavior cannot self-upgrade, prematurely grant, bypass provider verification, or produce false success during Redis/provider outage.
- FR-010 Premium guard MUST prove authentication-first, PostgreSQL-derived entitlement, same-token grant/removal, and no JWT/Redis/client authority.
- FR-011 Subscription transition audit MUST prove approved coupling/state-first semantics, idempotent pending reconciliation, append-only behavior, and FEAT-009 auth-audit invariance.
- FR-012 Learner UI MUST prove safe DTO use, server authority, status/error/accessibility coverage, no production commerce navigation/CTA, and zero payment-data handling under approved D8/D10.
- FR-013 Redis MUST remain transient-only with isolated namespace/TTL/multi-instance/outage/recovery verification.
- FR-014 Approved D9 deferral MUST be enforced: no existing Academy, Simulation, Community, or AI premium gate is introduced in Phase 7.
- FR-015 No public admin/manual premium mutation, provider debug, audit, reconciliation, or repair surface may exist.
- FR-016 Canonical validation, all authoritative guards, live PostgreSQL/Redis/provider tests, runtime E2E, and Phase 2-6 regression MUST execute with zero mandatory skips.
- FR-017 Exact-source CI evidence MUST be green before a Phase 7 PASS recommendation.
- FR-018 Any failure MUST be assigned to its owning feature; FEAT-057 MUST not rewrite earlier specs or implementation to hide it.
- FR-019 PASS requires zero open P0/P1, no unresolved mandatory Human decision, truthful reports, and consistent governance.
- FR-020 Phase 8 MUST remain blocked until FEAT-057 QA PASS and Human Phase 7 Final Gate approval.

## Dependencies

FEAT-048 through FEAT-056, approved D1 through D10, available isolated PostgreSQL and Redis, isolated provider-neutral mock/test environment, and exact-source CI.

## Out Of Scope

Defect implementation, new subscription behavior, new premium product integration, refunds, invoices, taxes, coupons, payment-method storage, admin tooling, and Phase 8.
