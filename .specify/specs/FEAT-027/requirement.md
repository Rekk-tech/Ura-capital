# Requirement: FEAT-027 XP & Idempotent Reward Ledger

**Feature ID**: FEAT-027  
**Phase**: Phase 4 - Academy  
**Status**: APPROVED FOR IMPLEMENTATION  
**Planning Owner**: Codex  
**Implementation Owner After Approval**: Antigravity / DEV-A  
**Implementation Status**: NOT_STARTED  
**Dependencies**: FEAT-026 DONE / Internal Feature Gate PASS / checkpoint `feat-026-approved`  

## Goal

FEAT-027 adds server-authoritative Academy XP rewards using the existing `AcademyUserXp` aggregate and `AcademyRewardLedger` durable history. It consumes FEAT-026 internal `AcademyCompletionFact` and awards XP exactly once per approved semantic reward.

## In Scope

- Lesson completion XP reward.
- Course completion XP reward.
- Deterministic reward identity derived from `userId`, `resourceType`, `resourceId`, and reward type/source.
- `AcademyRewardLedger` as durable reward source of truth.
- `AcademyUserXp` as transactionally maintained aggregate.
- Idempotent replay behavior.
- Concurrency-safe reward application.
- Safe current-user XP read projection and lightweight learner XP display.
- PostgreSQL-backed tests for duplicate/replay/concurrent reward prevention.
- Reward recovery/reconciliation after progression commits but reward write fails.

## Out of Scope

- Badges.
- Premium/subscription entitlement.
- Product audit activation. FEAT-029 owns the audit decision.
- Redis durable XP/reward authority.
- Quiz grading, progression, or completion semantics.
- Admin reward management APIs.
- Public reward mutation APIs.
- XP level mechanics, level thresholds, level-up events, or level rewards.

## Human-Approved Decisions

Human has approved the following FEAT-027 baseline:

| Decision | Approved Baseline | Rationale |
| --- | --- | --- |
| Lesson first completion reward | 10 XP | Small, predictable learner feedback. |
| Course first completion reward | 50 XP | Meaningfully larger than lesson reward. |
| Failed quiz | 0 XP | Avoid rewarding failed assessments. |
| Repeated quiz attempt | 0 additional XP | Prevent farming. |
| Historical automatic reward backfill | DEFERRED | Avoid surprising retroactive mutation. Future backfill requires explicit operational feature and Human approval. |
| Current-user XP read API | INCLUDED | Needed for learner transparency and FEAT-028 ownership tests. |
| Lightweight learner XP display | INCLUDED | Useful but strictly read-only. |
| Badges | OUT OF SCOPE | Avoid reward-system scope expansion. |
| Premium/subscription | OUT OF SCOPE | Owned by later phases/features. |
| Level mechanics | DEFERRED | No formula, thresholds, level-up events, or level rewards in Phase 4. |

Existing `AcademyUserXp.level` must not be treated as an authoritative learner progression mechanic in Phase 4. FEAT-027 must not update it from an invented formula and must not expose level in learner DTOs unless existing approved behavior already requires it.

## Functional Requirements

- FR-001: Reward eligibility MUST be server-derived from authenticated user context, FEAT-026 completion/progression state, deterministic reward identity, and PostgreSQL reward ledger state.
- FR-002: Client MUST NOT submit authoritative XP amount, reward type, ledger identity, completion state, or user id.
- FR-003: Reward identity MUST include `userId`, `resourceType`, `resourceId`, and `rewardType`; `AcademyCompletionFact.isFirstCompletion` is informational only and MUST NOT be durable reward eligibility authority.
- FR-004: `AcademyRewardLedger` MUST be written before/in the same transaction as `AcademyUserXp` aggregate mutation.
- FR-005: Duplicate reward identity MUST return an idempotent existing outcome and MUST NOT increment XP again.
- FR-006: Any failure after ledger start but before aggregate update MUST roll back both.
- FR-007: Five concurrent reward applications for the same completion identity MUST produce one ledger entry and one XP increment.
- FR-008: XP aggregate MUST never become negative.
- FR-009: Reward metadata MUST be flat, allowlisted, sanitized, and must not include password, token, cookie, secret, answer correctness, or raw request body.
- FR-010: Redis MUST NOT store durable XP, reward ledger, completion, or idempotency authority.
- FR-011: Product audit events MUST NOT be emitted unless FEAT-029 activates them.
- FR-012: All repository/UoW boundaries from FEAT-013 MUST be preserved.
- FR-013: FEAT-027 reward application MUST behave as idempotent reconciliation: if a completed resource has no canonical ledger entry, create the ledger and increment XP in one transaction; if the ledger exists, return the existing reward outcome with zero additional XP mutation.
- FR-014: If FEAT-026 progression has already committed and FEAT-027 reward write failed, retry/reconciliation MUST be able to award the missing reward exactly once and MUST NOT reject solely because a replayed completion fact has `isFirstCompletion == false`.
- FR-015: FEAT-026-to-FEAT-027 orchestration MUST invoke internal reward reconciliation after deriving eligible lesson/course completion facts, without adding a public reward mutation endpoint, Kafka/RabbitMQ, or outbox.
- FR-016: Current-user XP read API MUST use canonical route `GET /api/academy/me/xp`, require authentication, and return a minimal safe DTO containing `totalXp` only unless safe recent reward history is explicitly implemented.
- FR-017: Frontend XP display MUST be read-only and MUST NOT calculate authoritative XP, submit reward amount/identity, grant rewards, or calculate level.
- FR-018: No automatic historical backfill may run during deployment, startup, migration, or hidden repair.

## Schema Position

Actual schema already includes:

- `AcademyUserXp`: unique `userId`, `totalXp`, `level`.
- `AcademyRewardLedger`: `userId`, `sourceType`, `sourceId`, `rewardType`, `amount`, optional unique `idempotencyKey`, and unique `(userId, sourceType, sourceId, rewardType)`.

Recommended migration decision: ZERO production migration unless implementation proves an approved invariant cannot be enforced by existing constraints.

## Acceptance Baseline

FEAT-027 uses AC-001 through AC-027 from `acceptance.md`.
