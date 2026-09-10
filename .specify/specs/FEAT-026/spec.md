# Specification: FEAT-026 Academy Progression & Completion Tracking

**Feature ID**: FEAT-026  
**Phase**: Phase 4 - Academy  
**Status**: APPROVED FOR IMPLEMENTATION  
**Planning Owner**: Codex  
**Implementation Status**: NOT_STARTED  
**Human Planning Approval**: APPROVED  
**Unresolved Human Decisions**: ZERO  

---

## 1. Architectural Findings From Draft Review

The existing FEAT-026 draft was useful as draft input. Codex corrected it, Human approved the final planning package, and the approved policies are now canonical for implementation.

Actual schema inspection confirms:

- `AcademyUserLessonProgress` exists with UUID PK, `(userId, lessonId)` unique constraint, status/timestamp checks, indexes, and restrictive FK policy.
- `AcademyUserCourseProgress` exists with UUID PK, `(userId, courseId)` unique constraint, status/timestamp checks, indexes, and restrictive FK policy.
- `AcademyUserXp` and `AcademyRewardLedger` exist, but FEAT-026 must not mutate them.
- FEAT-025 grading writes `GRADED`, `score`, `passed`, and correctness snapshots in its own transaction.

Human-approved migration decision: ZERO production migration for FEAT-026 under the approved policy baseline.

## 2. FEAT-025 Reconciliation Architecture

FEAT-026 MUST preserve FEAT-025 ownership:

1. FEAT-025 grades the attempt and commits `GRADED` state.
2. FEAT-026 consumes the committed `GRADED` attempt through `reconcileProgressFromGradedAttempt(...)`.
3. FEAT-026 runs progression updates in a separate PostgreSQL transaction.
4. If progression reconciliation fails after grading commits, the graded attempt remains durable and retry can converge.

The reconciliation operation MUST be idempotent. Replaying reconciliation for an already-completed lesson or course must preserve original `completedAt` and return `isFirstCompletion = false`.

## 3. Historical and Current Curriculum Semantics

Human-approved canonical semantics:

- Historical completion is a durable milestone.
- Current coverage is a dynamic read projection.
- `completed = true` does not imply `progressPercent = 100`.

Example:

1. Learner completes 5 of 5 published lessons.
2. Course progress becomes `COMPLETED`, with `completedAt = T1`.
3. A 6th lesson is later published.
4. Historical completion remains `COMPLETED`, but current coverage reads `5 / 6 = 83%`.

Archived and draft lessons are excluded from current denominator calculations. Historical lesson progress rows remain intact.

## 4. Data Model Use

FEAT-026 uses existing Phase 4 persistence:

- `AcademyUserLessonProgress`
- `AcademyUserCourseProgress`
- FEAT-025 `AcademyQuizAttempt` as source of `GRADED` / `passed`
- Published `AcademyCourse`, `AcademyLesson`, and `AcademyQuiz` records

It must not create or mutate:

- `AcademyUserXp`
- `AcademyRewardLedger`
- product audit records
- Redis durable state

## 5. Completion Algorithm

Lesson completion sources:

- Quiz lesson: passed FEAT-025 `GRADED` attempt for the published quiz.
- Informational lesson: explicit authenticated completion request.

Course completion:

- Count active published lessons for the course.
- Count active published lessons completed by the learner.
- If total is zero, current coverage is `0 / 0 / 0%` and no new completion is inferred.
- If completed count equals total and total is greater than zero, persist course completion if it is not already completed.

Percentage:

```text
progressPercent = totalPublishedLessons == 0
  ? 0
  : Math.round((completedPublishedLessons / totalPublishedLessons) * 100)
```

## 6. Completion Fact Contract

Internal contract for FEAT-027:

```ts
type AcademyCompletionFact = {
  userId: string;
  resourceType: "LESSON" | "COURSE";
  resourceId: string;
  isFirstCompletion: boolean;
  completedAt: Date;
};
```

Semantic identity:

```text
userId + resourceType + resourceId
```

This is not a public API DTO and must not include score, pass/fail, XP, reward, or correctness details.

## 7. API Contracts

### GET /api/academy/courses/:courseSlug/progress

Authenticated current-user read. Returns safe course progress projection:

- course identifier and slug
- historical course status and `completedAt`
- `completedLessons`
- `totalLessons`
- `progressPercent`
- lesson progress summaries with completion status and timestamp

Must not expose answer correctness, score, pass/fail, XP, reward internals, or cross-user state.

### POST /api/academy/courses/:courseSlug/lessons/:lessonSlug/complete

Authenticated current-user mutation. Body must be `{}`.

If the lesson has no published quiz, it completes the lesson idempotently.

If the lesson has a published quiz, it fails with `400 QUIZ_COMPLETION_REQUIRED`; passing the quiz is the only completion path.

## 8. Frontend Contract

Learner UI may show:

- course progress bar
- completed lesson markers
- historical completion indicator
- informational lesson completion action

Frontend must not show XP/reward effects from FEAT-026 and must not infer hidden scoring or correctness.

## 9. Failure and Retry

Progress writes are isolated in a FEAT-026 transaction. On failure:

- no partial lesson/course progress is committed;
- no XP, reward, audit, or Redis side effects occur;
- the original FEAT-025 graded attempt remains durable;
- retrying the same completion/reconciliation must converge deterministically.

## 10. Security Rules

- User identity is server-derived.
- No arbitrary `userId` parameter is accepted.
- No cross-user progress read/write.
- No correctness, score, answer key, or explanation leakage.
- No Redis durable authority.
- No XP/reward/audit mutation.
- Sanitized generic errors only.

## 11. Validation Requirements

Implementation must include unit, integration, live PostgreSQL, and frontend tests where applicable. Canonical validation includes:

```text
npm run clean
npm run lint
npx prisma validate --schema=apps/api/prisma/schema.prisma
npm run typecheck
npm run build
npm run test
npm run test:unit
npm run test:db
npm run test:redis
npm run guard:persistence
npm run guard:migration
npm run guard:boundary
npm run guard:audit-governance
npm run guard:seed-safety
```

Mandatory skips cannot produce PASS.
