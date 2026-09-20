import { z } from "zod";

/**
 * Validates request body for POST /api/community/posts/:postId/comments.
 * Strictly accepts only { content: string }.
 * Content must be 1..2,000 Unicode characters after trimming.
 * Rejects unknown fields (parentCommentId, replyTo, depth, authorId, status, timestamps, etc.).
 */
export const CreateCommunityCommentBodySchema = z
  .object({
    content: z
      .string({ required_error: "Content is required" })
      .trim()
      .min(1, "Comment content must not be empty or whitespace only")
      .max(2000, "Comment content must not exceed 2,000 characters"),
  })
  .strict();

export type CreateCommunityCommentBody = z.infer<typeof CreateCommunityCommentBodySchema>;

/**
 * Validates query parameters for GET /api/community/posts/:postId/comments.
 * Supports cursor (opaque string) and limit (integer between 1 and 50, default 20).
 * Rejects unknown query parameters.
 */
export const GetCommunityCommentsQuerySchema = z
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

export type GetCommunityCommentsQuery = z.infer<typeof GetCommunityCommentsQuerySchema>;

/**
 * Validates route parameters containing postId (e.g. GET/POST /api/community/posts/:postId/comments).
 */
export const CommunityCommentPostParamSchema = z
  .object({
    postId: z.string().uuid("Invalid postId format. Expected UUID"),
  })
  .strict();

export type CommunityCommentPostParam = z.infer<typeof CommunityCommentPostParamSchema>;

/**
 * Validates route parameters containing commentId (e.g. DELETE /api/community/comments/:commentId).
 */
export const CommunityCommentParamSchema = z
  .object({
    commentId: z.string().uuid("Invalid commentId format. Expected UUID"),
  })
  .strict();

export type CommunityCommentParam = z.infer<typeof CommunityCommentParamSchema>;
