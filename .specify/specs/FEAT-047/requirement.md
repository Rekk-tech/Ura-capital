# FEAT-047 Requirement: Phase 6 Community Integration Gate

Status: PLANNED / HUMAN MASTER PLANNING APPROVED / BLOCKED BY FEAT-041..FEAT-046
Phase: Phase 6 - Community
Type: Validation gate
QA Owner: Codex

## Goal

Independently validate the complete Phase 6 Community domain and all upstream regressions before the Human Phase Final Gate.

## Functional Requirements

- FR-001 Validate approved implementation/rework/QA evidence for FEAT-041 through FEAT-046.
- FR-002 Validate fresh zero-state PostgreSQL migration deploy/status/validate.
- FR-003 Validate upgrade from the approved Phase 5 schema with representative Identity, Academy, Simulation, and audit rows preserved.
- FR-004 Validate Community schema, constraints, indexes, delete policies, and migration immutability.
- FR-005 Validate authenticated post feed/detail/create/remove lifecycle and safe DTOs.
- FR-006 Validate flat comment list/create/remove lifecycle and visible comment counts.
- FR-007 Validate post like/unlike idempotency, concurrency, user isolation, and relational counts.
- FR-008 Validate moderation status policy, hidden/removed visibility, and absence of public moderation API/UI.
- FR-009 Validate IDOR, forged authority, malformed/oversized content, safe errors, and privacy.
- FR-010 Validate exact Redis rate limits, shared counters, proxy safety, outage fail-closed writes, read availability, and recovery.
- FR-011 Validate Community UI authenticated journey, server-authoritative counts, states, and accessibility baseline.
- FR-012 Validate PostgreSQL durable authority, Redis transient-only boundary, and product-audit deferral without auth-audit misuse.
- FR-013 Run canonical 14, targeted Community suites, runtime E2E, and exact-commit CI with no mandatory skips.
- FR-014 Validate Phase 2 auth, Phase 3 data, Phase 4 Academy, and Phase 5 Simulation regressions.
- FR-015 Confirm no Phase 7/8/9 behavior or prohibited Community scope.
- FR-016 Produce `reports/qa/phase-6/PHASE-6-QA.md` with exact PASS or FAIL and defect ownership.

## Gate Policy

PASS requires every mandatory acceptance criterion, live PostgreSQL/Redis validation, runtime journey, guards, and exact-commit CI to pass. Environment unavailable or mandatory validation not executed is FAIL/NOT VERIFIED, never PASS. Any P0/P1 defect blocks. Any unresolved P2 affecting approved behavior, security, integrity, migration, UI critical journey, or truthful evidence blocks.

## Out Of Scope

Product fixes, new behavior, Phase 7 planning/implementation, public feed, editing, nested replies, comment likes, admin moderation UI/API, product audit activation, recommendations, chat, and monetization.

## Dependencies

FEAT-041..046 QA PASS and Human Final Gate approved; `phase-5-approved` remains the immutable upstream checkpoint.
