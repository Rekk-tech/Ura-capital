import { describe, it, expect } from "vitest";
import { encodeCursor, decodeCursor } from "../../src/modules/community/community-cursor.js";
import {
  CreateCommunityPostBodySchema,
  GetCommunityPostsQuerySchema,
  CommunityPostParamSchema,
} from "../../src/modules/community/community.validation.js";
import { toCommunityPostDto } from "../../src/modules/community/community.dto.js";
import type { CommunityPostRecord } from "../../src/modules/community/community.types.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("FEAT-042 Community Posts Unit Tests", () => {
  // ============================================================================
  // 1. Cursor Codec Tests
  // ============================================================================
  describe("Cursor Codec (T003, AC-008, AC-010)", () => {
    const validId = "11111111-2222-4333-8444-555555555555";
    const validDate = new Date("2026-09-20T12:00:00.000Z");

    it("encodes and decodes a valid cursor round-trip", () => {
      const cursor = encodeCursor({ createdAt: validDate, id: validId });
      expect(typeof cursor).toBe("string");
      expect(cursor.length).toBeGreaterThan(10);

      const decoded = decodeCursor(cursor);
      expect(decoded.id).toBe(validId);
      expect(decoded.createdAt.toISOString()).toBe(validDate.toISOString());
    });

    it("encodes and decodes with ISO string createdAt", () => {
      const cursor = encodeCursor({ createdAt: validDate.toISOString(), id: validId });
      const decoded = decodeCursor(cursor);
      expect(decoded.id).toBe(validId);
      expect(decoded.createdAt.toISOString()).toBe(validDate.toISOString());
    });

    it("throws 400 VALIDATION_ERROR on empty or non-string cursor", () => {
      expect(() => decodeCursor("")).toThrowError(AppError);
      try {
        decodeCursor("");
      } catch (err: unknown) {
        const appErr = err as AppError;
        expect(appErr.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(appErr.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      }
    });

    it("throws 400 VALIDATION_ERROR on malformed base64 / non-JSON payload", () => {
      expect(() => decodeCursor("not-base64-json!@#$")).toThrowError(AppError);
    });

    it("throws 400 VALIDATION_ERROR when cursor version is missing or unsupported", () => {
      const invalidVersionPayload = Buffer.from(
        JSON.stringify({ v: 2, createdAt: validDate.toISOString(), id: validId }),
      ).toString("base64url");

      expect(() => decodeCursor(invalidVersionPayload)).toThrowError(AppError);
    });

    it("throws 400 VALIDATION_ERROR when cursor contains an invalid UUID", () => {
      const invalidUuidPayload = Buffer.from(
        JSON.stringify({ v: 1, createdAt: validDate.toISOString(), id: "not-a-uuid" }),
      ).toString("base64url");

      expect(() => decodeCursor(invalidUuidPayload)).toThrowError(AppError);
    });

    it("throws 400 VALIDATION_ERROR when cursor contains an invalid date timestamp", () => {
      const invalidDatePayload = Buffer.from(
        JSON.stringify({ v: 1, createdAt: "not-a-date", id: validId }),
      ).toString("base64url");

      expect(() => decodeCursor(invalidDatePayload)).toThrowError(AppError);
    });

    it("throws 400 VALIDATION_ERROR when cursor payload is missing fields", () => {
      const missingFieldsPayload = Buffer.from(
        JSON.stringify({ v: 1, id: validId }),
      ).toString("base64url");

      expect(() => decodeCursor(missingFieldsPayload)).toThrowError(AppError);
    });
  });

  // ============================================================================
  // 2. Request Validation Tests
  // ============================================================================
  describe("Zod Request Validation (T002, AC-006, AC-007, AC-008, AC-025)", () => {
    describe("CreateCommunityPostBodySchema", () => {
      it("accepts valid post content and trims leading/trailing whitespace", () => {
        const result = CreateCommunityPostBodySchema.parse({
          content: "  Valid post content for the community!  ",
        });
        expect(result.content).toBe("Valid post content for the community!");
      });

      it("accepts boundary content of exactly 1 character", () => {
        const result = CreateCommunityPostBodySchema.parse({ content: "A" });
        expect(result.content).toBe("A");
      });

      it("accepts boundary content of exactly 5,000 characters", () => {
        const maxContent = "x".repeat(5000);
        const result = CreateCommunityPostBodySchema.parse({ content: maxContent });
        expect(result.content.length).toBe(5000);
      });

      it("rejects empty content", () => {
        expect(() => CreateCommunityPostBodySchema.parse({ content: "" })).toThrow();
      });

      it("rejects whitespace-only content (spaces, tabs, newlines)", () => {
        expect(() =>
          CreateCommunityPostBodySchema.parse({ content: "   \t\r\n   " }),
        ).toThrow();
      });

      it("rejects content exceeding 5,000 characters", () => {
        const oversized = "x".repeat(5001);
        expect(() => CreateCommunityPostBodySchema.parse({ content: oversized })).toThrow();
      });

      it("rejects spoofed / unapproved fields via strict check (AC-006, AC-025)", () => {
        expect(() =>
          CreateCommunityPostBodySchema.parse({
            content: "Hello",
            authorId: "00000000-0000-0000-0000-000000000001",
          }),
        ).toThrow();

        expect(() =>
          CreateCommunityPostBodySchema.parse({
            content: "Hello",
            status: "REMOVED",
          }),
        ).toThrow();

        expect(() =>
          CreateCommunityPostBodySchema.parse({
            content: "Hello",
            likeCount: 999,
          }),
        ).toThrow();

        expect(() =>
          CreateCommunityPostBodySchema.parse({
            content: "Hello",
            commentCount: 50,
          }),
        ).toThrow();

        expect(() =>
          CreateCommunityPostBodySchema.parse({
            content: "Hello",
            role: "ADMIN",
          }),
        ).toThrow();
      });
    });

    describe("GetCommunityPostsQuerySchema", () => {
      it("defaults limit to 20 when omitted", () => {
        const result = GetCommunityPostsQuerySchema.parse({});
        expect(result.limit).toBe(20);
        expect(result.cursor).toBeUndefined();
      });

      it("parses valid custom limit between 1 and 50", () => {
        const res1 = GetCommunityPostsQuerySchema.parse({ limit: "1" });
        expect(res1.limit).toBe(1);

        const res50 = GetCommunityPostsQuerySchema.parse({ limit: "50" });
        expect(res50.limit).toBe(50);
      });

      it("accepts valid cursor parameter", () => {
        const result = GetCommunityPostsQuerySchema.parse({
          cursor: "eyJ2IjoxfQ",
          limit: "10",
        });
        expect(result.cursor).toBe("eyJ2IjoxfQ");
        expect(result.limit).toBe(10);
      });

      it("rejects limit < 1", () => {
        expect(() => GetCommunityPostsQuerySchema.parse({ limit: "0" })).toThrow();
        expect(() => GetCommunityPostsQuerySchema.parse({ limit: "-5" })).toThrow();
      });

      it("rejects limit > 50 (AC-004)", () => {
        expect(() => GetCommunityPostsQuerySchema.parse({ limit: "51" })).toThrow();
        expect(() => GetCommunityPostsQuerySchema.parse({ limit: "100" })).toThrow();
      });

      it("rejects non-integer limits", () => {
        expect(() => GetCommunityPostsQuerySchema.parse({ limit: "12.5" })).toThrow();
        expect(() => GetCommunityPostsQuerySchema.parse({ limit: "abc" })).toThrow();
      });

      it("rejects unknown query parameters via strict check", () => {
        expect(() =>
          GetCommunityPostsQuerySchema.parse({ limit: "20", filter: "all" }),
        ).toThrow();
      });
    });

    describe("CommunityPostParamSchema", () => {
      it("accepts valid UUID", () => {
        const result = CommunityPostParamSchema.parse({
          postId: "00000000-0000-0000-0000-000000000001",
        });
        expect(result.postId).toBe("00000000-0000-0000-0000-000000000001");
      });

      it("rejects non-UUID post IDs (AC-008)", () => {
        expect(() => CommunityPostParamSchema.parse({ postId: "not-a-uuid" })).toThrow();
        expect(() => CommunityPostParamSchema.parse({ postId: "12345" })).toThrow();
      });
    });
  });

  // ============================================================================
  // 3. Safe DTO Mapping Tests
  // ============================================================================
  describe("Safe DTO Projection (T006, AC-019)", () => {
    const currentUserId = "user-1111-2222-3333";
    const baseRecord: CommunityPostRecord = {
      id: "post-uuid-1",
      authorId: currentUserId,
      content: "Learner insights on market dynamics",
      status: "VISIBLE",
      createdAt: new Date("2026-09-20T10:00:00.000Z"),
      updatedAt: new Date("2026-09-20T10:05:00.000Z"),
      removedAt: null,
      author: {
        displayName: "Alice Investor",
      },
      _count: {
        comments: 3,
        likes: 12,
      },
      likes: [{ id: "like-1" }],
    };

    it("projects exact canonical DTO fields", () => {
      const dto = toCommunityPostDto(baseRecord, currentUserId);

      expect(dto).toEqual({
        id: "post-uuid-1",
        author: {
          displayName: "Alice Investor",
        },
        content: "Learner insights on market dynamics",
        createdAt: "2026-09-20T10:00:00.000Z",
        likeCount: 12,
        commentCount: 3,
        likedByCurrentUser: true,
        ownedByCurrentUser: true,
      });

      // Verify strict whitelisting: no forbidden internal/identity fields
      const dtoKeys = Object.keys(dto).sort();
      expect(dtoKeys).toEqual([
        "author",
        "commentCount",
        "content",
        "createdAt",
        "id",
        "likeCount",
        "likedByCurrentUser",
        "ownedByCurrentUser",
      ]);

      expect("authorId" in dto).toBe(false);
      expect("status" in dto).toBe(false);
      expect("removedAt" in dto).toBe(false);
      expect("updatedAt" in dto).toBe(false);
      expect("email" in dto).toBe(false);
      expect("roles" in dto).toBe(false);
    });

    it("falls back to 'Aura Learner' when author display name is null or empty", () => {
      const recordNoName: CommunityPostRecord = {
        ...baseRecord,
        author: { displayName: null },
      };
      const dto1 = toCommunityPostDto(recordNoName, currentUserId);
      expect(dto1.author.displayName).toBe("Aura Learner");

      const recordWhitespaceName: CommunityPostRecord = {
        ...baseRecord,
        author: { displayName: "   \t  " },
      };
      const dto2 = toCommunityPostDto(recordWhitespaceName, currentUserId);
      expect(dto2.author.displayName).toBe("Aura Learner");
    });

    it("correctly determines ownedByCurrentUser = false for foreign posts", () => {
      const dto = toCommunityPostDto(baseRecord, "different-user-uuid");
      expect(dto.ownedByCurrentUser).toBe(false);
    });

    it("correctly determines likedByCurrentUser = false when user has not liked", () => {
      const unlikedRecord: CommunityPostRecord = {
        ...baseRecord,
        likes: [],
      };
      const dto = toCommunityPostDto(unlikedRecord, currentUserId);
      expect(dto.likedByCurrentUser).toBe(false);
    });
  });
});
