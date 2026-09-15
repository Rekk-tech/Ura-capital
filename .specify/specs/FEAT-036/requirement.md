# FEAT-036 Requirement: Order Idempotency & Concurrency Adversarial Hardening

Status: PLANNED / BLOCKED BY FEAT-035
Phase: Phase 5 - Simulation Engine
Type: Hardening feature

## Goal

Adversarially verify and harden the FEAT-035 idempotency and concurrency contract. FEAT-036 must not be the first feature that makes order execution safe.

## Functional Requirements

- FR-001 Stress same-key concurrent requests.
- FR-002 Stress duplicate database conflicts.
- FR-003 Verify retry after transport failure returns original result where mutation committed.
- FR-004 Stress concurrent distinct BUY requests.
- FR-005 Stress concurrent distinct SELL requests.
- FR-006 Verify lock ordering and deadlock avoidance/retry policy if needed.
- FR-007 Verify diagnostics sanitization under conflict and database errors.
- FR-008 Preserve FEAT-035 request/response/idempotency contract.
- FR-009 Record implementation evidence in `reports/implementation/phase-5/FEAT-036.md`.

## Out Of Scope

Introducing first-pass idempotency, first-pass locking, new order types, UI, product audit persistence.
