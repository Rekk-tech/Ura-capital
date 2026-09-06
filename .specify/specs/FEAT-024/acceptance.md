# Acceptance Criteria: FEAT-024 Quiz Attempt Lifecycle

**Feature ID**: FEAT-024  
**Feature Name**: Quiz Attempt Lifecycle  
**Phase**: Phase 4 — Academy  
**Status**: APPROVED FOR IMPLEMENTATION  

---

## 1. Acceptance Criteria Summary

| ID | Category | Description | Hard Gate |
|:---|:---|:---|:---:|
| **AC-001** | Authentication | Attempt start, read, and draft answer endpoints require valid JWT authentication (`401 UNAUTHENTICATED`) | YES |
| **AC-002** | Server Authority | Ownership derived from `req.user.id`; client-provided authoritative fields rejected with `400 VALIDATION_ERROR` | YES |
| **AC-003** | Publication Scoping | Starting an attempt requires Course `PUBLISHED`, Lesson `PUBLISHED`, and Quiz `PUBLISHED` (`404 NOT_FOUND`) | YES |
| **AC-004** | Primary Quiz Policy | Attempt is bound to the lowest-order `PUBLISHED` quiz of the lesson | YES |
| **AC-005** | Active Attempt Invariant | User may have at most one active `IN_PROGRESS` attempt per quiz; `CREATED` is not treated as active | YES |
| **AC-006** | Idempotent Start | Repeated start while `IN_PROGRESS` attempt exists returns existing attempt with `200 OK` (new returns `201`) | YES |
| **AC-007** | Concurrency & DB Guard | Concurrent starts serialize cleanly; targeted P2002 recovery; direct DB bypass rejected by partial unique index | YES |
| **AC-008** | Attempt Numbering | Each new attempt for a (user, quiz) tuple receives an incremented `attemptNumber >= 1` | NO |
| **AC-009** | Ownership Isolation | Attempt access by another user returns generic `404 QUIZ_ATTEMPT_NOT_FOUND` (non-enumerating) | YES |
| **AC-010** | Safe Attempt DTO | Attempt response contains only safe fields (`id`, `quizId`, `attemptNumber`, `status`, `startedAt`, `answers`) | YES |
| **AC-011** | Correctness Secrecy | Attempt and answer responses contain ZERO correctness metadata (`isCorrect`, `explanation`, `score`, etc.) | **CRITICAL HARD GATE** |
| **AC-012** | Relational Tree Check | Draft answer option must belong to question; question must belong to attempt quiz | YES |
| **AC-013** | Answer Replacement | Repeated draft answer for same question idempotently replaces previous selected option | YES |
| **AC-014** | Finalized Mutation Guard | Draft answers cannot be recorded if attempt is `SUBMITTED` or `GRADED` (`409 ATTEMPT_ALREADY_FINALIZED`) | YES |
| **AC-015** | Historical Read Policy | `IN_PROGRESS` unpublished returns `404 NOT_FOUND`; `SUBMITTED`/`GRADED` permits safe owner historical read | YES |
| **AC-016** | Redis Authority | Zero durable attempt authority in Redis; PostgreSQL is sole source of truth | YES |
| **AC-017** | Minimal Constraint Migration | Forward-only migration adds partial unique index on `(quiz_id, user_id) WHERE status = 'IN_PROGRESS'` | YES |
| **AC-018** | Frontend Attempt Shell | Learner UI renders "Start Quiz" and single-choice draft selectors without submit or score elements | NO |
| **AC-019** | Error Normalization | Normalized Aura errors (`VALIDATION_ERROR`, `UNAUTHENTICATED`, `NOT_FOUND`, `QUIZ_ATTEMPT_NOT_FOUND`, `INTERNAL_ERROR`) | YES |
| **AC-020** | Canonical Gate | Monorepo clean, lint, typecheck, build, unit, DB, Redis, and all guard tests pass | YES |

---

## 2. Deterministic Verification Criteria

### AC-001: Authentication Required
- **Given** an unauthenticated request (missing `Authorization` header, malformed token, or expired token)
- **When** calling `POST .../quiz/attempts`, `GET .../quiz/attempts/current`, `GET /api/academy/quiz-attempts/:id`, or `PUT /api/academy/quiz-attempts/:id/answers/:qId`
- **Then** the server returns `401 Unauthorized` with error code `UNAUTHENTICATED`.

