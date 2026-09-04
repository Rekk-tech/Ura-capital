import {
  AcademyApiError,
  AppErrorResponse,
  CourseDetailDto,
  CourseSummaryDto,
  LessonDetailDto,
  ListCoursesParams,
  PaginationMeta,
} from "../features/academy/types/academy-ui.types";

export interface IAcademyApiClient {
  listCourses(params?: ListCoursesParams): Promise<{ data: CourseSummaryDto[]; pagination: PaginationMeta }>;
  getCourseBySlug(slug: string): Promise<{ data: CourseDetailDto }>;
  getLessonBySlug(courseSlug: string, lessonSlug: string, accessToken?: string): Promise<{ data: LessonDetailDto }>;
}

export class AcademyApiClient implements IAcademyApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = "/api/academy") {
    this.baseUrl = baseUrl;
  }

  async listCourses(params?: ListCoursesParams): Promise<{ data: CourseSummaryDto[]; pagination: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.level) query.set("level", params.level);

    const queryString = query.toString();
    const url = `${this.baseUrl}/courses${queryString ? `?${queryString}` : ""}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: CourseSummaryDto[]; pagination: PaginationMeta };
  }

  async getCourseBySlug(slug: string): Promise<{ data: CourseDetailDto }> {
    const url = `${this.baseUrl}/courses/${encodeURIComponent(slug)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: CourseDetailDto };
  }

  async getLessonBySlug(
    courseSlug: string,
    lessonSlug: string,
    accessToken?: string
  ): Promise<{ data: LessonDetailDto }> {
    const url = `${this.baseUrl}/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}`;

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: LessonDetailDto };
  }

  private async handleError(res: Response): Promise<never> {
    let errorData: AppErrorResponse | null = null;

    try {
      errorData = (await res.json()) as AppErrorResponse;
    } catch {
      // JSON parse failure (e.g. proxy HTML or network error)
    }

    const code = errorData?.error?.code ?? (res.status === 401 ? "UNAUTHENTICATED" : res.status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR");
    const message = errorData?.error?.message ?? (res.status === 401 ? "Authentication required" : res.status === 404 ? "Resource not found" : "An unexpected error occurred");

    throw new AcademyApiError(res.status, code, message);
  }
}

export const academyApi = new AcademyApiClient();
