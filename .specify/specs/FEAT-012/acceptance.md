# Acceptance Criteria: FEAT-012 Migration Reproducibility & Schema Governance

**Status**: PROPOSED FOR HUMAN REVIEW

## 1. Acceptance Matrix

| ID | Criterion | Verification |
|----|-----------|--------------|
| AC-001 | A fresh isolated PostgreSQL database can be migrated from zero-state with `prisma migrate deploy`. | Command evidence and migration list/count in implementation report. |
| AC-002 | After fresh deploy, `prisma migrate status` reports the database schema is up to date. | Command evidence. |
| AC-003 | Fresh migration evidence uses explicit environment configuration and does not rely on developer-local `.env`. | Command/environment review. |
| AC-004 | Existing-schema upgrade validation starts from the latest approved FEAT-011/Phase 2 schema state. | Setup evidence and report review. |
| AC-005 | Representative Phase 2 rows survive current migration deploy: user, credential, role, user-role, refresh session, and auth security audit record. | PostgreSQL query evidence. |
| AC-006 | Key Phase 2 database constraints remain enforced after migration validation. | PostgreSQL-backed constraint tests or equivalent query evidence. |
| AC-007 | Local, test, CI, staging, and production migration rules are documented with explicit allowed/prohibited commands. | Documentation/report review. |
| AC-008 | Test/CI migration validation uses isolated PostgreSQL targets only. | Guard tests and command evidence. |
| AC-009 | Migration validation can run without developer-local `.env` values. | Clean environment or explicit-env validation evidence. |
| AC-010 | CI migration expectations are documented and do not require local developer services or secrets. | CI/workflow/docs review. |
| AC-011 | Test database isolation guard rejects local development, staging, production, missing, or ambiguous DB targets before mutation. | Unit/integration guard tests. |
| AC-012 | Guard/error/report output does not expose raw database URLs, credentials, tokens, cookies, passwords, secrets, or sensitive absolute local paths. | Output review and tests. |
| AC-013 | Non-destructive migration review rules identify destructive/drop/rename/backfill/raw SQL/constraint-risk changes. | Documentation or validation helper review. |
| AC-014 | Destructive or data-loss migrations require explicit Human approval before implementation/deployment. | Governance text and implementation report. |
| AC-015 | FEAT-012 does not introduce destructive schema changes or product-domain migrations. | Prisma schema/migration review. |
| AC-016 | Rollback governance distinguishes disposable local/test reset from shared/staging/production forward-fix migration strategy. | Documentation/report review. |
| AC-017 | Applied migration immutability and checksum-drift handling are defined and verified where feasible. | Prisma migration metadata/status evidence or validation helper. |
| AC-018 | Migration ordering is deterministic and reviewable. | Migration directory review and report evidence. |
| AC-019 | FEAT-002 through FEAT-011 regression validation remains green. | Clean/lint/validate/typecheck/build/test/db/redis/guard evidence. |
| AC-020 | `reports/implementation/phase-3/FEAT-012.md` exists and records commands, DB targets, migration evidence, validation results, limitations, and AC mapping truthfully. | Report review. |
| AC-021 | FEAT-012 introduces no product-domain API, UI, seed behavior, Redis health behavior, product audit table, or Phase 4 behavior. | Source/schema review. |
| AC-022 | Governance state remains consistent: FEAT-012 in QA/review after implementation, FEAT-013+ blocked, Phase 3 in progress, Phase 4 blocked. | Tracker/report review. |

## 2. PASS Requirements

FEAT-012 may receive QA PASS only when:

- AC-001 through AC-022 pass.
- Fresh zero-state migration passes against isolated PostgreSQL.
- Existing-schema upgrade preserves representative data.
- Test/CI migration validation cannot target unsafe databases.
- Migration status is up to date after deploy.
- No destructive or product-domain migration is introduced.
- FEAT-002 through FEAT-011 regression remains green.
- No blocking security/data-integrity defect remains.

## 3. FAIL Conditions

FEAT-012 must fail QA if any of the following are true:

- Fresh migration cannot be reproduced.
- Existing-schema migration loses or corrupts representative Phase 2 data.
- Migration validation requires developer-local `.env`.
- Test/CI validation can target local/staging/production-like databases.
- Destructive migration risk is hidden or ungoverned.
- Applied migrations are edited without drift/checksum detection.
- Product-domain schema or behavior is introduced.
- FEAT-002 through FEAT-011 behavior regresses.
- Implementation report claims validation passed without actual evidence.

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
npm run guard:persistence
```

FEAT-012 must also provide fresh and existing-schema PostgreSQL migration validation evidence. If a dedicated root command is added for migration validation, QA must run it independently.

## 5. Human Review Checklist

- [ ] FEAT-012 scope is limited to migration reproducibility and schema governance.
- [ ] No product-domain schema is specified.
- [ ] Environment migration rules are explicit enough for local/test/CI/staging/production.
- [ ] Test DB isolation guard expectations are strong enough.
- [ ] Non-destructive migration and forward-fix governance is acceptable.
- [ ] Acceptance criteria are independently testable.
- [ ] FEAT-013 remains blocked until FEAT-012 receives Human Final Gate approval.

## 6. Final Gate

Implementation may begin only after Human approves this spec package. FEAT-013 must not begin until FEAT-012 receives QA PASS and Human Final Gate approval.
