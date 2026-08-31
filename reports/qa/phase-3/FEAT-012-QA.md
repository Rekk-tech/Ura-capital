# FEAT-012 QA Report: Migration Reproducibility & Schema Governance

Feature: FEAT-012
Phase: Phase 3 - Data Foundation & Core Domain
QA Owner: Codex
QA Iteration: 2
Final Verdict: PASS

---

# FEAT-012 QA Report — Migration Reproducibility & Schema Governance

**QA Iteration**: 2  
**QA Owner**: Codex  
**Date**: 2026-08-29  
**Final Verdict**: PASS

## Scope

Targeted re-QA only for DEF-001 through DEF-005 from QA Iteration 1. Reviewed:

- `reports/qa/phase-3/FEAT-012-QA.md`
- `reports/implementation/phase-3/FEAT-012.md`
- `.specify/specs/FEAT-012/requirement.md`
- `.specify/specs/FEAT-012/spec.md`
- `.specify/specs/FEAT-012/plan.md`
- `.specify/specs/FEAT-012/tasks.md`
- `.specify/specs/FEAT-012/acceptance.md`
- FEAT-012 migration guard scripts, helpers, tests, and governance docs

No implementation code was modified. FEAT-013 was not started.

## Defect Closure Matrix

| Defect | QA2 Status | Evidence |
|---|---:|---|
| DEF-001 — active guard did not reject unsafe DB targets | FIXED | `npm run guard:migration` exits non-zero for missing, dev, staging, prod, and ambiguous `DATABASE_URL`; exits `0` for `aura_capital_test_feat012_qa2`. |
| DEF-002 — active guard missed required risk classes | FIXED | Independent probe detects/block/review coverage for drop, truncate, rename, NOT NULL, unique, and data mutation/backfill patterns. |
| DEF-003 — applied migration checksum/drift integrity not proven | FIXED | Live PostgreSQL probe compares local migrations against `_prisma_migrations`; clean state passes, modified applied migration fails, missing applied migration directory fails, restored state passes. |
| DEF-004 — command/doc naming inconsistency | FIXED | Canonical `npm run guard:migration` is documented and wired; `npm run guard:migrations` alias also succeeds with matching behavior. |
| DEF-005 — implementation report overstated readiness | FIXED | Rework report records defect closure, live DB evidence, validation counts, and AC mapping truthfully. |

## Active Guard Evidence

`npm run guard:migration` behavior:

| Case | Result |
|---|---:|
| Missing `DATABASE_URL` / `TEST_DATABASE_URL` | PASS — exit code `1` |
| Dev DB target | PASS — exit code `1`, credentials masked |
| Staging DB target | PASS — exit code `1`, credentials masked |
| Production DB target | PASS — exit code `1`, credentials masked |
| Ambiguous DB target | PASS — exit code `1`, credentials masked |
| Safe isolated test DB `aura_capital_test_feat012_qa2` | PASS — exit code `0` |

Safe guard output reported:

- `migrations=3`
- `review_risks=6`
- `digests=3`

## Risk Detection Evidence

Independent probe against the active `analyzeMigrationSql` helper verified:

| Pattern | Status |
|---|---:|
| `DROP TABLE` | BLOCKING detected |
| `DROP COLUMN` | BLOCKING detected |
| `DROP SCHEMA` | BLOCKING detected |
| `DROP TYPE` | BLOCKING detected |
| `DROP INDEX` | BLOCKING detected |
| `TRUNCATE` | BLOCKING detected |
| `RENAME COLUMN` | REVIEW detected |
| `RENAME TABLE` | REVIEW detected |
| `ADD COLUMN ... NOT NULL` without default | REVIEW detected |
| `ALTER COLUMN ... SET NOT NULL` | REVIEW detected |
| `CREATE UNIQUE INDEX` | REVIEW detected |
| `ADD CONSTRAINT ... UNIQUE` | REVIEW detected |
| `INSERT INTO` backfill/data migration | REVIEW detected |
| `UPDATE` backfill/data migration | REVIEW detected |
| `DELETE FROM` data migration | REVIEW detected |

## PostgreSQL Migration Evidence

Fresh isolated DB:

- DB: `aura_capital_test_feat012_qa2`
- `npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma`: PASS
- `npx prisma migrate status --schema=apps/api/prisma/schema.prisma`: PASS
- Migration count: 3
- Applied migrations:
  - `20260825000000_init_identity`
  - `20260825000001_feat005_refresh_session_rotation`
  - `20260827000000_feat009_audit_events`

Applied migration integrity against live PostgreSQL:

