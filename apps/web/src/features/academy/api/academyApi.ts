import {
  AcademyApiError,
  AppErrorResponse,
  CourseDetailDto,
  CourseSummaryDto,
  CourseLevel,
  LessonDetailDto,
  LessonFlashcardsResponseDto,
  ListCoursesParams,
  PaginationMeta,
  QuizDefinitionDto,
  QuizAttemptDto,
  QuizResultDto,
  CourseProgressDto,
  LessonProgressDto,
  LearnerXpDto,
  LearningPathResponseDto,
  CourseLessonsResponseDto,
  MilestoneStatus,
  PlayerLessonDto,
} from "../types/academy-ui.types";
import { getApiBaseUrl } from "../../../api/config";
import { getGlobalAccessToken } from "../../../api/auth-token";

export interface IAcademyApiClient {
  listCourses(params?: ListCoursesParams, options?: { signal?: AbortSignal }): Promise<{ data: CourseSummaryDto[]; pagination: PaginationMeta }>;
  getCourseBySlug(slug: string, options?: { signal?: AbortSignal }): Promise<{ data: CourseDetailDto }>;
  getLessonBySlug(courseSlug: string, lessonSlug: string, accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: LessonDetailDto }>;
  getLessonFlashcards(courseSlug: string, lessonSlug: string, accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: LessonFlashcardsResponseDto }>;
  getLessonQuiz(courseSlug: string, lessonSlug: string, accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: QuizDefinitionDto }>;
  getProjectedQuiz(quizId: string, accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: QuizDefinitionDto }>;
  startQuizAttempt(courseSlug: string, lessonSlug: string, accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: QuizAttemptDto }>;
  startQuizAttemptById(quizId: string, accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: QuizAttemptDto }>;
  getCurrentQuizAttempt(courseSlug: string, lessonSlug: string, accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: QuizAttemptDto }>;
  getQuizAttemptById(attemptId: string, accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: QuizAttemptDto }>;
  saveDraftQuizAnswer(attemptId: string, questionId: string, optionId: string, accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: { questionId: string; selectedOptionId: string; updatedAt: string } }>;
  submitQuizAttempt(attemptId: string, accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: QuizResultDto }>;
  getGradedQuizResult(attemptId: string, accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: QuizResultDto }>;
  getCourseProgress(courseSlug: string, accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: CourseProgressDto }>;
  completeLesson(courseSlug: string, lessonSlug: string, accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: LessonProgressDto }>;
  getMyXp(accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: LearnerXpDto }>;
  // FEAT-079: Learning Path & Course Player methods
  getLearningPath(accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: LearningPathResponseDto }>;
  getCourseLessons(courseSlug: string, accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: CourseLessonsResponseDto }>;
  getLessonContent(courseSlug: string, lessonSlug: string, accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: LessonDetailDto }>;
  markLessonComplete(courseSlug: string, lessonSlug: string, accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: LessonProgressDto }>;
}

