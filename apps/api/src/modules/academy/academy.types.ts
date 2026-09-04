import type {
  AcademyContentStatus,
  AcademyProgressStatus,
  QuizAttemptStatus,
  RewardLedgerStatus,
  QuizQuestionType,
} from "./academy.constants.js";

export interface CreateCourseInput {
  slug: string;
  title: string;
  description?: string | null;
  level?: string;
  status?: AcademyContentStatus;
  order?: number;
}

export interface CreateLessonInput {
  courseId: string;
  title: string;
  slug: string;
  content?: string | null;
  order: number;
  status?: AcademyContentStatus;
}

export interface CreateFlashcardInput {
  lessonId: string;
  front: string;
  back: string;
  order?: number;
}

export interface CreateQuizInput {
  lessonId: string;
  title: string;
  description?: string | null;
  status?: AcademyContentStatus;
  order?: number;
  passingScore?: number;
}

export interface CreateQuizQuestionInput {
  quizId: string;
  prompt: string;
  explanation?: string | null;
  type?: QuizQuestionType;
  order: number;
}

export interface CreateQuestionOptionNestedInput {
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface CreateQuestionWithOptionsInput {
  quizId: string;
  prompt: string;
  explanation?: string | null;
  type?: QuizQuestionType;
  order: number;
  options: CreateQuestionOptionNestedInput[];
}

export interface CreateQuizOptionInput {
  questionId: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface CreateQuizAttemptInput {
  userId: string;
  quizId: string;
  attemptNumber?: number;
  quizTitleSnapshot: string;
  quizVersionSnapshot?: string | null;
  status?: QuizAttemptStatus;
}

export interface CreateQuizAnswerInput {
  attemptId: string;
  quizId: string;
  questionId: string;
  selectedOptionId?: string | null;
  isCorrect?: boolean | null;
  questionPromptSnapshot: string;
  selectedOptionTextSnapshot?: string | null;
  correctOptionIdSnapshot?: string | null;
  correctOptionTextSnapshot?: string | null;
}

export interface UpsertCourseProgressInput {
  userId: string;
  courseId: string;
  status: AcademyProgressStatus;
  startedAt?: Date;
  completedAt?: Date | null;
}

export interface UpsertLessonProgressInput {
  userId: string;
  lessonId: string;
  status: AcademyProgressStatus;
  startedAt?: Date;
  completedAt?: Date | null;
}

export interface RecordRewardInput {
  userId: string;
  sourceType: string;
  sourceId: string;
  rewardType: string;
  amount: number;
  idempotencyKey?: string | null;
  status?: RewardLedgerStatus;
  metadata?: Record<string, unknown> | null;
}

export interface ListPublishedCoursesParams {
  skip: number;
  take: number;
  level?: string;
}

