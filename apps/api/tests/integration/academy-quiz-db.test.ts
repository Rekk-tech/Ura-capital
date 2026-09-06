import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import {
  assertSafeTestDatabase,
  sanitizeDiagnosticMessage,
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
// FEAT-023 Leakage Sentinel Scanner (AC-007)
// ============================================================================

const FORBIDDEN_PROPERTY_PATTERNS = [
  /^is_?correct$/i,
  /^correct$/i,
  /^correct_?option/i,
  /^correct_?answer/i,
  /^answer_?key$/i,
  /^solution/i,
  /^explanation$/i,
  /^score$/i,
  /^learner_?score$/i,
  /^points/i,
  /^grading/i,
  /^pass_?fail$/i,
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
            `SECURITY DEFECT: Forbidden correctness key "${key}" detected at path "${currentPath}" in quiz definition payload.`,
          );
        }
      }
      scan(propValue, currentPath);
    }
  }

  scan(payload, "");
}

describe("FEAT-023 Quiz Definition & Safe Projection (Live PostgreSQL Integration)", () => {
  let prisma: PrismaClient;
  let app: ReturnType<typeof createApp>;
  let learnerToken: string;

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

    try {
      await prisma.$connect();
      await cleanupTestData(prisma);
      app = createApp();
    } catch (err: unknown) {
      const errorMessage = sanitizeDiagnosticMessage(
        err instanceof Error ? err.message : String(err),
      );
      throw new Error(
        `[DB_CONNECTION_FAILED] Required PostgreSQL test database is unreachable. Error: ${errorMessage}`,
      );
    }
  });

  afterAll(async () => {
    try {
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
      await disconnectPrisma();
    } catch {
      // Safe cleanup teardown
    }
  });

  beforeEach(async () => {
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

    // Create active learner test user
    const user = await prisma.user.create({
      data: {
        email: "quiz-learner@auracapital.io",
        displayName: "Quiz Learner",
        status: "ACTIVE",
      },
    });

    learnerToken = accessTokenService.issueAccessToken(user.id).accessToken;
  });

  // --------------------------------------------------------------------------
  // AC-002: Authenticated Access Boundary
  // --------------------------------------------------------------------------
  describe("AC-002: Authenticated Access Boundary", () => {
    it("enforces 401 UNAUTHENTICATED on missing Authorization header", async () => {
      const res = await request(app)
        .get("/api/academy/courses/crypto-basics/lessons/intro/quiz")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("enforces 401 UNAUTHENTICATED on invalid/malformed Bearer token", async () => {
      const res = await request(app)
        .get("/api/academy/courses/crypto-basics/lessons/intro/quiz")
        .set("Authorization", "Bearer invalid-tampered-token")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });
  });

  // --------------------------------------------------------------------------
  // AC-003 & AC-011: Publication Enforcement & Uniform 404 Indistinguishability
  // --------------------------------------------------------------------------
  describe("AC-003 & AC-011: Publication Enforcement & Uniform 404 Indistinguishability", () => {
    const EXPECTED_NOT_FOUND = {
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: "Resource not found",
      },
    };

    it("returns uniform 404 when course does not exist", async () => {
      const res = await request(app)
        .get("/api/academy/courses/nonexistent-course/lessons/some-lesson/quiz")
        .set("Authorization", `Bearer ${learnerToken}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body).toMatchObject(EXPECTED_NOT_FOUND);
    });

    it("returns uniform 404 when course is DRAFT", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "draft-course",
          title: "Draft Course",
          status: "DRAFT",
          order: 1,
        },
      });
      const lesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "pub-lesson",
          title: "Pub Lesson",
          status: "PUBLISHED",
          order: 1,
        },
      });
      await prisma.academyQuiz.create({
        data: {
          lessonId: lesson.id,
          title: "Pub Quiz",
          status: "PUBLISHED",
          order: 1,
        },
      });

      const res = await request(app)
        .get("/api/academy/courses/draft-course/lessons/pub-lesson/quiz")
        .set("Authorization", `Bearer ${learnerToken}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body).toMatchObject(EXPECTED_NOT_FOUND);
    });

    it("returns uniform 404 when course is ARCHIVED", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "archived-course",
          title: "Archived Course",
          status: "ARCHIVED",
          order: 1,
        },
      });
      const lesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "pub-lesson",
          title: "Pub Lesson",
          status: "PUBLISHED",
          order: 1,
        },
      });
      await prisma.academyQuiz.create({
        data: {
          lessonId: lesson.id,
          title: "Pub Quiz",
          status: "PUBLISHED",
          order: 1,
        },
      });

      const res = await request(app)
        .get("/api/academy/courses/archived-course/lessons/pub-lesson/quiz")
        .set("Authorization", `Bearer ${learnerToken}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body).toMatchObject(EXPECTED_NOT_FOUND);
    });

    it("returns uniform 404 when lesson is DRAFT", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "pub-course-draft-lesson",
          title: "Pub Course Draft Lesson",
          status: "PUBLISHED",
          order: 1,
        },
      });
      const lesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "draft-lesson",
          title: "Draft Lesson",
          status: "DRAFT",
          order: 1,
        },
      });
      await prisma.academyQuiz.create({
        data: {
          lessonId: lesson.id,
          title: "Pub Quiz",
          status: "PUBLISHED",
          order: 1,
        },
      });

      const res = await request(app)
        .get("/api/academy/courses/pub-course-draft-lesson/lessons/draft-lesson/quiz")
        .set("Authorization", `Bearer ${learnerToken}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body).toMatchObject(EXPECTED_NOT_FOUND);
    });

    it("returns uniform 404 when lesson is ARCHIVED", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "pub-course-archived-lesson",
          title: "Pub Course Archived Lesson",
          status: "PUBLISHED",
          order: 1,
        },
      });
      const lesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "archived-lesson",
          title: "Archived Lesson",
          status: "ARCHIVED",
          order: 1,
        },
      });
      await prisma.academyQuiz.create({
        data: {
          lessonId: lesson.id,
          title: "Pub Quiz",
          status: "PUBLISHED",
          order: 1,
        },
      });

      const res = await request(app)
        .get("/api/academy/courses/pub-course-archived-lesson/lessons/archived-lesson/quiz")
        .set("Authorization", `Bearer ${learnerToken}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body).toMatchObject(EXPECTED_NOT_FOUND);
    });

    it("returns uniform 404 when lesson has no quiz attached", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "pub-course-no-quiz",
          title: "Pub Course No Quiz",
          status: "PUBLISHED",
          order: 1,
        },
      });
      await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "no-quiz-lesson",
          title: "Lesson without quiz",
          status: "PUBLISHED",
          order: 1,
        },
      });

      const res = await request(app)
        .get("/api/academy/courses/pub-course-no-quiz/lessons/no-quiz-lesson/quiz")
        .set("Authorization", `Bearer ${learnerToken}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body).toMatchObject(EXPECTED_NOT_FOUND);
    });

    it("returns uniform 404 when quiz is DRAFT", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "pub-course-draft-quiz",
          title: "Pub Course Draft Quiz",
          status: "PUBLISHED",
          order: 1,
        },
      });
      const lesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "has-draft-quiz",
          title: "Lesson with draft quiz",
          status: "PUBLISHED",
          order: 1,
        },
      });
      await prisma.academyQuiz.create({
        data: {
          lessonId: lesson.id,
          title: "Draft Quiz",
          status: "DRAFT",
          order: 1,
        },
      });

      const res = await request(app)
        .get("/api/academy/courses/pub-course-draft-quiz/lessons/has-draft-quiz/quiz")
        .set("Authorization", `Bearer ${learnerToken}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body).toMatchObject(EXPECTED_NOT_FOUND);
    });

    it("returns uniform 404 when quiz is ARCHIVED", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "pub-course-archived-quiz",
          title: "Pub Course Archived Quiz",
          status: "PUBLISHED",
          order: 1,
        },
      });
      const lesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "has-archived-quiz",
          title: "Lesson with archived quiz",
          status: "PUBLISHED",
          order: 1,
        },
      });
      await prisma.academyQuiz.create({
        data: {
          lessonId: lesson.id,
          title: "Archived Quiz",
          status: "ARCHIVED",
          order: 1,
        },
      });

      const res = await request(app)
        .get("/api/academy/courses/pub-course-archived-quiz/lessons/has-archived-quiz/quiz")
        .set("Authorization", `Bearer ${learnerToken}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body).toMatchObject(EXPECTED_NOT_FOUND);
    });
  });

  // --------------------------------------------------------------------------
  // AC-004: Relational Scoping & Cross-Course Isolation
  // --------------------------------------------------------------------------
  describe("AC-004: Relational Scoping & Cross-Course Isolation", () => {
    it("rejects lesson accessed via mismatched course with 404 NOT_FOUND", async () => {
      // Course A
      await prisma.academyCourse.create({
        data: {
          slug: "course-alpha",
          title: "Course Alpha",
          status: "PUBLISHED",
          order: 1,
        },
      });
      // Course B
      const courseB = await prisma.academyCourse.create({
        data: {
          slug: "course-beta",
          title: "Course Beta",
          status: "PUBLISHED",
          order: 2,
        },
      });

      // Lesson belongs to Course B
      const lessonB = await prisma.academyLesson.create({
        data: {
          courseId: courseB.id,
          slug: "lesson-beta-1",
          title: "Lesson Beta 1",
          status: "PUBLISHED",
          order: 1,
        },
      });

      await prisma.academyQuiz.create({
        data: {
          lessonId: lessonB.id,
          title: "Quiz Beta 1",
          status: "PUBLISHED",
          order: 1,
        },
      });

      // Request lessonB under courseA
      const res = await request(app)
        .get("/api/academy/courses/course-alpha/lessons/lesson-beta-1/quiz")
        .set("Authorization", `Bearer ${learnerToken}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });

  // --------------------------------------------------------------------------
  // AC-003 Primary Quiz Read Policy (Lowest-Order Published Quiz)
  // --------------------------------------------------------------------------
  describe("AC-003: Primary Quiz Read Policy", () => {
    it("selects the lowest-order published quiz when multiple quizzes exist for a lesson", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "defi-deepdive",
          title: "DeFi Deep Dive",
          status: "PUBLISHED",
          order: 1,
        },
      });
      const lesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "amm-liquidity",
          title: "AMM Liquidity",
          status: "PUBLISHED",
          order: 1,
        },
      });

      // Quiz 2 (order: 2)
      await prisma.academyQuiz.create({
        data: {
          lessonId: lesson.id,
          title: "Advanced AMM Quiz",
          description: "Quiz with higher order",
          status: "PUBLISHED",
          order: 2,
        },
      });

      // Quiz 1 (order: 1) - lowest order
      const primaryQuiz = await prisma.academyQuiz.create({
        data: {
          lessonId: lesson.id,
          title: "Basics of AMM Quiz",
          description: "Primary quiz to return",
          status: "PUBLISHED",
          order: 1,
        },
      });

      const res = await request(app)
        .get("/api/academy/courses/defi-deepdive/lessons/amm-liquidity/quiz")
        .set("Authorization", `Bearer ${learnerToken}`)
        .expect(HTTP_STATUS.OK);

      expect(res.body.data.id).toBe(primaryQuiz.id);
      expect(res.body.data.title).toBe("Basics of AMM Quiz");
    });
  });

  // --------------------------------------------------------------------------
  // AC-005, AC-006, AC-007, AC-008, AC-009, AC-010: Safe Projection & Security
  // --------------------------------------------------------------------------
  describe("AC-005..AC-010: Safe Projection, Deterministic Order, and Answer Secrecy", () => {
    it("returns safe projection with deterministic order and passes Leakage Sentinel", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "smart-contracts",
          title: "Smart Contracts",
          status: "PUBLISHED",
          order: 1,
        },
      });
      const lesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "solidity-intro",
          title: "Intro to Solidity",
          status: "PUBLISHED",
          order: 1,
        },
      });

      const quiz = await prisma.academyQuiz.create({
        data: {
          lessonId: lesson.id,
          title: "Solidity Basics Quiz",
          description: "Test basic syntax understanding",
          status: "PUBLISHED",
          passingScore: 85,
          order: 1,
        },
      });

      // Seed Questions & Options atomically in a transaction to satisfy PostgreSQL single-choice constraint trigger
      const { q2, q1 } = await prisma.$transaction(async (tx) => {
        // Seed Question 2 first (intentionally reverse order)
        const q2 = await tx.academyQuizQuestion.create({
          data: {
            quizId: quiz.id,
            prompt: "What is an address in Solidity?",
            explanation: "SECRET_EXPLANATION_DO_NOT_LEAK_Q2",
            type: "SINGLE_CHOICE",
            order: 2,
          },
        });
        await tx.academyQuizOption.createMany({
          data: [
            { questionId: q2.id, text: "A 20-byte value representing an account", isCorrect: true, order: 2 },
            { questionId: q2.id, text: "A physical mailing location", isCorrect: false, order: 1 },
          ],
        });

        // Seed Question 1 second
        const q1 = await tx.academyQuizQuestion.create({
          data: {
            quizId: quiz.id,
            prompt: "What keyword defines a contract in Solidity?",
            explanation: "SECRET_EXPLANATION_DO_NOT_LEAK_Q1",
            type: "SINGLE_CHOICE",
            order: 1,
          },
        });
        // Options seeded out of order: order 3, order 1, order 2
        await tx.academyQuizOption.createMany({
          data: [
            { questionId: q1.id, text: "class", isCorrect: false, order: 3 },
            { questionId: q1.id, text: "contract", isCorrect: true, order: 1 },
            { questionId: q1.id, text: "struct", isCorrect: false, order: 2 },
          ],
        });

        return { q2, q1 };
      });


      const res = await request(app)
        .get("/api/academy/courses/smart-contracts/lessons/solidity-intro/quiz")
        .set("Authorization", `Bearer ${learnerToken}`)
        .expect(HTTP_STATUS.OK);

      // 1. AC-007: Run Recursive Property Key Sentinel
      assertZeroCorrectnessLeakage(res.body);

      // 2. AC-006: Assert zero occurrence of forbidden keywords anywhere in raw response
      const rawBody = res.text;
      expect(rawBody).not.toMatch(/isCorrect/i);
      expect(rawBody).not.toMatch(/is_correct/i);
      expect(rawBody).not.toMatch(/correctOption/i);
      expect(rawBody).not.toMatch(/correct_option/i);
      expect(rawBody).not.toMatch(/answerKey/i);
      expect(rawBody).not.toMatch(/answer_key/i);

      // 3. AC-008: Adversarial explanation suppression
      expect(rawBody).not.toContain("SECRET_EXPLANATION_DO_NOT_LEAK_Q1");
      expect(rawBody).not.toContain("SECRET_EXPLANATION_DO_NOT_LEAK_Q2");

      // 4. AC-005: Verify deterministic ordering
      const data = res.body.data;
      expect(data.questions).toHaveLength(2);
      expect(data.questions[0].order).toBe(1);
      expect(data.questions[0].id).toBe(q1.id);
      expect(data.questions[1].order).toBe(2);
      expect(data.questions[1].id).toBe(q2.id);

      // Verify options order within Q1 (contract=1, struct=2, class=3)
      expect(data.questions[0].options).toHaveLength(3);
      expect(data.questions[0].options[0].order).toBe(1);
      expect(data.questions[0].options[0].text).toBe("contract");
      expect(data.questions[0].options[1].order).toBe(2);
      expect(data.questions[0].options[1].text).toBe("struct");
      expect(data.questions[0].options[2].order).toBe(3);
      expect(data.questions[0].options[2].text).toBe("class");

      // 5. AC-009 & AC-010: Whitelist projection structure
      expect(data.id).toBe(quiz.id);
      expect(data.courseSlug).toBe("smart-contracts");
      expect(data.lessonSlug).toBe("solidity-intro");
      expect(data.lessonTitle).toBe("Intro to Solidity");
      expect(data.title).toBe("Solidity Basics Quiz");
      expect(data.description).toBe("Test basic syntax understanding");
      expect(data.passingScore).toBe(85);
      expect(data.totalQuestions).toBe(2);

      // Verify forbidden internal FKs are NOT present
      expect(data).not.toHaveProperty("lessonId");
      expect(data).not.toHaveProperty("courseId");
      expect(data).not.toHaveProperty("status");
      expect(data).not.toHaveProperty("createdAt");
      expect(data).not.toHaveProperty("updatedAt");
      expect(data.questions[0]).not.toHaveProperty("quizId");
      expect(data.questions[0]).not.toHaveProperty("explanation");
      expect(data.questions[0].options[0]).not.toHaveProperty("questionId");
      expect(data.questions[0].options[0]).not.toHaveProperty("isCorrect");
    });
  });

  // --------------------------------------------------------------------------
  // AC-012: Empty Selected Published Quiz Graceful Handling
  // --------------------------------------------------------------------------
  describe("AC-012: Empty Selected Published Quiz Graceful Handling", () => {
    it("returns 200 OK with questions: [] and totalQuestions: 0 when quiz has no questions", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "zero-questions-course",
          title: "Zero Questions Course",
          status: "PUBLISHED",
          order: 1,
        },
      });
      const lesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "zero-questions-lesson",
          title: "Zero Questions Lesson",
          status: "PUBLISHED",
          order: 1,
        },
      });
      const quiz = await prisma.academyQuiz.create({
        data: {
          lessonId: lesson.id,
          title: "Empty Published Quiz",
          status: "PUBLISHED",
          order: 1,
          passingScore: 80,
        },
      });

      const res = await request(app)
        .get("/api/academy/courses/zero-questions-course/lessons/zero-questions-lesson/quiz")
        .set("Authorization", `Bearer ${learnerToken}`)
        .expect(HTTP_STATUS.OK);

      expect(res.body.data).toEqual({
        id: quiz.id,
        courseSlug: "zero-questions-course",
        lessonSlug: "zero-questions-lesson",
        lessonTitle: "Zero Questions Lesson",
        title: "Empty Published Quiz",
        description: null,
        passingScore: 80,
        totalQuestions: 0,
        questions: [],
      });
    });
  });

  // --------------------------------------------------------------------------
  // AC-013 & AC-014: Zero Mutation & Zero Audit/Redis Impact
  // --------------------------------------------------------------------------
  describe("AC-013 & AC-014: Zero Mutation & Zero Audit Impact", () => {
    it("reading quiz definition does not mutate attempts, answers, progress, xp, or rewards", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "mutation-check-course",
          title: "Mutation Check Course",
          status: "PUBLISHED",
          order: 1,
        },
      });
      const lesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "mutation-check-lesson",
          title: "Mutation Check Lesson",
          status: "PUBLISHED",
          order: 1,
        },
      });
      await prisma.academyQuiz.create({
        data: {
          lessonId: lesson.id,
          title: "Mutation Check Quiz",
          status: "PUBLISHED",
          order: 1,
        },
      });

      // Execute GET request
      await request(app)
        .get("/api/academy/courses/mutation-check-course/lessons/mutation-check-lesson/quiz")
        .set("Authorization", `Bearer ${learnerToken}`)
        .expect(HTTP_STATUS.OK);

      // Verify zero attempt / answer / progress / xp / reward records
      const attemptsCount = await prisma.academyQuizAttempt.count();
      const answersCount = await prisma.academyQuizAnswer.count();
      const courseProgressCount = await prisma.academyUserCourseProgress.count();
      const lessonProgressCount = await prisma.academyUserLessonProgress.count();
      const xpCount = await prisma.academyUserXp.count();
      const rewardCount = await prisma.academyRewardLedger.count();
      const auditCount = await prisma.authSecurityAuditRecord.count();

      expect(attemptsCount).toBe(0);
      expect(answersCount).toBe(0);
      expect(courseProgressCount).toBe(0);
      expect(lessonProgressCount).toBe(0);
      expect(xpCount).toBe(0);
      expect(rewardCount).toBe(0);
      expect(auditCount).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // Validation: Path Slugs Validation
  // --------------------------------------------------------------------------
  describe("Path Parameters Validation", () => {
    it("rejects uppercase course slug with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .get("/api/academy/courses/UPPERCASE/lessons/valid-lesson/quiz")
        .set("Authorization", `Bearer ${learnerToken}`)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("rejects traversal course slug with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .get("/api/academy/courses/..%2ftraversal/lessons/valid-lesson/quiz")
        .set("Authorization", `Bearer ${learnerToken}`)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  // --------------------------------------------------------------------------
  // Express Route Alias Verification
  // --------------------------------------------------------------------------
  describe("Route Alias Verification", () => {
    it("supports /academy/courses/:courseSlug/lessons/:lessonSlug/quiz alias identically", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "alias-course",
          title: "Alias Course",
          status: "PUBLISHED",
          order: 1,
        },
      });
      const lesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "alias-lesson",
          title: "Alias Lesson",
          status: "PUBLISHED",
          order: 1,
        },
      });
      await prisma.academyQuiz.create({
        data: {
          lessonId: lesson.id,
          title: "Alias Quiz",
          status: "PUBLISHED",
          order: 1,
        },
      });

      const res = await request(app)
        .get("/academy/courses/alias-course/lessons/alias-lesson/quiz")
        .set("Authorization", `Bearer ${learnerToken}`)
        .expect(HTTP_STATUS.OK);

      expect(res.body.data.title).toBe("Alias Quiz");
    });
  });
});
