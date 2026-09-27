# FEAT-079 Specification: Learning Path & Course Player UI

Status: IN_PROGRESS / ASSIGNED TO ANTIGRAVITY
Target Reviewer: Human Authority

## 1. Architecture & Boundaries

- **Objective**: Provide a comprehensive visual curriculum roadmap (`/academy/learning-path`) and an immersive, distraction-free Course Player (`/academy/courses/:courseSlug/player/:lessonSlug`) adhering to strict server-authoritative progression.
- **Route Governance**: Promote `/academy/learning-path` and `/academy/courses/:courseSlug/player/:lessonSlug` from `PLANNED` to `AVAILABLE` under `owningFeature: "FEAT-079"`.
- **Server Authority**: Lesson completion, unlock rules, XP rewards, and course milestones must be derived directly from server DTOs. Client caches serve presentation purposes only.
- **XSS & Content Sanitization**: Educational markdown must be parsed with raw HTML suppression and sanitized through DOMPurify before rendering.
- **Phase 8 AI Isolation**: AI track remains 100% FROZEN. No Gemini or AI gateway calls permitted.
- **Persistence Boundary**: Exactly 10 migrations total; ZERO schema changes or database migrations.

## 2. Functional Contract

### FR-001: Route Governance & Availability Promotion
- Register `ACADEMY_LEARNING_PATH` (`/academy/learning-path`) and `ACADEMY_COURSE_PLAYER` (`/academy/courses/:courseSlug/player/:lessonSlug`) in `route-registry.ts`.
- Set `status: "AVAILABLE"`, `owningFeature: "FEAT-079"`, and section `"learning"`.
- Update `route-registry.test.ts` and `AppShell.test.tsx` to assert learning path route resolution and metadata.

### FR-002: Academy API Client Enhancements
- In `AcademyApiClient` (`apps/web/src/features/academy/api/academyApi.ts` & `apps/web/src/api/academy.api.ts`):
  - `getLearningPath(accessToken?, options?)`: Retrieves sequenced roadmap with tracks (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`), milestones, and prerequisite statuses.
  - `getCourseLessons(courseSlug, accessToken?, options?)`: Retrieves ordered lessons with completion statuses and lock states.
  - `getLessonContent(courseSlug, lessonSlug, accessToken?, options?)`: Retrieves sanitized lesson detail.
  - `markLessonComplete(courseSlug, lessonSlug, accessToken?, options?)`: Dispatches server-authoritative lesson completion.
  - Native `AbortSignal` forwarding across all fetch calls.

### FR-003: Resilient TanStack Query Hooks
- In `apps/web/src/features/academy/hooks/use-academy.ts`:
  - `useLearningPathQuery(accessToken?)`: Configured with `staleTime: 30_000`, `refetchOnWindowFocus: false`.
  - `useCourseLessonsQuery(courseSlug, accessToken?)`: Cached lesson outline with prerequisite lock states.
  - `useLessonContentQuery(courseSlug, lessonSlug, accessToken?)`: Content query.
  - `useMarkLessonCompleteMutation()`: Invalidation of progress, learning path, lesson, and XP queries on success.
  - Retry suppression: Immediate suppression of retries on 401, 403, and 404 HTTP errors.

### FR-004: Visual Learning Roadmap (`LearningPathPage.tsx`)
- Render visual curriculum roadmap across milestone tracks:
  - Track tabs or sections: Beginner Foundations, Intermediate Strategies, Advanced Mastery.
  - Course cards showing title, description, level, lesson count, progress percentage, and status (`LOCKED`, `AVAILABLE`, `IN_PROGRESS`, `COMPLETED`).
  - Active course callout highlighting learner's current milestone.
  - Handles all 5 async UI states:
    1. Loading (roadmap skeleton)
    2. Empty (no courses available)
    3. Auth-Required (informational card prompting login to track personal progress)
    4. Error (error alert with retry trigger)
    5. Success (curriculum roadmap)
  - Explicit Server Authority Disclosure notice rendered.

### FR-005: Immersive Course Player (`CoursePlayerView.tsx`)
- Distraction-free split-pane reading layout:
  - **Left Sidebar**:
    - Course title & back-to-roadmap link.
    - Overall course progress bar with percentage and completed/total lesson counts.
    - Collapsible syllabus with ordered chapters/lessons.
    - Status indicators: Completed checkmark, Active reading indicator, Locked padlock.
    - Toggle collapse button for focused reading on smaller screens.
  - **Main Reading Panel**:
    - Lesson position label ("Lesson X of Y") and lesson title.
    - Markdown body rendered safely via `LessonContent.tsx` / DOMPurify.
  - **Bottom Control Bar**:
    - "Previous Lesson" button (disabled on first lesson).
    - "Mark as Completed" / "Complete & Continue" button triggering authoritative mutation.
    - "Next Lesson" button (disabled on last lesson or if next lesson is locked).

### FR-006: Prerequisite Lock Enforcement & Progression
- Sequential lesson progression:
  - The first lesson of an unlocked course is always accessible.
  - Subsequent lessons remain locked until preceding lessons are completed.
  - Direct navigation to a locked lesson URL displays an accessible locked state informing the learner of required prerequisites, without rendering unauthorized content.
- "Complete & Continue" button triggers `markLessonComplete` mutation, invalidates query caches, and transitions automatically to the next unlocked lesson.

### FR-007: Server Authority Disclosures
- Prominently render server authority notice on both Learning Path and Course Player views:
  *"All course completions, module unlock states, and XP rewards are evaluated exclusively server-authoritatively."*

### FR-008: Accessibility & Responsive Standards
- Single `<h1>` per view, semantic hierarchy (`<h2>`, `<h3>`).
- Full keyboard operability (Tab, Enter, Space, Escape).
- ARIA landmarks (`nav`, `main`, `aside`, `role="progressbar"`).
- Prefers-reduced-motion media query respected.
- Responsive layout down to 320px with zero horizontal scroll overflow.

## 3. Data & State Matrix

| State | Learning Path Page | Course Player View |
|---|---|---|
| **Loading** | Animated milestone track skeletons | Player sidebar + reading panel skeletons |
| **Empty** | "No courses available in this track" empty card | "No lessons found in this course" state |
| **Auth-Required** | Guest view with progress tracking notice | Guest preview or sign-in prompt for progress recording |
| **Locked** | Padlock badge, prerequisite requirement notice | Locked lesson view with prerequisite completion prompt |
| **Error** | Error banner with retry trigger | Error state with retry trigger |
| **Success** | Interactive curriculum roadmap | Immersive syllabus + content + controls |
