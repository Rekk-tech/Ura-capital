# FEAT-048 Implementation Report: Subscription Domain Schema & Persistence Foundation

## 1. Executive Summary

| Attribute | Canonical Record |
| --- | --- |
| **Feature ID** | FEAT-048 |
| **Feature Title** | Subscription Domain Schema & Persistence Foundation |
| **Phase** | Phase 7 — Subscription / Premium |
| **Role / Owners** | Architecture Owner: CODEX / Implementation Owner: DEV-B (ANTIGRAVITY) |
| **Baseline** | `phase-6-approved` (`bf94d61`) |
| **Delivery Strategy** | Fast-Track Implementation |
| **Migration Ownership** | Sole Phase 7 migration owner (FEAT-049..FEAT-057 contain ZERO migrations) |
| **Internal Feature Gate Status** | **PASS** (16/16 tasks complete, 24/24 ACs pass, Canonical 14 PASS) |

---

## 2. Models, Columns & Relationships

FEAT-048 establishes the server-authoritative persistence foundation across three PostgreSQL tables and Prisma models.

### 2.1 `UserSubscription` (`user_subscriptions`)
- **`id`**: `TEXT` (UUID), Primary Key (`user_subscriptions_pkey`).
- **`user_id`**: `TEXT`, Foreign Key to `users(id)` with `ON DELETE RESTRICT ON UPDATE CASCADE`.
- **`plan_key`**: `TEXT`, Default `'FREE'`, restricted to closed set `('FREE', 'PREMIUM')`.
- **`status`**: `TEXT`, Default `'ACTIVE'`, restricted to closed set `('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')`.
- **`provider_key`**: `TEXT`, Default `'INTERNAL'`. Provider-neutral string.
- **`external_subscription_id`**: `TEXT` (nullable), Provider external subscription identifier.
- **`current_period_start`**: `TIMESTAMP(3)`, Period start boundary.
- **`current_period_end`**: `TIMESTAMP(3)`, Period end boundary (`current_period_end >= current_period_start`).
- **`cancel_at_period_end`**: `BOOLEAN`, Default `false`. Indicates scheduled transition to `EXPIRED` at `current_period_end`.
- **`provider_sequence`**: `TEXT` (nullable), Trusted monotonic sequence/ordering marker from provider.
- **`created_at`**: `TIMESTAMP(3)`, Default `CURRENT_TIMESTAMP`.
- **`updated_at`**: `TIMESTAMP(3)`, Automatic timestamp update.

### 2.2 `SubscriptionProviderEvent` (`subscription_provider_events`)
- **`id`**: `TEXT` (UUID), Primary Key (`subscription_provider_events_pkey`).
- **`provider_key`**: `TEXT`, Provider namespace key.
- **`provider_event_id`**: `TEXT`, Authoritative provider event identifier.
- **`event_type`**: `TEXT`, Normalized webhook/event type.
- **`outcome`**: `TEXT`, Default `'RECEIVED'`, restricted to closed set `('RECEIVED', 'PROCESSED', 'DUPLICATE', 'IGNORED', 'FAILED')`.
- **`occurred_at`**: `TIMESTAMP(3)`, Event occurrence time at provider.
- **`received_at`**: `TIMESTAMP(3)`, Ingestion time at server.
- **`processed_at`**: `TIMESTAMP(3)` (nullable), Processing completion time.
- **`payload_digest`**: `TEXT` (nullable), Cryptographic hash of payload for integrity verification.
- **`metadata`**: `JSONB` (nullable), Flat allowlisted safe metadata.
- **`subscription_id`**: `TEXT` (nullable), Foreign Key to `user_subscriptions(id)` with `ON DELETE SET NULL ON UPDATE CASCADE`.
- **`created_at`**: `TIMESTAMP(3)`, Default `CURRENT_TIMESTAMP`.
- **`updated_at`**: `TIMESTAMP(3)`, Automatic timestamp update.

