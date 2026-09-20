import { z } from "zod";

/**
 * Validates request body for POST /api/community/posts.
 * Strictly accepts only { content: string }.
 * Content must be 1..5,000 Unicode characters after trimming.
 * Rejects unknown fields (authorId, status, timestamps, counts, etc.).
 */
export const CreateCommunityPostBodySchema = z
  .object({
    content: z
      .string({ required_error: "Content is required" })
      .trim()
      .min(1, "Post content must not be empty or whitespace only")
      .max(5000, "Post content must not exceed 5,000 characters"),
  })
  .strict();

export type CreateCommunityPostBody = z.infer<typeof CreateCommunityPostBodySchema>;

/**
 * Validates query parameters for GET /api/community/posts.
 * Supports cursor (opaque string) and limit (integer between 1 and 50, default 20).
 * Rejects unknown query parameters.
 */
export const GetCommunityPostsQuerySchema = z
  .object({
    cursor: z.string().min(1, "Cursor cannot be empty").optional(),
    limit: z
      .string()
      .optional()
      .transform((val, ctx) => {
        if (val === undefined) {
          return 20;
        }
        const parsed = Number(val);
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Limit must be an integer between 1 and 50",
          });
          return z.NEVER;
        }
        return parsed;
      }),
  })
  .strict();

export type GetCommunityPostsQuery = z.infer<typeof GetCommunityPostsQuerySchema>;

/**
 * Validates route parameters containing postId (e.g. GET /api/community/posts/:postId).
 */
export const CommunityPostParamSchema = z
  .object({
    postId: z.string().uuid("Invalid postId format. Expected UUID"),
  })
  .strict();

export type CommunityPostParam = z.infer<typeof CommunityPostParamSchema>;
