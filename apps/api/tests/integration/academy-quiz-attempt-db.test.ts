import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import {
  assertSafeTestDatabase,
} from "../helpers/test-db-guard.js";
import { createApp } from "../../src/server.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import { resetEnvCache } from "../../src/infrastructure/config/env.js";
import { disconnectPrisma } from "../../src/infrastructure/database/prisma.js";

const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("test")
    ? process.env.DATABASE_URL
    : "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh");

process.env.DATABASE_URL = testDbUrl;
process.env.NODE_ENV = "test";

// ============================================================================
// FEAT-024 Correctness Leakage Sentinel (AC-011)
// ============================================================================

const FORBIDDEN_PROPERTY_PATTERNS = [
  /^user_?id$/i,
  /^score$/i,
  /^learner_?score$/i,
  /^passed$/i,
  /^is_?correct$/i,
  /^correct$/i,
  /^correct_?option/i,
  /^correct_?option_?id$/i,
  /^correct_?option_?id_?snapshot$/i,
  /^correct_?option_?text_?snapshot$/i,
  /^correct_?answer/i,
  /^answer_?key$/i,
  /^solution/i,
  /^explanation$/i,
  /^points/i,
  /^grading$/i,
  /^grading_?result$/i,
  /^pass_?fail/i,
  /^pass_?fail_?result$/i,
  /^submitted_?at$/i,
  /^graded_?at$/i,
  /^completed_?at$/i,
  /^question_?prompt_?snapshot$/i,
  /^selected_?option_?text_?snapshot$/i,
];

export function assertZeroCorrectnessLeakage(payload: unknown): void {
  function scan(value: unknown, path: string): void {
    if (!value || typeof value !== "object") return;

    if (Array.isArray(value)) {
      value.forEach((item, index) => scan(item, `${path}[${index}]`));
      return;
    }

    for (const [key, propValue] of Object.entries(value as Record<string, unknown>)) {
      const currentPath = path ? `${path}.${key}` : key;
      for (const pattern of FORBIDDEN_PROPERTY_PATTERNS) {
        if (pattern.test(key)) {
          throw new Error(
            `SECURITY DEFECT AC-011: Forbidden key "${key}" detected at path "${currentPath}" in learner payload.`,
          );
        }
      }
      scan(propValue, currentPath);
    }
  }

  scan(payload, "");
}

