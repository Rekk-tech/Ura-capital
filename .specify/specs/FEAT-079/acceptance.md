# FEAT-079 Acceptance Criteria: Learning Path & Course Player UI

Status: APPROVED / ALL PASS (AC-001..AC-008 VERIFIED)

- **AC-001 (Route Governance & Availability Promotion)**:
  - Canonical routes `/academy/learning-path` and `/academy/courses/:courseSlug/player/:lessonSlug` are registered as `AVAILABLE` with `owningFeature: "FEAT-079"`.
  - `route-registry.test.ts` and `AppShell.test.tsx` verify route availability and metadata.
- **AC-002 (API Client & Cancellation Lifecycle)**:
  - `AcademyApiClient` provides `getLearningPath`, `getCourseLessons`, `getLessonContent`, and `markLessonComplete`.
  - All methods forward native `AbortSignal` for lifecycle cancellation.
- **AC-003 (Query Layer & Smart Retry Suppression)**:
  - Query hooks configure `staleTime: 30_000` and `refetchOnWindowFocus: false`.
  - Retries are suppressed on 401 Unauthorized, 403 Forbidden, and 404 Not Found.
- **AC-004 (Visual Learning Roadmap)**:
  - `LearningPathPage.tsx` visualizes curriculum roadmap across Beginner, Intermediate, and Advanced tracks.
  - All 5 async UI states (Loading skeleton, Empty, Auth-Required, Error with retry, Success) are deterministically handled.
- **AC-005 (Immersive Course Player)**:
  - `CoursePlayerView.tsx` provides split-pane layout with collapsible syllabus sidebar, lesson checkmarks, overall progress bar, and bottom navigation controls.
  - Markdown content is parsed with raw HTML suppression and sanitized through DOMPurify.
- **AC-006 (Sequential Progression & Prerequisite Locks)**:
  - Prerequisite lock rules are respected; locked lessons display a padlock badge and disabled advance actions.
  - Direct navigation to a locked lesson displays a locked state explaining prerequisites.
  - "Complete & Continue" triggers server mutation and auto-advances to the next lesson.
- **AC-007 (Server Authority Disclosures)**:
  - Prominent disclosure notice rendered: *"All course completions, module unlock states, and XP rewards are evaluated exclusively server-authoritatively."*
- **AC-008 (Accessibility & Responsive Quality Gates)**:
  - Exactly one H1 per page, valid semantic hierarchy, keyboard operability, ARIA landmark roles, and responsive layout from 320px+ with zero horizontal overflow.
  - Zero database migrations added (10 original migrations preserved).
  - Phase 8 AI track remains strictly FROZEN.
  - 100% test pass rate across unit, component, and monorepo quality gates.

## Traceability Matrix

| Requirement | Task | Acceptance Criteria |
|---|---|---|
| FR-001 | T001 | AC-001 (Route Governance & Promotion) |
| FR-002 | T002 | AC-002 (API Client & AbortSignal) |
| FR-003 | T003 | AC-003 (TanStack Query Hooks & Retry Suppression) |
| FR-004 | T004 | AC-004 (Visual Learning Roadmap) |
| FR-005 | T005 | AC-005 (Immersive Course Player) |
| FR-006 | T006 | AC-006 (Sequential Progression & Locks) |
| FR-007 | T007 | AC-007 (Server Authority Disclosures) |
| FR-008 | T008 | AC-008 (Accessibility & Quality Gates) |