### 2.3 `SubscriptionTransitionRecord` (`subscription_transition_records`)
- **`id`**: `TEXT` (UUID), Primary Key (`subscription_transition_records_pkey`).
- **`subscription_id`**: `TEXT`, Foreign Key to `user_subscriptions(id)` with `ON DELETE RESTRICT ON UPDATE CASCADE`.
- **`user_id`**: `TEXT`, Foreign Key to `users(id)` with `ON DELETE RESTRICT ON UPDATE CASCADE`.
- **`from_status`**: `TEXT` (nullable), Lifecycle status prior to transition.
- **`to_status`**: `TEXT`, Lifecycle status after transition (`'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'`).
- **`from_plan`**: `TEXT` (nullable), Commercial plan prior to transition.
- **`to_plan`**: `TEXT`, Commercial plan after transition (`'FREE' | 'PREMIUM'`).
- **`source`**: `TEXT`, Transition origin (`'USER_ACTION' | 'PROVIDER_WEBHOOK' | 'ADMIN_ACTION' | 'SYSTEM_JOB' | 'RECONCILIATION'`).
- **`transaction_strategy`**: `TEXT`, FEAT-016 coupling classification (`'TRANSACTIONALLY_COUPLED' | 'STATE_FIRST' | 'BEST_EFFORT'`).
- **`reason`**: `TEXT` (nullable), Business rationale for transition.
- **`provider_event_id`**: `TEXT` (nullable), Correlation to originating provider event.
- **`actor_id`**: `TEXT` (nullable), Server-controlled actor snapshot.
- **`subject_id`**: `TEXT` (nullable), Server-controlled subject snapshot.
- **`request_id`**: `TEXT` (nullable), Request tracing ID.
- **`correlation_id`**: `TEXT` (nullable), Distributed transaction correlation ID.
- **`metadata`**: `JSONB` (nullable), Safe flat metadata.
- **`created_at`**: `TIMESTAMP(3)`, Default `CURRENT_TIMESTAMP`.

---

## 3. Database Constraints, Indexes & Idempotency

### 3.1 Partial Unique Indexes & Idempotency
1. **One Non-Terminal Subscription Invariant**:
   ```sql
   CREATE UNIQUE INDEX "user_subscriptions_one_non_terminal"
   ON "user_subscriptions"("user_id")
   WHERE "status" IN ('ACTIVE', 'PAST_DUE');
   ```
   Enforces at the database engine level that no user can have more than one non-terminal subscription simultaneously. Permits multiple terminal subscriptions (`CANCELLED`, `EXPIRED`) for historical audit retention.
2. **Provider Event Idempotency**:
   ```sql
   CREATE UNIQUE INDEX "subscription_provider_events_provider_event_uidx"
   ON "subscription_provider_events"("provider_key", "provider_event_id");
   ```
   Durable PostgreSQL authority for provider event deduplication; eliminates reliance on Redis locks for authoritative deduplication.
3. **External Subscription Identifier Uniqueness**:
   ```sql
   CREATE UNIQUE INDEX "user_subscriptions_provider_external_id_uidx"
   ON "user_subscriptions"("provider_key", "external_subscription_id")
   WHERE "external_subscription_id" IS NOT NULL;
   ```
   Guarantees that an external provider subscription ID maps uniquely to one internal subscription within that provider namespace.

### 3.2 Check Constraints
- `user_subscriptions_status_check`: `status IN ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')`
- `user_subscriptions_plan_key_check`: `plan_key IN ('FREE', 'PREMIUM')`
- `user_subscriptions_period_dates_check`: `current_period_end >= current_period_start`
- `subscription_provider_events_outcome_check`: `outcome IN ('RECEIVED', 'PROCESSED', 'DUPLICATE', 'IGNORED', 'FAILED')`
- `subscription_transition_records_to_status_check`: `to_status IN ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')`
- `subscription_transition_records_from_status_check`: `from_status IS NULL OR from_status IN ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')`
- `subscription_transition_records_to_plan_check`: `to_plan IN ('FREE', 'PREMIUM')`
- `subscription_transition_records_from_plan_check`: `from_plan IS NULL OR from_plan IN ('FREE', 'PREMIUM')`
- `subscription_transition_records_source_check`: `source IN ('USER_ACTION', 'PROVIDER_WEBHOOK', 'ADMIN_ACTION', 'SYSTEM_JOB', 'RECONCILIATION')`
- `subscription_transition_records_strategy_check`: `transaction_strategy IN ('TRANSACTIONALLY_COUPLED', 'STATE_FIRST', 'BEST_EFFORT')`

