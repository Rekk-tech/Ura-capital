# Plan: FEAT-028 Academy Authorization & Ownership Hardening

**Status**: PLANNED / BLOCKED BY FEAT-027 IMPLEMENTATION GATE  
**Implementation Status**: NOT_STARTED  

## Start Condition

FEAT-028 may start only after FEAT-027 implementation complete, internal gate PASS, checkpoint published, CI green, and tag `feat-027-approved`.

## Work Plan

1. Record Human-approved admin/support deferral.
2. Build endpoint authorization matrix from actual learner-facing routes.
3. Add/adjust ownership tests for attempts, answers, submission, result, progress, XP, and rewards.
4. Harden service/repository ownership predicates where gaps are found.
5. Verify no JWT role spoof or client userId authority.
6. Verify safe 403/404 non-enumeration.
7. Run canonical 14 validation.
8. Produce `reports/implementation/phase-4/FEAT-028.md`.

## Migration Plan

No schema migration expected. If hardening requires new constraints, stop for Human migration approval.

## Parallel Plan

FEAT-028 can run in parallel with FEAT-029 after the FEAT-027 checkpoint because Human selected FEAT-029 DEFER. Both branches must start from the same `feat-027-approved` checkpoint, use isolated Git worktrees, and never run in the same working directory.
