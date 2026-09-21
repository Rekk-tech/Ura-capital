import { AppError } from "../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

export interface CommunityCommentCursorPayload {
  v: 1;
  createdAt: string;
  id: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Encodes a versioned, opaque cursor from a comment's createdAt timestamp and UUID.
 */
export function encodeCommentCursor(comment: { createdAt: Date | string; id: string }): string {
  const createdAtStr =
    comment.createdAt instanceof Date ? comment.createdAt.toISOString() : comment.createdAt;

  const payload: CommunityCommentCursorPayload = {
    v: 1,
    createdAt: createdAtStr,
    id: comment.id,
  };

  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
}

/**
 * Decodes and strictly validates an opaque comment cursor.
 * Throws a safe 400 VALIDATION_ERROR if the cursor is malformed, invalid base64,
 * tampered, uses an unsupported version, or contains invalid dates/UUIDs.
 */
export function decodeCommentCursor(cursorStr: string): { createdAt: Date; id: string } {
  if (!cursorStr || typeof cursorStr !== "string") {
    throw new AppError(
      "Invalid cursor format",
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  try {
    const jsonStr = Buffer.from(cursorStr, "base64url").toString("utf-8");
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      parsed.v !== 1 ||
      typeof parsed.createdAt !== "string" ||
      typeof parsed.id !== "string" ||
      !UUID_REGEX.test(parsed.id)
    ) {
      throw new Error("Invalid cursor payload structure");
    }

    const date = new Date(parsed.createdAt);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid cursor timestamp format");
    }

    return {
      createdAt: date,
      id: parsed.id,
    };
  } catch {
    throw new AppError(
      "Invalid cursor format",
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }
}