### AC-002: Server-Derived Ownership & Strict Body Rejection
- **Given** an authenticated learner with ID `user-123`
- **When** the client submits an attempt start request containing `{ "userId": "user-999" }` or any other authoritative properties (`quizId`, `status`, `score`, `passed`, `startedAt`, etc.)
- **Then** the server rejects the request with `400 Bad Request` (`code: "VALIDATION_ERROR"`). Authoritative fields are strictly server-owned and never accepted or ignored from client requests.

### AC-003: Published Content Hierarchy
- **Given** a course or lesson in `DRAFT` or `ARCHIVED` status, or a lesson with no published quiz
- **When** an authenticated learner requests `POST .../quiz/attempts`
- **Then** the server returns generic `404 Not Found` (`code: "NOT_FOUND"`, message: `"Resource not found"`).

### AC-004: Primary Quiz Selection
- **Given** a published lesson with multiple published quizzes of varying orders
- **When** starting an attempt
- **Then** the attempt is associated with the quiz having the lowest `order` value, identical to FEAT-023 selection.

### AC-005: Active Attempt Invariant
- **Given** an authenticated learner with an ongoing attempt in `IN_PROGRESS` status
- **When** an attempt start request is processed
- **Then** no second active attempt record is created in the database. Active lookup checks strictly `status = 'IN_PROGRESS'` (`CREATED` is not treated as active).

### AC-006: Idempotent Return-Existing Start
- **Given** an authenticated learner with an ongoing attempt `attempt-001` in `IN_PROGRESS` status
- **When** calling `POST .../quiz/attempts`
- **Then** the endpoint returns `200 OK` with the existing `attempt-001` DTO and `{ created: false }`.
- **Given** an authenticated learner with zero ongoing attempts
- **When** calling `POST .../quiz/attempts`
- **Then** the endpoint returns `201 Created` with the newly created attempt DTO and `{ created: true }`.

### AC-007: Concurrency & Database Constraint Enforcement
- **Given** an authenticated learner with zero existing attempts
- **When** 5 concurrent `POST .../quiz/attempts` requests are dispatched simultaneously via `Promise.all`
- **Then** exactly 1 record is created in `academy_quiz_attempts`, all 5 requests return success (`200` or `201`), and all 5 return the exact same attempt ID.
- **Targeted P2002 Recovery**: If a race condition triggers a unique constraint violation on `academy_quiz_attempts_quiz_id_user_id_active_key`, the repository verifies the active attempt exists and returns it with `200 OK`. Unrelated unique violations (e.g. sequence collisions) are rethrown and not swallowed.
- **Database Bypass Test**: When an automated test attempts to bypass the application service and execute a direct raw SQL/Prisma insert of a second `IN_PROGRESS` attempt for the same `(quiz_id, user_id)`, PostgreSQL strictly rejects it via unique constraint violation on `academy_quiz_attempts_quiz_id_user_id_active_key`.

### AC-008: Deterministic Attempt Numbering
- **Given** an authenticated learner who previously finalized attempt #1 (`status = 'GRADED'`)
- **When** starting a new attempt
- **Then** a new attempt is created with `attemptNumber = 2` and `status = 'IN_PROGRESS'`. Calculation occurs within the transaction advisory lock to prevent duplicate attempt numbers.

### AC-009: Cross-User Attempt Isolation
- **Given** User A owns `attempt-A`
- **When** User B requests `GET /api/academy/quiz-attempts/attempt-A` or `PUT /api/academy/quiz-attempts/attempt-A/answers/:qId`
- **Then** the server returns `404 Not Found` with `code: "QUIZ_ATTEMPT_NOT_FOUND"`, without confirming the attempt's existence.

### AC-010: Learner-Safe Attempt DTO
- **Given** an active attempt
- **When** retrieved via GET or POST
- **Then** the serialized JSON contains only `id`, `quizId`, `attemptNumber`, `status`, `startedAt`, and `answers`. It strictly omits `userId`, `score`, `passed`, `submittedAt`, and internal snapshots.

