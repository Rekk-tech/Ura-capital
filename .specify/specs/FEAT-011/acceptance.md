# Acceptance Criteria: FEAT-011 Persistence Boundary & Legacy Data Elimination

**Status**: APPROVED FOR IMPLEMENTATION

## 1. Acceptance Matrix

| ID | Criterion | Verification |
|----|-----------|--------------|
| AC-001 | Repository inventory finds and records all `db.json` references and obvious mutable JSON persistence patterns. | Source search evidence in implementation report. |
| AC-002 | No runtime application code reads from, writes to, imports, requires, or configures `db.json` persistence. | Guard validation and source review. |
| AC-003 | Any prohibited runtime JSON persistence discovered during implementation is removed or quarantined. | Diff review and implementation evidence. |
| AC-004 | No PostgreSQL or Redis failure path falls back to JSON-file persistence. | Source review and regression tests. |
| AC-005 | Every discovered legacy persistence reference is classified. | Classification table in implementation report. |
| AC-006 | Documentation references to `db.json` are allowed only as legacy/rejected architecture or historical context. | Documentation review. |
| AC-007 | Test fixture JSON, if present, is static, isolated, and not used as application persistence. | Test/source review. |
| AC-008 | A deterministic guard test or validation script fails on prohibited runtime `db.json` dependency. | Guard test evidence. |
| AC-009 | The guard allows explicitly approved docs/test fixture references without broad false-positive failure. | Guard test evidence and allowlist review. |
| AC-010 | Guard/log/report output does not expose secrets, DB URLs, Redis URLs, tokens, cookies, passwords, or sensitive local config. | Output review and sanitizer expectations. |
| AC-011 | FEAT-002 through FEAT-010A auth/security behavior remains unchanged. | Source review and regression evidence. |
| AC-012 | Existing PostgreSQL-backed and Redis-backed regression suites pass or are truthfully marked `NOT VERIFIED` with environment blocker for QA review. | Validation evidence. |
| AC-013 | FEAT-011 introduces no product-domain API, UI, seed strategy, Redis health implementation, product audit table, or Phase 4 behavior. | Source review. |
| AC-014 | `reports/implementation/phase-3/FEAT-011.md` exists and records inventory, classifications, changes, tests, validation, limitations, and AC mapping. | Report review. |
| AC-015 | Required validation commands are executed from repository root and results are recorded truthfully. | Command evidence in implementation report. |
| AC-016 | Governance state remains consistent: FEAT-011 in QA/review after implementation, FEAT-012 not started, Phase 3 in progress, Phase 4 blocked. | Tracker/report review. |

## 2. PASS Requirements

FEAT-011 may receive QA PASS only when:

- AC-001 through AC-016 pass.
- No runtime `db.json` dependency exists.
- Guard validation exists and is deterministic.
- Phase 2 regression remains green.
- No blocking security/data-integrity defect remains.

## 3. FAIL Conditions

FEAT-011 must fail QA if any of the following are true:

- Runtime application behavior depends on `db.json` or mutable JSON-file persistence.
- PostgreSQL/Redis failure falls back to JSON persistence.
- Guard validation is missing or too broad to distinguish allowed documentation/fixture references.
- Product-domain tables or behavior are introduced.
- FEAT-002 through FEAT-010A behavior regresses.
- Implementation report claims DB/Redis validation passed without actual evidence.

## 4. Required Validation Suite

Expected validation:

```text
npm run clean
npm run lint
npx prisma validate --schema=apps/api/prisma/schema.prisma
npm run typecheck
npm run build
npm run test
npm run test:db
npm run test:redis
```

QA may require fresh isolated PostgreSQL and isolated Redis validation if the implementation report claims live service evidence.

## 5. Human Review Checklist

- [ ] FEAT-011 scope is limited to persistence boundary and legacy JSON elimination.
- [ ] No product-domain schema or behavior is specified.
- [ ] Guard validation requirement is acceptable.
- [ ] Acceptance criteria are independently testable.
- [ ] FEAT-012 remains blocked until FEAT-011 receives Human Final Gate approval.

## 6. Final Gate

Implementation may begin only after this Human approval and must remain within the approved FEAT-011 scope.
