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

export function toLessonDetailDto(entity: {
  courseSlug?: string;
  course?: { slug: string };
  slug: string;
  title: string;
  content: string | null;
  order: number;
}): LessonDetailDto {
  const courseSlug = entity.courseSlug ?? entity.course?.slug ?? "";
  return {
    courseSlug,
    slug: entity.slug,
    title: entity.title,
    content: entity.content ?? null,
    order: entity.order,
  };
}
