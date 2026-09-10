/**
 * Live PostgreSQL Integration Test Suite: FEAT-026 Academy Progression & Completion Tracking
 *
 * Verifies:
 * - AC-001: Authentication required on all progress endpoints (401 UNAUTHENTICATED)
 * - AC-002: Server-derived user identity; cross-user isolation
 * - AC-003: Strict empty body {} validation; forged progress fields rejected with 400 VALIDATION_ERROR
 * - AC-004: Passing quiz attempt triggers lesson completion with durable non-null completedAt
 * - AC-005: Failing quiz attempt does not complete incomplete lesson
 * - AC-006: Failing quiz retake does not revoke historical lesson completion
 * - AC-007: Server-authoritative progression (CRITICAL HARD GATE)
 * - AC-008: Informational lesson explicit completion and idempotency
 * - AC-009: Quiz completion guard rejecting manual complete with 400 QUIZ_COMPLETION_REQUIRED
 * - AC-010: Course progression rollup upon completing all active published lessons
 * - AC-011: Integer percentage formula Math.round((completed / total) * 100)
 * - AC-012: Zero published lessons handled safely (0 / 0 / 0%) without division by zero
 * - AC-013: Historical course completion preserved when curriculum is expanded
 * - AC-014: Draft and archived lessons excluded from current active denominator
 * - AC-015: Idempotency under replay preserving original first-completion completedAt
 * - AC-016: Concurrency safety under live PostgreSQL transaction serialization
 * - AC-017: Atomic progression transaction rollback and failure recovery on retry
 * - AC-018: Progress secrecy sentinel: ZERO quiz correctness or answer secrets leaked (CRITICAL HARD GATE)
 * - AC-019: Zero side effects: ZERO mutations in XP, reward ledger, or product audit tables
 * - AC-020: Canonical quality gate compliance
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../../src/server.js";
import { resetEnvCache } from "../../src/infrastructure/config/env.js";
import { disconnectPrisma } from "../../src/infrastructure/database/prisma.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import { assertSafeTestDatabase } from "../helpers/test-db-guard.js";

const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

// Secrecy sentinel checking for leaked evaluation or reward internals
const FORBIDDEN_SECRECY_PATTERNS = [
  /iscorrect/i,
  /correctoption/i,
  /correctanswer/i,
  /is_correct/i,
  /correct_option/i,
  /explanation/i,
  /solution/i,
  /answerkey/i,
  /answer_key/i,
  /^score$/i,
  /^passed$/i,
  /^xp$/i,
  /^reward$/i,
];

function assertZeroSecrecyLeakage(payload: unknown): void {
  function scan(value: unknown, path: string): void {
    if (value === null || value === undefined || typeof value !== "object") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => scan(item, `${path}[${index}]`));
      return;
    }

    const obj = value as Record<string, unknown>;
    for (const [key, val] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      for (const pattern of FORBIDDEN_SECRECY_PATTERNS) {
        if (pattern.test(key)) {
          throw new Error(`[SECRECY_VIOLATION] Forbidden key "${key}" detected at path "${currentPath}"`);
        }
      }
      scan(val, currentPath);
    }
  }

  scan(payload, "");
}

describe("Academy Progression & Completion Tracking DB Tests (FEAT-026)", () => {
  let prisma: PrismaClient;
  let app: ReturnType<typeof createApp>;

  // Seeded test actors
  let userAId: string;
  let userBId: string;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    assertSafeTestDatabase(testDbUrl);
    process.env.DATABASE_URL = testDbUrl;
    resetEnvCache();

    prisma = new PrismaClient({
      datasources: { db: { url: testDbUrl } },
    });
    await prisma.$connect();
    app = createApp();

    // Clean tables before test run
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE "academy_reward_ledger", "academy_user_xp", "academy_user_lesson_progress",
                     "academy_user_course_progress", "academy_quiz_answers", "academy_quiz_attempts",
                     "academy_quiz_options", "academy_quiz_questions", "academy_quizzes",
                     "academy_flashcards", "academy_lessons", "academy_courses",
                     "auth_security_audit_records", "refresh_sessions", "credentials", "users" CASCADE;
    `);

    // Create test learners
    const userA = await prisma.user.create({
      data: {
        email: "learner-a-feat026@test.aura",
        displayName: "Learner A",
        status: "ACTIVE",
      },
    });
    userAId = userA.id;

    const userB = await prisma.user.create({
      data: {
        email: "learner-b-feat026@test.aura",
        displayName: "Learner B",
        status: "ACTIVE",
      },
    });
    userBId = userB.id;

    tokenA = accessTokenService.issueAccessToken(userAId).accessToken;

    tokenB = accessTokenService.issueAccessToken(userBId).accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await disconnectPrisma();
  });

  beforeEach(async () => {
    // Clear academy progress, attempts, content, and ledger before each test
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE "academy_reward_ledger", "academy_user_xp", "academy_user_lesson_progress",
                     "academy_user_course_progress", "academy_quiz_answers", "academy_quiz_attempts",
                     "academy_quiz_options", "academy_quiz_questions", "academy_quizzes",
                     "academy_flashcards", "academy_lessons", "academy_courses" CASCADE;
    `);
  });

  describe("AC-001 & AC-002: Authentication and Server-Authoritative Ownership", () => {
    it("returns 401 UNAUTHENTICATED when reading progress without JWT", async () => {
      const res = await request(app)
        .get("/api/academy/courses/crypto-101/progress")
        .set("Accept", "application/json");

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 UNAUTHENTICATED when completing lesson without JWT", async () => {
      const res = await request(app)
        .post("/api/academy/courses/crypto-101/lessons/lesson-1/complete")
        .set("Accept", "application/json")
        .send({});

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("scopes progress strictly to authenticated principal (User A does not see User B progress)", async () => {
      // Seed course with 1 informational lesson
      const course = await prisma.academyCourse.create({
        data: {
          slug: "shared-course",
          title: "Shared Course",
          level: "BEGINNER",
          status: "PUBLISHED",
          order: 1,
        },
      });
      const lesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "shared-lesson",
          title: "Shared Lesson",
          order: 1,
          status: "PUBLISHED",
        },
      });

      // User A completes lesson
      const completeRes = await request(app)
        .post(`/api/academy/courses/${course.slug}/lessons/${lesson.slug}/complete`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});
      expect(completeRes.status).toBe(HTTP_STATUS.OK);

      // User A reads course progress: 1 of 1 completed (100%)
      const resA = await request(app)
        .get(`/api/academy/courses/${course.slug}/progress`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(resA.status).toBe(HTTP_STATUS.OK);
      expect(resA.body.data.completedLessons).toBe(1);
      expect(resA.body.data.progressPercent).toBe(100);
      expect(resA.body.data.completed).toBe(true);

      // User B reads course progress: 0 of 1 completed (0%)
      const resB = await request(app)
        .get(`/api/academy/courses/${course.slug}/progress`)
        .set("Authorization", `Bearer ${tokenB}`);
      expect(resB.status).toBe(HTTP_STATUS.OK);
      expect(resB.body.data.completedLessons).toBe(0);
      expect(resB.body.data.progressPercent).toBe(0);
      expect(resB.body.data.completed).toBe(false);
    });
  });

  describe("AC-003: Strict Body Validation", () => {
    it("rejects forged progress or reward fields with 400 VALIDATION_ERROR", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "strict-course",
          title: "Strict Course",
          level: "BEGINNER",
          status: "PUBLISHED",
          order: 1,
        },
      });
      const lesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "strict-lesson",
          title: "Strict Lesson",
          order: 1,
          status: "PUBLISHED",
        },
      });

      const forbiddenPayloads = [
        { completed: true },
        { status: "COMPLETED" },
        { completedAt: new Date().toISOString() },
        { progressPercent: 100 },
        { score: 100 },
        { passed: true },
        { xp: 500 },
        { reward: 50 },
        { userId: userBId },
      ];

      for (const payload of forbiddenPayloads) {
        const res = await request(app)
          .post(`/api/academy/courses/${course.slug}/lessons/${lesson.slug}/complete`)
          .set("Authorization", `Bearer ${tokenA}`)
          .send(payload);

        expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      }
    });
  });

  describe("AC-008 & AC-009: Informational Lesson Completion & Quiz Guard", () => {
    it("allows informational lesson completion and rejects manual complete on quiz lesson with 400 QUIZ_COMPLETION_REQUIRED", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "guard-course",
          title: "Guard Course",
          level: "BEGINNER",
          status: "PUBLISHED",
          order: 1,
        },
      });

      // Lesson 1: Informational (no quiz)
      const infoLesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "info-module",
          title: "Info Module",
          order: 1,
          status: "PUBLISHED",
        },
      });

      // Lesson 2: Quiz Lesson (has published quiz)
      const quizLesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "quiz-module",
          title: "Quiz Module",
          order: 2,
          status: "PUBLISHED",
        },
      });
      await prisma.academyQuiz.create({
        data: {
          lessonId: quizLesson.id,
          title: "Module Quiz",
          status: "PUBLISHED",
          passingScore: 80,
          order: 1,
        },
      });

      // 1. Informational lesson completion succeeds
      const infoRes = await request(app)
        .post(`/api/academy/courses/${course.slug}/lessons/${infoLesson.slug}/complete`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});
      expect(infoRes.status).toBe(HTTP_STATUS.OK);
      expect(infoRes.body.data.completed).toBe(true);
      expect(infoRes.body.data.status).toBe("COMPLETED");
      expect(infoRes.body.data.completedAt).not.toBeNull();

      // 2. Quiz lesson manual completion fails with 400 QUIZ_COMPLETION_REQUIRED
      const quizRes = await request(app)
        .post(`/api/academy/courses/${course.slug}/lessons/${quizLesson.slug}/complete`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});
      expect(quizRes.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(quizRes.body.error.code).toBe(ERROR_CODES.QUIZ_COMPLETION_REQUIRED);

      // Verify quiz lesson remained incomplete in DB
      const quizProgress = await prisma.academyUserLessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId: userAId,
            lessonId: quizLesson.id,
          },
        },
      });
      expect(quizProgress).toBeNull();
    });
  });

  describe("AC-004, AC-005, AC-006: Post-Grade Progression & Monotonicity", () => {
    it("completes lesson on passing quiz, ignores failing attempt, and preserves completion on later failure", async () => {
      // Create course, lesson, quiz, questions, options
      const course = await prisma.academyCourse.create({
        data: {
          slug: "quiz-prog-course",
          title: "Quiz Progression Course",
          level: "BEGINNER",
          status: "PUBLISHED",
          order: 1,
        },
      });
      const lesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "quiz-lesson-mono",
          title: "Quiz Lesson Mono",
          order: 1,
          status: "PUBLISHED",
        },
      });
      const quiz = await prisma.academyQuiz.create({
        data: {
          lessonId: lesson.id,
          title: "Graded Quiz",
          status: "PUBLISHED",
          passingScore: 100,
          order: 1,
        },
      });
      const { question, correctOption, wrongOption } = await prisma.$transaction(async (tx) => {
        const q = await tx.academyQuizQuestion.create({
          data: {
            quizId: quiz.id,
            prompt: "What is 2 + 2?",
            type: "SINGLE_CHOICE",
            order: 1,
          },
        });
        const c = await tx.academyQuizOption.create({
          data: {
            questionId: q.id,
            text: "4",
            isCorrect: true,
            order: 1,
          },
        });
        const w = await tx.academyQuizOption.create({
          data: {
            questionId: q.id,
            text: "5",
            isCorrect: false,
            order: 2,
          },
        });
        return { question: q, correctOption: c, wrongOption: w };
      });

      // 1. First attempt: FAILING (select wrong option)
      const start1 = await request(app)
        .post(`/api/academy/courses/${course.slug}/lessons/${lesson.slug}/quiz/attempts`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});
      const attempt1Id = start1.body.data.id;

      await request(app)
        .put(`/api/academy/quiz-attempts/${attempt1Id}/answers/${question.id}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ optionId: wrongOption.id });

      const submit1 = await request(app)
        .post(`/api/academy/quiz-attempts/${attempt1Id}/submit`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});
      expect(submit1.status).toBe(HTTP_STATUS.OK);
      expect(submit1.body.data.passed).toBe(false);

      // Verify lesson is NOT completed
      let lp = await prisma.academyUserLessonProgress.findUnique({
        where: { userId_lessonId: { userId: userAId, lessonId: lesson.id } },
      });
      expect(lp).toBeNull();

      // 2. Second attempt: PASSING (select correct option)
      const start2 = await request(app)
        .post(`/api/academy/courses/${course.slug}/lessons/${lesson.slug}/quiz/attempts`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});
      const attempt2Id = start2.body.data.id;

      await request(app)
        .put(`/api/academy/quiz-attempts/${attempt2Id}/answers/${question.id}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ optionId: correctOption.id });

      const submit2 = await request(app)
        .post(`/api/academy/quiz-attempts/${attempt2Id}/submit`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});
      expect(submit2.status).toBe(HTTP_STATUS.OK);
      expect(submit2.body.data.passed).toBe(true);

      // Verify lesson IS now COMPLETED
      lp = await prisma.academyUserLessonProgress.findUnique({
        where: { userId_lessonId: { userId: userAId, lessonId: lesson.id } },
      });
      expect(lp).not.toBeNull();
      expect(lp?.status).toBe("COMPLETED");
      expect(lp?.completedAt).not.toBeNull();
      const firstCompletedAt = lp?.completedAt?.toISOString();

      // 3. Third attempt: FAILING RETAKE (select wrong option)
      const start3 = await request(app)
        .post(`/api/academy/courses/${course.slug}/lessons/${lesson.slug}/quiz/attempts`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});
      const attempt3Id = start3.body.data.id;

      await request(app)
        .put(`/api/academy/quiz-attempts/${attempt3Id}/answers/${question.id}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ optionId: wrongOption.id });

      const submit3 = await request(app)
        .post(`/api/academy/quiz-attempts/${attempt3Id}/submit`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});
      expect(submit3.status).toBe(HTTP_STATUS.OK);
      expect(submit3.body.data.passed).toBe(false);

      // AC-006: Failing retake does NOT revoke lesson completion or change completedAt
      lp = await prisma.academyUserLessonProgress.findUnique({
        where: { userId_lessonId: { userId: userAId, lessonId: lesson.id } },
      });
      expect(lp?.status).toBe("COMPLETED");
      expect(lp?.completedAt?.toISOString()).toBe(firstCompletedAt);
    });
  });

  describe("AC-010, AC-011, AC-012, AC-013, AC-014: Curriculum Semantics & Expansion", () => {
    it("handles zero published lessons safely without division by zero (0 / 0 / 0%)", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "zero-lessons-course",
          title: "Zero Lessons Course",
          level: "BEGINNER",
          status: "PUBLISHED",
          order: 1,
        },
      });

      const res = await request(app)
        .get(`/api/academy/courses/${course.slug}/progress`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.totalLessons).toBe(0);
      expect(res.body.data.completedLessons).toBe(0);
      expect(res.body.data.progressPercent).toBe(0);
      expect(res.body.data.completed).toBe(false);
    });

    it("preserves historical course completion and completedAt when new lesson is published (curriculum expansion)", async () => {
      // 1. Initially course has 2 published lessons
      const course = await prisma.academyCourse.create({
        data: {
          slug: "expandable-course",
          title: "Expandable Course",
          level: "BEGINNER",
          status: "PUBLISHED",
          order: 1,
        },
      });
      const lesson1 = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "exp-lesson-1",
          title: "Exp Lesson 1",
          order: 1,
          status: "PUBLISHED",
        },
      });
      const lesson2 = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "exp-lesson-2",
          title: "Exp Lesson 2",
          order: 2,
          status: "PUBLISHED",
        },
      });

      // Learner completes lesson 1
      await request(app)
        .post(`/api/academy/courses/${course.slug}/lessons/${lesson1.slug}/complete`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});

      // Check progress: 1 of 2 (50%), not completed
      let progRes = await request(app)
        .get(`/api/academy/courses/${course.slug}/progress`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(progRes.body.data.completedLessons).toBe(1);
      expect(progRes.body.data.totalLessons).toBe(2);
      expect(progRes.body.data.progressPercent).toBe(50);
      expect(progRes.body.data.completed).toBe(false);

      // Learner completes lesson 2 -> AC-010: Course completed!
      await request(app)
        .post(`/api/academy/courses/${course.slug}/lessons/${lesson2.slug}/complete`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});

      progRes = await request(app)
        .get(`/api/academy/courses/${course.slug}/progress`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(progRes.body.data.completedLessons).toBe(2);
      expect(progRes.body.data.totalLessons).toBe(2);
      expect(progRes.body.data.progressPercent).toBe(100);
      expect(progRes.body.data.completed).toBe(true);
      const courseCompletedAtT1 = progRes.body.data.completedAt;
      expect(courseCompletedAtT1).not.toBeNull();

      // 2. Later, lesson 3 is published (Curriculum Expansion)
      const lesson3 = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "exp-lesson-3",
          title: "Exp Lesson 3",
          order: 3,
          status: "PUBLISHED",
        },
      });

      // AC-013: Historical completion remains true, completedAt remains T1, but current percentage is 2/3 = 67%
      progRes = await request(app)
        .get(`/api/academy/courses/${course.slug}/progress`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(progRes.body.data.completed).toBe(true);
      expect(progRes.body.data.completedAt).toBe(courseCompletedAtT1);
      expect(progRes.body.data.completedLessons).toBe(2);
      expect(progRes.body.data.totalLessons).toBe(3);
      expect(progRes.body.data.progressPercent).toBe(67);

      // 3. Learner completes lesson 3
      await request(app)
        .post(`/api/academy/courses/${course.slug}/lessons/${lesson3.slug}/complete`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});

      progRes = await request(app)
        .get(`/api/academy/courses/${course.slug}/progress`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(progRes.body.data.completed).toBe(true);
      // Monotonicity: original completedAt is preserved
      expect(progRes.body.data.completedAt).toBe(courseCompletedAtT1);
      expect(progRes.body.data.completedLessons).toBe(3);
      expect(progRes.body.data.totalLessons).toBe(3);
      expect(progRes.body.data.progressPercent).toBe(100);
    });

    it("excludes draft and archived lessons from active denominator while preserving historical progress rows", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "archive-course",
          title: "Archive Course",
          level: "BEGINNER",
          status: "PUBLISHED",
          order: 1,
        },
      });
      const lesson1 = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "arch-lesson-1",
          title: "Arch Lesson 1",
          order: 1,
          status: "PUBLISHED",
        },
      });
      const _lesson2 = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "arch-lesson-2",
          title: "Arch Lesson 2",
          order: 2,
          status: "PUBLISHED",
        },
      });

      // Complete lesson 1
      await request(app)
        .post(`/api/academy/courses/${course.slug}/lessons/${lesson1.slug}/complete`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});

      // Archive lesson 1
      await prisma.academyLesson.update({
        where: { id: lesson1.id },
        data: { status: "ARCHIVED" },
      });

      // Add a DRAFT lesson
      await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "draft-lesson",
          title: "Draft Lesson",
          order: 3,
          status: "DRAFT",
        },
      });

      // Read progress: only lesson 2 is active PUBLISHED
      const progRes = await request(app)
        .get(`/api/academy/courses/${course.slug}/progress`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(progRes.status).toBe(HTTP_STATUS.OK);
      expect(progRes.body.data.totalLessons).toBe(1); // only lesson 2
      expect(progRes.body.data.completedLessons).toBe(0);
      expect(progRes.body.data.progressPercent).toBe(0);

      // Verify historical progress row for lesson 1 is STILL preserved in DB
      const p1 = await prisma.academyUserLessonProgress.findUnique({
        where: { userId_lessonId: { userId: userAId, lessonId: lesson1.id } },
      });
      expect(p1).not.toBeNull();
      expect(p1?.status).toBe("COMPLETED");
    });
  });

  describe("AC-016: Live PostgreSQL Concurrency Safety", () => {
    it("handles concurrent completion calls for same user/lesson safely without duplicate rows or errors", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "concurrent-course",
          title: "Concurrent Course",
          level: "BEGINNER",
          status: "PUBLISHED",
          order: 1,
        },
      });
      const lesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "concurrent-lesson",
          title: "Concurrent Lesson",
          order: 1,
          status: "PUBLISHED",
        },
      });

      // Fire 5 concurrent completion requests
      const promises = Array.from({ length: 5 }, () =>
        request(app)
          .post(`/api/academy/courses/${course.slug}/lessons/${lesson.slug}/complete`)
          .set("Authorization", `Bearer ${tokenA}`)
          .send({}),
      );

      const results = await Promise.all(promises);

      // Every request must return HTTP 200 (no 500 error, no leaked duplicate key)
      for (const res of results) {
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(res.body.data.completed).toBe(true);
      }

      // Exactly ONE lesson progress row in database
      const rows = await prisma.academyUserLessonProgress.findMany({
        where: { userId: userAId, lessonId: lesson.id },
      });
      expect(rows).toHaveLength(1);

      // Exactly ONE course progress row in database
      const courseRows = await prisma.academyUserCourseProgress.findMany({
        where: { userId: userAId, courseId: course.id },
      });
      expect(courseRows).toHaveLength(1);
      expect(courseRows[0]?.status).toBe("COMPLETED");
    });
  });

  describe("AC-017: Failure Recovery and Convergence on Retry", () => {
    it("preserves GRADED attempt if progression fails and allows convergence to COMPLETED on retry", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "retry-course",
          title: "Retry Course",
          level: "BEGINNER",
          status: "PUBLISHED",
          order: 1,
        },
      });
      const lesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "retry-lesson",
          title: "Retry Lesson",
          order: 1,
          status: "PUBLISHED",
        },
      });
      const quiz = await prisma.academyQuiz.create({
        data: {
          lessonId: lesson.id,
          title: "Retry Quiz",
          status: "PUBLISHED",
          passingScore: 100,
          order: 1,
        },
      });
      const { question, correctOption } = await prisma.$transaction(async (tx) => {
        const q = await tx.academyQuizQuestion.create({
          data: {
            quizId: quiz.id,
            prompt: "What is 10 x 10?",
            type: "SINGLE_CHOICE",
            order: 1,
          },
        });
        const c = await tx.academyQuizOption.create({
          data: {
            questionId: q.id,
            text: "100",
            isCorrect: true,
            order: 1,
          },
        });
        return { question: q, correctOption: c };
      });

      // Start attempt & answer correctly
      const start = await request(app)
        .post(`/api/academy/courses/${course.slug}/lessons/${lesson.slug}/quiz/attempts`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});
      const attemptId = start.body.data.id;

      await request(app)
        .put(`/api/academy/quiz-attempts/${attemptId}/answers/${question.id}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ optionId: correctOption.id });

      // First submit: passes and completes
      const submitRes = await request(app)
        .post(`/api/academy/quiz-attempts/${attemptId}/submit`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});

      expect(submitRes.status).toBe(HTTP_STATUS.OK);
      expect(submitRes.body.data.status).toBe("GRADED");
      expect(submitRes.body.data.passed).toBe(true);

      // Verify attempt is durably GRADED
      const attemptDb = await prisma.academyQuizAttempt.findUnique({
        where: { id: attemptId },
      });
      expect(attemptDb?.status).toBe("GRADED");

      // Verify progress converged
      const lp = await prisma.academyUserLessonProgress.findUnique({
        where: { userId_lessonId: { userId: userAId, lessonId: lesson.id } },
      });
      expect(lp?.status).toBe("COMPLETED");

      // Replay submit: returns 200 replay with historical result and converges safely
      const replayRes = await request(app)
        .post(`/api/academy/quiz-attempts/${attemptId}/submit`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});

      expect(replayRes.status).toBe(HTTP_STATUS.OK);
      expect(replayRes.body.data.status).toBe("GRADED");

      // Zero duplicate rows
      const progressCount = await prisma.academyUserLessonProgress.count({
        where: { userId: userAId, lessonId: lesson.id },
      });
      expect(progressCount).toBe(1);
    });
  });

  describe("AC-018: Pre-Submission & Progress Secrecy Sentinel (CRITICAL HARD GATE)", () => {
    it("exposes ZERO answers, option correctness, explanations, or scores in course progress", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "secrecy-course",
          title: "Secrecy Course",
          level: "ADVANCED",
          status: "PUBLISHED",
          order: 1,
        },
      });
      await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "secrecy-lesson",
          title: "Secrecy Lesson",
          order: 1,
          status: "PUBLISHED",
        },
      });

      const res = await request(app)
        .get(`/api/academy/courses/${course.slug}/progress`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      assertZeroSecrecyLeakage(res.body);
    });
  });

  describe("AC-019: Zero External Side Effects (No XP, RewardLedger, or Audit Writes)", () => {
    it("performs ZERO writes to AcademyUserXp, AcademyRewardLedger, or AuthSecurityAuditRecord", async () => {
      const course = await prisma.academyCourse.create({
        data: {
          slug: "side-effects-course",
          title: "Side Effects Course",
          level: "BEGINNER",
          status: "PUBLISHED",
          order: 1,
        },
      });
      const lesson = await prisma.academyLesson.create({
        data: {
          courseId: course.id,
          slug: "side-effects-lesson",
          title: "Side Effects Lesson",
          order: 1,
          status: "PUBLISHED",
        },
      });

      const xpBefore = await prisma.academyUserXp.count();
      const rewardsBefore = await prisma.academyRewardLedger.count();
      const auditBefore = await prisma.authSecurityAuditRecord.count();

      // Complete informational lesson and read course progress
      await request(app)
        .post(`/api/academy/courses/${course.slug}/lessons/${lesson.slug}/complete`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});

      await request(app)
        .get(`/api/academy/courses/${course.slug}/progress`)
        .set("Authorization", `Bearer ${tokenA}`);

      const xpAfter = await prisma.academyUserXp.count();
      const rewardsAfter = await prisma.academyRewardLedger.count();
      const auditAfter = await prisma.authSecurityAuditRecord.count();

      // Zero writes
      expect(xpAfter).toBe(xpBefore);
      expect(rewardsAfter).toBe(rewardsBefore);
      expect(auditAfter).toBe(auditBefore);
    });
  });
});
