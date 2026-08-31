# ADR-001: Modular Monolith First

**Status**: Accepted  
**Date**: 2026-08-25

## Context

Aura Capital is a greenfield rebuild with multiple domains: Identity, Academy, Simulation, Community, Subscriptions, AI, Admin, and Audit. The system needs strong boundaries without premature distributed-systems complexity.

## Decision

Build Aura Capital as a modular monolith first.

## Rationale

- Supports clear domain ownership while keeping deployment and local development simple.
- Avoids premature microservice overhead.
- Matches `docs/architecture-context.md`.
- Keeps transactions and consistency simpler for early auth, academy rewards, simulation settlement, subscriptions, and audit logs.

## Rejected Alternatives

- Microservices from the start: rejected due to unnecessary operational complexity and unclear scale/team boundaries.
- Single unstructured backend: rejected because domain boundaries would erode quickly.

## Consequences

- Modules must follow explicit boundaries and avoid cross-module data leakage.
- Shared infrastructure lives under API infrastructure/shared areas.
- Future microservice extraction requires a new ADR, proven operational need, and migration plan.
