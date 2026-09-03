import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage } from "../helpers/test-db-guard.js";
import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import { PrismaTransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("FEAT-019 Academy Domain Persistence & PostgreSQL Constraints (Integration)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test";

  let prisma: PrismaClient;
  let repos: IRepositoryContainer;

  beforeAll(async () => {
    assertSafeTestDatabase(testDbUrl, "test");

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
    });

    try {
      await prisma.$connect();
      repos = createRepositoryContainer(prisma);
    } catch (err: unknown) {
      const errorMessage = sanitizeDiagnosticMessage(
        err instanceof Error ? err.message : String(err),
      );
      throw new Error(
        `[DB_CONNECTION_FAILED] Required PostgreSQL test database is unreachable. Error: ${errorMessage}`,
      );
    }
  });

  async function cleanupAcademyData() {
    await prisma.$transaction(async (tx) => {
      // Delete in reverse dependency order
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

      // Clean up test users
      await tx.userRole.deleteMany();
      await tx.credential.deleteMany();
      await tx.refreshSession.deleteMany();
      await tx.authSecurityAuditRecord.deleteMany();
      await tx.user.deleteMany({
        where: {
          email: {
            contains: "@academy.test",
          },
        },
      });
    });
  }

  beforeEach(async () => {
    await cleanupAcademyData();
  });

  afterAll(async () => {
    if (prisma) {
      try {
        await cleanupAcademyData();
      } catch {
        // Ignore cleanup error
      } finally {
        await prisma.$disconnect();
      }
    }
  });

  // Helper to create a test user
  async function createTestUser(suffix = "1") {
    return prisma.user.create({
      data: {
        email: `learner.${suffix}@academy.test`,
        displayName: `Learner ${suffix}`,
      },
    });
  }

  // Helper to create a valid question with 1 correct option and optional incorrect options
  async function createValidQuestionWithOptions(quizId: string, prompt: string, order: number) {
    return prisma.$transaction(async (tx) => {
      const question = await tx.academyQuizQuestion.create({
        data: {
          quizId,
          prompt,
          type: "SINGLE_CHOICE",
          order,
        },
      });

      const opt1 = await tx.academyQuizOption.create({
        data: {
          questionId: question.id,
          text: "Correct Option",
          isCorrect: true,
          order: 1,
        },
      });

      const opt2 = await tx.academyQuizOption.create({
        data: {
          questionId: question.id,
          text: "Incorrect Option",
          isCorrect: false,
          order: 2,
        },
      });

      return { question, opt1, opt2 };
    });
  }

  describe("AC-003, AC-004: Durable Models & UUID Primary Keys", () => {
    it("creates course and lesson with UUID primary keys and default status", async () => {
      const course = await repos.academyCourseRepo.createCourse({
        slug: "intro-investing",
        title: "Introduction to Investing",
        description: "Learn the fundamentals of investing",
      });

      expect(course.id).toMatch(UUID_PATTERN);
      expect(course.status).toBe("DRAFT");
      expect(course.level).toBe("BEGINNER");

      const lesson = await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Stock Market Basics",
        slug: "stock-market-basics",
        order: 1,
      });

      expect(lesson.id).toMatch(UUID_PATTERN);
      expect(lesson.courseId).toBe(course.id);
      expect(lesson.status).toBe("DRAFT");
    });
  });

  describe("AC-006: Course Slug Uniqueness", () => {
    it("enforces unique course slug in PostgreSQL", async () => {
      await repos.academyCourseRepo.createCourse({
        slug: "crypto-101",
        title: "Crypto 101",
      });

      await expect(
        repos.academyCourseRepo.createCourse({
          slug: "crypto-101",
          title: "Duplicate Crypto",
        }),
      ).rejects.toThrow();
    });
  });

  describe("AC-007, AC-034, AC-035: Scoped Ordering & Deterministic Ownership", () => {
    it("enforces lesson ordering uniqueness within course and allows duplicate order in different courses", async () => {
      const course1 = await repos.academyCourseRepo.createCourse({
        slug: "c1",
        title: "Course 1",
      });
      const course2 = await repos.academyCourseRepo.createCourse({
        slug: "c2",
        title: "Course 2",
      });

      await repos.academyCourseRepo.createLesson({
        courseId: course1.id,
        title: "Lesson 1",
        slug: "l1",
        order: 1,
      });

      // Duplicate order within course1 must fail
      await expect(
        repos.academyCourseRepo.createLesson({
          courseId: course1.id,
          title: "Lesson 2 with duplicate order",
          slug: "l2",
          order: 1,
        }),
      ).rejects.toThrow();

      // Same order in course2 must succeed
      const lessonCourse2 = await repos.academyCourseRepo.createLesson({
        courseId: course2.id,
        title: "Lesson 1 Course 2",
        slug: "l1-c2",
        order: 1,
      });
      expect(lessonCourse2.order).toBe(1);
    });

    it("enforces quiz and flashcard ownership belongs strictly to lesson", async () => {
      const course = await repos.academyCourseRepo.createCourse({
        slug: "ownership-course",
        title: "Ownership Course",
      });
      const lesson = await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Ownership Lesson",
        slug: "ownership-lesson",
        order: 1,
      });

      const quiz = await repos.academyQuizRepo.createQuiz({
        lessonId: lesson.id,
        title: "Lesson 1 Quiz",
        order: 1,
      });
      expect(quiz.lessonId).toBe(lesson.id);

      const flashcard = await repos.academyCourseRepo.createFlashcard({
        lessonId: lesson.id,
        front: "What is ROI?",
        back: "Return on Investment",
        order: 1,
      });
      expect(flashcard.lessonId).toBe(lesson.id);

      // Duplicate flashcard order in same lesson must fail
      await expect(
        repos.academyCourseRepo.createFlashcard({
          lessonId: lesson.id,
          front: "Duplicate Front",
          back: "Duplicate Back",
          order: 1,
        }),
      ).rejects.toThrow();
    });
  });

  describe("DEF-001, AC-036, AC-037: Exactly ONE Correct Option Enforcement in PostgreSQL", () => {
    it("PASS: Exactly 1 correct option commits successfully", async () => {
      const course = await repos.academyCourseRepo.createCourse({
        slug: "quiz-course-pass",
        title: "Quiz Course Pass",
      });
      const lesson = await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Quiz Lesson",
        slug: "quiz-lesson",
        order: 1,
      });
      const quiz = await repos.academyQuizRepo.createQuiz({
        lessonId: lesson.id,
        title: "Single Choice Quiz",
      });

      const { question, opt1, opt2 } = await createValidQuestionWithOptions(
        quiz.id,
        "What is the primary exchange for US tech stocks?",
        1,
      );

      expect(question.id).toMatch(UUID_PATTERN);
      expect(opt1.isCorrect).toBe(true);
      expect(opt2.isCorrect).toBe(false);
    });

    it("REJECTED: 0 correct options (only false options) is rejected at commit time", async () => {
      const course = await repos.academyCourseRepo.createCourse({
        slug: "quiz-course-zero",
        title: "Quiz Course Zero",
      });
      const lesson = await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Quiz Lesson Zero",
        slug: "quiz-lesson-zero",
        order: 1,
      });
      const quiz = await repos.academyQuizRepo.createQuiz({
        lessonId: lesson.id,
        title: "Zero Correct Quiz",
      });

      // Attempting to create question with only false options must fail on transaction commit
      await expect(
        prisma.$transaction(async (tx) => {
          const question = await tx.academyQuizQuestion.create({
            data: {
              quizId: quiz.id,
              prompt: "Question with no correct option",
              type: "SINGLE_CHOICE",
              order: 1,
            },
          });

          await tx.academyQuizOption.create({
            data: {
              questionId: question.id,
              text: "False Option 1",
              isCorrect: false,
              order: 1,
            },
          });

          await tx.academyQuizOption.create({
            data: {
              questionId: question.id,
              text: "False Option 2",
              isCorrect: false,
              order: 2,
            },
          });
        }),
      ).rejects.toThrow();
    });

    it("REJECTED: 2 correct options is rejected immediately by PostgreSQL partial unique index", async () => {
      const course = await repos.academyCourseRepo.createCourse({
        slug: "quiz-course-two",
        title: "Quiz Course Two",
      });
      const lesson = await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Quiz Lesson Two",
        slug: "quiz-lesson-two",
        order: 1,
      });
      const quiz = await repos.academyQuizRepo.createQuiz({
        lessonId: lesson.id,
        title: "Two Correct Quiz",
      });

      await expect(
        prisma.$transaction(async (tx) => {
          const question = await tx.academyQuizQuestion.create({
            data: {
              quizId: quiz.id,
              prompt: "Question with 2 correct options",
              type: "SINGLE_CHOICE",
              order: 1,
            },
          });

          await tx.academyQuizOption.create({
            data: {
              questionId: question.id,
              text: "Correct Option 1",
              isCorrect: true,
              order: 1,
            },
          });

          await tx.academyQuizOption.create({
            data: {
              questionId: question.id,
              text: "Correct Option 2 (Prohibited)",
              isCorrect: true,
              order: 2,
            },
          });
        }),
      ).rejects.toThrow();
    });
  });

  describe("DEF-002: PostgreSQL DB-Backed Closed-Set Checks", () => {
    it("rejects invalid AcademyCourse.status", async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_courses" ("id", "slug", "title", "status", "level", "order", "updated_at")
          VALUES (gen_random_uuid()::text, 'invalid-course-status', 'Invalid Course', 'NOT_A_STATUS', 'BEGINNER', 1, now());
        `,
      ).rejects.toThrow();
    });

    it("rejects invalid AcademyLesson.status", async () => {
      const course = await repos.academyCourseRepo.createCourse({
        slug: "valid-course-for-lesson",
        title: "Valid Course",
      });

      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_lessons" ("id", "course_id", "title", "slug", "status", "order", "updated_at")
          VALUES (gen_random_uuid()::text, ${course.id}, 'Invalid Lesson', 'invalid-lesson', 'UNKNOWN', 1, now());
        `,
      ).rejects.toThrow();
    });

    it("rejects invalid AcademyQuiz.status", async () => {
      const course = await repos.academyCourseRepo.createCourse({
        slug: "valid-course-for-quiz",
        title: "Valid Course",
      });
      const lesson = await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Lesson",
        slug: "lesson",
        order: 1,
      });

      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quizzes" ("id", "lesson_id", "title", "status", "order", "passing_score", "updated_at")
          VALUES (gen_random_uuid()::text, ${lesson.id}, 'Invalid Quiz', 'INVALID_STATUS', 1, 80, now());
        `,
      ).rejects.toThrow();
    });

    it("rejects invalid AcademyQuizQuestion.type (e.g. MULTI_SELECT)", async () => {
      const course = await repos.academyCourseRepo.createCourse({
        slug: "valid-course-q-type",
        title: "Valid Course",
      });
      const lesson = await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Lesson",
        slug: "lesson",
        order: 1,
      });
      const quiz = await repos.academyQuizRepo.createQuiz({
        lessonId: lesson.id,
        title: "Quiz",
      });

      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_questions" ("id", "quiz_id", "prompt", "type", "order", "updated_at")
          VALUES (gen_random_uuid()::text, ${quiz.id}, 'Multi select question', 'MULTI_SELECT', 1, now());
        `,
      ).rejects.toThrow();
    });

    it("rejects invalid AcademyQuizAttempt.status", async () => {
      const user = await createTestUser("attempt-status");
      const course = await repos.academyCourseRepo.createCourse({
        slug: "valid-course-att",
        title: "Valid Course",
      });
      const lesson = await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Lesson",
        slug: "lesson",
        order: 1,
      });
      const quiz = await repos.academyQuizRepo.createQuiz({
        lessonId: lesson.id,
        title: "Quiz",
      });

      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "quiz_title_snapshot", "updated_at")
          VALUES (gen_random_uuid()::text, ${user.id}, ${quiz.id}, 1, 'INVALID_ATTEMPT_STATUS', 'Quiz Snapshot', now());
        `,
      ).rejects.toThrow();
    });

    it("rejects invalid AcademyUserCourseProgress.status", async () => {
      const user = await createTestUser("cp-status");
      const course = await repos.academyCourseRepo.createCourse({
        slug: "valid-course-cp",
        title: "Valid Course",
      });

      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_user_course_progress" ("id", "user_id", "course_id", "status", "updated_at")
          VALUES (gen_random_uuid()::text, ${user.id}, ${course.id}, 'NOT_A_PROGRESS_STATUS', now());
        `,
      ).rejects.toThrow();
    });

    it("rejects invalid AcademyRewardLedger.status, sourceType, and rewardType", async () => {
      const user = await createTestUser("reward-closed");

      // Invalid status
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_reward_ledger" ("id", "user_id", "source_type", "source_id", "reward_type", "amount", "status")
          VALUES (gen_random_uuid()::text, ${user.id}, 'COURSE_COMPLETION', 'c1', 'XP', 100, 'BOGUS_STATUS');
        `,
      ).rejects.toThrow();

      // Invalid sourceType
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_reward_ledger" ("id", "user_id", "source_type", "source_id", "reward_type", "amount", "status")
          VALUES (gen_random_uuid()::text, ${user.id}, 'BOGUS_SOURCE', 'c1', 'XP', 100, 'APPLIED');
        `,
      ).rejects.toThrow();

      // Invalid rewardType
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_reward_ledger" ("id", "user_id", "source_type", "source_id", "reward_type", "amount", "status")
          VALUES (gen_random_uuid()::text, ${user.id}, 'COURSE_COMPLETION', 'c1', 'BITCOIN', 100, 'APPLIED');
        `,
      ).rejects.toThrow();
    });
  });

  describe("DEF-003 & DEF-007: Answer / Question / Option / Attempt Same-Quiz Relational Integrity", () => {
    it("PASS: Q1 + option(Q1) for same quiz creates answer successfully", async () => {
      const user = await createTestUser("ans-valid");
      const course = await repos.academyCourseRepo.createCourse({
        slug: "ans-course-1",
        title: "Answer Course",
      });
      const lesson = await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Answer Lesson",
        slug: "ans-lesson",
        order: 1,
      });
      const quiz = await repos.academyQuizRepo.createQuiz({
        lessonId: lesson.id,
        title: "Answer Quiz",
      });

      const { question: q1, opt1: optQ1 } = await createValidQuestionWithOptions(
        quiz.id,
        "Question 1 Prompt",
        1,
      );

      const attempt = await repos.academyQuizRepo.createAttempt({
        userId: user.id,
        quizId: quiz.id,
        attemptNumber: 1,
        quizTitleSnapshot: "Answer Quiz",
      });

      const answer = await repos.academyQuizRepo.createAnswer({
        attemptId: attempt.id,
        quizId: quiz.id,
        questionId: q1.id,
        selectedOptionId: optQ1.id,
        isCorrect: true,
        questionPromptSnapshot: "Question 1 Prompt",
        selectedOptionTextSnapshot: "Correct Option",
      });

      expect(answer.questionId).toBe(q1.id);
      expect(answer.selectedOptionId).toBe(optQ1.id);
      expect(answer.quizId).toBe(quiz.id);
    });

    it("REJECTED: Q1 + option(Q2) fails at PostgreSQL level via composite foreign key", async () => {
      const user = await createTestUser("ans-invalid");
      const course = await repos.academyCourseRepo.createCourse({
        slug: "ans-course-2",
        title: "Answer Course 2",
      });
      const lesson = await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Answer Lesson 2",
        slug: "ans-lesson-2",
        order: 1,
      });
      const quiz = await repos.academyQuizRepo.createQuiz({
        lessonId: lesson.id,
        title: "Answer Quiz 2",
      });

      const { question: q1 } = await createValidQuestionWithOptions(
        quiz.id,
        "Question 1 Prompt",
        1,
      );
      const { opt1: optQ2 } = await createValidQuestionWithOptions(
        quiz.id,
        "Question 2 Prompt",
        2,
      );

      const attempt = await repos.academyQuizRepo.createAttempt({
        userId: user.id,
        quizId: quiz.id,
        attemptNumber: 1,
        quizTitleSnapshot: "Answer Quiz 2",
      });

      // Attempting to insert answer with questionId=Q1 and selectedOptionId=Option_of_Q2 must fail!
      await expect(
        repos.academyQuizRepo.createAnswer({
          attemptId: attempt.id,
          quizId: quiz.id,
          questionId: q1.id,
          selectedOptionId: optQ2.id, // Belonging to Q2!
          isCorrect: false,
          questionPromptSnapshot: "Question 1 Prompt",
          selectedOptionTextSnapshot: "Cross-question option",
        }),
      ).rejects.toThrow();
    });

    it("REJECTED: Attempt for Quiz A + Question for Quiz B fails at PostgreSQL level via composite foreign key (DEF-007)", async () => {
      const user = await createTestUser("cross-quiz-ans");
      const course = await repos.academyCourseRepo.createCourse({
        slug: "cross-quiz-course",
        title: "Cross Quiz Course",
      });
      const lesson = await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Cross Quiz Lesson",
        slug: "cross-quiz-lesson",
        order: 1,
      });
      const quizA = await repos.academyQuizRepo.createQuiz({
        lessonId: lesson.id,
        title: "Quiz A",
        order: 1,
      });
      const quizB = await repos.academyQuizRepo.createQuiz({
        lessonId: lesson.id,
        title: "Quiz B",
        order: 2,
      });

      const { question: qA, opt1: optQA } = await createValidQuestionWithOptions(
        quizA.id,
        "Quiz A Question",
        1,
      );
      const { question: qB, opt1: optQB } = await createValidQuestionWithOptions(
        quizB.id,
        "Quiz B Question",
        1,
      );

      // Attempt is created for Quiz A
      const attemptA = await repos.academyQuizRepo.createAttempt({
        userId: user.id,
        quizId: quizA.id,
        attemptNumber: 1,
        quizTitleSnapshot: "Quiz A",
      });

      // 1. Attempt Quiz A + Question Quiz A + Option Question A -> PASS
      const validAnswer = await repos.academyQuizRepo.createAnswer({
        attemptId: attemptA.id,
        quizId: quizA.id,
        questionId: qA.id,
        selectedOptionId: optQA.id,
        isCorrect: true,
        questionPromptSnapshot: "Quiz A Question",
        selectedOptionTextSnapshot: "Correct Option",
      });
      expect(validAnswer.id).toBeDefined();

      // 2. Attempt Quiz A + Question Quiz B (passing quizId=quizA) -> FAILS on (question_id, quiz_id) FK
      await expect(
        repos.academyQuizRepo.createAnswer({
          attemptId: attemptA.id,
          quizId: quizA.id,
          questionId: qB.id, // Belonging to Quiz B!
          selectedOptionId: optQB.id,
          isCorrect: true,
          questionPromptSnapshot: "Cross Quiz Question",
          selectedOptionTextSnapshot: "Option",
        }),
      ).rejects.toThrow();

      // 3. Attempt Quiz A + Question Quiz B (passing quizId=quizB) -> FAILS on (attempt_id, quiz_id) FK
      await expect(
        repos.academyQuizRepo.createAnswer({
          attemptId: attemptA.id,
          quizId: quizB.id, // Does not match attempt's quizA!
          questionId: qB.id,
          selectedOptionId: optQB.id,
          isCorrect: true,
          questionPromptSnapshot: "Cross Quiz Question",
          selectedOptionTextSnapshot: "Option",
        }),
      ).rejects.toThrow();
    });
  });

  describe("DEF-011: Repository Question & Options Creation Contract", () => {
    it("creates question and options atomically via createQuestionWithOptions (PASS for exactly 1 correct)", async () => {
      const course = await repos.academyCourseRepo.createCourse({
        slug: "contract-course",
        title: "Contract Course",
      });
      const lesson = await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Contract Lesson",
        slug: "contract-lesson",
        order: 1,
      });
      const quiz = await repos.academyQuizRepo.createQuiz({
        lessonId: lesson.id,
        title: "Contract Quiz",
      });

      const res = await repos.academyQuizRepo.createQuestionWithOptions({
        quizId: quiz.id,
        prompt: "What is an index fund?",
        order: 1,
        options: [
          { text: "A portfolio designed to mimic an index", isCorrect: true, order: 1 },
          { text: "A speculative crypto coin", isCorrect: false, order: 2 },
          { text: "A debt instrument only", isCorrect: false, order: 3 },
        ],
      });

      expect(res.question.id).toBeDefined();
      expect(res.options).toHaveLength(3);
      expect(res.options.filter((o) => o.isCorrect)).toHaveLength(1);
    });

    it("REJECTED: createQuestionWithOptions with 0 correct options fails and rolls back", async () => {
      const course = await repos.academyCourseRepo.createCourse({
        slug: "contract-course-0",
        title: "Contract Course 0",
      });
      const lesson = await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Contract Lesson 0",
        slug: "contract-lesson-0",
        order: 1,
      });
      const quiz = await repos.academyQuizRepo.createQuiz({
        lessonId: lesson.id,
        title: "Contract Quiz 0",
      });

      await expect(
        repos.academyQuizRepo.createQuestionWithOptions({
          quizId: quiz.id,
          prompt: "No correct options question?",
          order: 1,
          options: [
            { text: "Wrong 1", isCorrect: false, order: 1 },
            { text: "Wrong 2", isCorrect: false, order: 2 },
          ],
        }),
      ).rejects.toThrow();

      // Verify transaction rollback: zero questions or options created
      const questions = await repos.academyQuizRepo.listQuestionsByQuiz(quiz.id);
      expect(questions).toHaveLength(0);
    });

    it("REJECTED: createQuestionWithOptions with 2 correct options fails and rolls back", async () => {
      const course = await repos.academyCourseRepo.createCourse({
        slug: "contract-course-2",
        title: "Contract Course 2",
      });
      const lesson = await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Contract Lesson 2",
        slug: "contract-lesson-2",
        order: 1,
      });
      const quiz = await repos.academyQuizRepo.createQuiz({
        lessonId: lesson.id,
        title: "Contract Quiz 2",
      });

      await expect(
        repos.academyQuizRepo.createQuestionWithOptions({
          quizId: quiz.id,
          prompt: "Two correct options question?",
          order: 1,
          options: [
            { text: "Correct 1", isCorrect: true, order: 1 },
            { text: "Correct 2", isCorrect: true, order: 2 },
          ],
        }),
      ).rejects.toThrow();

      // Verify transaction rollback: zero questions or options created
      const questions = await repos.academyQuizRepo.listQuestionsByQuiz(quiz.id);
      expect(questions).toHaveLength(0);
    });
  });

  describe("DEF-004: Attempt Sequencing & attemptNumber Invariants", () => {
    it("enforces attemptNumber >= 1 and scoped uniqueness (quizId, userId, attemptNumber)", async () => {
      const user1 = await createTestUser("attempt-seq-1");
      const user2 = await createTestUser("attempt-seq-2");
      const course = await repos.academyCourseRepo.createCourse({
        slug: "seq-course",
        title: "Sequence Course",
      });
      const lesson = await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Sequence Lesson",
        slug: "seq-lesson",
        order: 1,
      });
      const quiz1 = await repos.academyQuizRepo.createQuiz({
        lessonId: lesson.id,
        title: "Sequence Quiz 1",
        order: 1,
      });
      const quiz2 = await repos.academyQuizRepo.createQuiz({
        lessonId: lesson.id,
        title: "Sequence Quiz 2",
        order: 2,
      });

      // 1. First attempt for User1 on Quiz1 with attemptNumber=1 succeeds
      const att1 = await repos.academyQuizRepo.createAttempt({
        userId: user1.id,
        quizId: quiz1.id,
        attemptNumber: 1,
        quizTitleSnapshot: "Sequence Quiz 1",
      });
      expect(att1.attemptNumber).toBe(1);

      // 2. Duplicate attempt with same (quiz1, user1, attemptNumber=1) MUST FAIL
      await expect(
        repos.academyQuizRepo.createAttempt({
          userId: user1.id,
          quizId: quiz1.id,
          attemptNumber: 1,
          quizTitleSnapshot: "Duplicate Attempt",
        }),
      ).rejects.toThrow();

      // 3. Same quiz/user with different attemptNumber (attemptNumber=2) MUST SUCCEED
      const att2 = await repos.academyQuizRepo.createAttempt({
        userId: user1.id,
        quizId: quiz1.id,
        attemptNumber: 2,
        quizTitleSnapshot: "Sequence Quiz 1 Attempt 2",
      });
      expect(att2.attemptNumber).toBe(2);

      // 4. Different user on same quiz with attemptNumber=1 MUST SUCCEED
      const attUser2 = await repos.academyQuizRepo.createAttempt({
        userId: user2.id,
        quizId: quiz1.id,
        attemptNumber: 1,
        quizTitleSnapshot: "Sequence Quiz 1 User 2",
      });
      expect(attUser2.userId).toBe(user2.id);

      // 5. Same user on different quiz with attemptNumber=1 MUST SUCCEED
      const attQuiz2 = await repos.academyQuizRepo.createAttempt({
        userId: user1.id,
        quizId: quiz2.id,
        attemptNumber: 1,
        quizTitleSnapshot: "Sequence Quiz 2",
      });
      expect(attQuiz2.quizId).toBe(quiz2.id);

      // 6. attemptNumber <= 0 MUST FAIL via PostgreSQL CHECK constraint
      await expect(
        prisma.$executeRaw`
          INSERT INTO "academy_quiz_attempts" ("id", "user_id", "quiz_id", "attempt_number", "status", "quiz_title_snapshot", "updated_at")
          VALUES (gen_random_uuid()::text, ${user1.id}, ${quiz1.id}, 0, 'CREATED', 'Zero Attempt', now());
        `,
      ).rejects.toThrow();
    });
  });

  describe("DEF-005: Progress State & Timestamp Integrity (Completed-Only Semantics)", () => {
    it("enforces completed-only semantics for AcademyUserCourseProgress", async () => {
      const user = await createTestUser("prog-sem-c");
      const course = await repos.academyCourseRepo.createCourse({
        slug: "prog-sem-course",
        title: "Progress Semantics Course",
      });

      // 1. NOT_STARTED with completedAt = null -> PASS
      const p1 = await repos.academyProgressRepo.upsertCourseProgress({
        userId: user.id,
        courseId: course.id,
        status: "NOT_STARTED",
        completedAt: null,
      });
      expect(p1.status).toBe("NOT_STARTED");

      // 2. NOT_STARTED with completedAt != null -> FAIL
      await expect(
        prisma.$executeRaw`
          UPDATE "academy_user_course_progress"
          SET "completed_at" = now()
          WHERE "id" = ${p1.id};
        `,
      ).rejects.toThrow();

      // 3. IN_PROGRESS with completedAt != null -> FAIL
      await expect(
        prisma.$executeRaw`
          UPDATE "academy_user_course_progress"
          SET "status" = 'IN_PROGRESS', "completed_at" = now()
          WHERE "id" = ${p1.id};
        `,
      ).rejects.toThrow();

      // 4. COMPLETED with completedAt = null -> FAIL
      await expect(
        prisma.$executeRaw`
          UPDATE "academy_user_course_progress"
          SET "status" = 'COMPLETED', "completed_at" = NULL
          WHERE "id" = ${p1.id};
        `,
      ).rejects.toThrow();

      // 5. COMPLETED with completedAt != null -> PASS
      const pCompleted = await repos.academyProgressRepo.upsertCourseProgress({
        userId: user.id,
        courseId: course.id,
        status: "COMPLETED",
        completedAt: new Date(),
      });
      expect(pCompleted.status).toBe("COMPLETED");
      expect(pCompleted.completedAt).not.toBeNull();
    });

    it("enforces completed-only semantics for AcademyUserLessonProgress", async () => {
      const user = await createTestUser("prog-sem-l");
      const course = await repos.academyCourseRepo.createCourse({
        slug: "prog-sem-course-l",
        title: "Course",
      });
      const lesson = await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Lesson",
        slug: "lesson",
        order: 1,
      });

      // 1. IN_PROGRESS with completedAt = null -> PASS
      const p1 = await repos.academyProgressRepo.upsertLessonProgress({
        userId: user.id,
        lessonId: lesson.id,
        status: "IN_PROGRESS",
        completedAt: null,
      });
      expect(p1.status).toBe("IN_PROGRESS");

      // 2. IN_PROGRESS with completedAt != null -> FAIL
      await expect(
        prisma.$executeRaw`
          UPDATE "academy_user_lesson_progress"
          SET "completed_at" = now()
          WHERE "id" = ${p1.id};
        `,
      ).rejects.toThrow();

      // 3. COMPLETED with completedAt != null -> PASS
      const pCompleted = await repos.academyProgressRepo.upsertLessonProgress({
        userId: user.id,
        lessonId: lesson.id,
        status: "COMPLETED",
        completedAt: new Date(),
      });
      expect(pCompleted.status).toBe("COMPLETED");
      expect(pCompleted.completedAt).not.toBeNull();
    });
  });

  describe("AC-008, AC-038: Attempt & Answer Snapshots and Single-Answer Uniqueness", () => {
    it("enforces unique answer per question per attempt and preserves historical snapshots", async () => {
      const user = await createTestUser("attempt-snap");
      const course = await repos.academyCourseRepo.createCourse({
        slug: "attempt-course-snap",
        title: "Attempt Course",
      });
      const lesson = await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Attempt Lesson",
        slug: "attempt-lesson",
        order: 1,
      });
      const quiz = await repos.academyQuizRepo.createQuiz({
        lessonId: lesson.id,
        title: "Historical Quiz Title",
      });

      const { question, opt1 } = await createValidQuestionWithOptions(
        quiz.id,
        "Historical Question Prompt",
        1,
      );

      const attempt = await repos.academyQuizRepo.createAttempt({
        userId: user.id,
        quizId: quiz.id,
        attemptNumber: 1,
        quizTitleSnapshot: "Historical Quiz Title",
        quizVersionSnapshot: "1.0",
      });

      const answer = await repos.academyQuizRepo.createAnswer({
        attemptId: attempt.id,
        quizId: quiz.id,
        questionId: question.id,
        selectedOptionId: opt1.id,
        isCorrect: true,
        questionPromptSnapshot: "Historical Question Prompt",
        selectedOptionTextSnapshot: "Correct Option",
        correctOptionIdSnapshot: opt1.id,
        correctOptionTextSnapshot: "Correct Option",
      });

      expect(answer.questionPromptSnapshot).toBe("Historical Question Prompt");
      expect(answer.selectedOptionTextSnapshot).toBe("Correct Option");

      // Duplicate answer for same question in same attempt must fail
      await expect(
        repos.academyQuizRepo.createAnswer({
          attemptId: attempt.id,
          quizId: quiz.id,
          questionId: question.id,
          selectedOptionId: opt1.id,
          isCorrect: true,
          questionPromptSnapshot: "Second Answer Prohibited",
        }),
      ).rejects.toThrow();
    });
  });

  describe("AC-014: Reward Ledger Semantic Idempotency & Global Idempotency Key", () => {
    it("enforces semantic uniqueness on (userId, sourceType, sourceId, rewardType)", async () => {
      const user = await createTestUser("reward-idemp");

      // 1. First reward succeeds
      const r1 = await repos.academyRewardRepo.recordReward({
        userId: user.id,
        sourceType: "LESSON_COMPLETION",
        sourceId: "lesson-100",
        rewardType: "XP",
        amount: 50,
        idempotencyKey: `${user.id}:LESSON_COMPLETION:lesson-100:XP`,
      });
      expect(r1.amount).toBe(50);

      // 2. Exact semantic duplicate MUST FAIL at PostgreSQL level
      await expect(
        repos.academyRewardRepo.recordReward({
          userId: user.id,
          sourceType: "LESSON_COMPLETION",
          sourceId: "lesson-100",
          rewardType: "XP",
          amount: 50,
          idempotencyKey: `${user.id}:LESSON_COMPLETION:lesson-100:XP:retry`,
        }),
      ).rejects.toThrow();

      // 3. Legitimate distinct reward for different sourceId succeeds
      const r2 = await repos.academyRewardRepo.recordReward({
        userId: user.id,
        sourceType: "LESSON_COMPLETION",
        sourceId: "lesson-200",
        rewardType: "XP",
        amount: 50,
        idempotencyKey: `${user.id}:LESSON_COMPLETION:lesson-200:XP`,
      });
      expect(r2.amount).toBe(50);
    });

    it("enforces global uniqueness on idempotencyKey", async () => {
      const user1 = await createTestUser("idemp1");
      const user2 = await createTestUser("idemp2");

      await repos.academyRewardRepo.recordReward({
        userId: user1.id,
        sourceType: "LESSON_COMPLETION",
        sourceId: "lesson-1",
        rewardType: "XP",
        amount: 100,
        idempotencyKey: "shared-key-must-be-unique",
      });

      // Same idempotencyKey on another user must fail
      await expect(
        repos.academyRewardRepo.recordReward({
          userId: user2.id,
          sourceType: "LESSON_COMPLETION",
          sourceId: "lesson-1",
          rewardType: "XP",
          amount: 100,
          idempotencyKey: "shared-key-must-be-unique",
        }),
      ).rejects.toThrow();
    });
  });

  describe("AC-040: AcademyUserXp Aggregate & Non-Negative Constraint", () => {
    it("enforces one row per user and non-negative totalXp check constraint", async () => {
      const user = await createTestUser("xp-check");

      const xp = await repos.academyRewardRepo.upsertUserXp(user.id, 150);
      expect(xp.totalXp).toBe(150);

      // Update totalXp positively
      const updatedXp = await repos.academyRewardRepo.upsertUserXp(user.id, 50);
      expect(updatedXp.totalXp).toBe(200);

      // Direct SQL attempt to set negative total_xp must violate CHECK constraint
      await expect(
        prisma.$executeRaw`UPDATE "academy_user_xp" SET "total_xp" = -10 WHERE "user_id" = ${user.id};`,
      ).rejects.toThrow();
    });
  });

  describe("AC-011, AC-039, AC-042: Restrictive Delete Policy & User History Preservation", () => {
    it("prevents deleting course when lessons exist (RESTRICT)", async () => {
      const course = await repos.academyCourseRepo.createCourse({
        slug: "del-course",
        title: "Delete Course",
      });
      await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Delete Lesson",
        slug: "del-lesson",
        order: 1,
      });

      await expect(
        prisma.academyCourse.delete({ where: { id: course.id } }),
      ).rejects.toThrow();
    });

    it("prevents deleting lesson when quizzes exist (RESTRICT)", async () => {
      const course = await repos.academyCourseRepo.createCourse({
        slug: "del-course-2",
        title: "Delete Course 2",
      });
      const lesson = await repos.academyCourseRepo.createLesson({
        courseId: course.id,
        title: "Delete Lesson 2",
        slug: "del-lesson-2",
        order: 1,
      });
      await repos.academyQuizRepo.createQuiz({
        lessonId: lesson.id,
        title: "Delete Quiz",
      });

      await expect(
        prisma.academyLesson.delete({ where: { id: lesson.id } }),
      ).rejects.toThrow();
    });

    it("prevents deleting User when Academy history (attempt/progress/xp/reward) exists (RESTRICT / NO ACTION)", async () => {
      const user = await createTestUser("delete-guard");
      const course = await repos.academyCourseRepo.createCourse({
        slug: "guard-course",
        title: "Guard Course",
      });

      await repos.academyProgressRepo.upsertCourseProgress({
        userId: user.id,
        courseId: course.id,
        status: "IN_PROGRESS",
      });

      // Attempting to delete user must fail with FK violation
      await expect(
        prisma.user.delete({ where: { id: user.id } }),
      ).rejects.toThrow();
    });
  });

  describe("AC-022, AC-023: Unit of Work Transaction Atomicity", () => {
    it("rolls back all writes if any step fails in a multi-write transaction", async () => {
      const user = await createTestUser("tx-test");
      const course = await repos.academyCourseRepo.createCourse({
        slug: "tx-course",
        title: "Transaction Course",
      });

      const txRunner = new PrismaTransactionRunner(prisma);
      const txPromise = txRunner.run(async (ctx) => {
        // 1. Record progress
        await ctx.repositories.academyProgressRepo.upsertCourseProgress({
          userId: user.id,
          courseId: course.id,
          status: "COMPLETED",
          completedAt: new Date(),
        });

        // 2. Grant reward
        await ctx.repositories.academyRewardRepo.recordReward({
          userId: user.id,
          sourceType: "COURSE_COMPLETION",
          sourceId: course.id,
          rewardType: "XP",
          amount: 250,
        });

        // 3. Deliberately fail
        throw new AppError("Simulated transaction failure", "VALIDATION_ERROR", 400);
      });

      await expect(txPromise).rejects.toThrow("Simulated transaction failure");

      // Verify ZERO rows were persisted
      const progress = await repos.academyProgressRepo.findCourseProgress(
        user.id,
        course.id,
      );
      expect(progress).toBeNull();

      const reward = await repos.academyRewardRepo.findRewardBySemanticTuple(
        user.id,
        "COURSE_COMPLETION",
        course.id,
        "XP",
      );
      expect(reward).toBeNull();
    });
  });
});
