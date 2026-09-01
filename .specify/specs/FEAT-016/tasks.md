# Tasks: FEAT-016 Product Audit Abstraction & Governance

**Status**: PROPOSED FOR HUMAN REVIEW  
**Phase**: Phase 3 - Data Foundation & Core Domain  

## 1. Task List

| ID | Task | Requirement Mapping | Acceptance Mapping |
|---|---|---|---|
| T001 | Read FEAT-016 spec package, FEAT-009 artifacts, FEAT-011..FEAT-015 artifacts, ADR-003, and Phase 3 governance context. | FR-001..FR-031 | AC-036 |
| T002 | Document the separation between auth/security audit and product-domain audit. | FR-001, FR-002, FR-003 | AC-001, AC-002, AC-003 |
| T003 | Confirm `AuthSecurityAuditRecord` remains unchanged and product-domain events are not added to it. | FR-002, FR-003 | AC-002, AC-003, AC-004 |
| T004 | Define PostgreSQL as the future durable product audit authority and reject Redis/log/file/client durable authority. | FR-005, FR-006 | AC-005, AC-006 |
| T005 | Define product audit taxonomy governance and domain-owned event naming rules. | FR-007, FR-008 | AC-007, AC-008 |
| T006 | Define actor, subject, object/resource, outcome, occurredAt, and request/correlation ID semantics. | FR-009, FR-010, FR-011 | AC-009, AC-010, AC-011 |
| T007 | Define server-controlled operation source values and client-trust prohibition. | FR-012 | AC-012 |
| T008 | Define metadata allowlist, sanitization, prohibited fields, and 2 KiB size strategy. | FR-013, FR-014, FR-015 | AC-013, AC-014, AC-019, AC-020 |
| T009 | Define append-only expectations for future durable product audit records. | FR-016 | AC-015 |
| T010 | Define transactionally coupled audit policy for future product events. | FR-017, FR-021 | AC-016, AC-021 |
| T011 | Define best-effort audit policy and failure logging rules. | FR-018, FR-021, FR-027 | AC-017, AC-021, AC-025 |
| T012 | Define state-first audit policy and non-rollback requirements. | FR-019, FR-020, FR-021 | AC-018, AC-021, AC-022 |
| T013 | Define repository/service abstraction and controller Prisma/audit-write boundary. | FR-022, FR-023 | AC-023, AC-024 |
| T014 | Define raw SQL containment rules for future audit persistence. | FR-024 | AC-024 |
| T015 | Define retention/deletion governance and schema activation criteria. | FR-025, FR-028 | AC-026, AC-027 |
| T016 | Define idempotency and duplicate-event considerations. | FR-026 | AC-028 |
| T017 | Define observability logs versus durable audit distinction. | FR-027 | AC-029 |
| T018 | Add product audit governance documentation. | FR-001..FR-028 | AC-001..AC-029 |
| T019 | Add or update static/unit tests for required governance document coverage. | FR-029 | AC-030 |
| T020 | Add or update static/unit tests for metadata prohibited fields and size strategy. | FR-013, FR-014, FR-015, FR-029 | AC-013, AC-014, AC-019, AC-020, AC-030 |
| T021 | Add or update static/unit tests for transaction strategy classification rules. | FR-017, FR-018, FR-019, FR-020, FR-021, FR-029 | AC-016, AC-017, AC-018, AC-021, AC-022, AC-030 |
| T022 | Add or update scope guard tests proving no product audit table, product-domain schema, public audit API, audit UI, or FEAT-017 behavior exists. | FR-004, FR-029 | AC-031, AC-032 |
| T023 | Verify Prisma schema and migrations do not change product audit or auth audit semantics. | FR-002, FR-003, FR-004 | AC-003, AC-004, AC-031 |
| T024 | Run FEAT-009 audit regression tests and related standard/DB suites. | FR-002, FR-030 | AC-033, AC-034 |
| T025 | Run FEAT-011 through FEAT-015 regression validation and guards. | FR-030 | AC-034 |
| T026 | Run full validation suite from repository root. | FR-029, FR-030 | AC-034 |
| T027 | Create `reports/implementation/phase-3/FEAT-016.md` with exact evidence, limitations, and AC mapping. | FR-031 | AC-035 |
| T028 | Update `docs/progress-tracker.md` after implementation evidence is complete and truthful. | FR-031 | AC-036 |
| T029 | Confirm FEAT-017 remains blocked and Phase 4 remains blocked. | FR-030, FR-031 | AC-032, AC-036 |

## 2. Dependency Order

1. T001
2. T002 through T017
3. T018
4. T019 through T023
5. T024 through T026
6. T027 through T029

## 3. Required Validation Commands

```text
npm run clean
npm run lint
npx prisma validate --schema=apps/api/prisma/schema.prisma
npm run typecheck
npm run build
npm run test
npm run test:db
npm run test:redis
npm run guard:persistence
npm run guard:migration
npm run guard:boundary
```

If implementation adds `guard:audit-governance` or an equivalent command, it must run from repository root and be included in the implementation report.

## 4. Implementation Notes

- Do not create product-domain schema.
- Do not create product audit table/model/migration.
- Do not modify `AuthSecurityAuditRecord`.
- Do not create public audit APIs or UI.
- Do not start FEAT-017.
- Do not start Phase 4.
