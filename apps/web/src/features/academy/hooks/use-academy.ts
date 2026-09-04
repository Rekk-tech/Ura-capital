import { useQuery } from "@tanstack/react-query";
import { academyApi } from "../../../api/academy.api";
import { ListCoursesParams, AcademyApiError } from "../types/academy-ui.types";

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

