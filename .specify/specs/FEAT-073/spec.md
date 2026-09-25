# FEAT-073 Specification: Academy Experience Integration & Polish

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / IMPLEMENTATION NOT_STARTED

## 1. Architecture Contract

- Objective: Integrate and polish the approved learner-facing Academy experience inside the Phase 9 shell while preserving Phase 4 security and data-integrity contracts.
- API: Consumes only approved Academy catalog, lesson, flashcard, quiz, progression, and reward endpoints.
- Persistence: ZERO database or migration changes.
- Security: Correct answers and grading remain server-side; user progress/reward authority remains PostgreSQL; educational rich content retains approved sanitization.
- Ownership: Owns Academy frontend integration and scoped polish. Excludes Academy schema/API changes, CMS, authoring, grading logic, reward logic, and durable product audit activation.

## 2. Functional Contract

### FR-001

Integrate all approved Academy learner routes into the canonical shell and route registry.

### FR-002

Preserve catalog, course, lesson, flashcard, quiz, progression, and reward contracts without inventing fields or endpoints.

### FR-003

Keep correct-answer data unavailable before submission and render only server grading/reward results.

### FR-004

Provide coherent continue-learning and progression presentation using only approved durable facts.

### FR-005

Preserve sanitized educational content and safe user-visible error handling.

### FR-006

Complete loading, empty, auth-required, not-found, validation, rate-limit, unavailable, and generic error states.

### FR-007

Meet Phase 9 responsive/accessibility requirements across all Academy learner journeys.

### FR-008

Run targeted Academy journeys and Phase 4 security/integrity regression with truthful evidence.

## 3. State and Error Contract

Every networked view must distinguish loading, success, empty where meaningful, authentication-required, authorization-denied, not-found, validation/rate-limit/unavailable, and generic failure as applicable. UI copy must be safe, bounded, and must not expose stack traces, provider details, database details, secrets, tokens, cookies, or sensitive paths.

## 4. Data and Authority Contract

ZERO database or migration changes. Browser state and query caches are presentation mechanisms only. Server denials and owning-domain facts override stale client state.

## 5. Quality Gate

All ACs must pass, targeted tests must be deterministic, relevant earlier-phase regressions and repository checks must remain green, exact-source CI must succeed, and there must be no open P0/P1. Self-verification is not independent QA.

