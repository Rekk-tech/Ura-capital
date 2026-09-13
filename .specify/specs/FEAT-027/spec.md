# Specification: FEAT-027 XP & Idempotent Reward Ledger

**Status**: APPROVED FOR IMPLEMENTATION  
**Planning Owner**: Codex  
**Implementation Status**: NOT_STARTED  

## Architecture

FEAT-027 is a narrow reward application and reconciliation feature. It consumes FEAT-026 completion/progression facts and atomically writes:

1. one durable `AcademyRewardLedger` record for the semantic reward identity;
2. one `AcademyUserXp` aggregate update for the same authenticated learner.

PostgreSQL is the only durable reward authority. Redis is prohibited for durable reward identity, XP, completion, or ledger state.

## Reward Identity

Canonical semantic identity:

```text
userId + resourceType + resourceId + rewardType
```

Suggested reward types:

- `ACADEMY_LESSON_COMPLETION`
- `ACADEMY_COURSE_COMPLETION`

The optional `idempotencyKey`, if used, must be deterministic from the same semantic tuple. It must not be client-supplied.

`AcademyCompletionFact.isFirstCompletion` is informational execution context only. It is not durable reward eligibility authority. Durable reward eligibility is determined from the authenticated user, persisted Academy completion state, deterministic reward identity, and absence/presence of the canonical `AcademyRewardLedger` row.

## Transaction Model

Reward application runs in one Unit of Work:

```text
validate server-derived completion fact
-> derive reward identity and amount
-> lookup/create canonical reward ledger row
-> update/upsert user XP aggregate exactly once
-> return safe outcome
```

If the ledger identity already exists, the service returns the existing ledger outcome and does not mutate aggregate XP. If any non-duplicate error occurs, both ledger and aggregate mutations roll back.

## Recovery / Reconciliation

FEAT-026 progression may commit before FEAT-027 reward reconciliation commits. If reward reconciliation fails after progression commits:

- lesson/course completion remains durable;
- `AcademyRewardLedger` remains absent;
- `AcademyUserXp.totalXp` remains unchanged;
- no partial reward state is allowed.

On retry or reconciliation, FEAT-027 must detect the completed resource and missing ledger identity, then create the ledger and increment XP exactly once. It must not reject solely because replayed execution context reports `isFirstCompletion == false`.

Completion fact invocation is at-least-once. Reward ledger effect is exactly-once. XP aggregate is convergent and increments exactly once per canonical reward identity.

## FEAT-026 Integration

After FEAT-026 derives eligible lesson/course completion facts, it must invoke internal FEAT-027 reward reconciliation for each eligible fact. Replayed already-completed resources must provide or reconstruct enough context for FEAT-027 to check missing ledger state.

Do not add a public reward mutation endpoint. Do not introduce Kafka, RabbitMQ, or an outbox in FEAT-027.

## API / Projection

Human-approved:

- Add `GET /api/academy/me/xp` authenticated current-user read.
- Return minimal safe DTO with `totalXp`.
- Recent reward history is optional only if it is already planned and safe.
- Add lightweight read-only learner XP display.

No endpoint may accept authoritative XP or reward input.

Do not expose `userId`, internal DB ids, idempotency keys, hidden quiz correctness, Prisma relation objects, or level as meaningful progression while level mechanics are deferred.

## Reward Policy

- Lesson first completion: 10 XP.
- Course first completion: 50 XP.
- Failed quiz: 0 XP.
- Repeated quiz attempt: 0 additional XP.
- Historical automatic reward backfill: deferred.
- Badges, premium/subscription behavior, level formulas, level thresholds, level-up events, and level rewards: out of scope.

Existing `AcademyUserXp.level` must not be updated based on an invented formula.

## Security

- Server-derived user only.
- No cross-user reads or writes.
- No client XP amount, reward type, source id, idempotency key, completion status, or user id authority.
- No answer correctness or hidden quiz data in XP DTOs.
- Safe sanitized errors only.

## Required Recovery Test

Mandatory integration coverage:

1. complete lesson;
2. commit progression;
3. inject FEAT-027 reward failure;
4. verify completion remains `COMPLETED`, ledger is absent, and `totalXp` is unchanged;
5. retry progression/reward reconciliation;
6. verify one ledger row and `totalXp += 10` exactly once;
7. retry again;
8. verify ledger count and XP remain unchanged.

Equivalent course reward coverage is required where practical.
