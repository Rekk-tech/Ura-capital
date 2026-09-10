# Aura Capital - Cross-Phase Dependency Map

Status: HUMAN APPROVED  
Date: 2026-09-07  
Scope: Phase 4 through Phase 7, with later phase signals.

## 1. Dependency Types

- HARD: consumer cannot implement or integrate correctly without the producer's concrete output.
- SOFT: consumer can implement against a frozen contract, mock, fixture, or adapter and integrate later.
- INDEPENDENT: no implementation dependency; only shared platform rules apply.

## 2. Phase Edges

| Producer | Consumer | Contract | Type | Notes |
| --- | --- | --- | --- | --- |
| Phase 2 | Phase 4 | Authenticated user context, RBAC/admin guards, auth audit, rate limits | HARD | Already approved. |
| Phase 3 | Phase 4 | PostgreSQL/Prisma, repositories, UoW, migration governance, Redis boundary, seed safety | HARD | Already approved. |
| Phase 4 | Phase 5 | Academy completion state | INDEPENDENT | Simulation does not consume Academy runtime data for MVP. Governance sequencing may still require Phase 4 completion first. |
| Phase 2 | Phase 5 | Authenticated user context and server-side authorization | HARD | Simulation sessions are user-owned. |
| Phase 3 | Phase 5 | Repository/UoW, migration governance, Redis transient boundary | HARD | Simulation is transaction-heavy. |
| Phase 5 | Phase 6 | Simulation data | INDEPENDENT | Community MVP does not depend on Simulation. |
| Phase 4 | Phase 6 | Academy data | INDEPENDENT | Community MVP does not depend on Academy. |
| Phase 2 | Phase 6 | Authenticated user context and admin guard | HARD | Posts/comments/likes/moderation are user/admin-scoped. |
| Phase 3 | Phase 6 | Repository/UoW, migration governance, product audit governance | HARD | Community persistence uses shared data foundation. |
| Phase 5 | Phase 7 | Premium-gated Simulation surfaces | SOFT | Entitlement middleware can be built before deciding exact Simulation gates. |
| Phase 6 | Phase 7 | Premium-gated Community surfaces | SOFT | Only needed if Human chooses premium Community features. |
| Phase 2 | Phase 7 | Authenticated user context | HARD | Entitlements are user-scoped. |
| Phase 3 | Phase 7 | Repository/UoW, migration governance, audit governance | HARD | Subscription state is durable and audited. |
| Phase 4 | Phase 8 | Academy context resolver | SOFT | AI can use contract/mocks until Academy integration is final. |
| Phase 5 | Phase 8 | Simulation context resolver | SOFT | AI needs read-only simulated context, not engine ownership. |
| Phase 7 | Phase 8 | AI entitlement/quota gating | SOFT | HARD only if Human decides AI is premium-only. |

## 3. Feature-Level Critical Edges

```text
Phase 4:
FEAT-025 -> FEAT-026 -> FEAT-027 -> FEAT-028 -> FEAT-029 decision -> FEAT-030

Phase 5:
FEAT-031 -> FEAT-032 -> FEAT-033 -> FEAT-034 -> FEAT-035 -> FEAT-036 -> FEAT-038 -> FEAT-040
FEAT-037 depends on FEAT-035/036
FEAT-039 depends on FEAT-033..037

Phase 6:
FEAT-041 -> FEAT-042 -> FEAT-043
FEAT-042 -> FEAT-044
FEAT-042/043 -> FEAT-045
FEAT-042..045 -> FEAT-046 -> FEAT-047

Phase 7:
FEAT-048 -> FEAT-049 -> FEAT-051
FEAT-048 -> FEAT-050 -> FEAT-053
FEAT-049/051 -> FEAT-052
FEAT-048..053 -> FEAT-054
```

## 4. DEV-B Phase 6 Early Start Decision

PHASE 6 CONTRACT-FIRST PREPARATION is AUTHORIZED after Human Master Planning Approval.

Reasons:

- Phase 6 has no HARD dependency on Phase 4 Academy or Phase 5 Simulation outputs.
- Phase 6 has HARD dependencies only on approved Phase 2 and Phase 3 contracts.
- Prisma migration ordering can conflict with DEV-A work, so DEV-B must reserve Phase 6 migration ranges and rebase before merge.
- DEV-B must not edit Phase 4/5 modules.
- Full Phase 6 production implementation is not authorized until Human decisions on public feed/read policy, Community UI scope, and moderation baseline are resolved.

## 5. Phase 7 Early Start Decision

PHASE 7 CONTRACT-FIRST PREPARATION may begin after Phase 6 core contracts are frozen.

Reasons:

- Subscription core does not require concrete Community implementation.
- Premium-gating specific Community/Simulation surfaces remains SOFT until Human chooses gates.
- DEV-B owns Phase 6 and Phase 7, so internal sequencing can be efficient, but final integration must still follow approved main.
- Full Phase 7 production implementation requires Human decisions on provider strategy, plan taxonomy, entitlement keys, and checkout inclusion/deferment.

## 6. Integration Order

Develop in parallel. Integrate sequentially:

```text
main
  <- Phase 4
  <- Phase 5
  <- Phase 6
  <- Phase 7
```

No later phase branch may merge before rebasing onto the latest approved main and passing cross-phase integration tests.
