import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import type { IAcademyCourseRepository } from "./academy.repository.js";
import type { ListCoursesQuery } from "./academy.validation.js";
import {
  type CourseCatalogResponse,
  type CourseDetailResponse,
  type LessonDetailResponse,
  toCourseSummaryDto,
  toCourseDetailDto,
  toLessonDetailDto,
} from "./academy.dto.js";

export class AcademyCourseReadService {
  constructor(private readonly courseRepo: IAcademyCourseRepository) {}

  async listCourses(query: ListCoursesQuery): Promise<CourseCatalogResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const take = limit;

    const { courses, total } = await this.courseRepo.listPublishedCourses({
      skip,
      take,
      level: query.level,
    });

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: courses.map(toCourseSummaryDto),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getCourseBySlug(slug: string): Promise<CourseDetailResponse> {
    const course = await this.courseRepo.findPublishedCourseBySlug(slug);

    if (!course) {
      throw new AppError("Course not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return {
      data: toCourseDetailDto(course),
    };
  }

  async getLessonBySlug(courseSlug: string, lessonSlug: string): Promise<LessonDetailResponse> {
    const lesson = await this.courseRepo.findPublishedLessonByCourseAndSlug(courseSlug, lessonSlug);

    if (!lesson) {
      throw new AppError("Lesson not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return {
      data: toLessonDetailDto(lesson),
    };
  }
}
