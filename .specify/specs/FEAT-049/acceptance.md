# FEAT-049 Acceptance Criteria

Status: HUMAN MASTER PLANNING APPROVED / PLANNED / DEPENDENCY CONTROLLED

- AC-001 The approved D2..D5 and D9 locks are implemented exactly; no implementation-defined tier, trial, grace, cancellation, terminal-state, or domain-gate choice remains.
- AC-002 Canonical tier/entitlement constants contain no unapproved key.
- AC-003 Plan catalog is server-owned, configuration-backed, and startup-validated.
- AC-004 Provider price IDs/secrets are absent from public/shared plan projections.
- AC-005 Entitlement resolver exposes a narrow reusable non-Prisma interface.
- AC-006 Missing subscription resolves to FREE with zero premium entitlement.
- AC-007 Valid ACTIVE subscription grants only mapped entitlements.
- AC-008 Period start/end boundaries use a server-controlled clock and deny expired/not-yet-valid state.
- AC-009 PAST_DUE grants no premium and has no grace period.
- AC-010 No trial, `TRIALING` state, or implicit trial entitlement exists.
- AC-011 Cancel-at-period-end remains ACTIVE only through valid `currentPeriodEnd` then becomes EXPIRED; only provider-confirmed immediate cancellation may become CANCELLED; both terminal states deny.
- AC-012 Forged client/JWT premium, plan, status, entitlement, date, provider, and user claims cannot affect resolution.
- AC-013 Repository/infrastructure failure returns safe failure and grants nothing.
- AC-014 Invalid durable state fails closed and emits only sanitized diagnostics.
- AC-015 FEAT-049 adds zero schema, migration, API, provider call, Redis cache, guard, UI, admin grant, or existing-domain gate.
- AC-016 Unit and PostgreSQL-backed tests deterministically cover all status/time boundaries.
- AC-017 Canonical validation and Phase 2-6/FEAT-048 regressions pass.
- AC-018 Report/AC/task evidence is truthful and dependent features remain correctly gated.

Hard fail: client authority, fail-open resolution, hidden tier/key, provider secret exposure, direct Prisma service use, or schema drift.
