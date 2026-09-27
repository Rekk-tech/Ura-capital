# FEAT-079 Tasks: Learning Path & Course Player UI

Status: COMPLETED / VERIFIED BY ANTIGRAVITY

| Task | Work | Requirement | Acceptance | State |
|---|---|---|---|---|
| T001 | Register/promote `/academy/learning-path` and `/academy/courses/:courseSlug/player/:lessonSlug` in `route-registry.ts` and mount in `academy-routes.tsx` | FR-001 | AC-001 | DONE |
| T002 | Enhance `AcademyApiClient` with `getLearningPath`, `getCourseLessons`, `getLessonContent`, and `markLessonComplete` supporting `AbortSignal` | FR-002 | AC-002 | DONE |
| T003 | Implement TanStack Query hooks (`useLearningPathQuery`, `useCourseLessonsQuery`, `useMarkLessonCompleteMutation`) with smart retry suppression | FR-003 | AC-003 | DONE |
| T004 | Build `LearningPathPage.tsx` visual learning roadmap with milestone tracks, progress bars, and all 5 async UI states | FR-004 | AC-004 | DONE |
| T005 | Build `CoursePlayerView.tsx` with collapsible syllabus sidebar, sanitized markdown reader, and bottom navigation bar | FR-005 | AC-005 | DONE |
| T006 | Implement sequential progression and prerequisite lock enforcement with locked view fallback and auto-advancement | FR-006 | AC-006 | DONE |
| T007 | Render server authority disclosure notices and ensure accessibility standards (single H1, keyboard navigation, reduced-motion) | FR-007, FR-008 | AC-007, AC-008 | DONE |
| T008 | Write comprehensive unit and component test suites, verify monorepo quality gates (lint, typecheck, test, build), and generate report | All | All | DONE |

## Dependency Order

- T001: Establishes route governance and availability baseline.
- T002 - T003: Builds typed API client methods and TanStack query hooks.
- T004 - T006: Assembles roadmap view and course player components with progression rules.
- T007: Validates accessibility, ARIA, and authority disclosures.
- T008: Executes automated test suites and repository quality gates.
