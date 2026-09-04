import { z } from "zod";

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const listCoursesQuerySchema = z.object({
  page: z.coerce.number().int({ message: "Page must be an integer" }).min(1, { message: "Page must be at least 1" }).default(1),
  limit: z.coerce.number().int({ message: "Limit must be an integer" }).min(1, { message: "Limit must be at least 1" }).max(50, { message: "Limit must not exceed 50" }).default(20),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"], {
    errorMap: () => ({ message: "Level must be one of: BEGINNER, INTERMEDIATE, ADVANCED" }),
  }).optional(),
});

export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;

export const courseSlugParamSchema = z.object({
  slug: z
    .string({ required_error: "Course slug is required" })
    .trim()
    .min(1, { message: "Course slug cannot be empty" })
    .max(100, { message: "Course slug cannot exceed 100 characters" })
    .regex(SLUG_REGEX, { message: "Course slug must be lowercase alphanumeric with hyphens" }),
});

export type CourseSlugParam = z.infer<typeof courseSlugParamSchema>;

export const lessonSlugParamSchema = z.object({
  courseSlug: z
    .string({ required_error: "Course slug is required" })
    .trim()
    .min(1, { message: "Course slug cannot be empty" })
    .max(100, { message: "Course slug cannot exceed 100 characters" })
    .regex(SLUG_REGEX, { message: "Course slug must be lowercase alphanumeric with hyphens" }),
  lessonSlug: z
    .string({ required_error: "Lesson slug is required" })
    .trim()
    .min(1, { message: "Lesson slug cannot be empty" })
    .max(100, { message: "Lesson slug cannot exceed 100 characters" })
    .regex(SLUG_REGEX, { message: "Lesson slug must be lowercase alphanumeric with hyphens" }),
});

export type LessonSlugParam = z.infer<typeof lessonSlugParamSchema>;