### 3.3 Foreign Key Deletion Policies
- `user_subscriptions.user_id -> users(id)`: **`ON DELETE RESTRICT`**
- `subscription_transition_records.subscription_id -> user_subscriptions(id)`: **`ON DELETE RESTRICT`**
- `subscription_transition_records.user_id -> users(id)`: **`ON DELETE RESTRICT`**
- `subscription_provider_events.subscription_id -> user_subscriptions(id)`: **`ON DELETE SET NULL`**

---

## 4. Repository Primitives & Transaction Compatibility

### 4.1 Interface Architecture
Defined in `apps/api/src/modules/subscription/subscription.types.ts`:
- **`ISubscriptionRepository`**: `findById`, `findActiveByUserId`, `findAllByUserId`, `findByExternalSubscriptionId`, `create`, `update`.
- **`ISubscriptionProviderEventRepository`**: `create`, `findById`, `findByProviderEventId`, `updateOutcome`.
- **`ISubscriptionTransitionRepository`**: `create`, `findById`, `findBySubscriptionId`, `findByUserId`, `findByCorrelationId`.

### 4.2 Append-Only Transition History Immutability
`ISubscriptionTransitionRepository` strictly prohibits update or delete operations:
- Zero `update`, `updateTransitionRecord`, or `updateMany` methods.
- Zero `delete`, `deleteTransitionRecord`, or `deleteMany` methods.

### 4.3 Transaction Runner Propagation
Registered in `apps/api/src/infrastructure/database/repository-factory.ts`:
- `subscriptionRepo: new PrismaSubscriptionRepository(client)`
- `subscriptionProviderEventRepo: new PrismaSubscriptionProviderEventRepository(client)`
- `subscriptionTransitionRepo: new PrismaSubscriptionTransitionRepository(client)`
When called inside `transactionRunner.run(async (ctx) => ...)`, all three repositories use `ctx.repositories` bound to `ctx.tx`, guaranteeing atomic commits or full rollback on failure.

---

## 5. Migration Validation & Reproducibility

### 5.1 Migration File
`apps/api/prisma/migrations/20260922000000_feat048_subscription_foundation/migration.sql`
- Total migrations in history: **10**
- Additive, forward-only, zero destructive DROP/TRUNCATE statements.
- Verified by `scripts/guard-migration.ts` with 0 blocking risks and clean checksum validation.

### 5.2 Fresh Zero-State Validation
Validated via `subscription-migration-validation.test.ts`:
- Migrations apply sequentially from zero without drift.
- All 10 migrations recorded in `_prisma_migrations` with `finished_at NOT NULL`.
- All tables, columns, indexes, and constraints exist in `information_schema` and `pg_indexes`.

### 5.3 Real Phase 6 Upgrade Preservation
Validated via `subscription-migration-validation.test.ts`:
- Seeded representative data for Phase 2 Identity (User, Credential, RefreshSession, AuthSecurityAuditRecord), Phase 4 Academy, Phase 5 Simulation, and Phase 6 Community (Post, Comment, Like).
- Applied FEAT-048 migration and verified 100% data preservation and intact foreign key relationships.
- Verified that existing Phase 6 users can immediately receive new Phase 7 subscription records.

---

## 6. Scope Guard Enforcements

| Scope Guard | Result | Verification Evidence |
| --- | --- | --- |
| **Zero Public / Learner Routes** | **PASS** | 0 routes added; 0 controllers added; 0 public services added |
| **Zero Checkout UI / CTAs** | **PASS** | 0 frontend components or UI modifications |
| **Zero Entitlement Logic** | **PASS** | Entitlement resolution and catalog deferred to FEAT-049 |
| **Zero Production Provider SDKs** | **PASS** | No Stripe, Paddle, LemonSqueezy, or payment gateway SDK imported |
| **Zero Payment / Credential Storage** | **PASS** | Probed `information_schema.columns`: 0 PAN, CVV, card, secret, raw payload columns |
| **Zero Redis Durable State** | **PASS** | PostgreSQL is 100% sole durable authority; Redis authority is 0 |
| **Zero Auth Audit Reuse** | **PASS** | `AuthSecurityAuditRecord` unchanged; dedicated `SubscriptionTransitionRecord` used |
| **Default User Semantics** | **PASS** | User with no subscription row resolves safely to null/FREE without DB mutation |

---

## 7. Canonical 14 Verification Results

