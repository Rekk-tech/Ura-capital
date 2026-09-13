# Acceptance Criteria: FEAT-027 XP & Idempotent Reward Ledger

**Status**: APPROVED FOR IMPLEMENTATION  
**Implementation Status**: NOT_STARTED  
**Unresolved Human Decisions**: ZERO  

| ID | Acceptance Criterion |
| --- | --- |
| AC-001 | Human-approved XP amounts, zero-reward policies, level deferral, and reward triggers are recorded before implementation. |
| AC-002 | Reward eligibility is derived only from authenticated user, FEAT-026 completion/progression context, persisted Academy completion state, deterministic reward identity, and PostgreSQL ledger state. |
| AC-003 | Durable reward identity includes `userId`, `resourceType`, `resourceId`, and `rewardType/source`; it does not rely only on `isFirstCompletion`. |
| AC-004 | First lesson completion awards exactly 10 XP. |
| AC-005 | First course completion awards exactly 50 XP. |
| AC-006 | Ledger creation and `AcademyUserXp` aggregate mutation occur in one transaction. |
| AC-007 | Forced failure rolls back both ledger and aggregate mutation. |
| AC-008 | Duplicate/replayed reward identity returns idempotently and does not increment XP again. |
| AC-009 | Five concurrent reward applications for the same identity create one ledger row and one XP increment. |
| AC-010 | Failed quiz and repeated quiz attempt rewards are 0 XP / 0 additional XP. |
| AC-011 | Historical automatic backfill is deferred and cannot run during deployment, startup, migration, or hidden repair. |
| AC-012 | Reward metadata is allowlisted, flat, sanitized, and size-bounded. |
| AC-013 | `GET /api/academy/me/xp` is authenticated and current-user only. |
| AC-014 | If reward history is exposed, it contains no hidden quiz correctness, secrets, internal relations, or cross-user data. |
| AC-015 | Lightweight frontend XP display is read-only and cannot submit XP/reward authority. |
| AC-016 | Client-supplied XP, reward amount/type, idempotency key, source id, completion state, or userId is rejected or ignored safely. |
| AC-017 | PostgreSQL unique constraints are final authority for reward idempotency. |
| AC-018 | Redis stores zero durable XP/reward authority. |
| AC-019 | Product audit is not activated by FEAT-027. |
| AC-020 | No subscription, premium, badge, or entitlement side effects are introduced. |
| AC-021 | FEAT-026 progression semantics remain unchanged. |
| AC-022 | Repository/UoW boundaries and safe error mapping are preserved. |
| AC-023 | Migration governance is preserved; no unapproved schema change. |
| AC-024 | Canonical 14 validation commands pass with no mandatory skips and implementation report maps AC-001..AC-027. |
| AC-025 | If progression commits but reward reconciliation fails, completion remains durable, ledger remains absent, XP remains unchanged, and retry awards exactly once. |
| AC-026 | Level mechanics are not introduced: no formula, thresholds, level-up event/reward, invented `level` update, or meaningful learner level DTO exposure. |
| AC-027 | FEAT-026 invokes internal reward reconciliation after eligible completion facts without adding public reward mutation endpoints, Kafka/RabbitMQ, or outbox. |