### AC-011: Critical Hard Gate — Pre-Submission Correctness Secrecy
- **Given** any response from attempt creation, retrieval, or draft answer persistence
- **When** inspected for correctness data
- **Then** none of `isCorrect`, `is_correct`, `correctOptionId`, `correctAnswer`, `answerKey`, `solution`, `explanation`, `learnerScore`, `score`, `pointsAwarded`, `gradingResult`, `passFailResult`, `correctOptionIdSnapshot`, or `correctOptionTextSnapshot` exist in HTTP JSON, headers, or client state.
- **Violation Posture**: Any leak constitutes a **P1 Security Defect / Feature Fail**.

### AC-012: Relational Hierarchy Integrity
- **Given** an active attempt for Quiz A
- **When** submitting a draft answer with a question belonging to Quiz B, or an option belonging to Question C
- **Then** the server rejects the request with `400 Bad Request` (`code: "INVALID_OPTION_FOR_QUESTION"`) and does not insert an answer record.

### AC-013: Answer Replacement Semantics
- **Given** an active attempt where Question Q currently has Option 1 selected
- **When** the learner selects Option 2 for Question Q
- **Then** `AcademyQuizAnswer` is updated so that `selectedOptionId` equals Option 2, the table contains exactly 1 row for `(attemptId, questionId)`, and the response reflects Option 2.

### AC-014: Finalized Mutation Guard
- **Given** an attempt with status `SUBMITTED` or `GRADED`
- **When** a draft answer PUT request is received
- **Then** the server rejects the request with `409 Conflict` (`code: "ATTEMPT_ALREADY_FINALIZED"`), evaluated before any content continuation check.

### AC-015: Historical Read Policy & Content Continuation
- **Given** an ongoing `IN_PROGRESS` attempt for a lesson whose quiz, lesson, or course is subsequently changed to `DRAFT` or `ARCHIVED`
- **When** calling `GET /api/academy/quiz-attempts/:attemptId` or `PUT .../answers/:questionId`
- **Then** the server rejects the request with generic `404 Not Found` (`code: "NOT_FOUND"`, message: `"Resource not found"`).
- **Given** a finalized `SUBMITTED` or `GRADED` attempt owned by the caller whose quiz, lesson, or course is subsequently changed to `DRAFT` or `ARCHIVED`
- **When** calling `GET /api/academy/quiz-attempts/:attemptId`
- **Then** the server allows the owner to read the safe historical attempt DTO with `200 OK`.

### AC-016: Zero Redis Authority
- **Given** any execution of FEAT-024 APIs
- **When** checking Redis keys
- **Then** zero quiz attempt or answer keys are created in Redis; PostgreSQL is the sole authority.

### AC-017: Minimal Active-Attempt Constraint Migration
- **Given** the database migration suite
- **When** applying migrations to a fresh database and upgrading an existing database
- **Then** the migration successfully applies a partial unique index `academy_quiz_attempts_quiz_id_user_id_active_key` on `academy_quiz_attempts(quiz_id, user_id) WHERE status = 'IN_PROGRESS'`. The migration includes preflight duplicate validation and introduces zero new tables, columns, or seed modifications.

### AC-018: Frontend Attempt Shell
- **Given** a learner viewing `LessonDetailPage` for a lesson with a quiz
- **When** no attempt is active, a "Start Quiz" button is displayed
- **When** an attempt is started, questions and selectable single-choice options appear, persisting selections as draft answers without displaying "Submit Quiz", scores, or results.

### AC-019: Normalized Aura Error Envelope
- **Given** invalid input formats or resource lookup failures
- **When** responses are returned to the client
- **Then** errors follow the standard `{ success: false, error: { code, message } }` envelope with canonical codes:
  - `400`: `VALIDATION_ERROR`, `INVALID_OPTION_FOR_QUESTION`
  - `401`: `UNAUTHENTICATED`
  - `404`: `NOT_FOUND`, `QUIZ_ATTEMPT_NOT_FOUND`
  - `409`: `ATTEMPT_ALREADY_FINALIZED`
  - `500`: `INTERNAL_ERROR`
  and zero SQL/Prisma details leaked.

### AC-020: Canonical Monorepo Validation Gate
- **Given** the complete FEAT-024 workspace
- **When** running the canonical 14 validation commands
- **Then** all commands exit with code 0.
