/**
 * FEAT-021: Academy Learner Course/Lesson UI Types
 * Aligned with FEAT-020 approved backend DTO contracts.
 */

export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface CourseSummaryDto {
  slug: string;
  title: string;
  description: string | null;
  level: CourseLevel;
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
  level: CourseLevel;
  order: number;
  lessons: LessonSummaryDto[];
}

export interface LessonDetailDto {
  courseSlug: string;
  slug: string;
  title: string;
  content: string | null;
  order: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListCoursesParams {
  page?: number;
  limit?: number;
  level?: CourseLevel;
}

export type CatalogViewState = "LOADING" | "SUCCESS" | "EMPTY" | "ERROR";
export type CourseDetailViewState = "LOADING" | "SUCCESS" | "NOT_FOUND" | "ERROR";
export type LessonDetailViewState = "LOADING" | "SUCCESS" | "AUTH_REQUIRED" | "NOT_FOUND" | "ERROR";

export interface AppErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class AcademyApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "AcademyApiError";
    this.status = status;
    this.code = code;
  }
}
