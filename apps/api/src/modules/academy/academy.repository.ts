import {
  type PrismaClient,
  Prisma,
  type AcademyCourse,
  type AcademyLesson,
  type AcademyFlashcard,
  type AcademyQuiz,
  type AcademyQuizQuestion,
  type AcademyQuizOption,
  type AcademyQuizAttempt,
  type AcademyQuizAnswer,
  type AcademyUserCourseProgress,
  type AcademyUserLessonProgress,
  type AcademyUserXp,
  type AcademyRewardLedger,
} from "@prisma/client";
import type {
  CreateCourseInput,
  CreateLessonInput,
  CreateFlashcardInput,
  CreateQuizInput,
  CreateQuizQuestionInput,
  CreateQuestionWithOptionsInput,
  CreateQuizOptionInput,
  CreateQuizAttemptInput,
  CreateQuizAnswerInput,
  UpsertCourseProgressInput,
  UpsertLessonProgressInput,
  RecordRewardInput,
  ListPublishedCoursesParams,
  PublishedQuizRecord,
  AcademyQuizAttemptWithAnswers,
  StartAttemptRepoResult,
  UpsertDraftAnswerInput,
  SafeProgressUpsertResult,
  PublishedCourseWithLessonsProgress,
} from "./academy.types.js";
import { getPrismaClient } from "../../infrastructure/database/prisma.js";
import { ERROR_CODES, HTTP_STATUS, type QuizResultDto, type QuizResultAnswerDto } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";

type DbClient = PrismaClient | Prisma.TransactionClient;

// ============================================================================
// Course & Content Repository
// ============================================================================

export interface IAcademyCourseRepository {
  createCourse(data: CreateCourseInput): Promise<AcademyCourse>;
  findCourseById(id: string): Promise<AcademyCourse | null>;
  findCourseBySlug(slug: string): Promise<AcademyCourse | null>;
  listCourses(filter?: { status?: string }): Promise<AcademyCourse[]>;
  createLesson(data: CreateLessonInput): Promise<AcademyLesson>;
  findLessonById(id: string): Promise<AcademyLesson | null>;
  findLessonByCourseAndSlug(
    courseId: string,
    slug: string,
  ): Promise<AcademyLesson | null>;
  listLessonsByCourse(courseId: string): Promise<AcademyLesson[]>;
  createFlashcard(data: CreateFlashcardInput): Promise<AcademyFlashcard>;
  listFlashcardsByLesson(lessonId: string): Promise<AcademyFlashcard[]>;
  listPublishedCourses(params: ListPublishedCoursesParams): Promise<{
    courses: Array<AcademyCourse & { _count: { lessons: number } }>;
    total: number;
  }>;
  findPublishedCourseBySlug(slug: string): Promise<
    (AcademyCourse & { lessons: Array<Pick<AcademyLesson, "slug" | "title" | "order">> }) | null
  >;
  findPublishedLessonByCourseAndSlug(
    courseSlug: string,
    lessonSlug: string,
  ): Promise<(AcademyLesson & { course: Pick<AcademyCourse, "slug"> }) | null>;
  findPublishedFlashcardsByLesson(
    courseSlug: string,
    lessonSlug: string,
  ): Promise<{
    lessonTitle: string;
    flashcards: Array<Pick<AcademyFlashcard, "front" | "back" | "order">>;
  } | null>;
}

export class PrismaAcademyCourseRepository implements IAcademyCourseRepository {
  private readonly client?: DbClient;

  constructor(prisma?: DbClient) {
    this.client = prisma;
  }

  private get prisma(): DbClient {
    return this.client ?? getPrismaClient();
  }

