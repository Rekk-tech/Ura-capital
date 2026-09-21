# FEAT-045 Tasks

- [x] T001 Freeze status transitions, Option A, rate limits, outage, and audit-deferral contracts (FR-001..FR-017; AC-001..AC-008).
- [x] T002 [P] Implement centralized Community moderation/visibility policy (FR-001..FR-004; AC-009..AC-012).
- [x] T003 Add strict forbidden-authority-field validation across Community writes (FR-005; AC-013).
- [x] T004 Revalidate non-enumerating IDOR behavior across post/comment/like routes (FR-006; AC-014).
- [x] T005 Add required Community limiter environment validation with no fallback secret (FR-012; AC-015).
- [x] T006 Implement HMAC key factory and namespaced run/worker-safe test keys (FR-011, FR-012; AC-016, AC-017).
- [x] T007 Implement post/comment create and delete limiter policies (FR-007..FR-009; AC-018..AC-021).
- [x] T008 Implement combined like/unlike limiter policy (FR-010; AC-022).
- [x] T009 Enforce approved proxy/source semantics (FR-013; AC-023).
- [x] T010 Implement safe 429/Retry-After and 503 fail-closed behavior (FR-014, FR-015; AC-024..AC-026).
- [x] T011 Preserve read availability and automatic recovery (FR-014; AC-027, AC-028).
- [x] T012 [P] Add unit tests for transitions, keys, proxy, thresholds, and diagnostics (FR-016, FR-018; AC-009..AC-018, AC-023).
- [x] T013 Add API spoofing, IDOR, exact-threshold, and no-audit-amplification tests (FR-005, FR-006, FR-015, FR-018; AC-013, AC-014, AC-024, AC-029).
- [x] T014 Add live Redis multi-instance, TTL, outage, recovery, and isolation tests (FR-011..FR-015, FR-018; AC-016..AC-028).
- [x] T015 Add live PostgreSQL zero-mutation checks for throttled/outage writes (FR-014, FR-018; AC-025, AC-026).
- [x] T016 Verify no raw identifiers/content/secrets in Redis keys or logs (FR-012, FR-016; AC-030).
- [x] T017 Verify no moderation route/UI, product audit table/event, or migration (FR-004, FR-017, FR-019; AC-031, AC-032).
- [x] T018 Run canonical 14 and FEAT-010A/015/016 regressions (FR-018; AC-033).
- [x] T019 Create `reports/implementation/phase-6/FEAT-045.md` with exact evidence (FR-018; AC-001..AC-033).

## Dependency Order

T001 -> T002..T006 -> T007..T011 -> T012..T017 -> T018 -> T019.
