import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { academyApi } from "../api/academyApi";
import {
  ListCoursesParams,
  AcademyApiError,
  QuizAttemptDto,
} from "../types/academy-ui.types";

const ACADEMY_QUERY_OPTIONS = {
  staleTime: 30000,
  refetchOnWindowFocus: false,
  gcTime: 1000 * 60 * 10,
} as const;

function isTestEnv(): boolean {
  return typeof process !== "undefined" && process.env?.NODE_ENV === "test";
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isTestEnv()) return false;
  if (error instanceof AcademyApiError && (error.status === 401 || error.status === 404)) {
    return false;
  }
  return failureCount < 1;
}

export function useCoursesQuery(params: ListCoursesParams = {}) {
  return useQuery({
    queryKey: ["academy", "courses", params],
    queryFn: ({ signal }) => academyApi.listCourses(params, { signal }),
    staleTime: ACADEMY_QUERY_OPTIONS.staleTime,
    refetchOnWindowFocus: ACADEMY_QUERY_OPTIONS.refetchOnWindowFocus,
    gcTime: ACADEMY_QUERY_OPTIONS.gcTime,
    retry: shouldRetry,
  });
}

export function useCourseQuery(slug: string | undefined) {
  return useQuery({
    queryKey: ["academy", "course", slug],
    queryFn: ({ signal }) => {
      if (!slug) throw new Error("Course slug is required");
      return academyApi.getCourseBySlug(slug, { signal });
    },
    enabled: Boolean(slug),
    staleTime: ACADEMY_QUERY_OPTIONS.staleTime,
    refetchOnWindowFocus: ACADEMY_QUERY_OPTIONS.refetchOnWindowFocus,
    gcTime: ACADEMY_QUERY_OPTIONS.gcTime,
    retry: shouldRetry,
  });
}

export function useLessonQuery(
  courseSlug: string | undefined,
  lessonSlug: string | undefined,
  accessToken?: string,
) {
  return useQuery({
    queryKey: ["academy", "lesson", courseSlug, lessonSlug],
    queryFn: ({ signal }) => {
      if (!courseSlug || !lessonSlug) throw new Error("Course and lesson slugs are required");
      return academyApi.getLessonBySlug(courseSlug, lessonSlug, accessToken, { signal });
    },
    enabled: Boolean(courseSlug && lessonSlug),
    staleTime: ACADEMY_QUERY_OPTIONS.staleTime,
    refetchOnWindowFocus: ACADEMY_QUERY_OPTIONS.refetchOnWindowFocus,
    gcTime: ACADEMY_QUERY_OPTIONS.gcTime,
    retry: shouldRetry,
  });
}

export function useFlashcardsQuery(
  courseSlug: string | undefined,
  lessonSlug: string | undefined,
  accessToken?: string,
) {
  return useQuery({
    queryKey: ["academy", "flashcards", courseSlug, lessonSlug],
    queryFn: ({ signal }) => {
      if (!courseSlug || !lessonSlug) throw new Error("Course and lesson slugs are required");
      return academyApi.getLessonFlashcards(courseSlug, lessonSlug, accessToken, { signal });
    },
    enabled: Boolean(courseSlug && lessonSlug),
    staleTime: ACADEMY_QUERY_OPTIONS.staleTime,
    refetchOnWindowFocus: ACADEMY_QUERY_OPTIONS.refetchOnWindowFocus,
    gcTime: ACADEMY_QUERY_OPTIONS.gcTime,
    retry: shouldRetry,
  });
}

export function useLessonQuizQuery(
  courseSlug: string | undefined,
  lessonSlug: string | undefined,
  accessToken?: string,
) {
  return useQuery({
    queryKey: ["academy", "quiz", courseSlug, lessonSlug],
    queryFn: ({ signal }) => {
      if (!courseSlug || !lessonSlug) throw new Error("Course and lesson slugs are required");
      return academyApi.getLessonQuiz(courseSlug, lessonSlug, accessToken, { signal });
    },
    enabled: Boolean(courseSlug && lessonSlug),
    staleTime: ACADEMY_QUERY_OPTIONS.staleTime,
    refetchOnWindowFocus: ACADEMY_QUERY_OPTIONS.refetchOnWindowFocus,
    gcTime: ACADEMY_QUERY_OPTIONS.gcTime,
    retry: shouldRetry,
  });
}

export function useProjectedQuizQuery(
  quizId: string | undefined,
  accessToken?: string,
) {
  return useQuery({
    queryKey: ["academy", "quiz-projected", quizId],
    queryFn: ({ signal }) => {
      if (!quizId) throw new Error("Quiz ID is required");
      return academyApi.getProjectedQuiz(quizId, accessToken, { signal });
    },
    enabled: Boolean(quizId),
    staleTime: ACADEMY_QUERY_OPTIONS.staleTime,
    refetchOnWindowFocus: ACADEMY_QUERY_OPTIONS.refetchOnWindowFocus,
    gcTime: ACADEMY_QUERY_OPTIONS.gcTime,
    retry: shouldRetry,
  });
}

export function useCurrentQuizAttemptQuery(
  courseSlug: string | undefined,
  lessonSlug: string | undefined,
  accessToken?: string,
) {
  return useQuery({
    queryKey: ["academy", "quiz-attempt", "current", courseSlug, lessonSlug],
    queryFn: ({ signal }) => {
      if (!courseSlug || !lessonSlug) throw new Error("Course and lesson slugs are required");
      return academyApi.getCurrentQuizAttempt(courseSlug, lessonSlug, accessToken, { signal });
    },
    enabled: Boolean(courseSlug && lessonSlug),
    staleTime: ACADEMY_QUERY_OPTIONS.staleTime,
    refetchOnWindowFocus: ACADEMY_QUERY_OPTIONS.refetchOnWindowFocus,
    gcTime: ACADEMY_QUERY_OPTIONS.gcTime,
    retry: shouldRetry,
  });
}

