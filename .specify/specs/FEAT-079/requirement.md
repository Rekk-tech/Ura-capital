# FEAT-079 Requirement: Learning Path & Course Player UI

Status: IN_PROGRESS / ASSIGNED TO ANTIGRAVITY
Phase: Phase 9 — Customer MVP UI
Type: Implementation
Implementation Owner: Antigravity

## Goal

Implement the dedicated Learning Path visual curriculum roadmap and immersive Course Player UI for the Aura Capital Academy, enabling learners to navigate structured financial learning tracks, inspect prerequisites, read sanitized lesson content in a distraction-free player, and achieve server-authoritative sequential lesson progression.

## Functional Requirements

- FR-001: Register and promote canonical learning path routes (`/academy/learning-path`, `/academy/courses/:courseSlug/player/:lessonSlug`) to `AVAILABLE` in `route-registry.ts` with `owningFeature: "FEAT-079"`.
- FR-002: Verify and enhance Academy API client (`AcademyApiClient`) with `getLearningPath`, `getCourseLessons`, `getLessonContent`, and `markLessonComplete`, forwarding native `AbortSignal` across all methods.
- FR-003: Implement resilient TanStack Query hooks in `use-academy.ts` with `staleTime: 30_000`, `refetchOnWindowFocus: false`, and retry suppression on 401, 403, and 404 errors.
- FR-004: Build `LearningPathPage.tsx` visual learning roadmap displaying prerequisite courses, milestone tracks (Beginner, Intermediate, Advanced), overall progress, and handling all 5 async UI states (Loading, Empty, Auth-Required, Error with retry, Success).
- FR-005: Build immersive `CoursePlayerView.tsx` with split-pane layout: collapsible syllabus sidebar (chapters, completion checkmarks, active lesson indicator, course progress bar), main sanitized markdown reading panel, and bottom navigation bar ("Previous Lesson", "Mark as Completed" / "Complete & Continue", "Next Lesson").
- FR-006: Enforce sequential lesson progression and prerequisite lock rules: locked lessons display an informative lock badge and disabled advance actions; "Complete & Continue" triggers authoritative server mutation and advances to the next unlocked lesson.
- FR-007: Display prominent Server Authority Disclosures: *"All course completions, module unlock states, and XP rewards are evaluated exclusively server-authoritatively."*
- FR-008: Adhere to strict accessibility (single H1, keyboard navigation, focus management, ARIA landmark roles, prefers-reduced-motion) and responsive standards (320px+ with zero horizontal overflow).

## Non-Functional Requirements

- NFR-001: Strict Server Authority — progression and lock states are derived from server contracts; client claims never grant unearned unlocks.
- NFR-002: Zero DB Migrations — database schema remains fixed at the approved 10 migrations; zero new migrations introduced.
- NFR-003: Answer Secrecy & XSS Sanitization — all markdown rendered through DOMPurify; zero quiz answer keys leaked into lesson content.
- NFR-004: Phase 8 AI Isolation — Gemini/AI Gateway remains strictly FROZEN.
- NFR-005: 100% Quality Gates — zero lint warnings, clean typecheck, full test suite pass, production build clean.

## Dependencies

- FEAT-070 (AppShell, Route Governance)
- FEAT-071 (Authentication & Session)
- FEAT-073 (Academy Experience Integration)