describe("FEAT-024 Quiz Attempt Lifecycle (Live PostgreSQL Integration)", () => {
  let prisma: PrismaClient;
  let app: ReturnType<typeof createApp>;
  let learnerAId: string;
  let _learnerBId: string;
  let learnerAToken: string;
  let learnerBToken: string;

  let publishedCourseId: string;
  let publishedLessonId: string;
  let publishedQuizId: string;
  let question1Id: string;
  let option1AId: string;
  let option1BId: string;
  let question2Id: string;
  let option2AId: string;
  let _option2BId: string;

  beforeAll(async () => {
    assertSafeTestDatabase(testDbUrl, "test");

    process.env.DATABASE_URL = testDbUrl;
    process.env.NODE_ENV = "test";
    resetEnvCache();
    await disconnectPrisma();

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
    });

    async function cleanupTestData(prismaClient: PrismaClient): Promise<void> {
      await prismaClient.$transaction(async (tx) => {
        await tx.academyRewardLedger.deleteMany();
        await tx.academyUserXp.deleteMany();
        await tx.academyUserLessonProgress.deleteMany();
        await tx.academyUserCourseProgress.deleteMany();
        await tx.academyQuizAnswer.deleteMany();
        await tx.academyQuizAttempt.deleteMany();
        await tx.academyQuizOption.deleteMany();
        await tx.academyQuizQuestion.deleteMany();
        await tx.academyQuiz.deleteMany();
        await tx.academyFlashcard.deleteMany();
        await tx.academyLesson.deleteMany();
        await tx.academyCourse.deleteMany();
        await tx.userRole.deleteMany();
        await tx.credential.deleteMany();
        await tx.refreshSession.deleteMany();
        await tx.authSecurityAuditRecord.deleteMany();
        await tx.user.deleteMany();
      });
    }


    await cleanupTestData(prisma);

    // Seed test users
    const userA = await prisma.user.create({
      data: {
        email: "learner-a@aura.test",
        status: "ACTIVE",
      },
    });
    learnerAId = userA.id;
    learnerAToken = accessTokenService.issueAccessToken(userA.id).accessToken;

    const userB = await prisma.user.create({
      data: {
        email: "learner-b@aura.test",
        status: "ACTIVE",
      },
    });
    _learnerBId = userB.id;
    learnerBToken = accessTokenService.issueAccessToken(userB.id).accessToken;

    app = createApp();
  });


  afterAll(async () => {
    if (prisma) {
      await prisma.$transaction(async (tx) => {
        await tx.academyRewardLedger.deleteMany();
        await tx.academyUserXp.deleteMany();
        await tx.academyUserLessonProgress.deleteMany();
        await tx.academyUserCourseProgress.deleteMany();
        await tx.academyQuizAnswer.deleteMany();
        await tx.academyQuizAttempt.deleteMany();
        await tx.academyQuizOption.deleteMany();
        await tx.academyQuizQuestion.deleteMany();
        await tx.academyQuiz.deleteMany();
        await tx.academyFlashcard.deleteMany();
        await tx.academyLesson.deleteMany();
        await tx.academyCourse.deleteMany();
        await tx.userRole.deleteMany();
        await tx.credential.deleteMany();
        await tx.refreshSession.deleteMany();
        await tx.authSecurityAuditRecord.deleteMany();
        await tx.user.deleteMany();
      });
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    // Reset academy state before each test atomically
    await prisma.$transaction(async (tx) => {
      await tx.academyRewardLedger.deleteMany();
      await tx.academyUserXp.deleteMany();
      await tx.academyUserLessonProgress.deleteMany();
      await tx.academyUserCourseProgress.deleteMany();
      await tx.academyQuizAnswer.deleteMany();
      await tx.academyQuizAttempt.deleteMany();
      await tx.academyQuizOption.deleteMany();
      await tx.academyQuizQuestion.deleteMany();
      await tx.academyQuiz.deleteMany();
      await tx.academyFlashcard.deleteMany();
      await tx.academyLesson.deleteMany();
      await tx.academyCourse.deleteMany();
    });


    // Create published Course, Lesson, Quiz hierarchy
    const course = await prisma.academyCourse.create({
      data: {
        slug: "crypto-101",
        title: "Introduction to Crypto",
        level: "BEGINNER",
        status: "PUBLISHED",
        order: 1,
      },
    });
    publishedCourseId = course.id;

    const lesson = await prisma.academyLesson.create({
      data: {
        courseId: course.id,
        slug: "pow-consensus",
        title: "Proof of Work Consensus",
        content: "Understanding Nakamoto consensus and mining puzzles.",
        status: "PUBLISHED",
        order: 1,
      },
    });
    publishedLessonId = lesson.id;

    const quiz = await prisma.academyQuiz.create({
      data: {
        lessonId: lesson.id,
        title: "Proof of Work Mastery",
        description: "Test your understanding of PoW mechanics.",
        passingScore: 80,
        status: "PUBLISHED",
        order: 1,
      },
    });
    publishedQuizId = quiz.id;

    // Create 2 questions with 2 options each in a transaction to satisfy single-choice DB trigger
    const seeded = await prisma.$transaction(async (tx) => {
      const q1 = await tx.academyQuizQuestion.create({
        data: {
          quizId: quiz.id,
          prompt: "What is hashing in Proof of Work?",
          type: "SINGLE_CHOICE",
          order: 1,
        },
      });
      const opt1A = await tx.academyQuizOption.create({
        data: {
          questionId: q1.id,
          text: "One-way cryptographic function",
          isCorrect: true,
          order: 1,
        },
      });
      const opt1B = await tx.academyQuizOption.create({
        data: {
          questionId: q1.id,
          text: "Two-way reversible encryption",
          isCorrect: false,
          order: 2,
        },
      });

      const q2 = await tx.academyQuizQuestion.create({
        data: {
          quizId: quiz.id,
          prompt: "What determines block creation difficulty?",
          type: "SINGLE_CHOICE",
          order: 2,
        },
      });
      const opt2A = await tx.academyQuizOption.create({
        data: {
          questionId: q2.id,
          text: "Network hash rate adjustment",
          isCorrect: true,
          order: 1,
        },
      });
      const opt2B = await tx.academyQuizOption.create({
        data: {
          questionId: q2.id,
          text: "Static predefined algorithm",
          isCorrect: false,
          order: 2,
        },
      });

      return { q1, opt1A, opt1B, q2, opt2A, opt2B };
    });

    question1Id = seeded.q1.id;
    option1AId = seeded.opt1A.id;
    option1BId = seeded.opt1B.id;
    question2Id = seeded.q2.id;
    option2AId = seeded.opt2A.id;
    _option2BId = seeded.opt2B.id;
  });


  // ==========================================================================
  // Section 37: Direct DB Invariant Test (AC-007)
  // ==========================================================================
  describe("Direct DB Invariant Test (Partial Unique Index Authority)", () => {
    it("physically rejects a second simultaneous IN_PROGRESS attempt for the same user and quiz", async () => {
      // Direct raw SQL insert 1
      await prisma.$executeRaw`
        INSERT INTO "academy_quiz_attempts" (
          "id", "user_id", "quiz_id", "attempt_number", "status", "quiz_title_snapshot", "started_at", "created_at", "updated_at"
        ) VALUES (
          gen_random_uuid(), ${learnerAId}, ${publishedQuizId}, 1, 'IN_PROGRESS', 'PoW Quiz', NOW(), NOW(), NOW()
        );
      `;

      // Direct raw SQL insert 2 (same user, same quiz, same IN_PROGRESS status)
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" (
            "id", "user_id", "quiz_id", "attempt_number", "status", "quiz_title_snapshot", "started_at", "created_at", "updated_at"
          ) VALUES (
            gen_random_uuid(), ${learnerAId}, ${publishedQuizId}, 2, 'IN_PROGRESS', 'PoW Quiz', NOW(), NOW(), NOW()
          );
        `,
      ).rejects.toThrow();

      // Confirms exactly ONE IN_PROGRESS row exists in the database
      const count = await prisma.academyQuizAttempt.count({
        where: { userId: learnerAId, quizId: publishedQuizId, status: "IN_PROGRESS" },
      });
      expect(count).toBe(1);
    });

    it("permits multiple historical GRADED or SUBMITTED attempts for same user and quiz", async () => {
      await prisma.$executeRaw`
        INSERT INTO "academy_quiz_attempts" (
          "id", "user_id", "quiz_id", "attempt_number", "status", "quiz_title_snapshot", "started_at", "created_at", "updated_at"
        ) VALUES (
          gen_random_uuid(), ${learnerAId}, ${publishedQuizId}, 1, 'GRADED', 'PoW Quiz', NOW(), NOW(), NOW()
        );
      `;

      await prisma.$executeRaw`
        INSERT INTO "academy_quiz_attempts" (
          "id", "user_id", "quiz_id", "attempt_number", "status", "quiz_title_snapshot", "started_at", "created_at", "updated_at"
        ) VALUES (
          gen_random_uuid(), ${learnerAId}, ${publishedQuizId}, 2, 'GRADED', 'PoW Quiz', NOW(), NOW(), NOW()
        );
      `;

      // And allows exactly one IN_PROGRESS attempt alongside completed attempts
      await prisma.$executeRaw`
        INSERT INTO "academy_quiz_attempts" (
          "id", "user_id", "quiz_id", "attempt_number", "status", "quiz_title_snapshot", "started_at", "created_at", "updated_at"
        ) VALUES (
          gen_random_uuid(), ${learnerAId}, ${publishedQuizId}, 3, 'IN_PROGRESS', 'PoW Quiz', NOW(), NOW(), NOW()
        );
      `;

      const totalCount = await prisma.academyQuizAttempt.count({
        where: { userId: learnerAId, quizId: publishedQuizId },
      });
      expect(totalCount).toBe(3);
    });
  });

  // ==========================================================================
  // Section 38: Concurrent Start Test (AC-007)
  // ==========================================================================
  describe("Concurrent Attempt Start (5 simultaneous requests)", () => {
    it("serializes concurrent starts: exactly one IN_PROGRESS row, 1x 201 Created, 4x 200 OK, same attempt ID", async () => {
      const requests = Array.from({ length: 5 }, () =>
        request(app)
          .post("/api/academy/courses/crypto-101/lessons/pow-consensus/quiz/attempts")
          .set("Authorization", `Bearer ${learnerAToken}`)
          .send({}),
      );

      const responses = await Promise.all(requests);

      // Verify all responses succeeded
      for (const res of responses) {
        expect([HTTP_STATUS.OK, HTTP_STATUS.CREATED]).toContain(res.status);
      }

      // Exactly one response should be 201 Created (the one that inserted)
      const createdResponses = responses.filter((r) => r.status === HTTP_STATUS.CREATED);
      const okResponses = responses.filter((r) => r.status === HTTP_STATUS.OK);

      expect(createdResponses.length).toBe(1);
      expect(okResponses.length).toBe(4);

      // All responses reference the exact same attempt ID
      const canonicalAttemptId = createdResponses[0].body.data.id;
      for (const res of responses) {
        expect(res.body.data.id).toBe(canonicalAttemptId);
        expect(res.body.data.status).toBe("IN_PROGRESS");
        expect(res.body.data.attemptNumber).toBe(1);
        assertZeroCorrectnessLeakage(res.body);
      }

      // DB authority check: exactly one row in PostgreSQL
      const dbAttempts = await prisma.academyQuizAttempt.findMany({
        where: { userId: learnerAId, quizId: publishedQuizId, status: "IN_PROGRESS" },
      });
      expect(dbAttempts.length).toBe(1);
      expect(dbAttempts[0].id).toBe(canonicalAttemptId);
    });
  });

  // ==========================================================================
  // Section 43: Strict Body Security Tests (AC-008)
  // ==========================================================================
  describe("Strict Start Body Validation (AC-008)", () => {
    it("rejects client-supplied forged fields with 400 VALIDATION_ERROR", async () => {
      const forgedPayloads = [
        { userId: "attacker-user-id" },
        { quizId: "00000000-0000-0000-0000-000000000000" },
        { attemptNumber: 50 },
        { status: "GRADED" },
        { score: 100 },
        { passed: true },
        { startedAt: "2020-01-01T00:00:00.000Z" },
        { gradedAt: "2020-01-01T00:00:00.000Z" },
        { xp: 999 },
      ];

      for (const payload of forgedPayloads) {
        const res = await request(app)
          .post("/api/academy/courses/crypto-101/lessons/pow-consensus/quiz/attempts")
          .set("Authorization", `Bearer ${learnerAToken}`)
          .send(payload);

        expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
        expect(res.body.error.message).toBe("Validation failed");
      }
    });

    it("requires authentication for start attempt (401 UNAUTHENTICATED)", async () => {
      const res = await request(app)
        .post("/api/academy/courses/crypto-101/lessons/pow-consensus/quiz/attempts")
        .send({});

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });
  });

  // ==========================================================================
  // Section 16 & 17: Current Attempt Endpoint (AC-004, AC-013)
  // ==========================================================================
  describe("Current Active Attempt Endpoint (GET .../quiz/attempts/current)", () => {
    it("returns 404 QUIZ_ATTEMPT_NOT_FOUND when no active attempt exists", async () => {
      const res = await request(app)
        .get("/api/academy/courses/crypto-101/lessons/pow-consensus/quiz/attempts/current")
        .set("Authorization", `Bearer ${learnerAToken}`);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);
      expect(res.body.error.message).toBe("Quiz attempt not found");
    });

    it("returns 200 with safe DTO when active IN_PROGRESS attempt exists", async () => {
      // Start an attempt
      const startRes = await request(app)
        .post("/api/academy/courses/crypto-101/lessons/pow-consensus/quiz/attempts")
        .set("Authorization", `Bearer ${learnerAToken}`)
        .send({});
      expect(startRes.status).toBe(HTTP_STATUS.CREATED);

      const res = await request(app)
        .get("/api/academy/courses/crypto-101/lessons/pow-consensus/quiz/attempts/current")
        .set("Authorization", `Bearer ${learnerAToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.id).toBe(startRes.body.data.id);
      expect(res.body.data.status).toBe("IN_PROGRESS");
      expect(res.body.data.attemptNumber).toBe(1);
      expect(res.body.data.answers).toEqual([]);
      assertZeroCorrectnessLeakage(res.body);
    });

    it("returns 404 NOT_FOUND when content hierarchy becomes unpublished", async () => {
      // Start attempt
      await request(app)
        .post("/api/academy/courses/crypto-101/lessons/pow-consensus/quiz/attempts")
        .set("Authorization", `Bearer ${learnerAToken}`)
        .send({});

      // Make course DRAFT
      await prisma.academyCourse.update({
        where: { id: publishedCourseId },
        data: { status: "DRAFT" },
      });

      const res = await request(app)
        .get("/api/academy/courses/crypto-101/lessons/pow-consensus/quiz/attempts/current")
        .set("Authorization", `Bearer ${learnerAToken}`);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(res.body.error.message).toBe("Resource not found");
    });
  });

  // ==========================================================================
  // Section 39: Cross-User IDOR & Ownership Isolation Tests (AC-009)
  // ==========================================================================
  describe("Cross-User Isolation & Ownership Enforcement (AC-009)", () => {
    it("returns identical 404 QUIZ_ATTEMPT_NOT_FOUND for foreign-user attempt and nonexistent attempt (zero 403 oracle)", async () => {
      // User A creates attempt
      const startRes = await request(app)
        .post("/api/academy/courses/crypto-101/lessons/pow-consensus/quiz/attempts")
        .set("Authorization", `Bearer ${learnerAToken}`)
        .send({});
      const attemptId = startRes.body.data.id;
      const randomNonexistentId = "e9999999-9999-4999-8999-999999999999";

      // 1. GET foreign attempt vs nonexistent attempt
      const userBGetRes = await request(app)
        .get(`/api/academy/quiz-attempts/${attemptId}`)
        .set("Authorization", `Bearer ${learnerBToken}`)
        .set("X-Request-ID", "idor-probe-fixed-req-id-get");

      const nonExistentGetRes = await request(app)
        .get(`/api/academy/quiz-attempts/${randomNonexistentId}`)
        .set("Authorization", `Bearer ${learnerBToken}`)
        .set("X-Request-ID", "idor-probe-fixed-req-id-get");

      // Must NOT return 403 Forbidden
      expect(userBGetRes.status).not.toBe(HTTP_STATUS.FORBIDDEN);
      expect(userBGetRes.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(userBGetRes.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);
      expect(userBGetRes.body.error.message).toBe("Quiz attempt not found");

      // Exact full learner-facing response body equality
      expect(userBGetRes.body).toEqual(nonExistentGetRes.body);

      // 2. PUT draft answer on foreign attempt vs nonexistent attempt
      const userBPutRes = await request(app)
        .put(`/api/academy/quiz-attempts/${attemptId}/answers/${question1Id}`)
        .set("Authorization", `Bearer ${learnerBToken}`)
        .set("X-Request-ID", "idor-probe-fixed-req-id-put")
        .send({ optionId: option1AId });

      const nonExistentPutRes = await request(app)
        .put(`/api/academy/quiz-attempts/${randomNonexistentId}/answers/${question1Id}`)
        .set("Authorization", `Bearer ${learnerBToken}`)
        .set("X-Request-ID", "idor-probe-fixed-req-id-put")
        .send({ optionId: option1AId });

      // Must NOT return 403 Forbidden
      expect(userBPutRes.status).not.toBe(HTTP_STATUS.FORBIDDEN);
      expect(userBPutRes.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(userBPutRes.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);
      expect(userBPutRes.body.error.message).toBe("Quiz attempt not found");

      // Exact full learner-facing response body equality
      expect(userBPutRes.body).toEqual(nonExistentPutRes.body);

      // Verify zero rows written in database
      const answers = await prisma.academyQuizAnswer.findMany({ where: { attemptId } });
      expect(answers.length).toBe(0);
    });
  });

  // ==========================================================================
  // Section 41: Historical Finalized Read Tests (AC-014)
  // ==========================================================================
  describe("Historical Finalized Read Policy (AC-014)", () => {
    it("allows owner to read historical SUBMITTED/GRADED attempt even after source content is unpublished", async () => {
      // Seed a historical GRADED attempt directly in the DB
      const gradedAttempt = await prisma.academyQuizAttempt.create({
        data: {
          userId: learnerAId,
          quizId: publishedQuizId,
          attemptNumber: 1,
          status: "GRADED",
          quizTitleSnapshot: "Historical PoW Quiz",
          startedAt: new Date("2026-08-01T00:00:00.000Z"),
          score: 100,
          passed: true,
        },
      });

      // Unpublish course
      await prisma.academyCourse.update({
        where: { id: publishedCourseId },
        data: { status: "ARCHIVED" },
      });

      // Owner reads attempt by ID
      const res = await request(app)
        .get(`/api/academy/quiz-attempts/${gradedAttempt.id}`)
        .set("Authorization", `Bearer ${learnerAToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.id).toBe(gradedAttempt.id);
      expect(res.body.data.status).toBe("GRADED");
      assertZeroCorrectnessLeakage(res.body);
    });

    it("rejects draft answer mutation on finalized attempt with 409 ATTEMPT_ALREADY_FINALIZED even if unpublished", async () => {
      // Seed a historical SUBMITTED attempt
      const submittedAttempt = await prisma.academyQuizAttempt.create({
        data: {
          userId: learnerAId,
          quizId: publishedQuizId,
          attemptNumber: 1,
          status: "SUBMITTED",
          quizTitleSnapshot: "Historical PoW Quiz",
          startedAt: new Date("2026-08-01T00:00:00.000Z"),
        },
      });

      // Unpublish quiz
      await prisma.academyQuiz.update({
        where: { id: publishedQuizId },
        data: { status: "ARCHIVED" },
      });

      // Attempt to save draft answer
      const res = await request(app)
        .put(`/api/academy/quiz-attempts/${submittedAttempt.id}/answers/${question1Id}`)
        .set("Authorization", `Bearer ${learnerAToken}`)
        .send({ optionId: option1AId });

      expect(res.status).toBe(HTTP_STATUS.CONFLICT);
      expect(res.body.error.code).toBe(ERROR_CODES.ATTEMPT_ALREADY_FINALIZED);
      expect(res.body.error.message).toBe("Attempt is already finalized");
    });
  });

  // ==========================================================================
  // Section 42: Legacy CREATED State Tests
  // ==========================================================================
  describe("Legacy CREATED State Handling", () => {
    it("treats CREATED attempt as unavailable (404 QUIZ_ATTEMPT_NOT_FOUND) and does not auto-promote it", async () => {
      const createdAttempt = await prisma.academyQuizAttempt.create({
        data: {
          userId: learnerAId,
          quizId: publishedQuizId,
          attemptNumber: 1,
          status: "CREATED",
          quizTitleSnapshot: "Created Quiz",
        },
      });

      // GET by ID returns 404
      const res = await request(app)
        .get(`/api/academy/quiz-attempts/${createdAttempt.id}`)
        .set("Authorization", `Bearer ${learnerAToken}`);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);

      // GET current returns 404
      const currentRes = await request(app)
        .get("/api/academy/courses/crypto-101/lessons/pow-consensus/quiz/attempts/current")
        .set("Authorization", `Bearer ${learnerAToken}`);

      expect(currentRes.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(currentRes.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);

      // Verify row in DB is still CREATED (not promoted)
      const row = await prisma.academyQuizAttempt.findUnique({ where: { id: createdAttempt.id } });
      expect(row?.status).toBe("CREATED");
    });
  });

  // ==========================================================================
  // Section 45: Draft Answer Persistence Tests (AC-009, AC-010)
  // ==========================================================================
  describe("Draft Answer Persistence & Relational Tree Integrity (AC-009, AC-010)", () => {
    let activeAttemptId: string;

    beforeEach(async () => {
      const startRes = await request(app)
        .post("/api/academy/courses/crypto-101/lessons/pow-consensus/quiz/attempts")
        .set("Authorization", `Bearer ${learnerAToken}`)
        .send({});
      activeAttemptId = startRes.body.data.id;
    });

    it("records first selection, repeats idempotently, and replaces selection cleanly", async () => {
      // 1. First selection: select Option 1A
      const res1 = await request(app)
        .put(`/api/academy/quiz-attempts/${activeAttemptId}/answers/${question1Id}`)
        .set("Authorization", `Bearer ${learnerAToken}`)
        .send({ optionId: option1AId });

      expect(res1.status).toBe(HTTP_STATUS.OK);
      expect(res1.body.data.questionId).toBe(question1Id);
      expect(res1.body.data.selectedOptionId).toBe(option1AId);
      assertZeroCorrectnessLeakage(res1.body);

      // Verify DB row
      let dbAnswer = await prisma.academyQuizAnswer.findUnique({
        where: { attemptId_questionId: { attemptId: activeAttemptId, questionId: question1Id } },
      });
      expect(dbAnswer).not.toBeNull();
      expect(dbAnswer?.selectedOptionId).toBe(option1AId);
      expect(dbAnswer?.isCorrect).toBeNull();
      expect(dbAnswer?.correctOptionIdSnapshot).toBeNull();
      expect(dbAnswer?.correctOptionTextSnapshot).toBeNull();

      // 2. Idempotent repeated selection of Option 1A
      const res2 = await request(app)
        .put(`/api/academy/quiz-attempts/${activeAttemptId}/answers/${question1Id}`)
        .set("Authorization", `Bearer ${learnerAToken}`)
        .send({ optionId: option1AId });

      expect(res2.status).toBe(HTTP_STATUS.OK);
      expect(res2.body.data.selectedOptionId).toBe(option1AId);

      // Exactly 1 answer row exists
      const answerCount = await prisma.academyQuizAnswer.count({ where: { attemptId: activeAttemptId } });
      expect(answerCount).toBe(1);

      // 3. Replace selection: select Option 1B
      const res3 = await request(app)
        .put(`/api/academy/quiz-attempts/${activeAttemptId}/answers/${question1Id}`)
        .set("Authorization", `Bearer ${learnerAToken}`)
        .send({ optionId: option1BId });

      expect(res3.status).toBe(HTTP_STATUS.OK);
      expect(res3.body.data.selectedOptionId).toBe(option1BId);

      dbAnswer = await prisma.academyQuizAnswer.findUnique({
        where: { attemptId_questionId: { attemptId: activeAttemptId, questionId: question1Id } },
      });
      expect(dbAnswer?.selectedOptionId).toBe(option1BId);
      expect(dbAnswer?.isCorrect).toBeNull();

      // 4. Read back current attempt with restored answers
      const currentRes = await request(app)
        .get("/api/academy/courses/crypto-101/lessons/pow-consensus/quiz/attempts/current")
        .set("Authorization", `Bearer ${learnerAToken}`);

      expect(currentRes.status).toBe(HTTP_STATUS.OK);
      expect(currentRes.body.data.answers.length).toBe(1);
      expect(currentRes.body.data.answers[0].questionId).toBe(question1Id);
      expect(currentRes.body.data.answers[0].selectedOptionId).toBe(option1BId);
      assertZeroCorrectnessLeakage(currentRes.body);
    });

    it("rejects option belonging to a different question (400 INVALID_OPTION_FOR_QUESTION)", async () => {
      // Try to submit option2AId for question1Id
      const res = await request(app)
        .put(`/api/academy/quiz-attempts/${activeAttemptId}/answers/${question1Id}`)
        .set("Authorization", `Bearer ${learnerAToken}`)
        .send({ optionId: option2AId });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.error.code).toBe(ERROR_CODES.INVALID_OPTION_FOR_QUESTION);
      expect(res.body.error.message).toBe("Invalid option for question");

      // Verify zero answers written
      const count = await prisma.academyQuizAnswer.count({ where: { attemptId: activeAttemptId } });
      expect(count).toBe(0);
    });

    it("rejects question belonging to a different quiz (400 INVALID_OPTION_FOR_QUESTION)", async () => {
      // Create second quiz with a question
      const quizB = await prisma.academyQuiz.create({
        data: {
          lessonId: publishedLessonId,
          title: "Quiz B",
          status: "PUBLISHED",
          order: 2,
        },
      });
      const { qB, optB } = await prisma.$transaction(async (tx) => {
        const qB = await tx.academyQuizQuestion.create({
          data: {
            quizId: quizB.id,
            prompt: "Question in Quiz B",
            type: "SINGLE_CHOICE",
            order: 1,
          },
        });
        const optB = await tx.academyQuizOption.create({
          data: {
            questionId: qB.id,
            text: "Option B",
            isCorrect: true,
            order: 1,
          },
        });
        return { qB, optB };
      });


      const res = await request(app)
        .put(`/api/academy/quiz-attempts/${activeAttemptId}/answers/${qB.id}`)
        .set("Authorization", `Bearer ${learnerAToken}`)
        .send({ optionId: optB.id });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.error.code).toBe(ERROR_CODES.INVALID_OPTION_FOR_QUESTION);
    });
  });

  // ==========================================================================
  // Section 46: Correctness Leakage Sentinel Test (Negative-Control Sentinel)
  // ==========================================================================
  describe("Pre-Submission Secrecy Sentinel (AC-011)", () => {
    it("sentinel negative control: correctly detects and fails on forbidden keys", () => {
      expect(() => assertZeroCorrectnessLeakage({ isCorrect: true })).toThrow(/Forbidden key "isCorrect"/);
      expect(() => assertZeroCorrectnessLeakage({ correctOptionId: "opt-1" })).toThrow(/Forbidden key "correctOptionId"/);
      expect(() =>
        assertZeroCorrectnessLeakage({ nested: { correctOptionTextSnapshot: "secret" } }),
      ).toThrow(/Forbidden key "correctOptionTextSnapshot"/);
      expect(() => assertZeroCorrectnessLeakage({ score: 100 })).toThrow(/Forbidden key "score"/);
      expect(() => assertZeroCorrectnessLeakage({ passed: true })).toThrow(/Forbidden key "passed"/);
      expect(() => assertZeroCorrectnessLeakage({ answerKey: "A" })).toThrow(/Forbidden key "answerKey"/);
      expect(() => assertZeroCorrectnessLeakage({ explanation: "Because math" })).toThrow(/Forbidden key "explanation"/);
    });

    it("sentinel passes on all real FEAT-024 API responses", async () => {
      // 1. Start attempt response
      const startRes = await request(app)
        .post("/api/academy/courses/crypto-101/lessons/pow-consensus/quiz/attempts")
        .set("Authorization", `Bearer ${learnerAToken}`)
        .send({});
      assertZeroCorrectnessLeakage(startRes.body);

      const attemptId = startRes.body.data.id;

      // 2. Current attempt response
      const currentRes = await request(app)
        .get("/api/academy/courses/crypto-101/lessons/pow-consensus/quiz/attempts/current")
        .set("Authorization", `Bearer ${learnerAToken}`);
      assertZeroCorrectnessLeakage(currentRes.body);

      // 3. Draft answer response
      const answerRes = await request(app)
        .put(`/api/academy/quiz-attempts/${attemptId}/answers/${question1Id}`)
        .set("Authorization", `Bearer ${learnerAToken}`)
        .send({ optionId: option1AId });
      assertZeroCorrectnessLeakage(answerRes.body);

      // 4. Attempt by ID response
      const idRes = await request(app)
        .get(`/api/academy/quiz-attempts/${attemptId}`)
        .set("Authorization", `Bearer ${learnerAToken}`);
      assertZeroCorrectnessLeakage(idRes.body);
    });
  });

  // ==========================================================================
  // Section 47: Zero Mutation Outside Attempt Domain
  // ==========================================================================
  describe("Domain Boundary & Zero Mutation (AC-016)", () => {
    it("confirms ZERO mutations to progress, XP, reward ledger, and product audit tables", async () => {
      // Verify initial zero state
      const initialCourseProg = await prisma.academyUserCourseProgress.count();
      const initialLessonProg = await prisma.academyUserLessonProgress.count();
      const initialXp = await prisma.academyUserXp.count();
      const initialRewards = await prisma.academyRewardLedger.count();
      const initialAudits = await prisma.authSecurityAuditRecord.count();

      // Perform full attempt start and draft answer persistence
      const startRes = await request(app)
        .post("/api/academy/courses/crypto-101/lessons/pow-consensus/quiz/attempts")
        .set("Authorization", `Bearer ${learnerAToken}`)
        .send({});
      expect(startRes.status).toBe(HTTP_STATUS.CREATED);

      const attemptId = startRes.body.data.id;

      await request(app)
        .put(`/api/academy/quiz-attempts/${attemptId}/answers/${question1Id}`)
        .set("Authorization", `Bearer ${learnerAToken}`)
        .send({ optionId: option1AId });

      await request(app)
        .put(`/api/academy/quiz-attempts/${attemptId}/answers/${question2Id}`)
        .set("Authorization", `Bearer ${learnerAToken}`)
        .send({ optionId: option2AId });

      // Verify ZERO mutations to other domain tables
      expect(await prisma.academyUserCourseProgress.count()).toBe(initialCourseProg);
      expect(await prisma.academyUserLessonProgress.count()).toBe(initialLessonProg);
      expect(await prisma.academyUserXp.count()).toBe(initialXp);
      expect(await prisma.academyRewardLedger.count()).toBe(initialRewards);
      expect(await prisma.authSecurityAuditRecord.count()).toBe(initialAudits);
    });
  });

  // ==========================================================================
  // Section 48: Migration Preflight Duplicate Guard (AC-017)
  // ==========================================================================
  describe("Migration Preflight Duplicate Safety Guard (AC-017)", () => {
    it("migration preflight fails safely and aborts when duplicate IN_PROGRESS attempts exist for same (user, quiz)", async () => {
      // Temporarily drop partial unique index to simulate pre-migration database containing duplicates
      await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "academy_quiz_attempts_quiz_id_user_id_active_key";`);

      // Insert two duplicate IN_PROGRESS attempts for the same user and quiz
      await prisma.academyQuizAttempt.create({
        data: {
          userId: learnerAId,
          quizId: publishedQuizId,
          attemptNumber: 101,
          status: "IN_PROGRESS",
          quizTitleSnapshot: "Duplicate Preflight 1",
        },
      });

      await prisma.academyQuizAttempt.create({
        data: {
          userId: learnerAId,
          quizId: publishedQuizId,
          attemptNumber: 102,
          status: "IN_PROGRESS",
          quizTitleSnapshot: "Duplicate Preflight 2",
        },
      });

      // Execute migration preflight DO block
      const preflightSql = `
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM "academy_quiz_attempts"
            WHERE "status" = 'IN_PROGRESS'
            GROUP BY "quiz_id", "user_id"
            HAVING COUNT(*) > 1
          ) THEN
            RAISE EXCEPTION 'Preflight check failed: duplicate IN_PROGRESS attempts found for same quiz_id and user_id';
          END IF;
        END $$;
      `;

      // Must fail safely and raise exception (zero silent repair)
      await expect(prisma.$executeRawUnsafe(preflightSql)).rejects.toThrow(
        /Preflight check failed: duplicate IN_PROGRESS attempts found for same quiz_id and user_id/,
      );

      // Clean up duplicates
      await prisma.academyQuizAttempt.deleteMany({
        where: {
          userId: learnerAId,
          quizId: publishedQuizId,
          attemptNumber: { in: [101, 102] },
        },
      });

      // Now preflight must succeed cleanly
      await expect(prisma.$executeRawUnsafe(preflightSql)).resolves.not.toThrow();

      // Re-create the partial unique index
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "academy_quiz_attempts_quiz_id_user_id_active_key"
        ON "academy_quiz_attempts"("quiz_id", "user_id")
        WHERE "status" = 'IN_PROGRESS';
      `);
    });
  });
});