export class AcademyApiClient implements IAcademyApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = `${getApiBaseUrl()}/api/academy`) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(accessToken?: string, isJson = false): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (isJson) {
      headers["Content-Type"] = "application/json";
    }
    const token = accessToken || getGlobalAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async listCourses(
    params?: ListCoursesParams,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: CourseSummaryDto[]; pagination: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.level) query.set("level", params.level);

    const queryString = query.toString();
    const url = `${this.baseUrl}/courses${queryString ? `?${queryString}` : ""}`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
      signal: options?.signal,
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: CourseSummaryDto[]; pagination: PaginationMeta };
  }

  async getCourseBySlug(
    slug: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: CourseDetailDto }> {
    const url = `${this.baseUrl}/courses/${encodeURIComponent(slug)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
      signal: options?.signal,
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: CourseDetailDto };
  }

  async getLessonBySlug(
    courseSlug: string,
    lessonSlug: string,
    accessToken?: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: LessonDetailDto }> {
    const url = `${this.baseUrl}/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(accessToken),
      credentials: "include",
      signal: options?.signal,
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: LessonDetailDto };
  }

  async getLessonFlashcards(
    courseSlug: string,
    lessonSlug: string,
    accessToken?: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: LessonFlashcardsResponseDto }> {
    const url = `${this.baseUrl}/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}/flashcards`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(accessToken),
      credentials: "include",
      signal: options?.signal,
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: LessonFlashcardsResponseDto };
  }

  async getLessonQuiz(
    courseSlug: string,
    lessonSlug: string,
    accessToken?: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: QuizDefinitionDto }> {
    const url = `${this.baseUrl}/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}/quiz`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(accessToken),
      credentials: "include",
      signal: options?.signal,
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: QuizDefinitionDto };
  }

  /**
   * Safe Projected Quiz Definition Read (Answer Secrecy Invariant)
   * Guaranteed to contain no correct answers.
   */
  async getProjectedQuiz(
    quizId: string,
    accessToken?: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: QuizDefinitionDto }> {
    const url = `${this.baseUrl}/quizzes/${encodeURIComponent(quizId)}/projected`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(accessToken),
      credentials: "include",
      signal: options?.signal,
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: QuizDefinitionDto };
  }

  async startQuizAttempt(
    courseSlug: string,
    lessonSlug: string,
    accessToken?: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: QuizAttemptDto }> {
    const url = `${this.baseUrl}/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}/quiz/attempts`;

    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(accessToken, true),
      credentials: "include",
      body: JSON.stringify({}),
      signal: options?.signal,
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: QuizAttemptDto };
  }

  async startQuizAttemptById(
    quizId: string,
    accessToken?: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: QuizAttemptDto }> {
    const url = `${this.baseUrl}/quiz-attempts`;

    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(accessToken, true),
      credentials: "include",
      body: JSON.stringify({ quizId }),
      signal: options?.signal,
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: QuizAttemptDto };
  }

  async getCurrentQuizAttempt(
    courseSlug: string,
    lessonSlug: string,
    accessToken?: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: QuizAttemptDto }> {
    const url = `${this.baseUrl}/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}/quiz/attempts/current`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(accessToken),
      credentials: "include",
      signal: options?.signal,
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: QuizAttemptDto };
  }

  async getQuizAttemptById(
    attemptId: string,
    accessToken?: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: QuizAttemptDto }> {
    const url = `${this.baseUrl}/quiz-attempts/${encodeURIComponent(attemptId)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(accessToken),
      credentials: "include",
      signal: options?.signal,
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
    accessToken?: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: { questionId: string; selectedOptionId: string; updatedAt: string } }> {
    const url = `${this.baseUrl}/quiz-attempts/${encodeURIComponent(attemptId)}/answers/${encodeURIComponent(questionId)}`;

    const res = await fetch(url, {
      method: "PUT",
      headers: this.getHeaders(accessToken, true),
      credentials: "include",
      body: JSON.stringify({ optionId }),
      signal: options?.signal,
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: { questionId: string; selectedOptionId: string; updatedAt: string } };
  }

  async submitQuizAttempt(
    attemptId: string,
    accessToken?: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: QuizResultDto }> {
    const url = `${this.baseUrl}/quiz-attempts/${encodeURIComponent(attemptId)}/submit`;

    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(accessToken, true),
      credentials: "include",
      body: JSON.stringify({}),
      signal: options?.signal,
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: QuizResultDto };
  }

  async getGradedQuizResult(
    attemptId: string,
    accessToken?: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: QuizResultDto }> {
    const url = `${this.baseUrl}/quiz-attempts/${encodeURIComponent(attemptId)}/result`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(accessToken),
      credentials: "include",
      signal: options?.signal,
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: QuizResultDto };
  }

  async getCourseProgress(
    courseSlug: string,
    accessToken?: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: CourseProgressDto }> {
    const url = `${this.baseUrl}/courses/${encodeURIComponent(courseSlug)}/progress`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(accessToken),
      credentials: "include",
      signal: options?.signal,
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: CourseProgressDto };
  }

  async completeLesson(
    courseSlug: string,
    lessonSlug: string,
    accessToken?: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: LessonProgressDto }> {
    const url = `${this.baseUrl}/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}/complete`;

    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(accessToken, true),
      credentials: "include",
      body: JSON.stringify({}),
      signal: options?.signal,
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: LessonProgressDto };
  }

  async getMyXp(
    accessToken?: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: LearnerXpDto }> {
    const url = `${this.baseUrl}/me/xp`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(accessToken),
      credentials: "include",
      signal: options?.signal,
    });

    if (!res.ok) {
      await this.handleError(res);
    }

    return (await res.json()) as { data: LearnerXpDto };
  }

  /**
   * FEAT-079: Fetch sequenced curriculum roadmap with tracks and prerequisites.
   * If the dedicated /learning-path endpoint exists on server, returns server DTO.
   * Otherwise, composes sequenced roadmap across BEGINNER, INTERMEDIATE, and ADVANCED
   * tracks from published courses and authoritative learner progress.
   */
  async getLearningPath(
    accessToken?: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: LearningPathResponseDto }> {
    const url = `${this.baseUrl}/learning-path`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers,
        signal: options?.signal,
      });

      if (res.ok) {
        return (await res.json()) as { data: LearningPathResponseDto };
      }
      if (res.status !== 404) {
        await this.handleError(res);
      }
    } catch (err) {
      if (err instanceof AcademyApiError) throw err;
      if (options?.signal?.aborted) throw err;
    }

    // Synthesize structured roadmap from published courses and progress
    const { data: courses } = await this.listCourses({ limit: 100 }, options);

    // Fetch progress for each course if authenticated
    const progressMap = new Map<string, CourseProgressDto>();
    if (accessToken) {
      await Promise.all(
        courses.map(async (course) => {
          try {
            const prog = await this.getCourseProgress(course.slug, accessToken, options);
            if (prog?.data) {
              progressMap.set(course.slug, prog.data);
            }
          } catch {
            // Ignore individual course progress errors for unstarted courses
          }
        }),
      );
    }

    const trackDefinitions: Array<{
      id: string;
      title: string;
      level: CourseLevel;
      description: string;
    }> = [
      {
        id: "beginner-track",
        title: "Beginner Foundations",
        level: "BEGINNER",
        description: "Core market concepts, financial instruments, and foundational investment mechanics.",
      },
      {
        id: "intermediate-track",
        title: "Intermediate Strategies",
        level: "INTERMEDIATE",
        description: "Technical indicators, portfolio asset allocation, and structured risk mitigation.",
      },
      {
        id: "advanced-track",
        title: "Advanced Mastery",
        level: "ADVANCED",
        description: "Derivatives pricing, quantitative strategies, and institutional portfolio management.",
      },
    ];

    let totalCourses = 0;
    let completedCourses = 0;
    let activeCourseSlug: string | null = null;

    const tracks = trackDefinitions.map((trackDef, trackIndex) => {
      const trackCourses = courses
        .filter((c) => c.level === trackDef.level)
        .sort((a, b) => a.order - b.order);

      const milestones = trackCourses.map((c, courseIndex) => {
        totalCourses++;
        const prog = progressMap.get(c.slug);
        const completedLessons = prog?.completedLessons ?? 0;
        const progressPercent = prog?.progressPercent ?? 0;
        const isCompleted = prog?.completed ?? false;
        if (isCompleted) completedCourses++;

        // Determine prerequisites:
        // Course 0 in track: requires last course of previous track (if any)
        // Course N in track: requires course N-1 in same track
        const prerequisites: string[] = [];
        if (courseIndex > 0) {
          const prevCourse = trackCourses[courseIndex - 1];
          if (prevCourse) prerequisites.push(prevCourse.slug);
        } else if (trackIndex > 0) {
          const prevTrackDef = trackDefinitions[trackIndex - 1];
          if (prevTrackDef) {
            const prevTrackCourses = courses.filter(
              (pc) => pc.level === prevTrackDef.level,
            );
            const lastPrevCourse = prevTrackCourses[prevTrackCourses.length - 1];
            if (lastPrevCourse) {
              prerequisites.push(lastPrevCourse.slug);
            }
          }
        }

        // Determine milestone status
        let status: MilestoneStatus;
        if (isCompleted) {
          status = "COMPLETED";
        } else if (completedLessons > 0) {
          status = "IN_PROGRESS";
        } else {
          // Check if prerequisites are all completed
          const prereqsSatisfied = prerequisites.every((pSlug) => {
            const pProg = progressMap.get(pSlug);
            return pProg?.completed === true;
          });
          // First course of first track is always available
          if (trackIndex === 0 && courseIndex === 0) {
            status = "AVAILABLE";
          } else {
            status = prereqsSatisfied ? "AVAILABLE" : "LOCKED";
          }
        }

        if (!activeCourseSlug && (status === "IN_PROGRESS" || status === "AVAILABLE")) {
          activeCourseSlug = c.slug;
        }

        return {
          courseSlug: c.slug,
          courseTitle: c.title,
          description: c.description,
          level: c.level,
          order: c.order,
          lessonCount: c.lessonCount,
          prerequisites,
          status,
          completedLessons,
          progressPercent,
        };
      });

      return {
        ...trackDef,
        milestones,
      };
    });

    const overallProgressPercent =
      totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

    return {
      data: {
        tracks,
        totalCourses,
        completedCourses,
        overallProgressPercent,
        activeCourseSlug: activeCourseSlug ?? (courses[0]?.slug ?? null),
      },
    };
  }

  /**
   * FEAT-079: Fetch ordered lesson outline with completion statuses and lock states.
   */
  async getCourseLessons(
    courseSlug: string,
    accessToken?: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: CourseLessonsResponseDto }> {
    const courseRes = await this.getCourseBySlug(courseSlug, options);
    const course = courseRes.data;

    let progress: CourseProgressDto | null = null;
    const token = accessToken || getGlobalAccessToken();
    if (token) {
      try {
        const progRes = await this.getCourseProgress(courseSlug, token, options);
        progress = progRes.data;
      } catch {
        // Unauthenticated or unstarted progress is handled gracefully
      }
    }

    const completedLessonSlugs = new Set(
      progress?.lessons?.filter((l) => l.completed).map((l) => l.lessonSlug) ?? [],
    );

    const sortedLessons = [...(course.lessons ?? [])].sort((a, b) => a.order - b.order);

    let priorCompleted = true; // Lesson 0 is unlocked
    const playerLessons: PlayerLessonDto[] = sortedLessons.map((lesson, idx) => {
      const isCompleted = completedLessonSlugs.has(lesson.slug);
      const isLocked = !priorCompleted;
      const prerequisiteLessonSlug = idx > 0 ? (sortedLessons[idx - 1]?.slug ?? null) : null;

      // Update priorCompleted for next iteration: must be completed to unlock next
      priorCompleted = isCompleted;

      return {
        slug: lesson.slug,
        title: lesson.title,
        order: lesson.order,
        isCompleted,
        isLocked,
        prerequisiteLessonSlug,
      };
    });

    const completedCount = playerLessons.filter((l) => l.isCompleted).length;
    const totalCount = playerLessons.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      data: {
        courseSlug: course.slug,
        courseTitle: course.title,
        lessons: playerLessons,
        completedCount,
        totalCount,
        progressPercent,
      },
    };
  }

  /**
   * FEAT-079: Fetch sanitized lesson markdown content.
   */
  async getLessonContent(
    courseSlug: string,
    lessonSlug: string,
    accessToken?: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: LessonDetailDto }> {
    return this.getLessonBySlug(courseSlug, lessonSlug, accessToken, options);
  }

  /**
   * FEAT-079: Trigger server-authoritative lesson completion.
   */
  async markLessonComplete(
    courseSlug: string,
    lessonSlug: string,
    accessToken?: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ data: LessonProgressDto }> {
    return this.completeLesson(courseSlug, lessonSlug, accessToken, options);
  }

  private async handleError(res: Response): Promise<never> {
    let errorData: AppErrorResponse | null = null;

    try {
      errorData = (await res.json()) as AppErrorResponse;
    } catch {
      // JSON parse failure (e.g. proxy HTML or network error)
    }

    const code =
      errorData?.error?.code ??
      (res.status === 401
        ? "UNAUTHENTICATED"
        : res.status === 404
        ? "NOT_FOUND"
        : "INTERNAL_ERROR");
    const message =
      errorData?.error?.message ??
      (res.status === 401
        ? "Authentication required"
        : res.status === 404
        ? "Resource not found"
        : "An unexpected error occurred");

    throw new AcademyApiError(res.status, code, message);
  }
}

export const academyApi = new AcademyApiClient();
