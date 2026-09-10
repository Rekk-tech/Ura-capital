import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { academyApi } from "../../../api/academy.api";
import { ListCoursesParams, AcademyApiError, QuizAttemptDto } from "../types/academy-ui.types";

export function useCoursesQuery(params: ListCoursesParams = {}) {
  return useQuery({
    queryKey: ["academy", "courses", params],
    queryFn: () => academyApi.listCourses(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,
  });
}

export function useCourseQuery(slug: string | undefined) {
  return useQuery({
    queryKey: ["academy", "course", slug],
    queryFn: () => {
      if (!slug) throw new Error("Course slug is required");
      return academyApi.getCourseBySlug(slug);
    },
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,
  });
}

export function useLessonQuery(courseSlug: string | undefined, lessonSlug: string | undefined, accessToken?: string) {
  return useQuery({
    queryKey: ["academy", "lesson", courseSlug, lessonSlug],
    queryFn: () => {
      if (!courseSlug || !lessonSlug) throw new Error("Course and lesson slugs are required");
      return academyApi.getLessonBySlug(courseSlug, lessonSlug, accessToken);
    },
    enabled: Boolean(courseSlug && lessonSlug),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
    retry: (failureCount, error: unknown) => {
      // Do not retry 401 or 404
      if (error instanceof AcademyApiError && (error.status === 401 || error.status === 404)) {
        return false;
      }
      if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useFlashcardsQuery(
  courseSlug: string | undefined,
  lessonSlug: string | undefined,
  accessToken?: string
) {
  return useQuery({
    queryKey: ["academy", "flashcards", courseSlug, lessonSlug],
    queryFn: () => {
      if (!courseSlug || !lessonSlug) throw new Error("Course and lesson slugs are required");
      return academyApi.getLessonFlashcards(courseSlug, lessonSlug, accessToken);
    },
    enabled: Boolean(courseSlug && lessonSlug),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
    retry: (failureCount, error: unknown) => {
      if (error instanceof AcademyApiError && (error.status === 401 || error.status === 404)) {
        return false;
      }
      if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useLessonQuizQuery(
  courseSlug: string | undefined,
  lessonSlug: string | undefined,
  accessToken?: string
) {
  return useQuery({
    queryKey: ["academy", "quiz", courseSlug, lessonSlug],
    queryFn: () => {
      if (!courseSlug || !lessonSlug) throw new Error("Course and lesson slugs are required");
      return academyApi.getLessonQuiz(courseSlug, lessonSlug, accessToken);
    },
    enabled: Boolean(courseSlug && lessonSlug),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error: unknown) => {
      if (error instanceof AcademyApiError && (error.status === 401 || error.status === 404)) {
        return false;
      }
      if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useCurrentQuizAttemptQuery(
  courseSlug: string | undefined,
  lessonSlug: string | undefined,
  accessToken?: string
) {
  return useQuery({
    queryKey: ["academy", "quiz-attempt", "current", courseSlug, lessonSlug],
    queryFn: () => {
      if (!courseSlug || !lessonSlug) throw new Error("Course and lesson slugs are required");
      return academyApi.getCurrentQuizAttempt(courseSlug, lessonSlug, accessToken);
    },
    enabled: Boolean(courseSlug && lessonSlug),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
    retry: (failureCount, error: unknown) => {
      if (error instanceof AcademyApiError && (error.status === 401 || error.status === 404)) {
        return false;
      }
      if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
        return false;
      }
      return failureCount < 2;
    },
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
    },
  });
}

export function useGradedQuizResultQuery(
  attemptId: string | undefined,
  accessToken?: string,
) {
  return useQuery({
    queryKey: ["academy", "quiz-result", attemptId],
    queryFn: () => {
      if (!attemptId) throw new Error("Attempt ID is required");
      return academyApi.getGradedQuizResult(attemptId, accessToken);
    },
    enabled: Boolean(attemptId),
    retry: false,
  });
}

export function useCourseProgressQuery(
  courseSlug: string | undefined,
  accessToken?: string,
) {
  return useQuery({
    queryKey: ["academy", "course-progress", courseSlug],
    queryFn: () => {
      if (!courseSlug) throw new Error("Course slug is required");
      return academyApi.getCourseProgress(courseSlug, accessToken);
    },
    enabled: Boolean(courseSlug && accessToken),
    retry: false,
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
    },
  });
}