  async createCourse(data: CreateCourseInput): Promise<AcademyCourse> {
    return this.prisma.academyCourse.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        level: data.level ?? "BEGINNER",
        status: data.status ?? "DRAFT",
        order: data.order ?? 0,
      },
    });
  }

  async findCourseById(id: string): Promise<AcademyCourse | null> {
    return this.prisma.academyCourse.findUnique({
      where: { id },
    });
  }

  async findCourseBySlug(slug: string): Promise<AcademyCourse | null> {
    return this.prisma.academyCourse.findUnique({
      where: { slug },
    });
  }

  async listCourses(filter?: { status?: string }): Promise<AcademyCourse[]> {
    return this.prisma.academyCourse.findMany({
      where: filter?.status ? { status: filter.status } : undefined,
      orderBy: { order: "asc" },
    });
  }

  async createLesson(data: CreateLessonInput): Promise<AcademyLesson> {
    return this.prisma.academyLesson.create({
      data: {
        courseId: data.courseId,
        title: data.title,
        slug: data.slug,
        content: data.content,
        order: data.order,
        status: data.status ?? "DRAFT",
      },
    });
  }

  async findLessonById(id: string): Promise<AcademyLesson | null> {
    return this.prisma.academyLesson.findUnique({
      where: { id },
    });
  }

  async findLessonByCourseAndSlug(
    courseId: string,
    slug: string,
  ): Promise<AcademyLesson | null> {
    return this.prisma.academyLesson.findUnique({
      where: {
        courseId_slug: {
          courseId,
          slug,
        },
      },
    });
  }

  async listLessonsByCourse(courseId: string): Promise<AcademyLesson[]> {
    return this.prisma.academyLesson.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
    });
  }

  async createFlashcard(data: CreateFlashcardInput): Promise<AcademyFlashcard> {
    return this.prisma.academyFlashcard.create({
      data: {
        lessonId: data.lessonId,
        front: data.front,
        back: data.back,
        order: data.order ?? 0,
      },
    });
  }

  async listFlashcardsByLesson(lessonId: string): Promise<AcademyFlashcard[]> {
    return this.prisma.academyFlashcard.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
    });
  }

  async listPublishedCourses(params: ListPublishedCoursesParams): Promise<{
    courses: Array<AcademyCourse & { _count: { lessons: number } }>;
    total: number;
  }> {
    const where: Prisma.AcademyCourseWhereInput = {
      status: "PUBLISHED",
      ...(params.level ? { level: params.level } : {}),
    };

    const [courses, total] = await Promise.all([
      this.prisma.academyCourse.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: [{ order: "asc" }, { title: "asc" }, { id: "asc" }],
        include: {
          _count: {
            select: { lessons: { where: { status: "PUBLISHED" } } },
          },
        },
      }),
      this.prisma.academyCourse.count({ where }),
    ]);

    return { courses, total };
  }

  async findPublishedCourseBySlug(slug: string): Promise<
    (AcademyCourse & { lessons: Array<Pick<AcademyLesson, "slug" | "title" | "order">> }) | null
  > {
    return this.prisma.academyCourse.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
      },
      include: {
        lessons: {
          where: { status: "PUBLISHED" },
          select: { slug: true, title: true, order: true },
          orderBy: [{ order: "asc" }, { title: "asc" }, { id: "asc" }],
        },
      },
    });
  }

  async findPublishedLessonByCourseAndSlug(
    courseSlug: string,
    lessonSlug: string,
  ): Promise<(AcademyLesson & { course: Pick<AcademyCourse, "slug"> }) | null> {
    return this.prisma.academyLesson.findFirst({
      where: {
        slug: lessonSlug,
        status: "PUBLISHED",
        course: {
          slug: courseSlug,
          status: "PUBLISHED",
        },
      },
      include: {
        course: {
          select: { slug: true },
        },
      },
    });
  }

  async findPublishedFlashcardsByLesson(
    courseSlug: string,
    lessonSlug: string,
  ): Promise<{
    lessonTitle: string;
    flashcards: Array<Pick<AcademyFlashcard, "front" | "back" | "order">>;
  } | null> {
    const lesson = await this.prisma.academyLesson.findFirst({
      where: {
        slug: lessonSlug,
        status: "PUBLISHED",
        course: {
          slug: courseSlug,
          status: "PUBLISHED",
        },
      },
      select: {
        title: true,
        flashcards: {
          select: {
            front: true,
            back: true,
            order: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!lesson) {
      return null;
    }

    return {
      lessonTitle: lesson.title,
      flashcards: lesson.flashcards,
    };
  }
}

// ============================================================================
// Quiz Repository
// ============================================================================

export interface IAcademyQuizRepository {
  createQuiz(data: CreateQuizInput): Promise<AcademyQuiz>;
  findQuizById(id: string): Promise<AcademyQuiz | null>;
  listQuizzesByLesson(lessonId: string): Promise<AcademyQuiz[]>;
  /**
   * Atomic question + options creation within a single transaction / Unit of Work.
   * Canonical persistence operation for SINGLE_CHOICE questions under DB exactly-one-correct trigger.
   */
  createQuestionWithOptions(data: CreateQuestionWithOptionsInput): Promise<{
    question: AcademyQuizQuestion;
    options: AcademyQuizOption[];
  }>;
  /**
   * Internal / transactional question insert. Note: SINGLE_CHOICE questions
   * must have options committed in the same transaction to satisfy the DB constraint trigger.
   */
  createQuestion(data: CreateQuizQuestionInput): Promise<AcademyQuizQuestion>;
  findQuestionById(id: string): Promise<AcademyQuizQuestion | null>;
  listQuestionsByQuiz(quizId: string): Promise<AcademyQuizQuestion[]>;
  createOption(data: CreateQuizOptionInput): Promise<AcademyQuizOption>;
  listOptionsByQuestion(questionId: string): Promise<AcademyQuizOption[]>;
  createAttempt(data: CreateQuizAttemptInput): Promise<AcademyQuizAttempt>;
  findAttemptById(id: string): Promise<AcademyQuizAttempt | null>;
  createAnswer(data: CreateQuizAnswerInput): Promise<AcademyQuizAnswer>;
  findAnswersByAttempt(attemptId: string): Promise<AcademyQuizAnswer[]>;
  findPublishedQuizByLesson(
    courseSlug: string,
    lessonSlug: string,
  ): Promise<PublishedQuizRecord | null>;
  findActiveAttempt(
    userId: string,
    quizId: string,
  ): Promise<AcademyQuizAttemptWithAnswers | null>;
  startAttemptWithLock(
    userId: string,
    quizId: string,
    quizTitleSnapshot: string,
  ): Promise<StartAttemptRepoResult>;
  findAttemptWithAnswersById(
    attemptId: string,
    userId?: string,
  ): Promise<AcademyQuizAttemptWithAnswers | null>;
  upsertDraftAnswer(data: UpsertDraftAnswerInput): Promise<AcademyQuizAnswer>;
  findQuestionWithQuiz(questionId: string): Promise<
    | (AcademyQuizQuestion & {
        quiz: Pick<AcademyQuiz, "id" | "status">;
      })
    | null
  >;
  findOptionWithQuestion(optionId: string): Promise<
    | (AcademyQuizOption & {
        question: Pick<AcademyQuizQuestion, "id" | "quizId" | "prompt" | "type">;
      })
    | null
  >;
  verifyPublishedHierarchyByQuizId(quizId: string): Promise<boolean>;
  submitAndGradeAttempt(
    userId: string,
    attemptId: string,
  ): Promise<QuizResultDto>;
  findGradedAttemptResult(
    attemptId: string,
    userId: string,
  ): Promise<QuizResultDto | null>;
}


export class PrismaAcademyQuizRepository implements IAcademyQuizRepository {
  private readonly client?: DbClient;

  constructor(prisma?: DbClient) {
    this.client = prisma;
  }

  private get prisma(): DbClient {
    return this.client ?? getPrismaClient();
  }

  async createQuiz(data: CreateQuizInput): Promise<AcademyQuiz> {
    return this.prisma.academyQuiz.create({
      data: {
        lessonId: data.lessonId,
        title: data.title,
        description: data.description,
        status: data.status ?? "DRAFT",
        order: data.order ?? 0,
        passingScore: data.passingScore ?? 80,
      },
    });
  }

  async findQuizById(id: string): Promise<AcademyQuiz | null> {
    return this.prisma.academyQuiz.findUnique({
      where: { id },
    });
  }

  async listQuizzesByLesson(lessonId: string): Promise<AcademyQuiz[]> {
    return this.prisma.academyQuiz.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
    });
  }

  async createQuestionWithOptions(data: CreateQuestionWithOptionsInput): Promise<{
    question: AcademyQuizQuestion;
    options: AcademyQuizOption[];
  }> {
    if ("$transaction" in this.prisma && typeof (this.prisma as PrismaClient).$transaction === "function") {
      return (this.prisma as PrismaClient).$transaction(async (tx) => {
        const question = await tx.academyQuizQuestion.create({
          data: {
            quizId: data.quizId,
            prompt: data.prompt,
            explanation: data.explanation,
            type: data.type ?? "SINGLE_CHOICE",
            order: data.order,
          },
        });
        const options: AcademyQuizOption[] = [];
        for (const opt of data.options) {
          const createdOpt = await tx.academyQuizOption.create({
            data: {
              questionId: question.id,
              text: opt.text,
              isCorrect: opt.isCorrect,
              order: opt.order,
            },
          });
          options.push(createdOpt);
        }
        return { question, options };
      });
    }

    const question = await this.prisma.academyQuizQuestion.create({
      data: {
        quizId: data.quizId,
        prompt: data.prompt,
        explanation: data.explanation,
        type: data.type ?? "SINGLE_CHOICE",
        order: data.order,
      },
    });
    const options: AcademyQuizOption[] = [];
    for (const opt of data.options) {
      const createdOpt = await this.prisma.academyQuizOption.create({
        data: {
          questionId: question.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
          order: opt.order,
        },
      });
      options.push(createdOpt);
    }
    return { question, options };
  }

  async createQuestion(
    data: CreateQuizQuestionInput,
  ): Promise<AcademyQuizQuestion> {
    return this.prisma.academyQuizQuestion.create({
      data: {
        quizId: data.quizId,
        prompt: data.prompt,
        explanation: data.explanation,
        type: data.type ?? "SINGLE_CHOICE",
        order: data.order,
      },
    });
  }

  async findQuestionById(id: string): Promise<AcademyQuizQuestion | null> {
    return this.prisma.academyQuizQuestion.findUnique({
      where: { id },
    });
  }

  async listQuestionsByQuiz(quizId: string): Promise<AcademyQuizQuestion[]> {
    return this.prisma.academyQuizQuestion.findMany({
      where: { quizId },
      orderBy: { order: "asc" },
    });
  }

  async createOption(data: CreateQuizOptionInput): Promise<AcademyQuizOption> {
    return this.prisma.academyQuizOption.create({
      data: {
        questionId: data.questionId,
        text: data.text,
        isCorrect: data.isCorrect,
        order: data.order,
      },
    });
  }

  async listOptionsByQuestion(
    questionId: string,
  ): Promise<AcademyQuizOption[]> {
    return this.prisma.academyQuizOption.findMany({
      where: { questionId },
      orderBy: { order: "asc" },
    });
  }

  async createAttempt(
    data: CreateQuizAttemptInput,
  ): Promise<AcademyQuizAttempt> {
    return this.prisma.academyQuizAttempt.create({
      data: {
        userId: data.userId,
        quizId: data.quizId,
        attemptNumber: data.attemptNumber ?? 1,
        quizTitleSnapshot: data.quizTitleSnapshot,
        quizVersionSnapshot: data.quizVersionSnapshot,
        status: data.status ?? "CREATED",
      },
    });
  }

  async findAttemptById(id: string): Promise<AcademyQuizAttempt | null> {
    return this.prisma.academyQuizAttempt.findUnique({
      where: { id },
    });
  }

  async createAnswer(data: CreateQuizAnswerInput): Promise<AcademyQuizAnswer> {
    return this.prisma.academyQuizAnswer.create({
      data: {
        attemptId: data.attemptId,
        quizId: data.quizId,
        questionId: data.questionId,
        selectedOptionId: data.selectedOptionId,
        isCorrect: data.isCorrect,
        questionPromptSnapshot: data.questionPromptSnapshot,
        selectedOptionTextSnapshot: data.selectedOptionTextSnapshot,
        correctOptionIdSnapshot: data.correctOptionIdSnapshot,
        correctOptionTextSnapshot: data.correctOptionTextSnapshot,
      },
    });
  }

  async findAnswersByAttempt(attemptId: string): Promise<AcademyQuizAnswer[]> {
    return this.prisma.academyQuizAnswer.findMany({
      where: { attemptId },
    });
  }

  async findPublishedQuizByLesson(
    courseSlug: string,
    lessonSlug: string,
  ): Promise<PublishedQuizRecord | null> {
    const quiz = await this.prisma.academyQuiz.findFirst({
      where: {
        status: "PUBLISHED",
        lesson: {
          slug: lessonSlug,
          status: "PUBLISHED",
          course: {
            slug: courseSlug,
            status: "PUBLISHED",
          },
        },
      },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        passingScore: true,
        lesson: {
          select: {
            title: true,
            slug: true,
            course: {
              select: {
                slug: true,
              },
            },
          },
        },
        questions: {
          select: {
            id: true,
            prompt: true,
            type: true,
            order: true,
            options: {
              select: {
                id: true,
                text: true,
                order: true,
              },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    return quiz as PublishedQuizRecord | null;
  }

  async findActiveAttempt(
    userId: string,
    quizId: string,
  ): Promise<AcademyQuizAttemptWithAnswers | null> {
    return this.prisma.academyQuizAttempt.findFirst({
      where: {
        userId,
        quizId,
        status: "IN_PROGRESS",
      },
      include: {
        answers: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async startAttemptWithLock(
    userId: string,
    quizId: string,
    quizTitleSnapshot: string,
  ): Promise<StartAttemptRepoResult> {
    // 1. Transaction-scoped advisory lock on (userId, quizId)
    await this.prisma.$executeRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(hashtext('quiz_attempt:' || ${userId} || ':' || ${quizId}));`,
    );

    // 2. Query existing active attempt
    const existing = await this.findActiveAttempt(userId, quizId);
    if (existing) {
      return {
        attempt: existing,
        created: false,
      };
    }

    // 3. Compute next attemptNumber for exact user+quiz
    const maxAgg = await this.prisma.academyQuizAttempt.aggregate({
      where: { userId, quizId },
      _max: { attemptNumber: true },
    });
    const nextAttemptNumber = (maxAgg._max.attemptNumber ?? 0) + 1;

    // 4. Insert IN_PROGRESS attempt
    try {
      const createdAttempt = await this.prisma.academyQuizAttempt.create({
        data: {
          userId,
          quizId,
          attemptNumber: nextAttemptNumber,
          quizTitleSnapshot,
          status: "IN_PROGRESS",
        },
        include: {
          answers: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      return {
        attempt: createdAttempt,
        created: true,
      };
    } catch (err: unknown) {
      // Targeted P2002 race recovery check
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        try {
          const active = await this.findActiveAttempt(userId, quizId);
          if (active) {
            return {
              attempt: active,
              created: false,
            };
          }
        } catch {
          // Transaction aborted; allow error to bubble up for root client recovery
        }
      }
      throw err;
    }
  }

  async findAttemptWithAnswersById(
    attemptId: string,
    userId?: string,
  ): Promise<AcademyQuizAttemptWithAnswers | null> {
    return this.prisma.academyQuizAttempt.findFirst({
      where: {
        id: attemptId,
        ...(userId ? { userId } : {}),
      },
      include: {
        answers: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async upsertDraftAnswer(
    data: UpsertDraftAnswerInput,
  ): Promise<AcademyQuizAnswer> {
    return this.prisma.academyQuizAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: data.attemptId,
          questionId: data.questionId,
        },
      },
      create: {
        attemptId: data.attemptId,
        quizId: data.quizId,
        questionId: data.questionId,
        selectedOptionId: data.selectedOptionId,
        questionPromptSnapshot: data.questionPromptSnapshot,
        selectedOptionTextSnapshot: data.selectedOptionTextSnapshot,
        isCorrect: null,
        correctOptionIdSnapshot: null,
        correctOptionTextSnapshot: null,
      },
      update: {
        selectedOptionId: data.selectedOptionId,
        selectedOptionTextSnapshot: data.selectedOptionTextSnapshot,
        isCorrect: null,
        correctOptionIdSnapshot: null,
        correctOptionTextSnapshot: null,
      },
    });
  }

  async findQuestionWithQuiz(questionId: string): Promise<
    | (AcademyQuizQuestion & {
        quiz: Pick<AcademyQuiz, "id" | "status">;
      })
    | null
  > {
    return this.prisma.academyQuizQuestion.findUnique({
      where: { id: questionId },
      include: {
        quiz: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
  }

  async findOptionWithQuestion(optionId: string): Promise<
    | (AcademyQuizOption & {
        question: Pick<AcademyQuizQuestion, "id" | "quizId" | "prompt" | "type">;
      })
    | null
  > {
    return this.prisma.academyQuizOption.findUnique({
      where: { id: optionId },
      include: {
        question: {
          select: {
            id: true,
            quizId: true,
            prompt: true,
            type: true,
          },
        },
      },
    });
  }

  async verifyPublishedHierarchyByQuizId(quizId: string): Promise<boolean> {
    const quiz = await this.prisma.academyQuiz.findFirst({
      where: {
        id: quizId,
        status: "PUBLISHED",
        lesson: {
          status: "PUBLISHED",
          course: {
            status: "PUBLISHED",
          },
        },
      },
      select: { id: true },
    });
    return quiz !== null;
  }

  async submitAndGradeAttempt(
    userId: string,
    attemptId: string,
  ): Promise<QuizResultDto> {
    // 1. Acquire row lock using SELECT ... FOR UPDATE scoped by attemptId and userId
    interface RawAttemptRow {
      id: string;
      user_id: string;
      quiz_id: string;
      status: string;
      score: number | null;
      passed: boolean | null;
      submitted_at: Date | null;
      graded_at: Date | null;
    }

    const attempts = await this.prisma.$queryRaw<RawAttemptRow[]>(
      Prisma.sql`SELECT id, user_id, quiz_id, status, score, passed, submitted_at, graded_at FROM "academy_quiz_attempts" WHERE "id" = ${attemptId} AND "user_id" = ${userId} FOR UPDATE;`,
    );

    if (attempts.length === 0) {
      throw new AppError(
        "Quiz attempt not found",
        ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    const attempt = attempts[0]!;

    // 2. Re-read under lock: If already GRADED, execute idempotent replay
    if (attempt.status === "GRADED") {
      return this.reconstructPersistedResult(
        attempt.id,
        attempt.quiz_id,
        attempt.score!,
        attempt.passed!,
        attempt.submitted_at!,
        attempt.graded_at!,
      );
    }

    // 3. Ensure attempt is IN_PROGRESS (CREATED or any other status yields 404)
    if (attempt.status !== "IN_PROGRESS") {
      throw new AppError(
        "Quiz attempt not found",
        ERROR_CODES.QUIZ_ATTEMPT_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    // 4. Validate content publication scoping: Course, Lesson, Quiz must be PUBLISHED
    const quiz = await this.prisma.academyQuiz.findUnique({
      where: { id: attempt.quiz_id },
      include: {
        lesson: {
          include: {
            course: true,
          },
        },
      },
    });

    if (
      !quiz ||
      quiz.status !== "PUBLISHED" ||
      quiz.lesson.status !== "PUBLISHED" ||
      quiz.lesson.course.status !== "PUBLISHED"
    ) {
      throw new AppError(
        "Resource not found",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    // 5. Load quiz questions and options
    const questions = await this.prisma.academyQuizQuestion.findMany({
      where: { quizId: quiz.id },
      include: {
        options: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    if (questions.length === 0) {
      throw new AppError(
        "Quiz has no questions to evaluate",
        ERROR_CODES.INVALID_QUIZ_STATE,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // 6. Load all draft answers for this attempt
    const draftAnswers = await this.prisma.academyQuizAnswer.findMany({
      where: { attemptId: attempt.id },
    });

    // 7. Strict completeness check: Ensure all questions have a draft answer with a selected option
    const answeredMap = new Map(draftAnswers.map((a) => [a.questionId, a]));
    for (const q of questions) {
      const draft = answeredMap.get(q.id);
      if (!draft || !draft.selectedOptionId) {
        throw new AppError(
          "All questions must be answered before submitting",
          ERROR_CODES.UNANSWERED_QUESTIONS,
          HTTP_STATUS.BAD_REQUEST,
        );
      }
    }

    // 8. Transactional intermediate step: set status = 'SUBMITTED'
    const now = new Date();
    await this.prisma.academyQuizAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "SUBMITTED",
        submittedAt: now,
      },
    });

    // 9. Evaluate each answer against current server-authoritative quiz definition
    let correctCount = 0;
    const evaluatedAnswers: QuizResultAnswerDto[] = [];

    for (const question of questions) {
      const draft = answeredMap.get(question.id)!;

      // Relational validation
      if (draft.quizId !== quiz.id) {
        throw new Error("Integrity defect: draft answer quizId mismatch");
      }

      // Exactly-one-correct defensive check
      const correctOptions = question.options.filter((o) => o.isCorrect);
      if (correctOptions.length !== 1) {
        throw new Error(`Integrity defect: question ${question.id} has ${correctOptions.length} correct options`);
      }
      const correctOption = correctOptions[0]!;

      // Option relational validation
      const optionBelongs = question.options.some((o) => o.id === draft.selectedOptionId);
      if (!optionBelongs) {
        throw new Error("Integrity defect: selectedOptionId does not belong to question");
      }

      const isCorrect = draft.selectedOptionId === correctOption.id;
      if (isCorrect) {
        correctCount += 1;
      }

      // Persist frozen correctness snapshots atomically
      await this.prisma.academyQuizAnswer.update({
        where: {
          attemptId_questionId: {
            attemptId: attempt.id,
            questionId: question.id,
          },
        },
        data: {
          isCorrect,
          correctOptionIdSnapshot: correctOption.id,
          correctOptionTextSnapshot: correctOption.text,
        },
      });

      evaluatedAnswers.push({
        questionId: question.id,
        selectedOptionId: draft.selectedOptionId,
        isCorrect,
        correctOptionId: correctOption.id,
      });
    }

    // 10. Compute integer score and pass/fail
    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= quiz.passingScore;

    // 11. Finalize attempt to GRADED
    const finalizedAttempt = await this.prisma.academyQuizAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "GRADED",
        score,
        passed,
        gradedAt: now,
      },
    });

    return {
      attemptId: finalizedAttempt.id,
      quizId: finalizedAttempt.quizId,
      status: "GRADED",
      score,
      passed,
      submittedAt: finalizedAttempt.submittedAt!.toISOString(),
      gradedAt: finalizedAttempt.gradedAt!.toISOString(),
      answers: evaluatedAnswers,
    };
  }

  private async reconstructPersistedResult(
    attemptId: string,
    quizId: string,
    score: number,
    passed: boolean,
    submittedAt: Date,
    gradedAt: Date,
  ): Promise<QuizResultDto> {
    const answers = await this.prisma.academyQuizAnswer.findMany({
      where: { attemptId },
      orderBy: { createdAt: "asc" },
    });

    return {
      attemptId,
      quizId,
      status: "GRADED",
      score,
      passed,
      submittedAt: submittedAt.toISOString(),
      gradedAt: gradedAt.toISOString(),
      answers: answers.map((a) => ({
        questionId: a.questionId,
        selectedOptionId: a.selectedOptionId,
        isCorrect: a.isCorrect ?? false,
        correctOptionId: a.correctOptionIdSnapshot ?? "",
      })),
    };
  }

  async findGradedAttemptResult(
    attemptId: string,
    userId: string,
  ): Promise<QuizResultDto | null> {
    const attempt = await this.prisma.academyQuizAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
      },
      include: {
        answers: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!attempt || attempt.status !== "GRADED") {
      return null;
    }

    return {
      attemptId: attempt.id,
      quizId: attempt.quizId,
      status: "GRADED",
      score: attempt.score!,
      passed: attempt.passed!,
      submittedAt: attempt.submittedAt!.toISOString(),
      gradedAt: attempt.gradedAt!.toISOString(),
      answers: attempt.answers.map((a) => ({
        questionId: a.questionId,
        selectedOptionId: a.selectedOptionId,
        isCorrect: a.isCorrect ?? false,
        correctOptionId: a.correctOptionIdSnapshot ?? "",
      })),
    };
  }
}


// ============================================================================
// Progress Repository
// ============================================================================

export interface IAcademyProgressRepository {
  upsertCourseProgress(
    data: UpsertCourseProgressInput,
  ): Promise<AcademyUserCourseProgress>;
  findCourseProgress(
    userId: string,
    courseId: string,
  ): Promise<AcademyUserCourseProgress | null>;
  upsertLessonProgress(
    data: UpsertLessonProgressInput,
  ): Promise<AcademyUserLessonProgress>;
  findLessonProgress(
    userId: string,
    lessonId: string,
  ): Promise<AcademyUserLessonProgress | null>;

  findCourseProgressBySlug(
    userId: string,
    courseSlug: string,
  ): Promise<PublishedCourseWithLessonsProgress | null>;
  findPublishedLessonWithCourse(
    courseSlug: string,
    lessonSlug: string,
  ): Promise<(AcademyLesson & { course: AcademyCourse }) | null>;
  hasPublishedQuiz(lessonId: string): Promise<boolean>;
  findGradedAttempt(
    attemptId: string,
    userId: string,
  ): Promise<
    | (AcademyQuizAttempt & {
        quiz: AcademyQuiz & {
          lesson: AcademyLesson & {
            course: AcademyCourse;
          };
        };
      })
    | null
  >;
  getPublishedLessonsForCourse(
    courseId: string,
  ): Promise<Array<Pick<AcademyLesson, "id" | "slug" | "title" | "order">>>;
  listLessonProgressForUser(
    userId: string,
    lessonIds: string[],
  ): Promise<AcademyUserLessonProgress[]>;
  upsertLessonProgressSafe(
    userId: string,
    lessonId: string,
    status: string,
    targetCompletedAt?: Date | null,
  ): Promise<SafeProgressUpsertResult<AcademyUserLessonProgress>>;
  upsertCourseProgressSafe(
    userId: string,
    courseId: string,
    status: string,
    targetCompletedAt?: Date | null,
  ): Promise<SafeProgressUpsertResult<AcademyUserCourseProgress>>;
}

export class PrismaAcademyProgressRepository
  implements IAcademyProgressRepository
{
  private readonly client?: DbClient;

  constructor(prisma?: DbClient) {
    this.client = prisma;
  }

  private get prisma(): DbClient {
    return this.client ?? getPrismaClient();
  }

  async upsertCourseProgress(
    data: UpsertCourseProgressInput,
  ): Promise<AcademyUserCourseProgress> {
    return this.prisma.academyUserCourseProgress.upsert({
      where: {
        userId_courseId: {
          userId: data.userId,
          courseId: data.courseId,
        },
      },
      create: {
        userId: data.userId,
        courseId: data.courseId,
        status: data.status,
        startedAt: data.startedAt ?? new Date(),
        completedAt: data.completedAt,
      },
      update: {
        status: data.status,
        completedAt: data.completedAt,
      },
    });
  }

  async findCourseProgress(
    userId: string,
    courseId: string,
  ): Promise<AcademyUserCourseProgress | null> {
    return this.prisma.academyUserCourseProgress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });
  }

  async upsertLessonProgress(
    data: UpsertLessonProgressInput,
  ): Promise<AcademyUserLessonProgress> {
    return this.prisma.academyUserLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: data.userId,
          lessonId: data.lessonId,
        },
      },
      create: {
        userId: data.userId,
        lessonId: data.lessonId,
        status: data.status,
        startedAt: data.startedAt ?? new Date(),
        completedAt: data.completedAt,
      },
      update: {
        status: data.status,
        completedAt: data.completedAt,
      },
    });
  }

  async findLessonProgress(
    userId: string,
    lessonId: string,
  ): Promise<AcademyUserLessonProgress | null> {
    return this.prisma.academyUserLessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });
  }

  async findCourseProgressBySlug(
    userId: string,
    courseSlug: string,
  ): Promise<PublishedCourseWithLessonsProgress | null> {
    const course = await this.prisma.academyCourse.findFirst({
      where: {
        slug: courseSlug,
        status: "PUBLISHED",
      },
    });

    if (!course) {
      return null;
    }

    const [courseProgress, publishedLessons] = await Promise.all([
      this.prisma.academyUserCourseProgress.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: course.id,
          },
        },
      }),
      this.prisma.academyLesson.findMany({
        where: {
          courseId: course.id,
          status: "PUBLISHED",
        },
        select: {
          id: true,
          slug: true,
          title: true,
          order: true,
        },
        orderBy: [{ order: "asc" }, { title: "asc" }, { id: "asc" }],
      }),
    ]);

    const lessonIds = publishedLessons.map((l) => l.id);
    const lessonProgressList =
      lessonIds.length > 0
        ? await this.prisma.academyUserLessonProgress.findMany({
            where: {
              userId,
              lessonId: { in: lessonIds },
            },
          })
        : [];

    const lessonProgressMap = new Map<string, AcademyUserLessonProgress>();
    for (const lp of lessonProgressList) {
      lessonProgressMap.set(lp.lessonId, lp);
    }

    return {
      course,
      courseProgress,
      publishedLessons,
      lessonProgressMap,
    };
  }

  async findPublishedLessonWithCourse(
    courseSlug: string,
    lessonSlug: string,
  ): Promise<(AcademyLesson & { course: AcademyCourse }) | null> {
    return this.prisma.academyLesson.findFirst({
      where: {
        slug: lessonSlug,
        status: "PUBLISHED",
        course: {
          slug: courseSlug,
          status: "PUBLISHED",
        },
      },
      include: {
        course: true,
      },
    });
  }

  async hasPublishedQuiz(lessonId: string): Promise<boolean> {
    const count = await this.prisma.academyQuiz.count({
      where: {
        lessonId,
        status: "PUBLISHED",
      },
    });
    return count > 0;
  }

  async findGradedAttempt(
    attemptId: string,
    userId: string,
  ): Promise<
    | (AcademyQuizAttempt & {
        quiz: AcademyQuiz & {
          lesson: AcademyLesson & {
            course: AcademyCourse;
          };
        };
      })
    | null
  > {
    return this.prisma.academyQuizAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
      },
      include: {
        quiz: {
          include: {
            lesson: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });
  }

  async getPublishedLessonsForCourse(
    courseId: string,
  ): Promise<Array<Pick<AcademyLesson, "id" | "slug" | "title" | "order">>> {
    return this.prisma.academyLesson.findMany({
      where: {
        courseId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        slug: true,
        title: true,
        order: true,
      },
      orderBy: [{ order: "asc" }, { title: "asc" }, { id: "asc" }],
    });
  }

  async listLessonProgressForUser(
    userId: string,
    lessonIds: string[],
  ): Promise<AcademyUserLessonProgress[]> {
    if (lessonIds.length === 0) return [];
    return this.prisma.academyUserLessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: lessonIds },
      },
    });
  }

  async upsertLessonProgressSafe(
    userId: string,
    lessonId: string,
    status: string,
    targetCompletedAt?: Date | null,
  ): Promise<SafeProgressUpsertResult<AcademyUserLessonProgress>> {
    // 1. Transaction-scoped advisory lock for concurrency safety
    await this.prisma.$executeRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(hashtext('lesson_progress:' || ${userId} || ':' || ${lessonId}));`,
    );

    // 2. Query existing progress under serialization
    const existing = await this.prisma.academyUserLessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    if (status === "COMPLETED") {
      const completedAt = targetCompletedAt ?? new Date();

      if (existing) {
        // Monotonicity: if already COMPLETED or has completedAt, preserve original completedAt
        if (existing.status === "COMPLETED" || existing.completedAt !== null) {
          return {
            progress: existing,
            isFirstCompletion: false,
          };
        }

        // Transition from NOT_STARTED / IN_PROGRESS to COMPLETED
        const updated = await this.prisma.academyUserLessonProgress.update({
          where: { id: existing.id },
          data: {
            status: "COMPLETED",
            completedAt,
          },
        });

        return {
          progress: updated,
          isFirstCompletion: true,
        };
      }

      // No prior record: insert new COMPLETED record
      try {
        const created = await this.prisma.academyUserLessonProgress.create({
          data: {
            userId,
            lessonId,
            status: "COMPLETED",
            startedAt: completedAt,
            completedAt,
          },
        });

        return {
          progress: created,
          isFirstCompletion: true,
        };
      } catch (err: unknown) {
        if (this.isP2002Error(err)) {
          const fallback = await this.prisma.academyUserLessonProgress.findUnique({
            where: {
              userId_lessonId: {
                userId,
                lessonId,
              },
            },
          });
          if (fallback) {
            return {
              progress: fallback,
              isFirstCompletion: false,
            };
          }
        }
        throw err;
      }
    }

    // status !== "COMPLETED" (e.g. IN_PROGRESS or NOT_STARTED)
    if (existing) {
      // Monotonicity: NEVER downgrade COMPLETED to IN_PROGRESS or NOT_STARTED
      if (existing.status === "COMPLETED" || existing.completedAt !== null) {
        return {
          progress: existing,
          isFirstCompletion: false,
        };
      }

      const updated = await this.prisma.academyUserLessonProgress.update({
        where: { id: existing.id },
        data: {
          status,
          completedAt: null,
        },
      });

      return {
        progress: updated,
        isFirstCompletion: false,
      };
    }

    try {
      const created = await this.prisma.academyUserLessonProgress.create({
        data: {
          userId,
          lessonId,
          status,
          startedAt: new Date(),
          completedAt: null,
        },
      });

      return {
        progress: created,
        isFirstCompletion: false,
      };
    } catch (err: unknown) {
      if (this.isP2002Error(err)) {
        const fallback = await this.prisma.academyUserLessonProgress.findUnique({
          where: {
            userId_lessonId: {
              userId,
              lessonId,
            },
          },
        });
        if (fallback) {
          return {
            progress: fallback,
            isFirstCompletion: false,
          };
        }
      }
      throw err;
    }
  }

  async upsertCourseProgressSafe(
    userId: string,
    courseId: string,
    status: string,
    targetCompletedAt?: Date | null,
  ): Promise<SafeProgressUpsertResult<AcademyUserCourseProgress>> {
    // 1. Transaction-scoped advisory lock for concurrency safety
    await this.prisma.$executeRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(hashtext('course_progress:' || ${userId} || ':' || ${courseId}));`,
    );

    // 2. Query existing course progress under serialization
    const existing = await this.prisma.academyUserCourseProgress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (status === "COMPLETED") {
      const completedAt = targetCompletedAt ?? new Date();

      if (existing) {
        // Monotonicity: if already COMPLETED or has completedAt, preserve original completedAt
        if (existing.status === "COMPLETED" || existing.completedAt !== null) {
          return {
            progress: existing,
            isFirstCompletion: false,
          };
        }

        // Transition from NOT_STARTED / IN_PROGRESS to COMPLETED
        const updated = await this.prisma.academyUserCourseProgress.update({
          where: { id: existing.id },
          data: {
            status: "COMPLETED",
            completedAt,
          },
        });

        return {
          progress: updated,
          isFirstCompletion: true,
        };
      }

      // No prior record: insert new COMPLETED record
      try {
        const created = await this.prisma.academyUserCourseProgress.create({
          data: {
            userId,
            courseId,
            status: "COMPLETED",
            startedAt: completedAt,
            completedAt,
          },
        });

        return {
          progress: created,
          isFirstCompletion: true,
        };
      } catch (err: unknown) {
        if (this.isP2002Error(err)) {
          const fallback = await this.prisma.academyUserCourseProgress.findUnique({
            where: {
              userId_courseId: {
                userId,
                courseId,
              },
            },
          });
          if (fallback) {
            return {
              progress: fallback,
              isFirstCompletion: false,
            };
          }
        }
        throw err;
      }
    }

    // status !== "COMPLETED" (e.g. IN_PROGRESS)
    if (existing) {
      // Monotonicity: NEVER downgrade COMPLETED course progress
      if (existing.status === "COMPLETED" || existing.completedAt !== null) {
        return {
          progress: existing,
          isFirstCompletion: false,
        };
      }

      const updated = await this.prisma.academyUserCourseProgress.update({
        where: { id: existing.id },
        data: {
          status,
          completedAt: null,
        },
      });

      return {
        progress: updated,
        isFirstCompletion: false,
      };
    }

    try {
      const created = await this.prisma.academyUserCourseProgress.create({
        data: {
          userId,
          courseId,
          status,
          startedAt: new Date(),
          completedAt: null,
        },
      });

      return {
        progress: created,
        isFirstCompletion: false,
      };
    } catch (err: unknown) {
      if (this.isP2002Error(err)) {
        const fallback = await this.prisma.academyUserCourseProgress.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId,
            },
          },
        });
        if (fallback) {
          return {
            progress: fallback,
            isFirstCompletion: false,
          };
        }
      }
      throw err;
    }
  }

  private isP2002Error(err: unknown): boolean {
    if (!err || typeof err !== "object") return false;
    const errObj = err as Record<string, unknown>;
    if (errObj.code === "P2002") return true;
    if (
      errObj.cause &&
      typeof errObj.cause === "object" &&
      (errObj.cause as Record<string, unknown>).code === "P2002"
    )
      return true;
    return false;
  }
}

// ============================================================================
// Reward & XP Repository
// ============================================================================

export interface IAcademyRewardRepository {
  recordReward(data: RecordRewardInput): Promise<AcademyRewardLedger>;
  findRewardBySemanticTuple(
    userId: string,
    sourceType: string,
    sourceId: string,
    rewardType: string,
  ): Promise<AcademyRewardLedger | null>;
  findRewardByIdempotencyKey(
    key: string,
  ): Promise<AcademyRewardLedger | null>;
  upsertUserXp(userId: string, initialOrDelta: number): Promise<AcademyUserXp>;
  getUserXp(userId: string): Promise<AcademyUserXp | null>;
}

export class PrismaAcademyRewardRepository implements IAcademyRewardRepository {
  private readonly client?: DbClient;

  constructor(prisma?: DbClient) {
    this.client = prisma;
  }

  private get prisma(): DbClient {
    return this.client ?? getPrismaClient();
  }

  async recordReward(data: RecordRewardInput): Promise<AcademyRewardLedger> {
    return this.prisma.academyRewardLedger.create({
      data: {
        userId: data.userId,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        rewardType: data.rewardType,
        amount: data.amount,
        idempotencyKey: data.idempotencyKey,
        status: data.status ?? "APPLIED",
        metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async findRewardBySemanticTuple(
    userId: string,
    sourceType: string,
    sourceId: string,
    rewardType: string,
  ): Promise<AcademyRewardLedger | null> {
    return this.prisma.academyRewardLedger.findUnique({
      where: {
        userId_sourceType_sourceId_rewardType: {
          userId,
          sourceType,
          sourceId,
          rewardType,
        },
      },
    });
  }

  async findRewardByIdempotencyKey(
    key: string,
  ): Promise<AcademyRewardLedger | null> {
    return this.prisma.academyRewardLedger.findUnique({
      where: { idempotencyKey: key },
    });
  }

  async upsertUserXp(
    userId: string,
    initialOrDelta: number,
  ): Promise<AcademyUserXp> {
    return this.prisma.academyUserXp.upsert({
      where: { userId },
      create: {
        userId,
        totalXp: initialOrDelta,
        level: 1,
      },
      update: {
        totalXp: { increment: initialOrDelta },
      },
    });
  }

  async getUserXp(userId: string): Promise<AcademyUserXp | null> {
    return this.prisma.academyUserXp.findUnique({
      where: { userId },
    });
  }
}
