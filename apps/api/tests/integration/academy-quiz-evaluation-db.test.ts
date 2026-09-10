/**
 * Live PostgreSQL Integration Test Suite: FEAT-025 Quiz Evaluation & Secure Submission
 *
 * Verifies:
 * - AC-001: Authentication required on submit and result endpoints
 * - AC-002: Strict empty submit payload; client scores/correctness rejected with 400
 * - AC-003: Strict ownership isolation and non-enumerating 404 responses
 * - AC-004: Published content scoping (Course, Lesson, Quiz must be PUBLISHED)
 * - AC-005: Unanswered questions guard rejecting submission with 400 UNANSWERED_QUESTIONS
 * - AC-006: Zero-question guard rejecting submission with 400 INVALID_QUIZ_STATE
 * - AC-007: Server-authoritative evaluation deriving correctness strictly from DB (CRITICAL HARD GATE)
 * - AC-008: Atomic correctness snapshot persistence (isCorrect, correctOptionIdSnapshot, correctOptionTextSnapshot)
 * - AC-009: Score calculation integer percentage formula Math.round((C / N) * 100)
 * - AC-010: Pass/fail determination based strictly on score >= quiz.passingScore
 * - AC-011: Atomic SUBMITTED -> GRADED lifecycle with full transaction rollback on failure
 * - AC-012: Active attempt partial unique index constraint release on grading
 * - AC-013: Idempotent historical result replay returning HTTP 200 without re-evaluating live options
 * - AC-014: Concurrency safety via row-level locking (SELECT ... FOR UPDATE)
 * - AC-015: Dedicated result endpoint GET .../result returning QuizResultDto for GRADED attempts
 * - AC-016: Historical result continuation even after live option text or passing score mutated
 * - AC-017: Draft answer immutability on GRADED attempts (409 ATTEMPT_ALREADY_FINALIZED)
 * - AC-018: Pre-submission secrecy regression sentinel (FEAT-023/024 leak ZERO correctness) (CRITICAL HARD GATE)
 * - AC-019: Zero external side effects and database-enforced CHECK constraints (DEF-025-01)
 * - AC-020: Canonical monorepo quality gate
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
import { PrismaAcademyQuizRepository } from "../../src/modules/academy/academy.repository.js";

const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

// Sentinel scanner for pre-submission correctness secrecy
const FORBIDDEN_PRE_SUBMISSION_PATTERNS = [
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
];

function assertZeroPreSubmissionLeakage(payload: unknown): void {
  function scan(value: unknown, path: string): void {
    if (value === null || value === undefined || typeof value !== "object") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => scan(item, `${path}[${index}]`));
      return;
    }

    for (const [key, propValue] of Object.entries(value as Record<string, unknown>)) {
      const currentPath = path ? `${path}.${key}` : key;
      for (const pattern of FORBIDDEN_PRE_SUBMISSION_PATTERNS) {
        if (pattern.test(key)) {
          throw new Error(
            `SECURITY DEFECT AC-018: Forbidden key "${key}" detected at path "${currentPath}" in pre-submission payload.`,
          );
        }
      }
      scan(propValue, currentPath);
    }
  }

  scan(payload, "");
}

describe("FEAT-025 Quiz Evaluation & Secure Submission (Live PostgreSQL Integration)", () => {
  let prisma: PrismaClient;
  let app: ReturnType<typeof createApp>;
  let learnerAId: string;
  let _learnerBId: string;
  let learnerAToken: string;
  let learnerBToken: string;

  const courseSlug = "crypto-eval-101";
  const lessonSlug = "consensus-eval";
  let publishedCourseId: string;
  let publishedLessonId: string;
  let publishedQuizId: string;
  let question1Id: string;
  let option1AId: string; // Correct
  let option1BId: string; // Incorrect
  let question2Id: string;
  let option2AId: string; // Correct
  let _option2BId: string; // Incorrect

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

    async function cleanupTestData(client: PrismaClient): Promise<void> {
      await client.$transaction(async (tx) => {
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

    const userA = await prisma.user.create({
      data: {
        email: "eval-learner-a@aura.test",
        status: "ACTIVE",
      },
    });
    learnerAId = userA.id;
    learnerAToken = accessTokenService.issueAccessToken(userA.id).accessToken;

    const userB = await prisma.user.create({
      data: {
        email: "eval-learner-b@aura.test",
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

    const course = await prisma.academyCourse.create({
      data: {
        slug: "crypto-eval-101",
        title: "Cryptocurrency Evaluation",
        level: "BEGINNER",
        status: "PUBLISHED",
        order: 1,
      },
    });
    publishedCourseId = course.id;

    const lesson = await prisma.academyLesson.create({
      data: {
        courseId: course.id,
        slug: "consensus-eval",
        title: "Consensus Mechanisms",
        content: "Detailed evaluation of consensus protocols.",
        status: "PUBLISHED",
        order: 1,
      },
    });
    publishedLessonId = lesson.id;

    // Passing score 75% -> 2 questions: 2 correct = 100% (passed), 1 correct = 50% (failed)
    const quiz = await prisma.academyQuiz.create({
      data: {
        lessonId: lesson.id,
        title: "Consensus Evaluation Quiz",
        description: "Assess consensus concepts.",
        passingScore: 75,
        status: "PUBLISHED",
        order: 1,
      },
    });
    publishedQuizId = quiz.id;

    const seeded = await prisma.$transaction(async (tx) => {
      const q1 = await tx.academyQuizQuestion.create({
        data: {
          quizId: quiz.id,
          prompt: "What is Proof of Work?",
          type: "SINGLE_CHOICE",
          order: 1,
        },
      });
      const opt1A = await tx.academyQuizOption.create({
        data: {
          questionId: q1.id,
          text: "Computational puzzle solving",
          isCorrect: true,
          order: 1,
        },
      });
      const opt1B = await tx.academyQuizOption.create({
        data: {
          questionId: q1.id,
          text: "Token staking mechanism",
          isCorrect: false,
          order: 2,
        },
      });

      const q2 = await tx.academyQuizQuestion.create({
        data: {
          quizId: quiz.id,
          prompt: "What is Proof of Stake?",
          type: "SINGLE_CHOICE",
          order: 2,
        },
      });
      const opt2A = await tx.academyQuizOption.create({
        data: {
          questionId: q2.id,
          text: "Economic capital staking",
          isCorrect: true,
          order: 1,
        },
      });
      const opt2B = await tx.academyQuizOption.create({
        data: {
          questionId: q2.id,
          text: "Hardware hash-rate mining",
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

  // Helper to start attempt and save answers
  async function setupAttemptWithAnswers(
    token: string,
    answers: Array<{ questionId: string; selectedOptionId: string }>,
  ): Promise<string> {
    const startRes = await request(app)
      .post(`/api/academy/courses/${courseSlug}/lessons/${lessonSlug}/quiz/attempts`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(startRes.status).toBe(HTTP_STATUS.CREATED);
    const attemptId = startRes.body.data.id;

    for (const ans of answers) {
      const putRes = await request(app)
        .put(`/api/academy/quiz-attempts/${attemptId}/answers/${ans.questionId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ optionId: ans.selectedOptionId });
      expect(putRes.status).toBe(HTTP_STATUS.OK);
    }

    return attemptId;
  }

  // ==========================================================================
  // Section 1: Authentication & Authorization (AC-001)
  // ==========================================================================

  it("returns 401 UNAUTHENTICATED when submitting or reading result without a token (AC-001)", async () => {
    const fakeAttemptId = "00000000-0000-0000-0000-000000000000";

    const submitRes = await request(app).post(`/api/academy/quiz-attempts/${fakeAttemptId}/submit`).send({});
    expect(submitRes.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(submitRes.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);

    const resultRes = await request(app).get(`/api/academy/quiz-attempts/${fakeAttemptId}/result`);
    expect(resultRes.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(resultRes.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  // ==========================================================================
  // Section 2: Strict Submission Body (AC-002)
  // ==========================================================================

  it("rejects non-empty payload or forged scoring fields with 400 VALIDATION_ERROR (AC-002)", async () => {
    const attemptId = await setupAttemptWithAnswers(learnerAToken, [
      { questionId: question1Id, selectedOptionId: option1AId },
      { questionId: question2Id, selectedOptionId: option2AId },
    ]);

    // Forged score and passed
    const res = await request(app)
      .post(`/api/academy/quiz-attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${learnerAToken}`)
      .send({ score: 100, passed: true });

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

    // Forged answers array
    const res2 = await request(app)
      .post(`/api/academy/quiz-attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${learnerAToken}`)
      .send({ answers: [{ isCorrect: true }] });

    expect(res2.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(res2.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });

  // ==========================================================================
  // Section 3: Ownership Isolation & Non-Enumeration (AC-003)
  // ==========================================================================

  it("enforces strict ownership isolation: Learner B accessing Learner A's attempt receives 404 QUIZ_ATTEMPT_NOT_FOUND (AC-003)", async () => {
    const attemptId = await setupAttemptWithAnswers(learnerAToken, [
      { questionId: question1Id, selectedOptionId: option1AId },
      { questionId: question2Id, selectedOptionId: option2AId },
    ]);

    // Learner B attempts to submit Learner A's attempt -> 404
    const submitRes = await request(app)
      .post(`/api/academy/quiz-attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${learnerBToken}`)
      .send({});
    expect(submitRes.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(submitRes.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);

    // Learner A submits successfully
    await request(app)
      .post(`/api/academy/quiz-attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${learnerAToken}`)
      .send({});

    // Learner B attempts to view Learner A's result -> 404
    const resultRes = await request(app)
      .get(`/api/academy/quiz-attempts/${attemptId}/result`)
      .set("Authorization", `Bearer ${learnerBToken}`);
    expect(resultRes.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(resultRes.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);
  });

  // ==========================================================================
  // Section 4: Published Content Scoping (AC-004)
  // ==========================================================================

  it("rejects submission with 404 NOT_FOUND when Course, Lesson, or Quiz is ARCHIVED (AC-004)", async () => {
    const attemptId = await setupAttemptWithAnswers(learnerAToken, [
      { questionId: question1Id, selectedOptionId: option1AId },
      { questionId: question2Id, selectedOptionId: option2AId },
    ]);

    // 1. Unpublish Course -> 404
    await prisma.academyCourse.update({ where: { id: publishedCourseId }, data: { status: "ARCHIVED" } });
    const resCourseArchived = await request(app)
      .post(`/api/academy/quiz-attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${learnerAToken}`)
      .send({});
    expect(resCourseArchived.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(resCourseArchived.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(resCourseArchived.body.error.message).toBe("Resource not found");

    // Restore Course, unpublish Lesson -> 404
    await prisma.academyCourse.update({ where: { id: publishedCourseId }, data: { status: "PUBLISHED" } });
    await prisma.academyLesson.update({ where: { id: publishedLessonId }, data: { status: "ARCHIVED" } });
    const resLessonArchived = await request(app)
      .post(`/api/academy/quiz-attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${learnerAToken}`)
      .send({});
    expect(resLessonArchived.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(resLessonArchived.body.error.code).toBe(ERROR_CODES.NOT_FOUND);

    // Restore Lesson, unpublish Quiz -> 404
    await prisma.academyLesson.update({ where: { id: publishedLessonId }, data: { status: "PUBLISHED" } });
    await prisma.academyQuiz.update({ where: { id: publishedQuizId }, data: { status: "ARCHIVED" } });
    const resQuizArchived = await request(app)
      .post(`/api/academy/quiz-attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${learnerAToken}`)
      .send({});
    expect(resQuizArchived.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(resQuizArchived.body.error.code).toBe(ERROR_CODES.NOT_FOUND);

    // Restore Quiz for subsequent tests
    await prisma.academyQuiz.update({ where: { id: publishedQuizId }, data: { status: "PUBLISHED" } });
  });

  // ==========================================================================
  // Section 5: Unanswered Questions Guard (AC-005)
  // ==========================================================================

  it("rejects submission with 400 UNANSWERED_QUESTIONS when some questions are unanswered (AC-005)", async () => {
    // Only answer 1 of 2 questions
    const attemptId = await setupAttemptWithAnswers(learnerAToken, [
      { questionId: question1Id, selectedOptionId: option1AId },
    ]);

    const res = await request(app)
      .post(`/api/academy/quiz-attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${learnerAToken}`)
      .send({});

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(res.body.error.code).toBe(ERROR_CODES.UNANSWERED_QUESTIONS);

    // Direct DB check: attempt must remain IN_PROGRESS
    const dbAttempt = await prisma.academyQuizAttempt.findUnique({
      where: { id: attemptId },
    });
    expect(dbAttempt?.status).toBe("IN_PROGRESS");
    expect(dbAttempt?.score).toBeNull();
    expect(dbAttempt?.submittedAt).toBeNull();
    expect(dbAttempt?.gradedAt).toBeNull();
  });

  // ==========================================================================
  // Section 6: Zero-Question Guard (AC-006)
  // ==========================================================================

  it("rejects submission with 400 INVALID_QUIZ_STATE when quiz has zero questions (AC-006)", async () => {
    // Create an empty quiz
    const emptyQuiz = await prisma.academyQuiz.create({
      data: {
        lessonId: publishedLessonId,
        title: "Empty Quiz",
        passingScore: 70,
        status: "PUBLISHED",
        order: 2,
      },
    });

    const emptyAttempt = await prisma.academyQuizAttempt.create({
      data: {
        userId: learnerAId,
        quizId: emptyQuiz.id,
        attemptNumber: 1,
        status: "IN_PROGRESS",
        quizTitleSnapshot: "Empty Quiz",
      },
    });

    const res = await request(app)
      .post(`/api/academy/quiz-attempts/${emptyAttempt.id}/submit`)
      .set("Authorization", `Bearer ${learnerAToken}`)
      .send({});

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(res.body.error.code).toBe(ERROR_CODES.INVALID_QUIZ_STATE);
    expect(res.body.error.message).toBe("Quiz has no questions to evaluate");
  });

  // ==========================================================================
  // Section 7: Server-Authoritative Evaluation (AC-007) & Snapshot Persistence (AC-008)
  // ==========================================================================

  it("evaluates completed attempt authoritatively against DB isCorrect and persists immutable snapshots (AC-007, AC-008)", async () => {
    // 2/2 correct -> 100% score >= 75% -> passed: true
    const attemptId = await setupAttemptWithAnswers(learnerAToken, [
      { questionId: question1Id, selectedOptionId: option1AId },
      { questionId: question2Id, selectedOptionId: option2AId },
    ]);

    const res = await request(app)
      .post(`/api/academy/quiz-attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${learnerAToken}`)
      .send({});

    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.data).toMatchObject({
      attemptId,
      quizId: publishedQuizId,
      score: 100,
      passed: true,
    });
    expect(res.body.data.submittedAt).toBeDefined();
    expect(res.body.data.gradedAt).toBeDefined();
    expect(res.body.data.answers).toHaveLength(2);

    const ans1 = res.body.data.answers.find((a: { questionId: string }) => a.questionId === question1Id);
    expect(ans1).toMatchObject({
      selectedOptionId: option1AId,
      isCorrect: true,
      correctOptionId: option1AId,
    });

    // Direct DB verification of snapshot persistence (AC-008)
    const dbAttempt = await prisma.academyQuizAttempt.findUnique({
      where: { id: attemptId },
      include: { answers: true },
    });
    expect(dbAttempt?.status).toBe("GRADED");
    expect(dbAttempt?.score).toBe(100);
    expect(dbAttempt?.passed).toBe(true);
    expect(dbAttempt?.submittedAt).toBeDefined();
    expect(dbAttempt?.gradedAt).toBeDefined();

    const dbAns1 = dbAttempt!.answers.find((a) => a.questionId === question1Id);
    expect(dbAns1?.isCorrect).toBe(true);
    expect(dbAns1?.correctOptionIdSnapshot).toBe(option1AId);
    expect(dbAns1?.correctOptionTextSnapshot).toBe("Computational puzzle solving");

    const dbAns2 = dbAttempt!.answers.find((a) => a.questionId === question2Id);
    expect(dbAns2?.isCorrect).toBe(true);
    expect(dbAns2?.correctOptionIdSnapshot).toBe(option2AId);
    expect(dbAns2?.correctOptionTextSnapshot).toBe("Economic capital staking");
  });

  // ==========================================================================
  // Section 8: Score Formula (AC-009) & Pass/Fail Determination (AC-010)
  // ==========================================================================

  it("calculates integer score with Math.round((C / N) * 100) and evaluates pass/fail threshold accurately (AC-009, AC-010)", async () => {
    // Create a 3-question quiz to test rounding (1/3 = 33%, 2/3 = 67%)
    const threeQQuiz = await prisma.academyQuiz.create({
      data: {
        lessonId: publishedLessonId,
        title: "Three Question Quiz",
        passingScore: 65, // 67% passes, 33% fails
        status: "PUBLISHED",
        order: 3,
      },
    });

    const { qA, optA1, qB, optB1, optB2, qC, optC2 } = await prisma.$transaction(async (tx) => {
      const qA = await tx.academyQuizQuestion.create({
        data: { quizId: threeQQuiz.id, prompt: "QA", type: "SINGLE_CHOICE", order: 1 },
      });
      const optA1 = await tx.academyQuizOption.create({
        data: { questionId: qA.id, text: "A1", isCorrect: true, order: 1 },
      });
      const optA2 = await tx.academyQuizOption.create({
        data: { questionId: qA.id, text: "A2", isCorrect: false, order: 2 },
      });

      const qB = await tx.academyQuizQuestion.create({
        data: { quizId: threeQQuiz.id, prompt: "QB", type: "SINGLE_CHOICE", order: 2 },
      });
      const optB1 = await tx.academyQuizOption.create({
        data: { questionId: qB.id, text: "B1", isCorrect: true, order: 1 },
      });
      const optB2 = await tx.academyQuizOption.create({
        data: { questionId: qB.id, text: "B2", isCorrect: false, order: 2 },
      });

      const qC = await tx.academyQuizQuestion.create({
        data: { quizId: threeQQuiz.id, prompt: "QC", type: "SINGLE_CHOICE", order: 3 },
      });
      const optC1 = await tx.academyQuizOption.create({
        data: { questionId: qC.id, text: "C1", isCorrect: true, order: 1 },
      });
      const optC2 = await tx.academyQuizOption.create({
        data: { questionId: qC.id, text: "C2", isCorrect: false, order: 2 },
      });

      return { qA, optA1, optA2, qB, optB1, optB2, qC, optC1, optC2 };
    });

    // Case 1: 1/3 correct -> score 33, passed: false (33 < 65)
    const attempt1 = await prisma.academyQuizAttempt.create({
      data: {
        userId: learnerAId,
        quizId: threeQQuiz.id,
        attemptNumber: 1,
        status: "IN_PROGRESS",
        quizTitleSnapshot: "Three Question Quiz",
      },
    });
    await prisma.academyQuizAnswer.createMany({
      data: [
        { attemptId: attempt1.id, quizId: threeQQuiz.id, questionId: qA.id, selectedOptionId: optA1.id, questionPromptSnapshot: "QA" },
        { attemptId: attempt1.id, quizId: threeQQuiz.id, questionId: qB.id, selectedOptionId: optB2.id, questionPromptSnapshot: "QB" },
        { attemptId: attempt1.id, quizId: threeQQuiz.id, questionId: qC.id, selectedOptionId: optC2.id, questionPromptSnapshot: "QC" },
      ],
    });

    const res1 = await request(app)
      .post(`/api/academy/quiz-attempts/${attempt1.id}/submit`)
      .set("Authorization", `Bearer ${learnerAToken}`)
      .send({});
    expect(res1.status).toBe(HTTP_STATUS.OK);
    expect(res1.body.data.score).toBe(33);
    expect(res1.body.data.passed).toBe(false);

    // Case 2: 2/3 correct -> score 67, passed: true (67 >= 65)
    const attempt2 = await prisma.academyQuizAttempt.create({
      data: {
        userId: learnerAId,
        quizId: threeQQuiz.id,
        attemptNumber: 2,
        status: "IN_PROGRESS",
        quizTitleSnapshot: "Three Question Quiz",
      },
    });
    await prisma.academyQuizAnswer.createMany({
      data: [
        { attemptId: attempt2.id, quizId: threeQQuiz.id, questionId: qA.id, selectedOptionId: optA1.id, questionPromptSnapshot: "QA" },
        { attemptId: attempt2.id, quizId: threeQQuiz.id, questionId: qB.id, selectedOptionId: optB1.id, questionPromptSnapshot: "QB" },
        { attemptId: attempt2.id, quizId: threeQQuiz.id, questionId: qC.id, selectedOptionId: optC2.id, questionPromptSnapshot: "QC" },
      ],
    });

    const res2 = await request(app)
      .post(`/api/academy/quiz-attempts/${attempt2.id}/submit`)
      .set("Authorization", `Bearer ${learnerAToken}`)
      .send({});
    expect(res2.status).toBe(HTTP_STATUS.OK);
    expect(res2.body.data.score).toBe(67);
    expect(res2.body.data.passed).toBe(true);
  });

  // ==========================================================================
  // Section 9: Atomic SUBMITTED -> GRADED Lifecycle & Rollback (AC-011)
  // ==========================================================================

  it("rolls back atomic transaction cleanly on failure, leaving attempt IN_PROGRESS with zero snapshots (AC-011)", async () => {
    const attemptId = await setupAttemptWithAnswers(learnerAToken, [
      { questionId: question1Id, selectedOptionId: option1AId },
      { questionId: question2Id, selectedOptionId: option2AId },
    ]);

    // Install a temporary DB trigger that causes answer snapshot updating in Step 9 to fail
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION test_fail_grading_trigger_fn() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'Simulated database failure during answer grading snapshot write';
      END;
      $$ LANGUAGE plpgsql;
    `);
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS test_fail_grading_trigger ON "academy_quiz_answers";`);
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER test_fail_grading_trigger
      BEFORE UPDATE ON "academy_quiz_answers"
      FOR EACH ROW EXECUTE FUNCTION test_fail_grading_trigger_fn();
    `);

    try {
      // Submit attempt -> must throw 500 and trigger full transaction rollback
      const res = await request(app)
        .post(`/api/academy/quiz-attempts/${attemptId}/submit`)
        .set("Authorization", `Bearer ${learnerAToken}`)
        .send({});

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      // Verify DB rollback: Attempt must be IN_PROGRESS, zero score, zero passed, zero timestamps
      const dbAttempt = await prisma.academyQuizAttempt.findUnique({
        where: { id: attemptId },
        include: { answers: true },
      });
      expect(dbAttempt?.status).toBe("IN_PROGRESS");
      expect(dbAttempt?.score).toBeNull();
      expect(dbAttempt?.passed).toBeNull();
      expect(dbAttempt?.submittedAt).toBeNull();
      expect(dbAttempt?.gradedAt).toBeNull();

      // Verify answer snapshots were NOT committed
      for (const ans of dbAttempt!.answers) {
        expect(ans.isCorrect).toBeNull();
        expect(ans.correctOptionIdSnapshot).toBeNull();
        expect(ans.correctOptionTextSnapshot).toBeNull();
      }
    } finally {
      await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS test_fail_grading_trigger ON "academy_quiz_answers";`);
      await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS test_fail_grading_trigger_fn();`);
    }
  });

  // ==========================================================================
  // Section 10: Active Attempt Constraint Release (AC-012)
  // ==========================================================================

  it("releases active attempt lock on grading, enabling immediate clean retake without unique index conflict (AC-012)", async () => {
    const attempt1Id = await setupAttemptWithAnswers(learnerAToken, [
      { questionId: question1Id, selectedOptionId: option1AId },
      { questionId: question2Id, selectedOptionId: option2AId },
    ]);

    // Grade attempt 1
    const submitRes = await request(app)
      .post(`/api/academy/quiz-attempts/${attempt1Id}/submit`)
      .set("Authorization", `Bearer ${learnerAToken}`)
      .send({});
    expect(submitRes.status).toBe(HTTP_STATUS.OK);

    // Start a new attempt on the same quiz -> must succeed with 201 Created
    const retakeRes = await request(app)
      .post(`/api/academy/courses/${courseSlug}/lessons/${lessonSlug}/quiz/attempts`)
      .set("Authorization", `Bearer ${learnerAToken}`)
      .send({});
    expect(retakeRes.status).toBe(HTTP_STATUS.CREATED);
    expect(retakeRes.body.data.id).not.toBe(attempt1Id);
    expect(retakeRes.body.data.status).toBe("IN_PROGRESS");

    // Both attempts exist in DB
    const attempts = await prisma.academyQuizAttempt.findMany({
      where: { userId: learnerAId, quizId: publishedQuizId },
    });
    expect(attempts).toHaveLength(2);
  });

  // ==========================================================================
  // Section 11: Idempotent Result Replay & Snapshot Immutability (AC-013, AC-016)
  // ==========================================================================

  it("guarantees historical replay stability when live quiz options or passingScore are mutated after grading (AC-013, AC-016)", async () => {
    const attemptId = await setupAttemptWithAnswers(learnerAToken, [
      { questionId: question1Id, selectedOptionId: option1AId },
      { questionId: question2Id, selectedOptionId: option2AId },
    ]);

    // Submit attempt
    const initialSubmitRes = await request(app)
      .post(`/api/academy/quiz-attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${learnerAToken}`)
      .send({});
    expect(initialSubmitRes.status).toBe(HTTP_STATUS.OK);
    const originalScore = initialSubmitRes.body.data.score;

    // Mutate live quiz option text and passing score in database
    await prisma.academyQuizOption.update({
      where: { id: option1AId },
      data: { text: "MUTATED_TEXT_IN_LIVE_TABLE" },
    });
    await prisma.academyQuiz.update({
      where: { id: publishedQuizId },
      data: { passingScore: 100 }, // Was 75
    });

    // Subsequent submit (idempotent replay) must read ONLY persisted snapshots
    const replaySubmitRes = await request(app)
      .post(`/api/academy/quiz-attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${learnerAToken}`)
      .send({});
    expect(replaySubmitRes.status).toBe(HTTP_STATUS.OK);
    expect(replaySubmitRes.body.data.score).toBe(originalScore);
    expect(replaySubmitRes.body.data.passed).toBe(true);
    expect(replaySubmitRes.body.data.answers[0].correctOptionId).toBe(option1AId);

    // Direct DB check: correctOptionTextSnapshot in academy_quiz_answers is untouched
    const dbAnswers = await prisma.academyQuizAnswer.findMany({
      where: { attemptId },
    });
    const dbAns1 = dbAnswers.find((a) => a.questionId === question1Id);
    expect(dbAns1?.correctOptionTextSnapshot).toBe("Computational puzzle solving");

    // GET /api/academy/quiz-attempts/:attemptId/result endpoint must also read ONLY snapshots
    const resultRes = await request(app)
      .get(`/api/academy/quiz-attempts/${attemptId}/result`)
      .set("Authorization", `Bearer ${learnerAToken}`);
    expect(resultRes.status).toBe(HTTP_STATUS.OK);
    expect(resultRes.body.data.score).toBe(originalScore);
    expect(resultRes.body.data.passed).toBe(true);
    expect(resultRes.body.data.answers[0].correctOptionId).toBe(option1AId);
    expect(resultRes.body.data.answers[0].isCorrect).toBe(true);
  });

  // ==========================================================================
  // Section 12: Concurrency & Row-Level Lock Serialization (AC-014)
  // ==========================================================================

  it("serializes 5 concurrent submit requests via FOR UPDATE row-lock yielding identical HTTP 200 responses (AC-014)", async () => {
    const attemptId = await setupAttemptWithAnswers(learnerAToken, [
      { questionId: question1Id, selectedOptionId: option1AId },
      { questionId: question2Id, selectedOptionId: option2AId },
    ]);

    // Fire 5 concurrent submit requests
    const responses = await Promise.all([
      request(app).post(`/api/academy/quiz-attempts/${attemptId}/submit`).set("Authorization", `Bearer ${learnerAToken}`).send({}),
      request(app).post(`/api/academy/quiz-attempts/${attemptId}/submit`).set("Authorization", `Bearer ${learnerAToken}`).send({}),
      request(app).post(`/api/academy/quiz-attempts/${attemptId}/submit`).set("Authorization", `Bearer ${learnerAToken}`).send({}),
      request(app).post(`/api/academy/quiz-attempts/${attemptId}/submit`).set("Authorization", `Bearer ${learnerAToken}`).send({}),
      request(app).post(`/api/academy/quiz-attempts/${attemptId}/submit`).set("Authorization", `Bearer ${learnerAToken}`).send({}),
    ]);

    // All 5 must succeed with 200
    for (const res of responses) {
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.score).toBe(100);
      expect(res.body.data.passed).toBe(true);
    }

    // Scores, gradedAt, and submittedAt must match across all 5 responses
    const firstData = responses[0].body.data;
    for (let i = 1; i < responses.length; i++) {
      expect(responses[i].body.data.score).toBe(firstData.score);
      expect(responses[i].body.data.passed).toBe(firstData.passed);
      expect(responses[i].body.data.submittedAt).toBe(firstData.submittedAt);
      expect(responses[i].body.data.gradedAt).toBe(firstData.gradedAt);
    }

    // Direct DB check: exactly 1 attempt row in GRADED state
    const attempts = await prisma.academyQuizAttempt.findMany({
      where: { id: attemptId },
    });
    expect(attempts).toHaveLength(1);
    expect(attempts[0].status).toBe("GRADED");
  });

  // ==========================================================================
  // Section 13: Dedicated Result Read (AC-015)
  // ==========================================================================

  it("returns 404 QUIZ_ATTEMPT_NOT_FOUND when requesting result of an IN_PROGRESS attempt (AC-015)", async () => {
    const attemptId = await setupAttemptWithAnswers(learnerAToken, [
      { questionId: question1Id, selectedOptionId: option1AId },
    ]);

    // Not submitted yet
    const resultRes = await request(app)
      .get(`/api/academy/quiz-attempts/${attemptId}/result`)
      .set("Authorization", `Bearer ${learnerAToken}`);
    expect(resultRes.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(resultRes.body.error.code).toBe(ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND);
  });

  // ==========================================================================
  // Section 14: Draft Mutation Immutability (AC-017)
  // ==========================================================================

  it("rejects draft answer updates on a GRADED attempt with 409 ATTEMPT_ALREADY_FINALIZED (AC-017)", async () => {
    const attemptId = await setupAttemptWithAnswers(learnerAToken, [
      { questionId: question1Id, selectedOptionId: option1AId },
      { questionId: question2Id, selectedOptionId: option2AId },
    ]);

    // Grade attempt
    await request(app)
      .post(`/api/academy/quiz-attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${learnerAToken}`)
      .send({});

    // Attempt to update draft answer on graded attempt -> 409
    const putRes = await request(app)
      .put(`/api/academy/quiz-attempts/${attemptId}/answers/${question1Id}`)
      .set("Authorization", `Bearer ${learnerAToken}`)
      .send({ optionId: option1BId });

    expect(putRes.status).toBe(HTTP_STATUS.CONFLICT);
    expect(putRes.body.error.code).toBe(ERROR_CODES.ATTEMPT_ALREADY_FINALIZED);
  });

  // ==========================================================================
  // Section 15: Pre-Submission Secrecy Regression (AC-018 HARD GATE)
  // ==========================================================================

  it("ensures FEAT-023 Quiz Definition and FEAT-024 Attempt Read leak ZERO correctness data (AC-018)", async () => {
    const attemptId = await setupAttemptWithAnswers(learnerAToken, [
      { questionId: question1Id, selectedOptionId: option1AId },
    ]);

    // 1. FEAT-023 Quiz Definition endpoint
    const quizDefRes = await request(app)
      .get(`/api/academy/courses/${courseSlug}/lessons/${lessonSlug}/quiz`)
      .set("Authorization", `Bearer ${learnerAToken}`);
    expect(quizDefRes.status).toBe(HTTP_STATUS.OK);
    assertZeroPreSubmissionLeakage(quizDefRes.body);

    // 2. FEAT-024 Current Attempt endpoint
    const currentAttemptRes = await request(app)
      .get(`/api/academy/courses/${courseSlug}/lessons/${lessonSlug}/quiz/attempts/current`)
      .set("Authorization", `Bearer ${learnerAToken}`);
    expect(currentAttemptRes.status).toBe(HTTP_STATUS.OK);
    assertZeroPreSubmissionLeakage(currentAttemptRes.body);

    // 3. FEAT-024 Get Attempt by ID endpoint
    const attemptByIdRes = await request(app)
      .get(`/api/academy/quiz-attempts/${attemptId}`)
      .set("Authorization", `Bearer ${learnerAToken}`);
    expect(attemptByIdRes.status).toBe(HTTP_STATUS.OK);
    assertZeroPreSubmissionLeakage(attemptByIdRes.body);
  });

  // ==========================================================================
  // Section 16: Zero Side Effects (AC-019)
  // ==========================================================================

  it("verifies zero side-effect writes to progress, XP, reward ledger, or product audit during grading (AC-019)", async () => {
    const attemptId = await setupAttemptWithAnswers(learnerAToken, [
      { questionId: question1Id, selectedOptionId: option1AId },
      { questionId: question2Id, selectedOptionId: option2AId },
    ]);

    const quizRepo = new PrismaAcademyQuizRepository(prisma);
    await quizRepo.submitAndGradeAttempt(learnerAId, attemptId);

    // Verify zero progress records
    const courseProgress = await prisma.academyUserCourseProgress.findMany({ where: { userId: learnerAId } });
    expect(courseProgress).toHaveLength(0);

    const lessonProgress = await prisma.academyUserLessonProgress.findMany({ where: { userId: learnerAId } });
    expect(lessonProgress).toHaveLength(0);

    // Verify zero XP or reward ledger
    const userXp = await prisma.academyUserXp.findMany({ where: { userId: learnerAId } });
    expect(userXp).toHaveLength(0);

    const rewardLedger = await prisma.academyRewardLedger.findMany({ where: { userId: learnerAId } });
    expect(rewardLedger).toHaveLength(0);

    // Verify zero auth audit records created by quiz submission
    const auditRecords = await prisma.authSecurityAuditRecord.findMany({ where: { userId: learnerAId } });
    expect(auditRecords).toHaveLength(0);
  });

  // ==========================================================================
  // Section 17: Direct DB Constraint Tests Bypassing Service (DEF-025-01 & AC-019)
  // ==========================================================================

  describe("Direct DB Constraint Rejections & Acceptances (DEF-025-01)", () => {
    // 0. CREATED state violations
    it("rejects direct SQL INSERT of CREATED with non-null score", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "score", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 891, 'CREATED', 50, 'Direct Test', NOW(), NOW());
        `,
      ).rejects.toThrow();
    });

    it("rejects direct SQL INSERT of CREATED with non-null passed", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "passed", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 892, 'CREATED', true, 'Direct Test', NOW(), NOW());
        `,
      ).rejects.toThrow();
    });

    it("rejects direct SQL INSERT of CREATED with non-null submitted_at", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "submitted_at", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 893, 'CREATED', NOW(), 'Direct Test', NOW(), NOW());
        `,
      ).rejects.toThrow();
    });

    it("rejects direct SQL INSERT of CREATED with non-null graded_at", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "graded_at", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 894, 'CREATED', NOW(), 'Direct Test', NOW(), NOW());
        `,
      ).rejects.toThrow();
    });

    // 1. IN_PROGRESS state violations
    it("rejects direct SQL INSERT of IN_PROGRESS with non-null score", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "score", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 901, 'IN_PROGRESS', 50, 'Direct Test', NOW(), NOW());
        `,
      ).rejects.toThrow();
    });

    it("rejects direct SQL INSERT of IN_PROGRESS with non-null passed", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "passed", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 902, 'IN_PROGRESS', true, 'Direct Test', NOW(), NOW());
        `,
      ).rejects.toThrow();
    });

    it("rejects direct SQL INSERT of IN_PROGRESS with non-null submitted_at", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "submitted_at", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 903, 'IN_PROGRESS', NOW(), 'Direct Test', NOW(), NOW());
        `,
      ).rejects.toThrow();
    });

    it("rejects direct SQL INSERT of IN_PROGRESS with non-null graded_at", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "graded_at", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 904, 'IN_PROGRESS', NOW(), 'Direct Test', NOW(), NOW());
        `,
      ).rejects.toThrow();
    });

    // 2. SUBMITTED state violations
    it("rejects direct SQL INSERT of SUBMITTED with NULL submitted_at", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "submitted_at", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 905, 'SUBMITTED', NULL, 'Direct Test', NOW(), NOW());
        `,
      ).rejects.toThrow();
    });

    it("rejects direct SQL INSERT of SUBMITTED with non-null score", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "submitted_at", "score", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 906, 'SUBMITTED', NOW(), 100, 'Direct Test', NOW(), NOW());
        `,
      ).rejects.toThrow();
    });

    it("rejects direct SQL INSERT of SUBMITTED with non-null passed", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "submitted_at", "passed", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 907, 'SUBMITTED', NOW(), true, 'Direct Test', NOW(), NOW());
        `,
      ).rejects.toThrow();
    });

    it("rejects direct SQL INSERT of SUBMITTED with non-null graded_at", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "submitted_at", "graded_at", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 908, 'SUBMITTED', NOW(), NOW(), 'Direct Test', NOW(), NOW());
        `,
      ).rejects.toThrow();
    });

    // 3. GRADED state violations
    it("rejects direct SQL INSERT of GRADED with NULL score", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "submitted_at", "graded_at", "score", "passed", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 909, 'GRADED', NOW(), NOW(), NULL, true, 'Direct Test', NOW(), NOW());
        `,
      ).rejects.toThrow();
    });

    it("rejects direct SQL INSERT of GRADED with NULL passed", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "submitted_at", "graded_at", "score", "passed", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 910, 'GRADED', NOW(), NOW(), 80, NULL, 'Direct Test', NOW(), NOW());
        `,
      ).rejects.toThrow();
    });

    it("rejects direct SQL INSERT of GRADED with NULL submitted_at", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "submitted_at", "graded_at", "score", "passed", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 911, 'GRADED', NULL, NOW(), 80, true, 'Direct Test', NOW(), NOW());
        `,
      ).rejects.toThrow();
    });

    it("rejects direct SQL INSERT of GRADED with NULL graded_at", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "submitted_at", "graded_at", "score", "passed", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 912, 'GRADED', NOW(), NULL, 80, true, 'Direct Test', NOW(), NOW());
        `,
      ).rejects.toThrow();
    });

    // 4. Score range violations
    it("rejects direct SQL INSERT of score > 100 or score < 0", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "submitted_at", "graded_at", "score", "passed", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 913, 'GRADED', NOW(), NOW(), 101, true, 'Direct Test', NOW(), NOW());
        `,
      ).rejects.toThrow();

      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "submitted_at", "graded_at", "score", "passed", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 914, 'GRADED', NOW(), NOW(), -1, false, 'Direct Test', NOW(), NOW());
        `,
      ).rejects.toThrow();
    });

    // 5. Valid states prove accepted
    it("proves valid lifecycle states are accepted by PostgreSQL engine", async () => {
      // Valid CREATED
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "score", "passed", "submitted_at", "graded_at", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 914, 'CREATED', NULL, NULL, NULL, NULL, 'Valid CREATED', NOW(), NOW());
        `,
      ).resolves.toBe(1);

      // Valid IN_PROGRESS
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "score", "passed", "submitted_at", "graded_at", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 915, 'IN_PROGRESS', NULL, NULL, NULL, NULL, 'Valid IN_PROGRESS', NOW(), NOW());
        `,
      ).resolves.toBe(1);

      // Valid SUBMITTED
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "score", "passed", "submitted_at", "graded_at", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 916, 'SUBMITTED', NULL, NULL, NOW(), NULL, 'Valid SUBMITTED', NOW(), NOW());
        `,
      ).resolves.toBe(1);

      // Valid GRADED
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "score", "passed", "submitted_at", "graded_at", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 917, 'GRADED', 100, true, NOW(), NOW(), 'Valid GRADED', NOW(), NOW());
        `,
      ).resolves.toBe(1);
    });

    // 6. Transition Compatibility (Section 10)
    it("verifies valid runtime transition IN_PROGRESS -> SUBMITTED -> GRADED inside one transaction succeeds", async () => {
      const transAttemptId = "00000000-0000-0000-0000-000000000999";
      await prisma.$transaction(async (tx) => {
        // Step 1: Create attempt in IN_PROGRESS
        await tx.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "score", "passed", "submitted_at", "graded_at", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (${transAttemptId}, ${learnerAId}, ${publishedQuizId}, 999, 'IN_PROGRESS', NULL, NULL, NULL, NULL, 'Transition Test', NOW(), NOW());
        `;

        // Step 2: Transition to SUBMITTED
        await tx.$executeRaw`
          UPDATE "academy_quiz_attempts"
          SET "status" = 'SUBMITTED', "submitted_at" = NOW(), "updated_at" = NOW()
          WHERE "id" = ${transAttemptId};
        `;

        // Step 3: Transition to GRADED
        await tx.$executeRaw`
          UPDATE "academy_quiz_attempts"
          SET "status" = 'GRADED', "score" = 100, "passed" = true, "graded_at" = NOW(), "updated_at" = NOW()
          WHERE "id" = ${transAttemptId};
        `;
      });

      const finalAttempt = await prisma.academyQuizAttempt.findUnique({
        where: { id: transAttemptId },
      });
      expect(finalAttempt?.status).toBe("GRADED");
      expect(finalAttempt?.score).toBe(100);
      expect(finalAttempt?.passed).toBe(true);
      expect(finalAttempt?.submittedAt).toBeDefined();
      expect(finalAttempt?.gradedAt).toBeDefined();
    });
  });

  // ==========================================================================
  // Section 18: Migration Preflight Fail-Safe Verification (DEF-025-01)
  // ==========================================================================

  describe("Migration Preflight Fail-Safe Tests", () => {
    it("fails safely and aborts migration when historical row has IN_PROGRESS + score != NULL", async () => {
      // Temporarily drop constraint to simulate dirty historical DB
      await prisma.$executeRawUnsafe(`ALTER TABLE "academy_quiz_attempts" DROP CONSTRAINT IF EXISTS "academy_quiz_attempts_graded_state_check";`);

      try {
        await prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "score", "quiz_title_snapshot", "created_at", "updated_at")
          VALUES (gen_random_uuid()::text, ${learnerAId}, ${publishedQuizId}, 950, 'IN_PROGRESS', 85, 'Corrupt Preflight', NOW(), NOW());
        `;

        const preflightSql = `
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM "academy_quiz_attempts"
              WHERE "status" IN ('CREATED', 'IN_PROGRESS')
                AND ("score" IS NOT NULL OR "passed" IS NOT NULL OR "submitted_at" IS NOT NULL OR "graded_at" IS NOT NULL)
            ) THEN
              RAISE EXCEPTION 'Preflight check failed: CREATED or IN_PROGRESS attempts found with non-NULL score, passed, submitted_at, or graded_at';
            END IF;
          END $$;
        `;

        await expect(prisma.$executeRawUnsafe(preflightSql)).rejects.toThrow(/Preflight check failed/);
      } finally {
        await prisma.academyQuizAttempt.deleteMany({ where: { quizTitleSnapshot: "Corrupt Preflight" } });
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "academy_quiz_attempts"
            ADD CONSTRAINT "academy_quiz_attempts_graded_state_check"
            CHECK (
              ("status" IN ('CREATED', 'IN_PROGRESS') AND "score" IS NULL AND "passed" IS NULL AND "submitted_at" IS NULL AND "graded_at" IS NULL)
              OR
              ("status" = 'SUBMITTED' AND "submitted_at" IS NOT NULL AND "score" IS NULL AND "passed" IS NULL AND "graded_at" IS NULL)
              OR
              ("status" = 'GRADED' AND "submitted_at" IS NOT NULL AND "graded_at" IS NOT NULL AND "score" IS NOT NULL AND "passed" IS NOT NULL)
            );
        `);
      }
    });
  });
});
