import { z } from "zod";
import {
  HealthStatusSchema,
  ErrorEnvelopeSchema,
  EnvConfigSchema,
  RegisterRequestSchema,
  SafeUserSchema,
  RegisterResponseSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  AccessTokenClaimsSchema,
  AuthMeResponseSchema,
  RefreshResponseSchema,
  SubscriptionPlanKeySchema,
  EffectiveSubscriptionStatusSchema,
  EntitlementKeySchema,
  SubscriptionPlanDtoSchema,
  SubscriptionPlansResponseSchema,
  SubscriptionMeDtoSchema,
  SubscriptionMeResponseSchema,
} from "../schemas/index.js";

export * from "./product-audit.types.js";
export * from "./seed.types.js";

export type HealthStatus = z.infer<typeof HealthStatusSchema>;
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;
export type EnvConfig = z.infer<typeof EnvConfigSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type SafeUser = z.infer<typeof SafeUserSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type AccessTokenClaims = z.infer<typeof AccessTokenClaimsSchema>;
export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;

// FEAT-023 Quiz Definition & Safe Projection DTOs
export interface QuizOptionDto {
  id: string;
  text: string;
  order: number;
}

export interface QuizQuestionDto {
  id: string;
  prompt: string;
  type: "SINGLE_CHOICE";
  order: number;
  options: QuizOptionDto[];
}

export interface QuizDefinitionDto {
  id: string;
  courseSlug: string;
  lessonSlug: string;
  lessonTitle: string;
  title: string;
  description: string | null;
  passingScore: number;
  totalQuestions: number;
  questions: QuizQuestionDto[];
}

export interface QuizDefinitionResponse {
  data: QuizDefinitionDto;
}

// FEAT-024 Quiz Attempt Lifecycle DTOs
export interface QuizDraftAnswerDto {
  questionId: string;
  selectedOptionId: string | null;
  updatedAt: string;
}

export interface QuizAttemptDto {
  id: string;
  quizId: string;
  attemptNumber: number;
  status: "CREATED" | "IN_PROGRESS" | "SUBMITTED" | "GRADED";
  startedAt: string;
  answers: QuizDraftAnswerDto[];
}

export interface StartAttemptResult {
  attempt: QuizAttemptDto;
  created: boolean;
}

export interface StartQuizAttemptResponse {
  data: QuizAttemptDto;
}

export interface CurrentQuizAttemptResponse {
  data: QuizAttemptDto;
}

export interface QuizAttemptResponse {
  data: QuizAttemptDto;
}

export interface SaveDraftAnswerRequest {
  optionId: string;
}

export interface SaveDraftAnswerResponse {
  data: {
    questionId: string;
    selectedOptionId: string;
    updatedAt: string;
  };
}

// FEAT-025 Quiz Evaluation & Secure Submission DTOs
export interface QuizResultAnswerDto {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
  correctOptionId: string;
}

export interface QuizResultDto {
  attemptId: string;
  quizId: string;
  status: "GRADED";
  score: number;
  passed: boolean;
  submittedAt: string;
  gradedAt: string;
  answers: QuizResultAnswerDto[];
}

export interface QuizResultResponse {
  data: QuizResultDto;
}

// FEAT-026 Academy Progression & Completion Tracking Types & DTOs
export type AcademyProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface LessonProgressDto {
  lessonSlug: string;
  status: AcademyProgressStatus;
  completed: boolean;
  completedAt: string | null;
}

export interface CourseProgressDto {
  courseSlug: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  status: AcademyProgressStatus;
  completed: boolean;
  completedAt: string | null;
  lessons: LessonProgressDto[];
}

export interface CourseProgressResponse {
  data: CourseProgressDto;
}

export interface CompleteLessonResponse {
  data: LessonProgressDto;
}

export interface AcademyCompletionFact {
  readonly userId: string;
  readonly resourceType: "LESSON" | "COURSE";
  readonly resourceId: string;
  readonly isFirstCompletion: boolean;
  readonly completedAt: Date;
}

export function getCompletionKey(
  userIdOrFact: string | AcademyCompletionFact,
  resourceType?: "LESSON" | "COURSE",
  resourceId?: string,
): string {
  if (typeof userIdOrFact === "object" && userIdOrFact !== null) {
    return `${userIdOrFact.userId}:${userIdOrFact.resourceType}:${userIdOrFact.resourceId}`;
  }
  return `${userIdOrFact}:${resourceType}:${resourceId}`;
}

// FEAT-027 Academy XP & Reward Ledger Types & DTOs
export interface LearnerXpDto {
  totalXp: number;
}

export interface LearnerXpResponse {
  data: LearnerXpDto;
}

export interface RewardReconciliationResult {
  readonly rewardLedgerId: string;
  readonly userId: string;
  readonly sourceType: string;
  readonly sourceId: string;
  readonly rewardType: string;
  readonly amount: number;
  readonly isDuplicate: boolean;
  readonly totalXp: number;
}

/**
 * Derives the canonical deterministic idempotency key for an Academy reward.
 * Format: academy:reward:{userId}:{sourceType}:{sourceId}:{rewardType}
 */
export function deriveRewardIdempotencyKey(
  userId: string,
  sourceType: string,
  sourceId: string,
  rewardType: string,
): string {
  return `academy:reward:${userId}:${sourceType}:${sourceId}:${rewardType}`;
}

// FEAT-050 Subscription Read DTOs
export type SubscriptionPlanKey = z.infer<typeof SubscriptionPlanKeySchema>;
export type EffectiveSubscriptionStatus = z.infer<typeof EffectiveSubscriptionStatusSchema>;
export type EntitlementKey = z.infer<typeof EntitlementKeySchema>;
export type SubscriptionPlanDto = z.infer<typeof SubscriptionPlanDtoSchema>;
export type SubscriptionPlansResponse = z.infer<typeof SubscriptionPlansResponseSchema>;
export type SubscriptionMeDto = z.infer<typeof SubscriptionMeDtoSchema>;
export type SubscriptionMeResponse = z.infer<typeof SubscriptionMeResponseSchema>;



