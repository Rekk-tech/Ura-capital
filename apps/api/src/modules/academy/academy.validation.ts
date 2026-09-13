import { z } from "zod";

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const listCoursesQuerySchema = z.object({
  page: z.coerce.number().int({ message: "Page must be an integer" }).min(1, { message: "Page must be at least 1" }).default(1),
  limit: z.coerce.number().int({ message: "Limit must be an integer" }).min(1, { message: "Limit must be at least 1" }).max(50, { message: "Limit must not exceed 50" }).default(20),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"], {
    errorMap: () => ({ message: "Level must be one of: BEGINNER, INTERMEDIATE, ADVANCED" }),
  }).optional(),
});

export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;

export const courseSlugParamSchema = z.object({
  slug: z
    .string({ required_error: "Course slug is required" })
    .trim()
    .min(1, { message: "Course slug cannot be empty" })
    .max(100, { message: "Course slug cannot exceed 100 characters" })
    .regex(SLUG_REGEX, { message: "Course slug must be lowercase alphanumeric with hyphens" }),
});

export type CourseSlugParam = z.infer<typeof courseSlugParamSchema>;

export const lessonSlugParamSchema = z.object({
  courseSlug: z
    .string({ required_error: "Course slug is required" })
    .trim()
    .min(1, { message: "Course slug cannot be empty" })
    .max(100, { message: "Course slug cannot exceed 100 characters" })
    .regex(SLUG_REGEX, { message: "Course slug must be lowercase alphanumeric with hyphens" }),
  lessonSlug: z
    .string({ required_error: "Lesson slug is required" })
    .trim()
    .min(1, { message: "Lesson slug cannot be empty" })
    .max(100, { message: "Lesson slug cannot exceed 100 characters" })
    .regex(SLUG_REGEX, { message: "Lesson slug must be lowercase alphanumeric with hyphens" }),
});

export type LessonSlugParam = z.infer<typeof lessonSlugParamSchema>;

// FEAT-023: Quiz Definition Params Validation
export const getLessonQuizParamsSchema = z.object({
  courseSlug: z
    .string()
    .min(1)
    .max(120)
    .regex(SLUG_REGEX, "Invalid course slug format"),
  lessonSlug: z
    .string()
    .min(1)
    .max(120)
    .regex(SLUG_REGEX, "Invalid lesson slug format"),
});

export type GetLessonQuizParams = z.infer<typeof getLessonQuizParamsSchema>;

// FEAT-024: Quiz Attempt Lifecycle Validation
export const startQuizAttemptBodySchema = z.object({}).strict();

export const saveDraftAnswerBodySchema = z
  .object({
    optionId: z.string().uuid("Invalid optionId format"),
  })
  .strict();

export const quizAttemptParamSchema = z
  .object({
    attemptId: z.string().uuid("Invalid attemptId format"),
  })
  .strict();

export const quizDraftAnswerParamSchema = z
  .object({
    attemptId: z.string().uuid("Invalid attemptId format"),
    questionId: z.string().uuid("Invalid questionId format"),
  })
  .strict();

export type StartQuizAttemptBody = z.infer<typeof startQuizAttemptBodySchema>;
export type SaveDraftAnswerBody = z.infer<typeof saveDraftAnswerBodySchema>;
export type QuizAttemptParam = z.infer<typeof quizAttemptParamSchema>;
export type QuizDraftAnswerParam = z.infer<typeof quizDraftAnswerParamSchema>;

// FEAT-025: Quiz Evaluation & Secure Submission Validation
export const submitQuizAttemptBodySchema = z.object({}).strict();
export type SubmitQuizAttemptBody = z.infer<typeof submitQuizAttemptBodySchema>;

// FEAT-026: Academy Progression & Completion Tracking Validation
export { CompleteLessonBodySchema, type CompleteLessonBody } from "@aura/shared";

export const completeLessonParamSchema = z
  .object({
    courseSlug: z
      .string({ required_error: "Course slug is required" })
      .trim()
      .min(1, { message: "Course slug cannot be empty" })
      .max(100, { message: "Course slug cannot exceed 100 characters" })
      .regex(SLUG_REGEX, {
        message: "Course slug must be lowercase alphanumeric with hyphens",
      }),
    lessonSlug: z
      .string({ required_error: "Lesson slug is required" })
      .trim()
      .min(1, { message: "Lesson slug cannot be empty" })
      .max(100, { message: "Lesson slug cannot exceed 100 characters" })
      .regex(SLUG_REGEX, {
        message: "Lesson slug must be lowercase alphanumeric with hyphens",
      }),
  })
  .strict();

export type CompleteLessonParam = z.infer<typeof completeLessonParamSchema>;

export const courseProgressParamSchema = z
  .object({
    courseSlug: z
      .string({ required_error: "Course slug is required" })
      .trim()
      .min(1, { message: "Course slug cannot be empty" })
      .max(100, { message: "Course slug cannot exceed 100 characters" })
      .regex(SLUG_REGEX, {
        message: "Course slug must be lowercase alphanumeric with hyphens",
      }),
  })
  .strict();

export type CourseProgressParam = z.infer<typeof courseProgressParamSchema>;

// FEAT-027: Reward Metadata Allowlist & Sanitization (AC-009, AC-012)
const ALLOWED_METADATA_KEYS = new Set([
  "courseSlug",
  "lessonSlug",
  "completedAt",
  "source",
]);

const FORBIDDEN_METADATA_PATTERNS = [
  /password/i,
  /token/i,
  /cookie/i,
  /secret/i,
  /key/i,
  /hash/i,
  /correct/i,
  /explanation/i,
  /answer/i,
  /option/i,
  /score/i,
];

/**
 * Sanitizes reward ledger metadata according to FEAT-027 AC-009 & AC-012:
 * - Allowlisted keys only: courseSlug, lessonSlug, completedAt, source
 * - Flat primitives only (string, number, boolean)
 * - Strings bounded to 256 characters
 * - Strictly strips secrets, tokens, answers, correctness, explanations
 * - Max 10 keys total
 */
export function sanitizeRewardMetadata(
  metadata?: Record<string, unknown> | null,
): Record<string, string | number | boolean> | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return undefined;
  }

  const sanitized: Record<string, string | number | boolean> = {};
  let count = 0;

  for (const [rawKey, rawValue] of Object.entries(metadata)) {
    if (count >= 10) break;
    const trimmedKey = rawKey.trim();

    // Check allowlist
    if (!ALLOWED_METADATA_KEYS.has(trimmedKey)) {
      continue;
    }

    // Double check forbidden patterns just in case
    if (FORBIDDEN_METADATA_PATTERNS.some((p) => p.test(trimmedKey))) {
      continue;
    }

    if (typeof rawValue === "string") {
      // Check if string content looks like a token/secret
      if (rawValue.length > 256) {
        sanitized[trimmedKey] = rawValue.substring(0, 256);
      } else {
        sanitized[trimmedKey] = rawValue;
      }
      count++;
    } else if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      sanitized[trimmedKey] = rawValue;
      count++;
    } else if (typeof rawValue === "boolean") {
      sanitized[trimmedKey] = rawValue;
      count++;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}


