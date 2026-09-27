# FEAT-079 Plan: Learning Path & Course Player UI

Status: IN_PROGRESS / ASSIGNED TO ANTIGRAVITY

## 1. Delivery Architecture

1. **Route Governance & Shell Integration**:
   - Register `ACADEMY_LEARNING_PATH` (`/academy/learning-path`) and `ACADEMY_COURSE_PLAYER` (`/academy/courses/:courseSlug/player/:lessonSlug`) in `apps/web/src/app/router/route-registry.ts`.
   - Mount routes in `apps/web/src/app/router/academy-routes.tsx`.
   - Update tests in `route-registry.test.ts` and `AppShell.test.tsx`.

2. **Types & API Client**:
   - Define learning path DTOs (`LearningPathTrackDto`, `LearningPathMilestoneDto`, `PlayerLessonDto`, `CoursePlayerDetailsDto`) in `academy-ui.types.ts`.
   - Add `getLearningPath`, `getCourseLessons`, `getLessonContent`, and `markLessonComplete` to `AcademyApiClient` in `academyApi.ts`.
   - Forward `AbortSignal` across all requests.
   - Unit test methods in `academy.api.test.ts`.

3. **TanStack Query Hooks**:
   - Add `useLearningPathQuery`, `useCourseLessonsQuery`, `useLessonContentQuery`, and `useMarkLessonCompleteMutation` to `use-academy.ts`.
   - Apply `shouldRetry` preventing retry loops on 401/403/404.

4. **Visual Learning Roadmap**:
   - Create `LearningPathPage.tsx` under `apps/web/src/features/academy/pages/`.
   - Implement milestone tracks (Beginner, Intermediate, Advanced) with prerequisite checks, active course highlight, and progress bars.
   - Support all 5 async UI states: Loading, Empty, Auth-Required, Error, and Success.
   - Component test in `LearningPathPage.test.tsx`.

5. **Immersive Course Player**:
   - Create `CoursePlayerView.tsx` under `apps/web/src/features/academy/components/` (and/or `LessonPlayerPage.tsx` page).
   - Implement split-pane layout with collapsible syllabus, chapters, completion checkmarks, active lesson indicator, and course progress bar.
   - Render sanitized markdown body via DOMPurify (`LessonContent.tsx`).
   - Implement bottom control bar with Previous, Complete & Continue, and Next controls.
   - Enforce sequential progression and prerequisite lock states.
   - Component test in `CoursePlayerView.test.tsx`.

6. **Accessibility & Quality Verification**:
   - Single H1 per view, semantic heading structure, keyboard operability, ARIA landmark roles, and responsive layout from 320px+ with zero horizontal overflow.
   - Run `npm run lint`, `npm run typecheck`, `npm run test:web`, `npm run build`, and repository guards.