| # | Command | Status | Details / Counts |
| -: | --- | :---: | --- |
| 1 | `npm run clean` | **PASS** | Cleaned dist and cache |
| 2 | `npm run lint` | **PASS** | 0 errors, 0 warnings across all workspaces |
| 3 | `npx prisma validate --schema=apps/api/prisma/schema.prisma` | **PASS** | Schema is valid |
| 4 | `npm run typecheck` | **PASS** | 0 TypeScript errors across api, web, shared |
| 5 | `npm run build` | **PASS** | Built shared, api, and web (vite bundle 547 kB) |
| 6 | `npm run test` | **PASS** | 42 test files passed across all workspaces |
| 7 | `npm run test:unit` | **PASS** | 68 test files passed (api: 53 files/669 tests, web: 14 files/181 tests, shared: 1 file/31 tests) |
| 8 | `npm run test:db` | **PASS** | 38 test files passed, 517 tests passed sequentially |
| 9 | `npm run test:redis` | **PASS** | 5 test files passed, 50 tests passed |
| 10 | `npm run guard:persistence` | **PASS** | 1 test file passed, 14 tests passed |
| 11 | `npm run guard:migration` | **PASS** | 10 migrations verified, 0 blocking risks, 39 review risks, 10 digests |
| 12 | `npm run guard:boundary` | **PASS** | 18 controllers, 23 services, 9 repositories, 0 violations |
| 13 | `npm run guard:audit-governance` | **PASS** | 0 premature product audit models, tables, or APIs |
| 14 | `npm run guard:seed-safety` | **PASS** | 0 unsafe seed scripts, migration fixtures, or admin backdoors |

---

## 8. Acceptance Criteria Matrix (24/24 PASS)

| AC ID | Description | Result | Evidence |
| --- | --- | :---: | --- |
| **AC-001** | Approved D2..D6 locks implemented exactly without deviation | **PASS** | FREE/PREMIUM tiers, no trial, PAST_DUE no access, CANCELLED/EXPIRED terminal, dedicated transition record |
| **AC-002** | Persistence-only scope, PostgreSQL durable authority, no-record FREE semantics | **PASS** | `subscriptionRepo.findActiveByUserId` returns null safely without creating DB rows; 0 public APIs |
| **AC-003** | Exact `phase-6-approved` schema and migration baseline recorded | **PASS** | 9 historical migrations cataloged; FEAT-048 is #10 |
| **AC-004** | Only UserSubscription, SubscriptionProviderEvent, SubscriptionTransitionRecord introduced | **PASS** | Exact Prisma models and tables created; 0 speculative plan or entitlement tables |
| **AC-005** | No database-backed plan catalog or per-user entitlement table | **PASS** | Verified via information_schema table queries |
| **AC-006** | Explicit relationships, cardinalities, nullability, and delete policies | **PASS** | Verified in schema.prisma and migration.sql (`ON DELETE RESTRICT` for user and transitions) |
| **AC-007** | Plan/status/outcome/source/strategy closed sets reject invalid durable values | **PASS** | Tested in `subscription-foundation-db.test.ts` with PostgreSQL CHECK constraints |
| **AC-008** | Exactly one additive Phase 7 migration introduced | **PASS** | `20260922000000_feat048_subscription_foundation` is sole Phase 7 migration |
| **AC-009** | Migration contains no destructive/data-loss operation, production seed, or db push | **PASS** | Verified by `guard:migration` with 0 blocking risks |
| **AC-010** | Duplicate `(providerKey, providerEventId)` rejected by PostgreSQL | **PASS** | Tested and verified in `subscription-foundation-db.test.ts` |
| **AC-011** | Duplicate provider external subscription identity rejected in approved scope | **PASS** | Tested and verified in `subscription-foundation-db.test.ts` (partial unique index where not null) |
| **AC-012** | Concurrent creation converges to at most one non-terminal subscription per user | **PASS** | Tested with 8 parallel concurrent creation attempts: 1 winner, 7 rejected |
| **AC-013** | Required indexes, timestamps, and NOT NULL constraints match approved model | **PASS** | Verified in `subscription-migration-validation.test.ts` |
| **AC-014** | User deletion restricted while subscription history exists | **PASS** | Foreign key violation thrown on deleting user with subscription or transition rows |
| **AC-015** | Controllers/services remain Prisma-free; repositories implement approved interfaces | **PASS** | Verified by `guard:boundary` (0 violations) |
| **AC-016** | Root and transaction repository factories use same implementation classes | **PASS** | `createRepositoryContainer` wires same Prisma repositories for root and transaction clients |
| **AC-017** | Repository primitives participate atomically in caller-owned UoW and roll back on error | **PASS** | Tested in `subscription-foundation-db.test.ts` with forced failure rollback verification |
| **AC-018** | Transition history is append-only under normal application behavior | **PASS** | `ISubscriptionTransitionRepository` has zero update or delete methods |
| **AC-019** | `AuthSecurityAuditRecord` schema, taxonomy, and behavior unchanged | **PASS** | Verified in `subscription-foundation-db.test.ts` |
| **AC-020** | No payment credential, raw webhook payload, provider secret, or sensitive path leaks | **PASS** | Schema column probe confirms 0 sensitive payment/secret fields |
| **AC-021** | Fresh isolated PostgreSQL deploy/status/validate and constraint suite pass from zero | **PASS** | Verified in `subscription-migration-validation.test.ts` |
| **AC-022** | Real Phase 6 upgrade preserves representative rows, relationships, and constraints | **PASS** | Tested across Identity, Academy, Simulation, and Community data in `subscription-migration-validation.test.ts` |
| **AC-023** | Canonical validation, existing guards, and Phase 2-6 regressions pass with no skips | **PASS** | All 14 Canonical checks and regressions PASS |
| **AC-024** | Report evidence and tracker state truthful; FEAT-049 remains blocked pending gate | **PASS** | Documented in this report and updated in tracker |

