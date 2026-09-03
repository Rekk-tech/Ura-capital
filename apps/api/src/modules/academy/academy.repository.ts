import type {
  PrismaClient,
  Prisma,
  AcademyCourse,
  AcademyLesson,
  AcademyFlashcard,
  AcademyQuiz,
  AcademyQuizQuestion,
  AcademyQuizOption,
  AcademyQuizAttempt,
  AcademyQuizAnswer,
  AcademyUserCourseProgress,
  AcademyUserLessonProgress,
  AcademyUserXp,
  AcademyRewardLedger,
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
} from "./academy.types.js";

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
}

export class PrismaAcademyCourseRepository implements IAcademyCourseRepository {
  constructor(private readonly prisma: DbClient) {}

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
}

export class PrismaAcademyQuizRepository implements IAcademyQuizRepository {
  constructor(private readonly prisma: DbClient) {}

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
}

export class PrismaAcademyProgressRepository
  implements IAcademyProgressRepository
{
  constructor(private readonly prisma: DbClient) {}

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
  constructor(private readonly prisma: DbClient) {}

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
