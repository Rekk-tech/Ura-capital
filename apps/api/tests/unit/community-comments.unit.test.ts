import { describe, it, expect } from "vitest";
import {
  encodeCommentCursor,
  decodeCommentCursor,
} from "../../src/modules/community/community-comment-cursor.js";
import {
  CreateCommunityCommentBodySchema,
  GetCommunityCommentsQuerySchema,
  CommunityCommentPostParamSchema,
  CommunityCommentParamSchema,
} from "../../src/modules/community/community-comment.validation.js";
import { toCommunityCommentDto } from "../../src/modules/community/community-comment.dto.js";
import type { CommunityCommentRecord } from "../../src/modules/community/community.types.js";
import type {
  ICommunityCommentRepository,
  ICommunityPostRepository,
} from "../../src/modules/community/community.repository.js";
import type { ITransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import type { TransactionContext } from "../../src/infrastructure/database/transaction-context.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { vi } from "vitest";

describe("FEAT-043 Community Comments Unit Tests", () => {
  // ============================================================================
  // 1. Cursor Codec Tests
  // ============================================================================
  describe("Comment Cursor Codec", () => {
    const validId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const validDate = new Date("2026-09-20T14:30:00.000Z");

    it("encodes and decodes a valid comment cursor round-trip", () => {
      const cursor = encodeCommentCursor({ createdAt: validDate, id: validId });
      expect(typeof cursor).toBe("string");
      expect(cursor.length).toBeGreaterThan(10);

      const decoded = decodeCommentCursor(cursor);
      expect(decoded.id).toBe(validId);
      expect(decoded.createdAt.toISOString()).toBe(validDate.toISOString());
    });

    it("encodes and decodes with ISO string createdAt", () => {
      const cursor = encodeCommentCursor({
        createdAt: validDate.toISOString(),
        id: validId,
      });
      const decoded = decodeCommentCursor(cursor);
      expect(decoded.id).toBe(validId);
      expect(decoded.createdAt.toISOString()).toBe(validDate.toISOString());
    });

    it("throws 400 VALIDATION_ERROR on empty or non-string cursor", () => {
      expect(() => decodeCommentCursor("")).toThrowError(AppError);
      try {
        decodeCommentCursor("");
      } catch (err: unknown) {
        const appErr = err as AppError;
        expect(appErr.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(appErr.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      }
    });

    it("throws 400 VALIDATION_ERROR on malformed base64 / non-JSON payload", () => {
      expect(() => decodeCommentCursor("invalid-comment-cursor-base64!")).toThrowError(
        AppError,
      );
    });

    it("throws 400 VALIDATION_ERROR when cursor version is missing or unsupported", () => {
      const invalidVersionPayload = Buffer.from(
        JSON.stringify({ v: 2, createdAt: validDate.toISOString(), id: validId }),
      ).toString("base64url");

      expect(() => decodeCommentCursor(invalidVersionPayload)).toThrowError(AppError);
    });

    it("throws 400 VALIDATION_ERROR when cursor contains an invalid UUID", () => {
      const invalidUuidPayload = Buffer.from(
        JSON.stringify({ v: 1, createdAt: validDate.toISOString(), id: "not-a-valid-uuid" }),
      ).toString("base64url");

      expect(() => decodeCommentCursor(invalidUuidPayload)).toThrowError(AppError);
    });

    it("throws 400 VALIDATION_ERROR when cursor contains an invalid date timestamp", () => {
      const invalidDatePayload = Buffer.from(
        JSON.stringify({ v: 1, createdAt: "invalid-date", id: validId }),
      ).toString("base64url");

      expect(() => decodeCommentCursor(invalidDatePayload)).toThrowError(AppError);
    });

    it("throws 400 VALIDATION_ERROR when cursor payload is missing fields", () => {
      const missingFieldsPayload = Buffer.from(
        JSON.stringify({ v: 1, id: validId }),
      ).toString("base64url");

      expect(() => decodeCommentCursor(missingFieldsPayload)).toThrowError(AppError);
    });
  });

  // ============================================================================
  // 2. Request Validation Tests
  // ============================================================================
  describe("Zod Request Validation", () => {
    describe("CreateCommunityCommentBodySchema", () => {
      it("accepts valid comment content and trims leading/trailing whitespace", () => {
        const result = CreateCommunityCommentBodySchema.parse({
          content: "  This is an insightful comment on the analysis!  ",
        });
        expect(result.content).toBe("This is an insightful comment on the analysis!");
      });

      it("accepts boundary content of exactly 1 character", () => {
        const result = CreateCommunityCommentBodySchema.parse({ content: "C" });
        expect(result.content).toBe("C");
      });

      it("accepts boundary content of exactly 2,000 characters", () => {
        const maxContent = "y".repeat(2000);
        const result = CreateCommunityCommentBodySchema.parse({ content: maxContent });
        expect(result.content.length).toBe(2000);
      });

      it("rejects empty comment content", () => {
        expect(() => CreateCommunityCommentBodySchema.parse({ content: "" })).toThrow();
      });

      it("rejects whitespace-only comment content", () => {
        expect(() =>
          CreateCommunityCommentBodySchema.parse({ content: "   \t\r\n   " }),
        ).toThrow();
      });

      it("rejects content exceeding 2,000 characters", () => {
        const oversized = "y".repeat(2001);
        expect(() =>
          CreateCommunityCommentBodySchema.parse({ content: oversized }),
        ).toThrow();
      });

      it("rejects forbidden nested/reply/identity fields via strict check", () => {
        expect(() =>
          CreateCommunityCommentBodySchema.parse({
            content: "Great post!",
            parentCommentId: "11111111-2222-3333-4444-555555555555",
          }),
        ).toThrow();

        expect(() =>
          CreateCommunityCommentBodySchema.parse({
            content: "Great post!",
            replyTo: "Alice",
          }),
        ).toThrow();

        expect(() =>
          CreateCommunityCommentBodySchema.parse({
            content: "Great post!",
            depth: 1,
          }),
        ).toThrow();

        expect(() =>
          CreateCommunityCommentBodySchema.parse({
            content: "Great post!",
            authorId: "00000000-0000-0000-0000-000000000001",
          }),
        ).toThrow();

        expect(() =>
          CreateCommunityCommentBodySchema.parse({
            content: "Great post!",
            status: "REMOVED",
          }),
        ).toThrow();

        expect(() =>
          CreateCommunityCommentBodySchema.parse({
            content: "Great post!",
            postId: "00000000-0000-0000-0000-000000000002",
          }),
        ).toThrow();
      });
    });

    describe("GetCommunityCommentsQuerySchema", () => {
      it("defaults limit to 20 when omitted", () => {
        const result = GetCommunityCommentsQuerySchema.parse({});
        expect(result.limit).toBe(20);
        expect(result.cursor).toBeUndefined();
      });

      it("parses valid custom limit between 1 and 50", () => {
        const res1 = GetCommunityCommentsQuerySchema.parse({ limit: "1" });
        expect(res1.limit).toBe(1);

        const res50 = GetCommunityCommentsQuerySchema.parse({ limit: "50" });
        expect(res50.limit).toBe(50);
      });

      it("accepts valid cursor parameter", () => {
        const result = GetCommunityCommentsQuerySchema.parse({
          cursor: "eyJ2IjoxfQ",
          limit: "15",
        });
        expect(result.cursor).toBe("eyJ2IjoxfQ");
        expect(result.limit).toBe(15);
      });

      it("rejects limit < 1", () => {
        expect(() => GetCommunityCommentsQuerySchema.parse({ limit: "0" })).toThrow();
        expect(() => GetCommunityCommentsQuerySchema.parse({ limit: "-1" })).toThrow();
      });

      it("rejects limit > 50", () => {
        expect(() => GetCommunityCommentsQuerySchema.parse({ limit: "51" })).toThrow();
        expect(() => GetCommunityCommentsQuerySchema.parse({ limit: "100" })).toThrow();
      });

      it("rejects non-integer limits", () => {
        expect(() => GetCommunityCommentsQuerySchema.parse({ limit: "10.5" })).toThrow();
        expect(() => GetCommunityCommentsQuerySchema.parse({ limit: "abc" })).toThrow();
      });

      it("rejects unknown query parameters via strict check", () => {
        expect(() =>
          GetCommunityCommentsQuerySchema.parse({ limit: "20", sort: "desc" }),
        ).toThrow();
      });
    });

    describe("CommunityCommentPostParamSchema", () => {
      it("accepts valid UUID for postId", () => {
        const result = CommunityCommentPostParamSchema.parse({
          postId: "00000000-0000-0000-0000-000000000001",
        });
        expect(result.postId).toBe("00000000-0000-0000-0000-000000000001");
      });

      it("rejects non-UUID postId", () => {
        expect(() =>
          CommunityCommentPostParamSchema.parse({ postId: "not-a-uuid" }),
        ).toThrow();
      });
    });

    describe("CommunityCommentParamSchema", () => {
      it("accepts valid UUID for commentId", () => {
        const result = CommunityCommentParamSchema.parse({
          commentId: "00000000-0000-0000-0000-000000000002",
        });
        expect(result.commentId).toBe("00000000-0000-0000-0000-000000000002");
      });

      it("rejects non-UUID commentId", () => {
        expect(() =>
          CommunityCommentParamSchema.parse({ commentId: "not-a-uuid" }),
        ).toThrow();
      });
    });
  });

  // ============================================================================
  // 3. Safe DTO Mapping Tests
  // ============================================================================
  describe("Safe DTO Projection", () => {
    const currentUserId = "user-uuid-1111";
    const baseRecord: CommunityCommentRecord = {
      id: "comment-uuid-1",
      postId: "post-uuid-1",
      authorId: currentUserId,
      content: "Excellent risk management perspective.",
      status: "VISIBLE",
      createdAt: new Date("2026-09-20T11:00:00.000Z"),
      updatedAt: new Date("2026-09-20T11:00:00.000Z"),
      removedAt: null,
      author: {
        displayName: "Bob Trader",
      },
    };

    it("projects exact canonical DTO fields and verifies strict whitelisting", () => {
      const dto = toCommunityCommentDto(baseRecord, currentUserId);

      expect(dto).toEqual({
        id: "comment-uuid-1",
        author: {
          displayName: "Bob Trader",
        },
        content: "Excellent risk management perspective.",
        createdAt: "2026-09-20T11:00:00.000Z",
        ownedByCurrentUser: true,
      });

      const dtoKeys = Object.keys(dto).sort();
      expect(dtoKeys).toEqual([
        "author",
        "content",
        "createdAt",
        "id",
        "ownedByCurrentUser",
      ]);

      expect("authorId" in dto).toBe(false);
      expect("postId" in dto).toBe(false);
      expect("status" in dto).toBe(false);
      expect("removedAt" in dto).toBe(false);
      expect("updatedAt" in dto).toBe(false);
      expect("email" in dto).toBe(false);
      expect("roles" in dto).toBe(false);
    });

    it("falls back to 'Aura Learner' when author display name is null or whitespace", () => {
      const recordNoName: CommunityCommentRecord = {
        ...baseRecord,
        author: { displayName: null },
      };
      const dto1 = toCommunityCommentDto(recordNoName, currentUserId);
      expect(dto1.author.displayName).toBe("Aura Learner");

      const recordWhitespaceName: CommunityCommentRecord = {
        ...baseRecord,
        author: { displayName: "   \t  " },
      };
      const dto2 = toCommunityCommentDto(recordWhitespaceName, currentUserId);
      expect(dto2.author.displayName).toBe("Aura Learner");
    });

    it("correctly determines ownedByCurrentUser = false for foreign comments", () => {
      const dto = toCommunityCommentDto(baseRecord, "different-user-uuid");
      expect(dto.ownedByCurrentUser).toBe(false);
    });
  });

  // ============================================================================
  // 4. CommunityCommentService Unit Tests
  // ============================================================================
  describe("CommunityCommentService Unit Tests", () => {
    it("throws 404 NOT_FOUND when parent post does not exist or is not visible on listComments", async () => {
      const { CommunityCommentService } = await import(
        "../../src/modules/community/community-comment.service.js"
      );

      const mockCommentRepo = {
        listVisibleCommentsByPost: vi.fn(),
      } as unknown as ICommunityCommentRepository;
      const mockPostRepo = {
        findVisiblePostDetail: vi.fn().mockResolvedValue(null),
      } as unknown as ICommunityPostRepository;
      const mockTxRunner = {
        run: vi.fn(),
      } as unknown as ITransactionRunner;

      const service = new CommunityCommentService(
        mockCommentRepo,
        mockPostRepo,
        mockTxRunner,
      );

      await expect(
        service.listComments({
          postId: "post-uuid-1",
          limit: 20,
          currentUserId: "user-1",
        }),
      ).rejects.toThrow("Post not found");
    });

    it("throws 404 NOT_FOUND when parent post is missing on createComment", async () => {
      const { CommunityCommentService } = await import(
        "../../src/modules/community/community-comment.service.js"
      );

      const mockCommentRepo = {} as unknown as ICommunityCommentRepository;
      const mockPostRepo = {} as unknown as ICommunityPostRepository;
      const mockTxRunner = {
        run: vi.fn().mockImplementation(async (cb: (ctx: TransactionContext) => Promise<unknown>) => {
          return cb({
            repositories: {
              communityPostRepo: {
                findVisiblePostDetail: vi.fn().mockResolvedValue(null),
              },
              communityCommentRepo: {
                createComment: vi.fn(),
              },
            },
          } as unknown as TransactionContext);
        }),
      } as unknown as ITransactionRunner;

      const service = new CommunityCommentService(
        mockCommentRepo,
        mockPostRepo,
        mockTxRunner,
      );

      await expect(
        service.createComment({
          postId: "post-uuid-1",
          authorId: "user-1",
          content: "Comment content",
        }),
      ).rejects.toThrow("Post not found");
    });

    it("throws 404 NOT_FOUND when comment removal returns null", async () => {
      const { CommunityCommentService } = await import(
        "../../src/modules/community/community-comment.service.js"
      );

      const mockCommentRepo = {} as unknown as ICommunityCommentRepository;
      const mockPostRepo = {} as unknown as ICommunityPostRepository;
      const mockTxRunner = {
        run: vi.fn().mockImplementation(async (cb: (ctx: TransactionContext) => Promise<unknown>) => {
          return cb({
            repositories: {
              communityCommentRepo: {
                removeCommentIfOwner: vi.fn().mockResolvedValue(null),
              },
            },
          } as unknown as TransactionContext);
        }),
      } as unknown as ITransactionRunner;

      const service = new CommunityCommentService(
        mockCommentRepo,
        mockPostRepo,
        mockTxRunner,
      );

      await expect(
        service.removeComment("comment-uuid-1", "user-1"),
      ).rejects.toThrow("Comment not found");
    });
  });
});