export function useStartQuizAttemptMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseSlug,
      lessonSlug,
      accessToken,
    }: {
      courseSlug: string;
      lessonSlug: string;
      accessToken?: string;
    }) => academyApi.startQuizAttempt(courseSlug, lessonSlug, accessToken),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ["academy", "quiz-attempt", "current", variables.courseSlug, variables.lessonSlug],
        data,
      );
      queryClient.invalidateQueries({
        queryKey: ["academy", "quiz-attempt", "current", variables.courseSlug, variables.lessonSlug],
      });
    },
  });
}

export function useSaveDraftQuizAnswerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      attemptId,
      questionId,
      optionId,
      accessToken,
    }: {
      attemptId: string;
      questionId: string;
      optionId: string;
      accessToken?: string;
      courseSlug?: string;
      lessonSlug?: string;
    }) => academyApi.saveDraftQuizAnswer(attemptId, questionId, optionId, accessToken),
    onSuccess: (result, variables) => {
      if (variables.courseSlug && variables.lessonSlug) {
        queryClient.setQueryData(
          ["academy", "quiz-attempt", "current", variables.courseSlug, variables.lessonSlug],
          (old: { data: QuizAttemptDto } | undefined) => {
            if (!old) return old;
            const updatedAnswers = [...old.data.answers];
            const idx = updatedAnswers.findIndex((a) => a.questionId === variables.questionId);
            if (idx >= 0) {
              updatedAnswers[idx] = {
                questionId: variables.questionId,
                selectedOptionId: variables.optionId,
                updatedAt: result.data.updatedAt,
              };
            } else {
              updatedAnswers.push({
                questionId: variables.questionId,
                selectedOptionId: variables.optionId,
                updatedAt: result.data.updatedAt,
              });
            }
            return {
              ...old,
              data: {
                ...old.data,
                answers: updatedAnswers,
              },
            };
          },
        );
      }
    },
  });
}

export function useSubmitQuizAttemptMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      attemptId,
      accessToken,
    }: {
      attemptId: string;
      accessToken?: string;
      courseSlug?: string;
      lessonSlug?: string;
    }) => academyApi.submitQuizAttempt(attemptId, accessToken),
    onSuccess: (result, variables) => {
      queryClient.setQueryData(
        ["academy", "quiz-result", variables.attemptId],
        result,
      );
      if (variables.courseSlug && variables.lessonSlug) {
        queryClient.invalidateQueries({
          queryKey: ["academy", "quiz-attempt", "current", variables.courseSlug, variables.lessonSlug],
        });
        queryClient.invalidateQueries({
          queryKey: ["academy", "lesson", variables.courseSlug, variables.lessonSlug],
        });
      }
      if (variables.courseSlug) {
        queryClient.invalidateQueries({
          queryKey: ["academy", "course-progress", variables.courseSlug],
        });
      }
      // Authoritative server reward reconciliation
      queryClient.invalidateQueries({
        queryKey: ["academy", "me", "xp"],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
      });
    },
  });
}

export function useGradedQuizResultQuery(
  attemptId: string | undefined,
  accessToken?: string,
) {
  return useQuery({
    queryKey: ["academy", "quiz-result", attemptId],
    queryFn: ({ signal }) => {
      if (!attemptId) throw new Error("Attempt ID is required");
      return academyApi.getGradedQuizResult(attemptId, accessToken, { signal });
    },
    enabled: Boolean(attemptId),
    staleTime: ACADEMY_QUERY_OPTIONS.staleTime,
    refetchOnWindowFocus: ACADEMY_QUERY_OPTIONS.refetchOnWindowFocus,
    retry: false,
  });
}

export function useCourseProgressQuery(
  courseSlug: string | undefined,
  accessToken?: string,
) {
  return useQuery({
    queryKey: ["academy", "course-progress", courseSlug],
    queryFn: ({ signal }) => {
      if (!courseSlug) throw new Error("Course slug is required");
      return academyApi.getCourseProgress(courseSlug, accessToken, { signal });
    },
    enabled: Boolean(courseSlug),
    staleTime: ACADEMY_QUERY_OPTIONS.staleTime,
    refetchOnWindowFocus: ACADEMY_QUERY_OPTIONS.refetchOnWindowFocus,
    retry: shouldRetry,
  });
}

export function useCompleteLessonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseSlug,
      lessonSlug,
      accessToken,
    }: {
      courseSlug: string;
      lessonSlug: string;
      accessToken?: string;
    }) => academyApi.completeLesson(courseSlug, lessonSlug, accessToken),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["academy", "course-progress", variables.courseSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["academy", "lesson", variables.courseSlug, variables.lessonSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["academy", "me", "xp"],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
      });
    },
  });
}

// Current User XP Query Hook (FEAT-027)
export function useMyXpQuery(accessToken?: string) {
  return useQuery({
    queryKey: ["academy", "me", "xp", accessToken],
    queryFn: ({ signal }) => academyApi.getMyXp(accessToken, { signal }),
    staleTime: ACADEMY_QUERY_OPTIONS.staleTime,
    refetchOnWindowFocus: ACADEMY_QUERY_OPTIONS.refetchOnWindowFocus,
    retry: false,
  });
}
