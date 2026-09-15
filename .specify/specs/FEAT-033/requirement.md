# FEAT-033 Requirement: Simulation Session Lifecycle

Status: PLANNED / BLOCKED BY FEAT-031
Phase: Phase 5 - Simulation Engine
Type: Implementation feature

## Human Decisions

HUMAN APPROVED: lifecycle `CREATED -> ACTIVE -> COMPLETED`, `CREATED -> CANCELLED`, `ACTIVE -> CANCELLED`; at most one ACTIVE session per user; reset cancels old current session and creates a new CREATED session; completion is explicit server-authorized learner action.

## Goal

Implement authenticated private Simulation session lifecycle, scenario binding, and current-cycle ownership.

## Functional Requirements

- FR-001 Authenticated user can create a `CREATED` private simulation session.
- FR-002 Session binds to the approved default scenario and starts with `currentCycle = 1`.
- FR-003 Starting a session transitions `CREATED -> ACTIVE`.
- FR-004 At most one `ACTIVE` session per user is enforced by PostgreSQL partial unique protection.
- FR-005 Concurrent starts must not create two active sessions.
- FR-006 Completion transitions `ACTIVE -> COMPLETED` only through explicit server-authorized learner action.
- FR-007 Cancellation supports `CREATED -> CANCELLED` and `ACTIVE -> CANCELLED`.
- FR-008 Reset cancels the old current session and creates a new `CREATED` session without deleting history.
- FR-009 Client cannot provide userId, status, startingCash, currentCycle, scenarioId, timestamps, balances, or portfolio fields.
- FR-010 Users can list/read only their own sessions.
- FR-011 No admin/support visibility, real-money, brokerage, or order execution behavior.
- FR-012 Record implementation evidence in `reports/implementation/phase-5/FEAT-033.md`.

## Out Of Scope

Asset catalog, snapshot catalog, orders, portfolio accounting beyond initial portfolio creation, UI, audit, rate limiting.