- Clean applied state: PASS (`applied=3`, `verified=3`)
- Modified already-applied migration: PASS — drift/checksum mismatch detected
- Removed applied migration directory: PASS — missing applied migration detected
- Restored clean state: PASS
- Comparison authority: live PostgreSQL `_prisma_migrations`

## Command Consistency

- `npm run guard:migration`: PASS
- `npm run guard:migrations`: PASS, alias behavior matches canonical command
- `docs/migration-governance.md`: uses canonical `npm run guard:migration`
- Package scripts are aligned at root and `@aura/api`.

## Full Validation Suite

| Validation | Result | Evidence |
|---|---:|---|
| `npm run clean` | PASS | Completed successfully |
| `npm run lint` | PASS | Completed successfully |
| `npx prisma validate --schema=apps/api/prisma/schema.prisma` | PASS | Schema valid |
| `npm run typecheck` | PASS | Completed successfully |
| `npm run build` | PASS | API/web/shared built successfully |
| `npm run test` | PASS | 43 files / 347 tests passed |
| `npm run test:db` | PASS | 9 files / 47 tests passed |
| `npm run test:redis` | PASS | 4 files / 40 tests passed |
| `npm run guard:persistence` | PASS | 1 file / 14 tests passed |
| `npm run guard:migration` | PASS | CLI guard passed against isolated test DB |

## Acceptance Criteria Matrix

| AC | Status | Notes |
|---|---:|---|
| AC-001 | PASS | Fresh isolated DB migrated from zero-state. |
| AC-002 | PASS | Fresh DB status reported up to date. |
| AC-003 | PASS | QA commands used explicit environment variables. Prisma prints `.env` load notices by default, but target DB was explicitly set. |
| AC-004 | PASS | Existing/current approved schema is represented by the migrated FEAT-002..FEAT-011 state. |
| AC-005 | PASS | DB regression suite covers representative Phase 2 row preservation. |
| AC-006 | PASS | DB regression suite verifies key uniqueness, FK, cascade, and SET NULL constraints. |
| AC-007 | PASS | Migration rules documented with canonical command. |
| AC-008 | PASS | Test/CI migration validation requires isolated target naming. |
| AC-009 | PASS | Validation can run with explicit env configuration. |
| AC-010 | PASS | CI migration expectations documented without developer-local secrets. |
| AC-011 | PASS | Active command rejects unsafe/missing/ambiguous targets before mutation. |
| AC-012 | PASS | Guard output masks DB credentials and does not expose secrets. Advisory: future hardening should avoid absolute local paths in non-secret diagnostic errors. |
| AC-013 | PASS | Required migration risk classes are detected as BLOCKING or REVIEW. |
| AC-014 | PASS | Blocking destructive patterns fail guard and require Human approval. |
| AC-015 | PASS | No product-domain schema or destructive schema change introduced. |
| AC-016 | PASS | Forward-fix/reset governance documented. |
| AC-017 | PASS | Applied migration integrity is compared to live `_prisma_migrations`; tamper/missing probes fail closed. |
| AC-018 | PASS | Current migration ordering is deterministic and monotonic. |
| AC-019 | PASS | Full FEAT-002..FEAT-011 regression validation passed. |
| AC-020 | PASS | Implementation report is now accurate for defects, evidence, counts, and limitations. |
| AC-021 | PASS | No product API/UI/seed/Redis health/product audit/Phase 4 behavior introduced. |
| AC-022 | PASS | FEAT-012 remains in QA/review, FEAT-013+ blocked, Phase 3 in progress, Phase 4 blocked. Advisory: tracker has historical Phase 2-era text saying Phase 3 implementation had not started, but current FEAT-012 governance fields are correct. |

## Security / Data Integrity Assessment

PASS. The active guard now fails closed for unsafe database targets, masks database credentials, detects required destructive/review-risk SQL classes, and verifies applied migration immutability against PostgreSQL migration metadata. PostgreSQL remains the migration authority; no Redis/JWT/client state is introduced as migration authority.

## Regression Assessment

PASS. Standard, PostgreSQL, Redis, persistence guard, and migration guard validation all passed. No FEAT-002 through FEAT-011 regression was observed.

## Advisory Notes

- The drift helper's missing-file diagnostic can include an absolute local path in non-secret local/test failure output. This did not leak credentials or application secrets during QA, but should be sanitized in a future hardening pass if the project treats all absolute local paths as sensitive.
- `docs/progress-tracker.md` contains historical Phase 2-era wording that says Phase 3 implementation had not started. The current FEAT-012 governance section correctly states `IMPLEMENTED / READY FOR QA`, and FEAT-013 remains blocked.

## Blocking Issues

None.

## Final Verdict

PASS

FEAT-012 is ready for Human Final Gate. FEAT-013 must remain BLOCKED until Human Final Gate approval is granted for FEAT-012.
