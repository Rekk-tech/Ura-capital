/**
 * Closed-set domain status constants and question type baselines for Phase 4 Academy.
 */

export const ACADEMY_CONTENT_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;

export type AcademyContentStatus =
  (typeof ACADEMY_CONTENT_STATUS)[keyof typeof ACADEMY_CONTENT_STATUS];

export const ACADEMY_PROGRESS_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export type AcademyProgressStatus =
  (typeof ACADEMY_PROGRESS_STATUS)[keyof typeof ACADEMY_PROGRESS_STATUS];

export const QUIZ_ATTEMPT_STATUS = {
  CREATED: "CREATED",
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
  GRADED: "GRADED",
} as const;

export type QuizAttemptStatus =
  (typeof QUIZ_ATTEMPT_STATUS)[keyof typeof QUIZ_ATTEMPT_STATUS];

export const REWARD_LEDGER_STATUS = {
  PENDING: "PENDING",
  APPLIED: "APPLIED",
  REVERSED: "REVERSED",
} as const;

export type RewardLedgerStatus =
  (typeof REWARD_LEDGER_STATUS)[keyof typeof REWARD_LEDGER_STATUS];

export const QUIZ_QUESTION_TYPES = {
  SINGLE_CHOICE: "SINGLE_CHOICE",
} as const;

export type QuizQuestionType =
  (typeof QUIZ_QUESTION_TYPES)[keyof typeof QUIZ_QUESTION_TYPES];

// FEAT-027 Academy XP & Reward Policy Constants
export const ACADEMY_XP_POLICY = {
  LESSON_FIRST_COMPLETION_XP: 10,
  COURSE_FIRST_COMPLETION_XP: 50,
  FAILED_QUIZ_XP: 0,
  REPEAT_ATTEMPT_XP: 0,
} as const;

export const ACADEMY_REWARD_TYPES = {
  XP: "XP",
} as const;

export type AcademyRewardType =
  (typeof ACADEMY_REWARD_TYPES)[keyof typeof ACADEMY_REWARD_TYPES];

export const ACADEMY_SOURCE_TYPES = {
  LESSON_COMPLETION: "LESSON_COMPLETION",
  COURSE_COMPLETION: "COURSE_COMPLETION",
  QUIZ_PERFECT_SCORE: "QUIZ_PERFECT_SCORE",
  FLASHCARD_SESSION: "FLASHCARD_SESSION",
} as const;

export type AcademySourceType =
  (typeof ACADEMY_SOURCE_TYPES)[keyof typeof ACADEMY_SOURCE_TYPES];

export const ACADEMY_RESOURCE_TYPES = {
  LESSON: "LESSON",
  COURSE: "COURSE",
} as const;

export type AcademyResourceType =
  (typeof ACADEMY_RESOURCE_TYPES)[keyof typeof ACADEMY_RESOURCE_TYPES];

