export interface CourseSummaryDto {
  slug: string;
  title: string;
  description: string | null;
  level: string;
  order: number;
  lessonCount: number;
}

export interface LessonSummaryDto {
  slug: string;
  title: string;
  order: number;
}

export interface CourseDetailDto {
  slug: string;
  title: string;
  description: string | null;
  level: string;
  order: number;
  lessons: LessonSummaryDto[];
}

export interface LessonDetailDto {
  courseSlug: string;
  slug: string;
  title: string;
  content: string | null;
  order: number;
  progress?: LessonProgressDto | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CourseCatalogResponse {
  data: CourseSummaryDto[];
  pagination: PaginationMeta;
}

export interface CourseDetailResponse {
  data: CourseDetailDto;
}

export interface LessonDetailResponse {
  data: LessonDetailDto;
}

// Pure mapper functions ensuring strict whitelisting and zero internal leaks

export function toCourseSummaryDto(entity: {
  slug: string;
  title: string;
  description: string | null;
  level: string;
  order: number;
  _count?: { lessons: number };
  lessonCount?: number;
}): CourseSummaryDto {
  return {
    slug: entity.slug,
    title: entity.title,
    description: entity.description ?? null,
    level: entity.level,
    order: entity.order,
    lessonCount: entity._count?.lessons ?? entity.lessonCount ?? 0,
  };
}

export function toLessonSummaryDto(entity: {
  slug: string;
  title: string;
  order: number;
}): LessonSummaryDto {
  return {
    slug: entity.slug,
    title: entity.title,
    order: entity.order,
  };
}

export function toCourseDetailDto(entity: {
  slug: string;
  title: string;
  description: string | null;
  level: string;
  order: number;
  lessons: Array<{ slug: string; title: string; order: number }>;
}): CourseDetailDto {
  return {
    slug: entity.slug,
    title: entity.title,
    description: entity.description ?? null,
    level: entity.level,
    order: entity.order,
    lessons: (entity.lessons ?? []).map(toLessonSummaryDto),
  };
}

export function toLessonDetailDto(
  entity: {
    courseSlug?: string;
    course?: { slug: string };
    slug: string;
    title: string;
    content: string | null;
    order: number;
  },
  progress?: LessonProgressDto | null,
): LessonDetailDto {
  const courseSlug = entity.courseSlug ?? entity.course?.slug ?? "";
  return {
    courseSlug,
    slug: entity.slug,
    title: entity.title,
    content: entity.content ?? null,
    order: entity.order,
    ...(progress !== undefined ? { progress } : {}),
  };
}

export interface FlashcardItemDto {
  front: string;
  back: string;
  order: number;
}

export interface LessonFlashcardsResponseDto {
  courseSlug: string;
  lessonSlug: string;
  lessonTitle: string;
  flashcards: FlashcardItemDto[];
  totalCount: number;
}

export interface LessonFlashcardsResponse {
  data: LessonFlashcardsResponseDto;
}

export function toFlashcardItemDto(entity: {
  front: string;
  back: string;
  order: number;
}): FlashcardItemDto {
  return {
    front: entity.front,
    back: entity.back,
    order: entity.order,
  };
}

// FEAT-023: Quiz Definition & Safe Projection DTOs and Mappers

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

export function toQuizOptionDto(entity: {
  id: string;
  text: string;
  order: number;
}): QuizOptionDto {
  return {
    id: entity.id,
    text: entity.text,
    order: entity.order,
  };
}

export function toQuizQuestionDto(entity: {
  id: string;
  prompt: string;
  type: string;
  order: number;
  options?: Array<{ id: string; text: string; order: number }>;
}): QuizQuestionDto {
  return {
    id: entity.id,
    prompt: entity.prompt,
    type: "SINGLE_CHOICE",
    order: entity.order,
    options: (entity.options ?? []).map(toQuizOptionDto),
  };
}

export function toQuizDefinitionDto(entity: {
  id: string;
  title: string;
  description?: string | null;
  passingScore: number;
  lesson: {
    title: string;
    slug: string;
    course: {
      slug: string;
    };
  };
  questions?: Array<{
    id: string;
    prompt: string;
    type: string;
    order: number;
    options?: Array<{ id: string; text: string; order: number }>;
  }>;
}): QuizDefinitionDto {
  const mappedQuestions = (entity.questions ?? []).map(toQuizQuestionDto);
  return {
    id: entity.id,
    courseSlug: entity.lesson.course.slug,
    lessonSlug: entity.lesson.slug,
    lessonTitle: entity.lesson.title,
    title: entity.title,
    description: entity.description ?? null,
    passingScore: entity.passingScore,
    totalQuestions: mappedQuestions.length,
    questions: mappedQuestions,
  };
}

// FEAT-024: Quiz Attempt Lifecycle DTOs and Mappers

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

export interface SaveDraftAnswerResponse {
  data: {
    questionId: string;
    selectedOptionId: string;
    updatedAt: string;
  };
}

export function toQuizDraftAnswerDto(entity: {
  questionId: string;
  selectedOptionId?: string | null;
  updatedAt: Date | string;
}): QuizDraftAnswerDto {
  return {
    questionId: entity.questionId,
    selectedOptionId: entity.selectedOptionId ?? null,
    updatedAt:
      entity.updatedAt instanceof Date
        ? entity.updatedAt.toISOString()
        : String(entity.updatedAt),
  };
}

export function toQuizAttemptDto(entity: {
  id: string;
  quizId: string;
  attemptNumber: number;
  status: string;
  startedAt: Date | string;
  answers?: Array<{
    questionId: string;
    selectedOptionId?: string | null;
    updatedAt: Date | string;
  }>;
}): QuizAttemptDto {
  return {
    id: entity.id,
    quizId: entity.quizId,
    attemptNumber: entity.attemptNumber,
    status: entity.status as "CREATED" | "IN_PROGRESS" | "SUBMITTED" | "GRADED",
    startedAt:
      entity.startedAt instanceof Date
        ? entity.startedAt.toISOString()
        : String(entity.startedAt),
    answers: (entity.answers ?? []).map(toQuizDraftAnswerDto),
  };
}

// FEAT-025 Quiz Evaluation & Secure Submission DTOs
export type {
  QuizResultAnswerDto,
  QuizResultDto,
  QuizResultResponse,
} from "@aura/shared";

import type { QuizResultDto } from "@aura/shared";

export function toQuizResultDto(entity: {
  id: string;
  quizId: string;
  status: string;
  score: number | null;
  passed: boolean | null;
  submittedAt: Date | string | null;
  gradedAt: Date | string | null;
  answers?: Array<{
    questionId: string;
    selectedOptionId?: string | null;
    isCorrect?: boolean | null;
    correctOptionIdSnapshot?: string | null;
  }>;
}): QuizResultDto {
  return {
    attemptId: entity.id,
    quizId: entity.quizId,
    status: "GRADED",
    score: entity.score ?? 0,
    passed: entity.passed ?? false,
    submittedAt:
      entity.submittedAt instanceof Date
        ? entity.submittedAt.toISOString()
        : String(entity.submittedAt ?? ""),
    gradedAt:
      entity.gradedAt instanceof Date
        ? entity.gradedAt.toISOString()
        : String(entity.gradedAt ?? ""),
    answers: (entity.answers ?? []).map((a) => ({
      questionId: a.questionId,
      selectedOptionId: a.selectedOptionId ?? null,
      isCorrect: Boolean(a.isCorrect),
      correctOptionId: a.correctOptionIdSnapshot ?? "",
    })),
  };
}

// FEAT-026: Academy Progression & Completion Tracking DTOs and Mappers

export type {
  LessonProgressDto,
  CourseProgressDto,
  CourseProgressResponse,
  CompleteLessonResponse,
  AcademyCompletionFact,
} from "@aura/shared";

import type { LessonProgressDto, CourseProgressDto } from "@aura/shared";

export function toLessonProgressDto(entity: {
  slug: string;
  status?: string;
  completed?: boolean;
  completedAt?: Date | string | null;
}): LessonProgressDto {
  const isCompleted = entity.completed ?? entity.status === "COMPLETED";
  const completedAt =
    entity.completedAt instanceof Date
      ? entity.completedAt.toISOString()
      : entity.completedAt
        ? String(entity.completedAt)
        : null;

  return {
    lessonSlug: entity.slug,
    status: isCompleted
      ? "COMPLETED"
      : ((entity.status as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED") ??
        "NOT_STARTED"),
    completed: isCompleted,
    completedAt,
  };
}

export function toCourseProgressDto(entity: {
  courseSlug: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  status: string;
  completed: boolean;
  completedAt: Date | string | null;
  lessons?: LessonProgressDto[];
}): CourseProgressDto {
  const completedAt =
    entity.completedAt instanceof Date
      ? entity.completedAt.toISOString()
      : entity.completedAt
        ? String(entity.completedAt)
        : null;

  return {
    courseSlug: entity.courseSlug,
    completedLessons: entity.completedLessons,
    totalLessons: entity.totalLessons,
    progressPercent: entity.progressPercent,
    status: entity.status as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED",
    completed: entity.completed,
    completedAt,
    lessons: entity.lessons ?? [],
  };
}

