# FEAT-048 Acceptance Criteria

Status: HUMAN MASTER PLANNING APPROVED / APPROVED FOR IMPLEMENTATION

- AC-001 The approved D2..D6 locks are implemented exactly and no implementation-defined commercial/lifecycle/audit choice remains.
- AC-002 Scope is persistence-only; PostgreSQL is the durable authority, a missing subscription row resolves to FREE/no premium without mutation, and FEAT-049+ behavior is absent.
- AC-003 The exact `phase-6-approved` schema and migration baseline is recorded.
- AC-004 Only `UserSubscription`, `SubscriptionProviderEvent`, and approved `SubscriptionTransitionRecord` concepts are introduced.
- AC-005 No database-backed plan catalog or per-user entitlement grant table exists unless Human changes the proposal.
- AC-006 Relationships, cardinalities, nullability, and delete policies are explicit.
- AC-007 Plan/status/outcome/source/strategy closed sets reject invalid durable values; cancel-at-period-end reaches `EXPIRED` at `currentPeriodEnd`, provider-confirmed immediate cancellation alone may produce `CANCELLED`, and both are terminal.
- AC-008 Exactly one additive Phase 7 migration is introduced by FEAT-048.
- AC-009 Migration contains no destructive/data-loss operation, production seed, premium grant, or `db push` dependency.
- AC-010 Duplicate `(providerKey, providerEventId)` is rejected by PostgreSQL.
- AC-011 Duplicate provider external subscription identity is rejected in its approved scope.
- AC-012 Concurrent creation converges to at most one non-terminal subscription per user.
- AC-013 Required indexes, timestamps, and NOT NULL constraints match the approved model.
- AC-014 User deletion is restricted while subscription history exists.
- AC-015 Controllers/services remain Prisma-free and repositories implement approved interfaces.
- AC-016 Root and transaction repository factories use the same implementation classes and transaction client propagation.
- AC-017 Repository primitives use the caller's transaction context and a repository test harness proves event/state/history writes commit or roll back atomically without adding a transition-producing service.
- AC-018 Transition history is append-only under normal application behavior.
- AC-019 `AuthSecurityAuditRecord` schema, taxonomy, and behavior are unchanged.
- AC-020 No payment credential, raw webhook payload, provider secret, database detail, token, cookie, or sensitive path leaks or persists.
- AC-021 Fresh isolated PostgreSQL deploy/status/validate and constraint suite pass from zero.
- AC-022 Real Phase 6 upgrade preserves representative rows, relationships, constraints, indexes, and migration integrity.
- AC-023 Canonical validation, all existing guards, and Phase 2-6 regressions pass with no mandatory skip.
- AC-024 Report evidence and tracker state are truthful; FEAT-049 remains blocked until the feature gate.

Hard fail: destructive migration, multiple migration owners, client authority, missing DB uniqueness, payment-data storage, auth-audit reuse, or unexecuted mandatory live validation.
