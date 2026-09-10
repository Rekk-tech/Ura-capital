import {
  AcademyApiError,
  AppErrorResponse,
  CourseDetailDto,
  CourseSummaryDto,
  LessonDetailDto,
  LessonFlashcardsResponseDto,
  ListCoursesParams,
  PaginationMeta,
  QuizDefinitionDto,
  QuizAttemptDto,
  QuizResultDto,
} from "../features/academy/types/academy-ui.types";

export interface IAcademyApiClient {
  listCourses(params?: ListCoursesParams): Promise<{ data: CourseSummaryDto[]; pagination: PaginationMeta }>;
  getCourseBySlug(slug: string): Promise<{ data: CourseDetailDto }>;
  getLessonBySlug(courseSlug: string, lessonSlug: string, accessToken?: string): Promise<{ data: LessonDetailDto }>;
  getLessonFlashcards(courseSlug: string, lessonSlug: string, accessToken?: string): Promise<{ data: LessonFlashcardsResponseDto }>;
  getLessonQuiz(courseSlug: string, lessonSlug: string, accessToken?: string): Promise<{ data: QuizDefinitionDto }>;
  startQuizAttempt(courseSlug: string, lessonSlug: string, accessToken?: string): Promise<{ data: QuizAttemptDto }>;
  getCurrentQuizAttempt(courseSlug: string, lessonSlug: string, accessToken?: string): Promise<{ data: QuizAttemptDto }>;
  getQuizAttemptById(attemptId: string, accessToken?: string): Promise<{ data: QuizAttemptDto }>;
  saveDraftQuizAnswer(attemptId: string, questionId: string, optionId: string, accessToken?: string): Promise<{ data: { questionId: string; selectedOptionId: string; updatedAt: string } }>;
  submitQuizAttempt(attemptId: string, accessToken?: string): Promise<{ data: QuizResultDto }>;
  getGradedQuizResult(attemptId: string, accessToken?: string): Promise<{ data: QuizResultDto }>;
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

  async getLessonFlashcards(
    courseSlug: string,
    lessonSlug: string,
    accessToken?: string
  ): Promise<{ data: LessonFlashcardsResponseDto }> {
    const url = `${this.baseUrl}/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}/flashcards`;

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

    return (await res.json()) as { data: LessonFlashcardsResponseDto };
  }

  async getLessonQuiz(
    courseSlug: string,
    lessonSlug: string,
    accessToken?: string
  ): Promise<{ data: QuizDefinitionDto }> {
    const url = `${this.baseUrl}/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}/quiz`;

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

    return (await res.json()) as { data: QuizDefinitionDto };
  }

  async startQuizAttempt(
    courseSlug: string,
    lessonSlug: string,
    accessToken?: string
  ): Promise<{ data: QuizAttemptDto }> {
    const url = `${this.baseUrl}/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}/quiz/attempts`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: QuizAttemptDto };
  }

  async getCurrentQuizAttempt(
    courseSlug: string,
    lessonSlug: string,
    accessToken?: string
  ): Promise<{ data: QuizAttemptDto }> {
    const url = `${this.baseUrl}/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}/quiz/attempts/current`;

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

    return (await res.json()) as { data: QuizAttemptDto };
  }

  async getQuizAttemptById(
    attemptId: string,
    accessToken?: string
  ): Promise<{ data: QuizAttemptDto }> {
    const url = `/api/academy/quiz-attempts/${encodeURIComponent(attemptId)}`;

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

    return (await res.json()) as { data: QuizAttemptDto };
  }

  async saveDraftQuizAnswer(
    attemptId: string,
    questionId: string,
    optionId: string,
    accessToken?: string
  ): Promise<{ data: { questionId: string; selectedOptionId: string; updatedAt: string } }> {
    const url = `/api/academy/quiz-attempts/${encodeURIComponent(attemptId)}/answers/${encodeURIComponent(questionId)}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({ optionId }),
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: { questionId: string; selectedOptionId: string; updatedAt: string } };
  }

  async submitQuizAttempt(
    attemptId: string,
    accessToken?: string
  ): Promise<{ data: QuizResultDto }> {
    const url = `/api/academy/quiz-attempts/${encodeURIComponent(attemptId)}/submit`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: QuizResultDto };
  }

  async getGradedQuizResult(
    attemptId: string,
    accessToken?: string
  ): Promise<{ data: QuizResultDto }> {
    const url = `/api/academy/quiz-attempts/${encodeURIComponent(attemptId)}/result`;

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

    return (await res.json()) as { data: QuizResultDto };
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
