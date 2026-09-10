# Aura Capital - Phase Ownership Matrix

Status: HUMAN APPROVED  
Date: 2026-09-07

## 1. Canonical Ownership

Human Approval:

```text
PHASE OWNERSHIP MODEL: APPROVED
```

| Phase | Domain | Owner | Ownership |
| --- | --- | --- | --- |
| Phase 4 | Academy | DEV-A | Exclusive |
| Phase 5 | Simulation Engine | DEV-A | Exclusive |
| Phase 6 | Community | DEV-B | Exclusive |
| Phase 7 | Subscription / Premium | DEV-B | Exclusive |
| Phase 8+ | AI, UI polish, hardening | UNASSIGNED | Human decision required |

## 2. Branch Ownership

| Branch Pattern | Owner | Purpose |
| --- | --- | --- |
| `main` | Human/Codex governance gate | Protected integration branch |
| `phase/4-academy` | DEV-A | Phase 4 implementation stream |
| `phase/5-simulation` | DEV-A | Phase 5 implementation stream |
| `phase/6-community` | DEV-B | Phase 6 implementation stream |
| `phase/7-subscription` | DEV-B | Phase 7 implementation stream |

Do not implement two different phases in the same long-lived development branch.

## 3. Schema Ownership

| Schema Area | Owner | Consumers | Modification Rule |
| --- | --- | --- | --- |
| Identity/auth/session/roles | Protected shared / Phase 2 | All phases | No phase may modify without Codex architecture review |
| Auth security audit | Protected shared / Phase 2 | All phases | Do not repurpose for product audit |
| Shared migration metadata | Protected shared / Phase 3 | All phases | Immutable once approved/applied |
| Academy tables | DEV-A / Phase 4 | Phase 8 context may read later | Only Phase 4 owns mutations/migrations |
| Simulation tables | DEV-A / Phase 5 | Phase 8 context may read later; Phase 7 may gate access | Only Phase 5 owns schema/migrations |
| Community tables | DEV-B / Phase 6 | Phase 7 may gate access | Only Phase 6 owns schema/migrations |
| Subscription/entitlement tables | DEV-B / Phase 7 | Phase 5/6/8 may call entitlement checks | Only Phase 7 owns schema/migrations |
| Product audit tables | Owning activation feature | Domain modules | Requires Human-approved activation |
| AI conversation/context tables | Phase 8 owner TBD | AI module | Unassigned until Phase 8 planning |

## 3.1 Phase 5/6/7 Table Ownership Detail

| Phase | Owner | Owned Table Families | Shared Tables Consumed | Prohibited Direct Modification |
| --- | --- | --- | --- | --- |
| Phase 5 | DEV-A | `simulation_sessions`, `simulation_assets`, `simulation_scenarios`, `market_snapshots`, `simulation_orders`, `simulation_trades`, `simulation_positions`, `simulation_portfolios`, `simulation_settlements`, `simulation_events`, optional `simulation_leaderboard_snapshots` | `users`; auth context; optional product audit table if activated | Auth/session/roles; Academy tables; Community tables; Subscription tables; AI tables |
| Phase 6 | DEV-B | `community_posts`, `community_comments`, `community_post_likes`, optional `community_reports`, moderation status/history tables if approved | `users`; auth/admin context; optional entitlement check; optional product audit table if activated | Auth/session/roles; Academy tables; Simulation tables; Subscription authority tables; AI tables |
| Phase 7 | DEV-B | `plans`, `subscriptions`, `subscription_entitlements`, `provider_events`, optional `subscription_status_history`, optional provider account/link tables | `users`; auth/admin context; optional product audit table if activated | Auth/session/roles; Academy tables; Simulation tables; Community tables except consuming entitlement checks through public contracts; AI tables |

## 4. Migration Ranges

Reserved naming ranges reduce collisions during parallel development:

| Phase | Owner | Suggested Migration Prefix |
| --- | --- | --- |
| Remaining new Phase 4 work | DEV-A | `20261004xxxxxx_feat025_...` through `20261004xxxxxx_feat030_...` for new/unapplied Phase 4 additions only |
| Phase 5 | DEV-A | `20261005xxxxxx_feat031_...` through `20261005xxxxxx_feat040_...` |
| Phase 6 | DEV-B | `20261006xxxxxx_feat041_...` through `20261006xxxxxx_feat047_...` |
| Phase 7 | DEV-B | `20261007xxxxxx_feat048_...` through `20261007xxxxxx_feat054_...` |

Existing approved Phase 4 migrations, including `202609...` migrations, are immutable and must not be renamed, reordered, or edited. The reserved `20261004` range applies only to remaining new/unapplied Phase 4 work. If a branch rebases and timestamp conflicts occur, the owning developer coordinates with Codex before renaming an unapplied migration only.

## 5. Protected Shared Architecture

Neither developer may independently redesign:

- Auth/token/session lifecycle.
- Global middleware and error envelope.
- Repository factory and TransactionRunner.
- Prisma migration safety guards.
- Redis connection, namespace, health, or authority boundary.
- Auth/security audit or product audit governance.
- Seed safety and environment target classifiers.
- CI workflow and required validation suite.
- Shared security/log sanitization utilities.

Codex architecture review is required for changes in these surfaces.

## 6. Contract-First Rule

Allowed before upstream merge:

- Phase-local interfaces.
- DTOs.
- Mocks and test doubles.
- Fixtures in isolated tests.
- Domain code that consumes FROZEN contracts only.

Prohibited:

- Copying or reimplementing upstream Phase 4/5 logic in Phase 6/7.
- Guessing upstream behavior not frozen in `docs/cross-phase-contracts.md`.
- Modifying another owner's phase code.
- Sharing one branch for multiple long-lived phase streams.
