# Requirement: FEAT-011 Persistence Boundary & Legacy Data Elimination

**Status**: APPROVED FOR IMPLEMENTATION  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Feature Type**: Implementation feature  
**Implementation Agent**: Antigravity after Human approval  
**QA Owner**: Codex  

## 1. Context

Phase 2 is DONE, QA PASS, and Human Final Gate APPROVED. FEAT-002 through FEAT-010A established PostgreSQL/Prisma-backed identity, authentication, authorization, audit, and Redis-backed rate limiting.

Phase 3 now extends the approved data foundation for future product domains. FEAT-011 is the first Phase 3 feature and must prove the rebuild has no runtime dependency on legacy JSON-file persistence, especially `db.json`.

The legacy application may remain as product/UX/regression reference only. It must not be a runtime persistence dependency for the new application.

## 2. Goal

Eliminate or formally quarantine any runtime dependency on legacy JSON-file persistence and establish a verified persistence boundary:

- PostgreSQL is the durable application data authority.
- Redis is transient/distributed state only.
- `db.json` and equivalent JSON-file persistence are prohibited from runtime application behavior.

## 3. In Scope

- Inventory source references to `db.json` and legacy JSON persistence patterns.
- Classify every reference as prohibited runtime dependency, allowed documentation/reference, or allowed test fixture.
- Remove or quarantine prohibited runtime dependency if discovered.
- Add a guard test or validation script that fails if runtime application code imports, reads, writes, or configures `db.json` persistence.
- Document allowed JSON fixture/reference usage.
- Confirm FEAT-002 through FEAT-010A PostgreSQL/Redis authority boundaries remain intact.
- Run regression validation required for Phase 3 start.
- Produce `reports/implementation/phase-3/FEAT-011.md`.

## 4. Out of Scope

- Creating Academy, Simulation, Community, Subscription, or AI domain tables.
- Redesigning FEAT-002 through FEAT-010A auth persistence.
- Prisma schema migrations unless strictly needed to remove a discovered runtime legacy dependency and separately justified.
- New product APIs or UI.
- Data import from legacy JSON files.
- Seed strategy implementation; FEAT-017 owns seeds.
- Redis health implementation; FEAT-015 owns Redis readiness.
- Product-domain audit table creation; FEAT-016 owns audit governance only.
- Phase 4 planning or implementation.

## 5. Functional Requirements

- **FR-001**: The implementation MUST inventory all source, config, script, test, and documentation references to `db.json` and obvious JSON-file persistence patterns.
- **FR-002**: Each discovered reference MUST be classified as prohibited runtime persistence, allowed test fixture, allowed documentation/reference, or unrelated false positive.
- **FR-003**: Runtime application code MUST NOT read from, write to, import, require, or configure `db.json` or equivalent mutable JSON-file persistence.
- **FR-004**: If a prohibited runtime dependency exists, it MUST be removed or quarantined so it cannot affect application runtime behavior.
- **FR-005**: Test fixtures may use JSON only when they are static, isolated, and do not act as application persistence.
- **FR-006**: Documentation may mention legacy `db.json` only as rejected architecture, historical context, or prohibited runtime dependency.
- **FR-007**: A guard test or validation script MUST fail if runtime application code reintroduces `db.json` persistence.
- **FR-008**: The guard MUST distinguish prohibited runtime code from approved documentation and test fixtures.
- **FR-009**: FEAT-011 MUST preserve FEAT-002 through FEAT-010A PostgreSQL authority for users, credentials, refresh sessions, roles, auth audit records, and other durable auth/security state.
- **FR-010**: FEAT-011 MUST preserve FEAT-010A Redis transient-only rate-limit behavior.
- **FR-011**: No production fallback to JSON-file persistence may exist when PostgreSQL or Redis is unavailable.
- **FR-012**: Implementation evidence MUST list references found, classification decisions, files changed, validation commands, and acceptance mapping.
- **FR-013**: Standard validation MUST include lint, typecheck, build, standard tests, PostgreSQL-backed tests where existing Phase 2 regression requires them, and Redis-backed tests where FEAT-010A regression requires them.
- **FR-014**: FEAT-011 MUST NOT change product behavior except eliminating prohibited legacy persistence dependency if one is found.

## 6. Non-Functional Requirements

- Changes must be minimal and governance-aligned.
- No hard-coded secrets.
- No sensitive filesystem paths, database URLs, Redis URLs, tokens, cookies, passwords, or secrets in logs or reports.
- Static validation must be maintainable and not fragile to documentation references.
- Any path allowlist must be explicit and reviewed.

## 7. Dependencies

- Phase 2 Human Final Gate APPROVED.
- FEAT-002 through FEAT-010A DONE, QA PASS, Human APPROVED.
- Human-approved Phase 3 decomposition.

## 8. Success Definition

FEAT-011 is successful when:

- No runtime application dependency on `db.json` or equivalent mutable JSON persistence exists.
- Guard validation prevents reintroduction.
- Any allowed documentation/test fixture references are documented.
- Phase 2 auth/security regression remains green.
- `reports/implementation/phase-3/FEAT-011.md` truthfully records evidence.

## 9. Open Questions

None blocking for spec review.

Potential implementation choice for Human awareness:

- The guard may be implemented as a focused test, validation script, or both, as long as it is deterministic and included in standard validation.
