# FEAT-042 Plan: Posts API & Feed Read Models

Status: PLANNED / HUMAN MASTER PLANNING APPROVED / BLOCKED BY FEAT-041

## Delivery Sequence

1. Freeze request/response and cursor contracts.
2. Extend post repository reads/writes using FEAT-041 models.
3. Add post service authorization, projection, creation, and logical removal.
4. Add validation, controller, and exact routes.
5. Add unit/API tests, then live PostgreSQL ordering/ownership/rollback tests.
6. Run canonical validation and publish evidence.

## Schema And Migration Impact

Zero expected. Any schema need discovered here must stop implementation and return to Human/Codex; FEAT-041 owns Community schema.

## Test Strategy

- Unit: cursor codec, validation, DTO mapping, service policy.
- Integration: authenticated endpoint contracts and safe errors.
- PostgreSQL: deterministic pagination, aggregate counts, visibility, owner removal, rollback.
- Security: forged ownership/status/count fields, IDOR, sensitive DTO leakage.
- Regression: Phase 2 auth and Phase 3 repository guards plus Phase 4/5 suites.

## Risks

Cursor ordering must avoid duplicate/missing rows. Relational aggregates may be slower than counters but are the approved correctness-first baseline. Logical removal retains durable content and requires strict DTO filtering.

## Completion Gate

All routes, authorization, pagination, safe DTOs, logical removal, live DB tests, and canonical validation pass. FEAT-043/044 implementation remains dependency-gated by Human approval and FEAT-042 gate status.
