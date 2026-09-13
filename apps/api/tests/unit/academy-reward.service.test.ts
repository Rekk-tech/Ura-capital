import { describe, it, expect, vi, beforeEach } from "vitest";
import { AcademyRewardService } from "../../src/modules/academy/academy-reward.service.js";
import type {
  IAcademyRewardRepository,
  IAcademyProgressRepository,
} from "../../src/modules/academy/academy.repository.js";
import type { ITransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import type { IRepositoryContainer } from "../../src/infrastructure/database/repository-factory.js";
import {
  ACADEMY_XP_POLICY,
  ACADEMY_REWARD_TYPES,
  ACADEMY_SOURCE_TYPES,
  ACADEMY_RESOURCE_TYPES,
  deriveRewardIdempotencyKey,
  type AcademyCompletionFact,
} from "@aura/shared";
import { toLearnerXpDto } from "../../src/modules/academy/academy.dto.js";
import { sanitizeRewardMetadata } from "../../src/modules/academy/academy.validation.js";
import type { TransactionContext } from "../../src/infrastructure/database/transaction-context.js";

describe("AcademyRewardService - Unit Tests (FEAT-027)", () => {
  const mockRewardRepo: IAcademyRewardRepository = {
    recordReward: vi.fn(),
    recordRewardSafe: vi.fn(),
    findRewardBySemanticTuple: vi.fn(),
    findRewardByIdempotencyKey: vi.fn(),
    upsertUserXp: vi.fn(),
    getUserXp: vi.fn(),
  };

  const mockProgressRepo: IAcademyProgressRepository = {
    upsertCourseProgress: vi.fn(),
    findCourseProgress: vi.fn(),
    upsertLessonProgress: vi.fn(),
    findLessonProgress: vi.fn(),
    findCourseProgressBySlug: vi.fn(),
    findPublishedLessonWithCourse: vi.fn(),
    hasPublishedQuiz: vi.fn(),
    findGradedAttempt: vi.fn(),
    getPublishedLessonsForCourse: vi.fn(),
    listLessonProgressForUser: vi.fn(),
    getPublishedCoursesWithLessons: vi.fn(),
    isCourseCompleted: vi.fn(),
  };

  const mockTxRunner: ITransactionRunner = {
    run: vi.fn(async (callback) => {
      const container: IRepositoryContainer = {
        academyProgressRepo: mockProgressRepo,
        academyRewardRepo: mockRewardRepo,
      };
      return callback({ repositories: container } as unknown as TransactionContext);
    }),
    getActiveContext: vi.fn().mockReturnValue(undefined),
    isInTransaction: vi.fn().mockReturnValue(false),
  };

  let service: AcademyRewardService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AcademyRewardService(
      mockRewardRepo,
      mockProgressRepo,
      mockTxRunner,
    );
  });

  describe("AC-001, AC-004, AC-005, AC-010: Locked Human XP Policy", () => {
    it("freezes exact approved XP policy constants", () => {
      expect(ACADEMY_XP_POLICY.LESSON_FIRST_COMPLETION_XP).toBe(10);
      expect(ACADEMY_XP_POLICY.COURSE_FIRST_COMPLETION_XP).toBe(50);
      expect(ACADEMY_XP_POLICY.FAILED_QUIZ_XP).toBe(0);
      expect(ACADEMY_XP_POLICY.REPEAT_ATTEMPT_XP).toBe(0);
    });

    it("freezes exact approved reward and resource types", () => {
      expect(ACADEMY_REWARD_TYPES.XP).toBe("XP");
      expect(ACADEMY_SOURCE_TYPES.LESSON_COMPLETION).toBe("LESSON_COMPLETION");
      expect(ACADEMY_SOURCE_TYPES.COURSE_COMPLETION).toBe("COURSE_COMPLETION");
      expect(ACADEMY_RESOURCE_TYPES.LESSON).toBe("LESSON");
      expect(ACADEMY_RESOURCE_TYPES.COURSE).toBe("COURSE");
    });
  });

  describe("AC-002, AC-003: Deterministic Reward Identity & Eligibility", () => {
    it("generates deterministic canonical idempotency keys", () => {
      const lessonKey = deriveRewardIdempotencyKey(
        "usr-1",
        ACADEMY_SOURCE_TYPES.LESSON_COMPLETION,
        "les-42",
        ACADEMY_REWARD_TYPES.XP,
      );
      expect(lessonKey).toBe("academy:reward:usr-1:LESSON_COMPLETION:les-42:XP");

      const courseKey = deriveRewardIdempotencyKey(
        "usr-1",
        ACADEMY_SOURCE_TYPES.COURSE_COMPLETION,
        "crs-99",
        ACADEMY_REWARD_TYPES.XP,
      );
      expect(courseKey).toBe("academy:reward:usr-1:COURSE_COMPLETION:crs-99:XP");
    });

    it("rejects reward reconciliation if completion fact userId does not match principal", async () => {
      const fact: AcademyCompletionFact = {
        userId: "user-b",
        resourceType: "LESSON",
        resourceId: "lesson-1",
        isFirstCompletion: true,
        completedAt: new Date(),
      };

      const result = await service.reconcileRewardForCompletion("user-a", fact);
      expect(result).toBeNull();
      expect(mockRewardRepo.recordRewardSafe).not.toHaveBeenCalled();
    });

    it("rejects lesson reward if lesson progress is not durably COMPLETED in DB", async () => {
      vi.mocked(mockProgressRepo.findLessonProgress).mockResolvedValue({
        id: "lp-1",
        userId: "user-1",
        lessonId: "lesson-1",
        status: "IN_PROGRESS",
        startedAt: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const fact: AcademyCompletionFact = {
        userId: "user-1",
        resourceType: "LESSON",
        resourceId: "lesson-1",
        isFirstCompletion: true,
        completedAt: new Date(),
      };

      const result = await service.reconcileRewardForCompletion("user-1", fact);
      expect(result).toBeNull();
      expect(mockRewardRepo.recordRewardSafe).not.toHaveBeenCalled();
    });

    it("rejects course reward if course progress is not durably COMPLETED in DB", async () => {
      vi.mocked(mockProgressRepo.findCourseProgress).mockResolvedValue({
        id: "cp-1",
        userId: "user-1",
        courseId: "course-1",
        status: "IN_PROGRESS",
        startedAt: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const fact: AcademyCompletionFact = {
        userId: "user-1",
        resourceType: "COURSE",
        resourceId: "course-1",
        isFirstCompletion: true,
        completedAt: new Date(),
      };

      const result = await service.reconcileRewardForCompletion("user-1", fact);
      expect(result).toBeNull();
      expect(mockRewardRepo.recordRewardSafe).not.toHaveBeenCalled();
    });
  });

  describe("AC-004, AC-005, AC-006: First Completion Reward Grants & Atomicity", () => {
    it("grants exactly 10 XP on eligible first lesson completion", async () => {
      vi.mocked(mockProgressRepo.findLessonProgress).mockResolvedValue({
        id: "lp-1",
        userId: "user-1",
        lessonId: "lesson-1",
        status: "COMPLETED",
        startedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockRewardRepo.recordRewardSafe).mockResolvedValue({
        reward: {
          id: "rw-1",
          userId: "user-1",
          sourceType: "LESSON_COMPLETION",
          sourceId: "lesson-1",
          rewardType: "XP",
          amount: 10,
          idempotencyKey: "academy:reward:user-1:LESSON_COMPLETION:lesson-1:XP",
          status: "APPLIED",
          metadata: null,
          createdAt: new Date(),
        },
        isDuplicate: false,
      });

      vi.mocked(mockRewardRepo.upsertUserXp).mockResolvedValue({
        id: "xp-1",
        userId: "user-1",
        totalXp: 10,
        level: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const fact: AcademyCompletionFact = {
        userId: "user-1",
        resourceType: "LESSON",
        resourceId: "lesson-1",
        isFirstCompletion: true,
        completedAt: new Date(),
      };

      const result = await service.reconcileRewardForCompletion("user-1", fact);

      expect(result).not.toBeNull();
      expect(result?.amount).toBe(10);
      expect(result?.isDuplicate).toBe(false);
      expect(result?.totalXp).toBe(10);
      expect(mockRewardRepo.upsertUserXp).toHaveBeenCalledWith("user-1", 10);
    });

    it("grants exactly 50 XP on eligible first course completion", async () => {
      vi.mocked(mockProgressRepo.findCourseProgress).mockResolvedValue({
        id: "cp-1",
        userId: "user-1",
        courseId: "course-1",
        status: "COMPLETED",
        startedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockRewardRepo.recordRewardSafe).mockResolvedValue({
        reward: {
          id: "rw-2",
          userId: "user-1",
          sourceType: "COURSE_COMPLETION",
          sourceId: "course-1",
          rewardType: "XP",
          amount: 50,
          idempotencyKey: "academy:reward:user-1:COURSE_COMPLETION:course-1:XP",
          status: "APPLIED",
          metadata: null,
          createdAt: new Date(),
        },
        isDuplicate: false,
      });

      vi.mocked(mockRewardRepo.upsertUserXp).mockResolvedValue({
        id: "xp-1",
        userId: "user-1",
        totalXp: 60,
        level: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const fact: AcademyCompletionFact = {
        userId: "user-1",
        resourceType: "COURSE",
        resourceId: "course-1",
        isFirstCompletion: true,
        completedAt: new Date(),
      };

      const result = await service.reconcileRewardForCompletion("user-1", fact);

      expect(result).not.toBeNull();
      expect(result?.amount).toBe(50);
      expect(result?.isDuplicate).toBe(false);
      expect(result?.totalXp).toBe(60);
      expect(mockRewardRepo.upsertUserXp).toHaveBeenCalledWith("user-1", 50);
    });
  });

  describe("AC-008, AC-025: Duplicate / Replay Idempotency & Reward Recovery", () => {
    it("returns existing outcome without mutating XP when ledger row already exists", async () => {
      vi.mocked(mockProgressRepo.findLessonProgress).mockResolvedValue({
        id: "lp-1",
        userId: "user-1",
        lessonId: "lesson-1",
        status: "COMPLETED",
        startedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockRewardRepo.recordRewardSafe).mockResolvedValue({
        reward: {
          id: "rw-1",
          userId: "user-1",
          sourceType: "LESSON_COMPLETION",
          sourceId: "lesson-1",
          rewardType: "XP",
          amount: 10,
          idempotencyKey: "academy:reward:user-1:LESSON_COMPLETION:lesson-1:XP",
          status: "APPLIED",
          metadata: null,
          createdAt: new Date(),
        },
        isDuplicate: true,
      });

      vi.mocked(mockRewardRepo.getUserXp).mockResolvedValue({
        id: "xp-1",
        userId: "user-1",
        totalXp: 10,
        level: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const fact: AcademyCompletionFact = {
        userId: "user-1",
        resourceType: "LESSON",
        resourceId: "lesson-1",
        isFirstCompletion: false,
        completedAt: new Date(),
      };

      const result = await service.reconcileRewardForCompletion("user-1", fact);

      expect(result?.isDuplicate).toBe(true);
      expect(result?.amount).toBe(10);
      expect(result?.totalXp).toBe(10);
      // Critical check: upsertUserXp MUST NOT be called on duplicate
      expect(mockRewardRepo.upsertUserXp).not.toHaveBeenCalled();
    });

    it("awards missing reward even if isFirstCompletion=false when resource is durably completed (Recovery)", async () => {
      // Simulates recovery scenario: lesson is durably completed in DB,
      // but earlier reward tx failed, so ledger was missing.
      vi.mocked(mockProgressRepo.findLessonProgress).mockResolvedValue({
        id: "lp-1",
        userId: "user-1",
        lessonId: "lesson-1",
        status: "COMPLETED",
        startedAt: new Date(),
        completedAt: new Date("2026-09-10T10:00:00Z"),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // recordRewardSafe finds no prior row, inserts new row
      vi.mocked(mockRewardRepo.recordRewardSafe).mockResolvedValue({
        reward: {
          id: "rw-recovery",
          userId: "user-1",
          sourceType: "LESSON_COMPLETION",
          sourceId: "lesson-1",
          rewardType: "XP",
          amount: 10,
          idempotencyKey: "academy:reward:user-1:LESSON_COMPLETION:lesson-1:XP",
          status: "APPLIED",
          metadata: null,
          createdAt: new Date(),
        },
        isDuplicate: false,
      });

      vi.mocked(mockRewardRepo.upsertUserXp).mockResolvedValue({
        id: "xp-1",
        userId: "user-1",
        totalXp: 10,
        level: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Crucial: fact reports isFirstCompletion = false because progression was already committed
      const replayedFact: AcademyCompletionFact = {
        userId: "user-1",
        resourceType: "LESSON",
        resourceId: "lesson-1",
        isFirstCompletion: false,
        completedAt: new Date("2026-09-10T10:00:00Z"),
      };

      const result = await service.reconcileRewardForCompletion("user-1", replayedFact);

      expect(result).not.toBeNull();
      expect(result?.isDuplicate).toBe(false);
      expect(result?.amount).toBe(10);
      expect(result?.totalXp).toBe(10);
      expect(mockRewardRepo.upsertUserXp).toHaveBeenCalledWith("user-1", 10);
    });
  });

  describe("AC-012: Metadata Sanitization & Allowlist", () => {
    it("preserves allowed metadata fields and strips sensitive/unrecognized fields", () => {
      const input = {
        courseSlug: "crypto-101",
        lessonSlug: "intro-hash",
        completedAt: "2026-09-12T10:00:00Z",
        source: "MANUAL_COMPLETION",
        password: "supersecretpassword",
        authToken: "bearer-token-secret",
        cookie: "session=xyz",
        answer: "A",
        explanation: "Correct because...",
        score: 100,
        unknownField: "ignored",
      };

      const sanitized = sanitizeRewardMetadata(input);

      expect(sanitized).toBeDefined();
      expect(sanitized?.courseSlug).toBe("crypto-101");
      expect(sanitized?.lessonSlug).toBe("intro-hash");
      expect(sanitized?.completedAt).toBe("2026-09-12T10:00:00Z");
      expect(sanitized?.source).toBe("MANUAL_COMPLETION");

      // Strictly stripped
      expect(sanitized?.password).toBeUndefined();
      expect(sanitized?.authToken).toBeUndefined();
      expect(sanitized?.cookie).toBeUndefined();
      expect(sanitized?.answer).toBeUndefined();
      expect(sanitized?.explanation).toBeUndefined();
      expect(sanitized?.score).toBeUndefined();
      expect(sanitized?.unknownField).toBeUndefined();
    });

    it("bounds string lengths in metadata to 256 chars", () => {
      const longSlug = "a".repeat(400);
      const sanitized = sanitizeRewardMetadata({ courseSlug: longSlug });

      expect(sanitized?.courseSlug).toHaveLength(256);
    });

    it("returns undefined for null or empty metadata", () => {
      expect(sanitizeRewardMetadata(null)).toBeUndefined();
      expect(sanitizeRewardMetadata(undefined)).toBeUndefined();
      expect(sanitizeRewardMetadata({})).toBeUndefined();
    });
  });

  describe("AC-016, AC-026: Safe Learner DTO Projection & Level Mechanics Deferral", () => {
    it("maps XP to minimal safe DTO containing totalXp only", () => {
      const dto = toLearnerXpDto({ totalXp: 120 });
      expect(dto).toEqual({ totalXp: 120 });

      // Verifies zero exposure of internal fields or deferred levels
      const keys = Object.keys(dto);
      expect(keys).toEqual(["totalXp"]);
      expect((dto as Record<string, unknown>).level).toBeUndefined();
      expect((dto as Record<string, unknown>).userId).toBeUndefined();
      expect((dto as Record<string, unknown>).id).toBeUndefined();
    });

    it("clamps negative XP to 0", () => {
      const dto = toLearnerXpDto({ totalXp: -50 });
      expect(dto.totalXp).toBe(0);
    });

    it("getMyXp returns 0 XP when user has no record in database", async () => {
      vi.mocked(mockRewardRepo.getUserXp).mockResolvedValue(null);

      const result = await service.getMyXp("user-new");
      expect(result).toEqual({ totalXp: 0 });
    });

    it("getMyXp returns user totalXp when record exists", async () => {
      vi.mocked(mockRewardRepo.getUserXp).mockResolvedValue({
        id: "xp-1",
        userId: "user-active",
        totalXp: 210,
        level: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.getMyXp("user-active");
      expect(result).toEqual({ totalXp: 210 });
    });
  });
});
