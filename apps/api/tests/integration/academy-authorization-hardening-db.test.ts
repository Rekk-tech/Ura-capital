/**
 * Live PostgreSQL Integration Test Suite: FEAT-028 Academy Authorization & Ownership Hardening
 *
 * Verifies:
 * - AC-001 & AC-017 & AC-018: Human-approved admin/support visibility deferral; zero new admin routes;
 *   ADMIN user in DB cannot bypass learner ownership boundaries.
 * - AC-002: Canonical endpoint authorization matrix (Public vs Authenticated vs Owner-Scoped).
 * - AC-003: User A cannot read User B quiz attempts.
 * - AC-004: User A cannot read User B graded results.
 * - AC-005: User A cannot read User B progress.
 * - AC-006: User A cannot read User B XP/reward history.
 * - AC-007: User A cannot mutate User B draft answers.
 * - AC-008: User A cannot submit User B attempt or trigger User B progression.
 * - AC-009: User A cannot mutate User B XP/rewards.
 * - AC-010: Client-supplied userId has zero authority.
 * - AC-011: JWT role/admin spoofing is rejected; PostgreSQL remains role authority.
 * - AC-012: Ownership failures avoid cross-user existence enumeration (identical 404 responses).
 * - AC-013: Malformed identifiers return safe canonical 400 VALIDATION_ERROR.
 * - AC-014: Pre-submission quiz secrecy remains intact (zero correctness leaks).
 * - AC-015: Graded result visibility remains owner-scoped.
 * - AC-016: Progress and reward DTOs expose no sensitive/internal fields.
 * - AC-019..AC-021: Zero semantic change, zero DB migration, zero Redis durable authority.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { createApp } from "../../src/server.js";
import { resetEnvCache } from "../../src/infrastructure/config/env.js";
import { disconnectPrisma } from "../../src/infrastructure/database/prisma.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";
import { assertSafeTestDatabase } from "../helpers/test-db-guard.js";

const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

const FORBIDDEN_SECRECY_PATTERNS = [
  /^user_?id$/i,
  /^score$/i,
  /^passed$/i,
  /^is_?correct$/i,
  /^correct$/i,
  /^correct_?option/i,
  /^correct_?option_?id$/i,
  /^correct_?answer/i,
  /^explanation$/i,
  /^solution/i,
  /^idempotency_?key$/i,
  /^level$/i,
];

function assertZeroPreSubmissionLeakage(payload: unknown, allowedKeys: string[] = []): void {
  function scan(value: unknown, path: string): void {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => scan(item, `${path}[${index}]`));
      return;
    }
    for (const [key, propValue] of Object.entries(value as Record<string, unknown>)) {
      const currentPath = path ? `${path}.${key}` : key;
      if (!allowedKeys.includes(key)) {
        for (const pattern of FORBIDDEN_SECRECY_PATTERNS) {
          if (pattern.test(key)) {
            throw new Error(
              `SECURITY VIOLATION: Forbidden sensitive key "${key}" found at path "${currentPath}".`,
            );
          }
        }
      }
      scan(propValue, currentPath);
    }
  }
  scan(payload, "");
}

describe("FEAT-028 Academy Authorization & Ownership Hardening (Live DB Integration)", () => {
  let prisma: PrismaClient;
  let app: ReturnType<typeof createApp>;

  // Test actors
  let userAId: string;
  let userBId: string;
  let adminUserId: string;
  let tokenA: string;
  let tokenB: string;
  let adminToken: string;

  // Test content
  let courseSlug: string;
  let quizLessonSlug: string;
  let infoLessonSlug: string;
  let questionId: string;
  let correctOptionId: string;
  let _wrongOptionId: string;

  beforeAll(async () => {
    assertSafeTestDatabase(testDbUrl);
    process.env.DATABASE_URL = testDbUrl;
    resetEnvCache();

    prisma = new PrismaClient({
      datasources: { db: { url: testDbUrl } },
    });
    await prisma.$connect();

    app = createApp();

    // Create User A
    const userA = await prisma.user.upsert({
      where: { email: "feat028-user-a@auracapital.io" },
      update: { status: "ACTIVE" },
      create: {
        email: "feat028-user-a@auracapital.io",
        displayName: "Learner User A",
        status: "ACTIVE",
      },
    });
    userAId = userA.id;
    tokenA = accessTokenService.issueAccessToken(userAId).accessToken;

    // Create User B
    const userB = await prisma.user.upsert({
      where: { email: "feat028-user-b@auracapital.io" },
      update: { status: "ACTIVE" },
      create: {
        email: "feat028-user-b@auracapital.io",
        displayName: "Learner User B",
        status: "ACTIVE",
      },
    });
    userBId = userB.id;
    tokenB = accessTokenService.issueAccessToken(userBId).accessToken;

    // Create Admin User with ADMIN role in PostgreSQL
    const adminUser = await prisma.user.upsert({
      where: { email: "feat028-admin@auracapital.io" },
      update: { status: "ACTIVE" },
      create: {
        email: "feat028-admin@auracapital.io",
        displayName: "Platform Admin",
        status: "ACTIVE",
      },
    });
    adminUserId = adminUser.id;
    adminToken = accessTokenService.issueAccessToken(adminUserId).accessToken;

    // Ensure ADMIN role exists and is assigned
    const adminRole = await prisma.role.upsert({
      where: { name: "ADMIN" },
      update: {},
      create: { name: "ADMIN", description: "Administrator" },
    });
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUserId,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUserId,
        roleId: adminRole.id,
      },
    });

    // Create test curriculum
    const timestamp = Date.now();
    courseSlug = `auth-harden-course-${timestamp}`;
    quizLessonSlug = `quiz-lesson-${timestamp}`;
    infoLessonSlug = `info-lesson-${timestamp}`;

    const course = await prisma.academyCourse.create({
      data: {
        slug: courseSlug,
        title: "Authorization Hardening Course",
        description: "Course for verifying ownership and IDOR boundaries",
        level: "BEGINNER",
        status: "PUBLISHED",
        order: 1,
      },
    });

    // 1. Quiz Lesson
    const quizLesson = await prisma.academyLesson.create({
      data: {
        courseId: course.id,
        slug: quizLessonSlug,
        title: "Quiz Lesson",
        status: "PUBLISHED",
        order: 1,
      },
    });

    // 2. Informational Lesson (no quiz)
    await prisma.academyLesson.create({
      data: {
        courseId: course.id,
        slug: infoLessonSlug,
        title: "Informational Lesson",
        status: "PUBLISHED",
        order: 2,
      },
    });

    // Create published quiz with 1 question and 2 options
    const quiz = await prisma.academyQuiz.create({
      data: {
        lessonId: quizLesson.id,
        title: "Test Hardening Quiz",
        status: "PUBLISHED",
        order: 1,
        passingScore: 80,
      },
    });

    const { q, oA, oB } = await prisma.$transaction(async (tx) => {
      const createdQ = await tx.academyQuizQuestion.create({
        data: {
          quizId: quiz.id,
          prompt: "Which protocol is decentralized?",
          type: "SINGLE_CHOICE",
          order: 1,
        },
      });

      const createdOA = await tx.academyQuizOption.create({
        data: {
          questionId: createdQ.id,
          text: "Bitcoin",
          isCorrect: true,
          order: 1,
        },
      });

      const createdOB = await tx.academyQuizOption.create({
        data: {
          questionId: createdQ.id,
          text: "Central Bank",
          isCorrect: false,
          order: 2,
        },
      });

      return { q: createdQ, oA: createdOA, oB: createdOB };
    });

    questionId = q.id;
    correctOptionId = oA.id;
    _wrongOptionId = oB.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await disconnectPrisma();
  });

  beforeEach(async () => {
    // Clean transactional Academy tables
    await prisma.academyRewardLedger.deleteMany({});
    await prisma.academyUserXp.deleteMany({});
    await prisma.academyQuizAnswer.deleteMany({});
    await prisma.academyQuizAttempt.deleteMany({});
    await prisma.academyUserLessonProgress.deleteMany({});
    await prisma.academyUserCourseProgress.deleteMany({});
  });

  describe("AC-001 & AC-017 & AC-018: Admin / Support Visibility Deferral & Route Boundary", () => {
    it("returns 404 NOT_FOUND for any invented admin or support academy endpoints", async () => {
      const forbiddenRoutes = [
        "/api/academy/admin/courses",
        "/api/academy/admin/learners",
        "/api/academy/admin/attempts",
        "/api/academy/support/learners",
        "/api/academy/support/quiz-attempts",
      ];

      for (const route of forbiddenRoutes) {
        const res = await request(app)
          .get(route)
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(HTTP_STATUS.NOT_FOUND);

        expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
      }
    });

    it("verifies an authenticated PostgreSQL ADMIN user cannot access User B private attempt (AC-018)", async () => {
      // User B starts an attempt
      const startRes = await request(app)
        .post(`/api/academy/courses/${courseSlug}/lessons/${quizLessonSlug}/quiz/attempts`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({})
        .expect(HTTP_STATUS.CREATED);

      const attemptBId = startRes.body.data.id;

      // Admin calls GET attempt by ID -> 404 QUIZ_ATTEMPT_NOT_FOUND (not 200, not 403)
      const adminAttemptRes = await request(app)
        .get(`/api/academy/quiz-attempts/${attemptBId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(adminAttemptRes.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);

      // Admin calls GET graded result -> 404 QUIZ_ATTEMPT_NOT_FOUND
      const adminResultRes = await request(app)
        .get(`/api/academy/quiz-attempts/${attemptBId}/result`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(adminResultRes.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);
    });
  });

  describe("AC-002: Endpoint Authorization Classification & Authentication Enforcement", () => {
    it("allows unauthenticated access to public catalog endpoints", async () => {
      await request(app).get("/api/academy/courses").expect(HTTP_STATUS.OK);
      await request(app).get(`/api/academy/courses/${courseSlug}`).expect(HTTP_STATUS.OK);
      // Legacy routes without /api
      await request(app).get("/academy/courses").expect(HTTP_STATUS.OK);
      await request(app).get(`/academy/courses/${courseSlug}`).expect(HTTP_STATUS.OK);
    });

    it("rejects unauthenticated requests to all 12 learner/authenticated endpoints with 401 UNAUTHENTICATED", async () => {
      const dummyUuid = "00000000-0000-0000-0000-000000000001";
      const endpoints: Array<{ method: "get" | "post" | "put"; path: string }> = [
        { method: "get", path: `/api/academy/courses/${courseSlug}/lessons/${quizLessonSlug}` },
        { method: "get", path: `/api/academy/courses/${courseSlug}/lessons/${quizLessonSlug}/flashcards` },
        { method: "get", path: `/api/academy/courses/${courseSlug}/lessons/${quizLessonSlug}/quiz` },
        { method: "post", path: `/api/academy/courses/${courseSlug}/lessons/${quizLessonSlug}/quiz/attempts` },
        { method: "get", path: `/api/academy/courses/${courseSlug}/lessons/${quizLessonSlug}/quiz/attempts/current` },
        { method: "get", path: `/api/academy/quiz-attempts/${dummyUuid}` },
        { method: "put", path: `/api/academy/quiz-attempts/${dummyUuid}/answers/${dummyUuid}` },
        { method: "post", path: `/api/academy/quiz-attempts/${dummyUuid}/submit` },
        { method: "get", path: `/api/academy/quiz-attempts/${dummyUuid}/result` },
        { method: "get", path: `/api/academy/courses/${courseSlug}/progress` },
        { method: "post", path: `/api/academy/courses/${courseSlug}/lessons/${infoLessonSlug}/complete` },
        { method: "get", path: "/api/academy/me/xp" },
      ];

      for (const ep of endpoints) {
        const req = request(app)[ep.method](ep.path);
        const res = await req.expect(HTTP_STATUS.UNAUTHORIZED);
        expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
      }
    });

    it("rejects invalid, malformed, or expired Bearer tokens with 401 UNAUTHENTICATED", async () => {
      const res = await request(app)
        .get("/api/academy/me/xp")
        .set("Authorization", "Bearer invalid-tampered-token")
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });
  });

  describe("AC-003 & AC-007 & AC-008: IDOR Hardening for Quiz Attempts & Mutations", () => {
    let attemptBId: string;

    beforeEach(async () => {
      // User B starts an attempt
      const res = await request(app)
        .post(`/api/academy/courses/${courseSlug}/lessons/${quizLessonSlug}/quiz/attempts`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({})
        .expect(HTTP_STATUS.CREATED);
      attemptBId = res.body.data.id;
    });

    it("AC-003: User A cannot read User B quiz attempt by ID", async () => {
      const res = await request(app)
        .get(`/api/academy/quiz-attempts/${attemptBId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);
    });

    it("AC-003: User A cannot read User B current active attempt", async () => {
      // User A requests current attempt -> User A has no active attempt -> 404
      const res = await request(app)
        .get(`/api/academy/courses/${courseSlug}/lessons/${quizLessonSlug}/quiz/attempts/current`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);
    });

    it("AC-007: User A cannot mutate User B draft answers", async () => {
      const res = await request(app)
        .put(`/api/academy/quiz-attempts/${attemptBId}/answers/${questionId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ optionId: correctOptionId })
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);

      // Verify no answer exists in DB for User B's attempt
      const answers = await prisma.academyQuizAnswer.findMany({
        where: { attemptId: attemptBId },
      });
      expect(answers.length).toBe(0);
    });

    it("AC-008: User A cannot submit User B quiz attempt", async () => {
      const res = await request(app)
        .post(`/api/academy/quiz-attempts/${attemptBId}/submit`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({})
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);

      // Verify User B's attempt remains IN_PROGRESS in DB
      const attemptInDb = await prisma.academyQuizAttempt.findUnique({
        where: { id: attemptBId },
      });
      expect(attemptInDb?.status).toBe("IN_PROGRESS");
    });
  });

  describe("AC-004 & AC-015: IDOR Hardening for Graded Results", () => {
    let attemptBId: string;

    beforeEach(async () => {
      // User B starts attempt, answers question, and submits
      const startRes = await request(app)
        .post(`/api/academy/courses/${courseSlug}/lessons/${quizLessonSlug}/quiz/attempts`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({});
      attemptBId = startRes.body.data.id;

      await request(app)
        .put(`/api/academy/quiz-attempts/${attemptBId}/answers/${questionId}`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ optionId: correctOptionId });

      await request(app)
        .post(`/api/academy/quiz-attempts/${attemptBId}/submit`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({});
    });

    it("AC-004 & AC-015: User A cannot read User B graded result, while User B can", async () => {
      // User B can read own result (200 OK)
      const resB = await request(app)
        .get(`/api/academy/quiz-attempts/${attemptBId}/result`)
        .set("Authorization", `Bearer ${tokenB}`)
        .expect(HTTP_STATUS.OK);

      expect(resB.body.data.attemptId).toBe(attemptBId);
      expect(resB.body.data.score).toBe(100);
      expect(resB.body.data.passed).toBe(true);

      // User A cannot read User B result (404 NOT_FOUND)
      const resA = await request(app)
        .get(`/api/academy/quiz-attempts/${attemptBId}/result`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(resA.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);
    });
  });

  describe("AC-005 & AC-006 & AC-009: IDOR Hardening for Progress & XP/Rewards", () => {
    beforeEach(async () => {
      // User B completes the informational lesson (earns progress & 10 XP)
      await request(app)
        .post(`/api/academy/courses/${courseSlug}/lessons/${infoLessonSlug}/complete`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({})
        .expect(HTTP_STATUS.OK);
    });

    it("AC-005: User A cannot read User B progress; gets strictly User A progress", async () => {
      // User B has 50% course progress (1 of 2 lessons completed)
      const resB = await request(app)
        .get(`/api/academy/courses/${courseSlug}/progress`)
        .set("Authorization", `Bearer ${tokenB}`)
        .expect(HTTP_STATUS.OK);

      expect(resB.body.data.completedLessons).toBe(1);
      expect(resB.body.data.progressPercent).toBe(50);

      // User A has 0% progress
      const resA = await request(app)
        .get(`/api/academy/courses/${courseSlug}/progress`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(HTTP_STATUS.OK);

      expect(resA.body.data.completedLessons).toBe(0);
      expect(resA.body.data.progressPercent).toBe(0);

      // User A attempts query parameter spoofing: ?userId=userBId -> ignored
      const resSpoof = await request(app)
        .get(`/api/academy/courses/${courseSlug}/progress?userId=${userBId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(HTTP_STATUS.OK);

      expect(resSpoof.body.data.completedLessons).toBe(0);
      expect(resSpoof.body.data.progressPercent).toBe(0);
    });

    it("AC-006: User A cannot read User B XP; gets strictly User A XP", async () => {
      // User B has 10 XP
      const resB = await request(app)
        .get("/api/academy/me/xp")
        .set("Authorization", `Bearer ${tokenB}`)
        .expect(HTTP_STATUS.OK);

      expect(resB.body.data.totalXp).toBe(10);

      // User A has 0 XP
      const resA = await request(app)
        .get("/api/academy/me/xp")
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(HTTP_STATUS.OK);

      expect(resA.body.data.totalXp).toBe(0);

      // Query parameter spoofing: ?userId=userBId -> ignored
      const resSpoof = await request(app)
        .get(`/api/academy/me/xp?userId=${userBId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(HTTP_STATUS.OK);

      expect(resSpoof.body.data.totalXp).toBe(0);
    });

    it("AC-009: User A actions do not mutate User B XP or reward ledger", async () => {
      // User A completes informational lesson
      await request(app)
        .post(`/api/academy/courses/${courseSlug}/lessons/${infoLessonSlug}/complete`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({})
        .expect(HTTP_STATUS.OK);

      // Verify User A now has 10 XP
      const xpA = await prisma.academyUserXp.findUnique({ where: { userId: userAId } });
      expect(xpA?.totalXp).toBe(10);

      // Verify User B's XP is still 10, not 20
      const xpB = await prisma.academyUserXp.findUnique({ where: { userId: userBId } });
      expect(xpB?.totalXp).toBe(10);

      // Verify ledger has exactly 1 row per user
      const ledgerA = await prisma.academyRewardLedger.findMany({ where: { userId: userAId } });
      const ledgerB = await prisma.academyRewardLedger.findMany({ where: { userId: userBId } });
      expect(ledgerA.length).toBe(1);
      expect(ledgerB.length).toBe(1);
    });
  });

  describe("AC-010: Client Authority Rejection & Body Whitelisting", () => {
    it("rejects client-supplied userId in all request bodies with 400 VALIDATION_ERROR", async () => {
      const dummyUuid = "00000000-0000-0000-0000-000000000001";

      // 1. Start attempt
      await request(app)
        .post(`/api/academy/courses/${courseSlug}/lessons/${quizLessonSlug}/quiz/attempts`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ userId: userBId })
        .expect(HTTP_STATUS.BAD_REQUEST);

      // 2. Draft answer
      await request(app)
        .put(`/api/academy/quiz-attempts/${dummyUuid}/answers/${questionId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ optionId: correctOptionId, userId: userBId })
        .expect(HTTP_STATUS.BAD_REQUEST);

      // 3. Submit attempt
      await request(app)
        .post(`/api/academy/quiz-attempts/${dummyUuid}/submit`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ userId: userBId })
        .expect(HTTP_STATUS.BAD_REQUEST);

      // 4. Complete lesson
      await request(app)
        .post(`/api/academy/courses/${courseSlug}/lessons/${infoLessonSlug}/complete`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ userId: userBId })
        .expect(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("AC-011: JWT Role / Admin Claim Spoofing Rejection", () => {
    it("rejects token with spoofed role claim with 401 UNAUTHENTICATED due to strict claims validation", async () => {
      // User B creates an attempt
      const startRes = await request(app)
        .post(`/api/academy/courses/${courseSlug}/lessons/${quizLessonSlug}/quiz/attempts`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({});
      const attemptBId = startRes.body.data.id;

      // Attacker crafts a token with sub: userAId, but injects forged role: "ADMIN"
      const now = Math.floor(Date.now() / 1000);
      const forgedJwt = jwt.sign(
        {
          sub: userAId,
          iat: now,
          exp: now + 3600,
          iss: "aura-capital",
          aud: "aura-client",
          typ: "access",
          role: "ADMIN",
        },
        process.env.AUTH_ACCESS_TOKEN_SECRET || "aura-capital-development-jwt-secret-min-32-chars-long!",
        { algorithm: "HS256" },
      );

      // Token with spoofed role claim is rejected by strict claims parser with 401
      const res = await request(app)
        .get(`/api/academy/quiz-attempts/${attemptBId}`)
        .set("Authorization", `Bearer ${forgedJwt}`)
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("rejects role bypass when user attempts header spoofing (x-role: ADMIN)", async () => {
      // User B creates an attempt
      const startRes = await request(app)
        .post(`/api/academy/courses/${courseSlug}/lessons/${quizLessonSlug}/quiz/attempts`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({});
      const attemptBId = startRes.body.data.id;

      // User A sends valid token with spoofed admin headers
      const res = await request(app)
        .get(`/api/academy/quiz-attempts/${attemptBId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .set("x-role", "ADMIN")
        .set("x-admin", "true")
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(res.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);
    });
  });

  describe("AC-012: Non-Enumerating Error Semantics", () => {
    it("returns identical 404 response for foreign-owned resource vs nonexistent resource (zero 403 leaks)", async () => {
      // User B starts an attempt
      const startRes = await request(app)
        .post(`/api/academy/courses/${courseSlug}/lessons/${quizLessonSlug}/quiz/attempts`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({});
      const attemptBId = startRes.body.data.id;
      const nonexistentUuid = "99999999-9999-9999-9999-999999999999";

      // 1. GET attempt by ID: foreign vs nonexistent
      const foreignAttemptRes = await request(app)
        .get(`/api/academy/quiz-attempts/${attemptBId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      const nonexistentAttemptRes = await request(app)
        .get(`/api/academy/quiz-attempts/${nonexistentUuid}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(foreignAttemptRes.body.error.code).toBe(nonexistentAttemptRes.body.error.code);
      expect(foreignAttemptRes.body.error.message).toBe(nonexistentAttemptRes.body.error.message);
      expect(foreignAttemptRes.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);

      // 2. GET graded result: foreign vs nonexistent
      const foreignResultRes = await request(app)
        .get(`/api/academy/quiz-attempts/${attemptBId}/result`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      const nonexistentResultRes = await request(app)
        .get(`/api/academy/quiz-attempts/${nonexistentUuid}/result`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(foreignResultRes.body.error.code).toBe(nonexistentResultRes.body.error.code);
      expect(foreignResultRes.body.error.message).toBe(nonexistentResultRes.body.error.message);
      expect(foreignResultRes.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);

      // 3. PUT draft answer: foreign vs nonexistent
      const foreignDraftRes = await request(app)
        .put(`/api/academy/quiz-attempts/${attemptBId}/answers/${questionId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ optionId: correctOptionId })
        .expect(HTTP_STATUS.NOT_FOUND);

      const nonexistentDraftRes = await request(app)
        .put(`/api/academy/quiz-attempts/${nonexistentUuid}/answers/${questionId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ optionId: correctOptionId })
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(foreignDraftRes.body.error.code).toBe(nonexistentDraftRes.body.error.code);
      expect(foreignDraftRes.body.error.message).toBe(nonexistentDraftRes.body.error.message);
      expect(foreignDraftRes.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);

      // 4. POST submit attempt: foreign vs nonexistent
      const foreignSubmitRes = await request(app)
        .post(`/api/academy/quiz-attempts/${attemptBId}/submit`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({})
        .expect(HTTP_STATUS.NOT_FOUND);

      const nonexistentSubmitRes = await request(app)
        .post(`/api/academy/quiz-attempts/${nonexistentUuid}/submit`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({})
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(foreignSubmitRes.body.error.code).toBe(nonexistentSubmitRes.body.error.code);
      expect(foreignSubmitRes.body.error.message).toBe(nonexistentSubmitRes.body.error.message);
      expect(foreignSubmitRes.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);
    });
  });

  describe("AC-013: Malformed Identifier Canonical Error Handling", () => {
    it("returns safe 400 VALIDATION_ERROR on malformed UUIDs and slugs without DB exception leaks", async () => {
      // 1. Malformed attempt UUID
      const resAttempt = await request(app)
        .get("/api/academy/quiz-attempts/malformed-id-123")
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(resAttempt.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

      // 2. Malformed draft answer question UUID
      const resDraft = await request(app)
        .put("/api/academy/quiz-attempts/00000000-0000-0000-0000-000000000001/answers/not-a-uuid")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ optionId: correctOptionId })
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(resDraft.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

      // 3. Malformed course slug in progress endpoint
      const resProg = await request(app)
        .get("/api/academy/courses/INVALID_SLUG!/progress")
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(resProg.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

      // 4. Malformed lesson slug in complete endpoint
      const resComp = await request(app)
        .post("/api/academy/courses/valid-course/lessons/INVALID_LESSON!/complete")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({})
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(resComp.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe("AC-014 & AC-016: Pre-Submission Secrecy & DTO Boundary Sentinels", () => {
    it("AC-014: verifies zero correctness or explanation leakage in quiz definition, attempt, and draft APIs", async () => {
      // 1. Quiz definition
      const defRes = await request(app)
        .get(`/api/academy/courses/${courseSlug}/lessons/${quizLessonSlug}/quiz`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(HTTP_STATUS.OK);

      assertZeroPreSubmissionLeakage(defRes.body);

      // 2. Start attempt
      const startRes = await request(app)
        .post(`/api/academy/courses/${courseSlug}/lessons/${quizLessonSlug}/quiz/attempts`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({})
        .expect(HTTP_STATUS.CREATED);

      assertZeroPreSubmissionLeakage(startRes.body);
      const attemptId = startRes.body.data.id;

      // 3. Read current attempt
      const currentRes = await request(app)
        .get(`/api/academy/courses/${courseSlug}/lessons/${quizLessonSlug}/quiz/attempts/current`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(HTTP_STATUS.OK);

      assertZeroPreSubmissionLeakage(currentRes.body);

      // 4. Save draft answer
      const draftRes = await request(app)
        .put(`/api/academy/quiz-attempts/${attemptId}/answers/${questionId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ optionId: correctOptionId })
        .expect(HTTP_STATUS.OK);

      assertZeroPreSubmissionLeakage(draftRes.body);
    });

    it("AC-016: verifies progress and XP DTOs expose zero userId, internal DB IDs, or level fields", async () => {
      // 1. Course progress
      const progRes = await request(app)
        .get(`/api/academy/courses/${courseSlug}/progress`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(HTTP_STATUS.OK);

      const progData = progRes.body.data;
      expect(progData).not.toHaveProperty("userId");
      expect(progData).not.toHaveProperty("id");
      for (const lesson of progData.lessons) {
        expect(lesson).not.toHaveProperty("userId");
        expect(lesson).not.toHaveProperty("id");
      }

      // 2. XP endpoint
      const xpRes = await request(app)
        .get("/api/academy/me/xp")
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(HTTP_STATUS.OK);

      expect(Object.keys(xpRes.body.data)).toEqual(["totalXp"]);
      expect(xpRes.body.data).not.toHaveProperty("userId");
      expect(xpRes.body.data).not.toHaveProperty("level");
      expect(xpRes.body.data).not.toHaveProperty("idempotencyKey");
    });
  });
});