---

## 9. Tasks Matrix (16/16 COMPLETE)

| Task ID | Description | Status |
| --- | --- | :---: |
| **T001** | Record and implement approved D2..D6 locks, PostgreSQL authority, no-record FREE semantics | **COMPLETE** |
| **T002** | Inventory the `phase-6-approved` Prisma baseline and migration digests | **COMPLETE** |
| **T003** | Define the three approved entities and explicit cardinalities/delete policies | **COMPLETE** |
| **T004** | Define closed plan/status/outcome/source/strategy values | **COMPLETE** |
| **T005** | Create the sole additive Phase 7 migration | **COMPLETE** |
| **T006** | Add provider-event and external-subscription uniqueness | **COMPLETE** |
| **T007** | Add one-non-terminal-subscription database invariant and race proof | **COMPLETE** |
| **T008** | Add required indexes, timestamps, nullability, and User delete restriction | **COMPLETE** |
| **T009** | Add repository interfaces and shared root/transaction implementations | **COMPLETE** |
| **T010** | Prove repository primitives participate atomically in caller-owned UoW and roll back on error | **COMPLETE** |
| **T011** | Prove transition append-only and auth-audit invariance | **COMPLETE** |
| **T012** | Probe prohibited payment/raw-payload persistence and diagnostic leakage | **COMPLETE** |
| **T013** | Run fresh zero-state migration validation | **COMPLETE** |
| **T014** | Run real Phase 6 upgrade and representative-row/constraint preservation | **COMPLETE** |
| **T015** | Run boundary/migration/audit guards and full Phase 2-6 regression | **COMPLETE** |
| **T016** | Publish truthful implementation report and keep FEAT-049 blocked pending gate | **COMPLETE** |

---

## 10. Internal Feature Gate Verdict

```text
================================================================================
FEAT-048 INTERNAL FEATURE GATE VERDICT: PASS
================================================================================
Tasks Completed:               16 / 16
Acceptance Criteria Passed:    24 / 24
Sole Phase 7 Migration:        20260922000000_feat048_subscription_foundation
Fresh Zero-State DB:           PASS
Phase 6 Upgrade Preservation:  PASS
PostgreSQL Invariants:         PASS (Partial Unique Index, Unique Event, Checks, Restrict FKs)
Concurrency Races:             PASS (Single Winner Invariant)
UoW Atomic Rollback:           PASS
Redis Authority:               ZERO
Public APIs / Routes:          ZERO
Payment SDKs / Data:           ZERO
Canonical 14 Pipeline:         PASS (14 / 14)
Escalation / Defects:          ZERO (No P0/P1)
Status:                        INTERNAL FEATURE GATE PASS
================================================================================
```
