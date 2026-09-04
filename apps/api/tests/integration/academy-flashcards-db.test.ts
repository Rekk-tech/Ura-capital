import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import {
  assertSafeTestDatabase,
  sanitizeDiagnosticMessage,
  cleanAllTestTables,
} from "../helpers/test-db-guard.js";
import { createApp } from "../../src/server.js";
import { accessTokenService } from "../../src/modules/auth/access-token.service.js";
import { HTTP_STATUS, ERROR_CODES } from "@aura/shared";

const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("test")
    ? process.env.DATABASE_URL
    : "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh");

process.env.DATABASE_URL = testDbUrl;
process.env.NODE_ENV = "test";

describe("FEAT-022 Flashcards Domain & Read Model (Live PostgreSQL Integration)", () => {
  let prisma: PrismaClient;
  let app: ReturnType<typeof createApp>;
  let learnerToken: string;

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
      await cleanAllTestTables(prisma);
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
      await cleanAllTestTables(prisma);
      await prisma.$disconnect();
    } catch {
      // Safe cleanup teardown
    }
  });

  beforeEach(async () => {
    await cleanAllTestTables(prisma);

    // Create active test user
    const user = await prisma.user.create({
      data: {
        email: "learner-fc@auracapital.io",
        displayName: "Flashcard Learner",
        status: "ACTIVE",
      },
    });

    learnerToken = accessTokenService.issueAccessToken(user.id).accessToken;
  });

  it("enforces 401 UNAUTHENTICATED on missing Authorization header", async () => {
    const res = await request(app)
      .get("/api/academy/courses/c1/lessons/l1/flashcards")
      .expect(HTTP_STATUS.UNAUTHORIZED);

    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
  });

  it("returns 200 with flashcards in strict order ASC and minimized DTO whitelist", async () => {
    // 1. Create published course
    const course = await prisma.academyCourse.create({
      data: {
        slug: "crypto-fundamentals",
        title: "Crypto Fundamentals",
        description: "Learn crypto basics",
        level: "BEGINNER",
        order: 1,
        status: "PUBLISHED",
      },
    });

    // 2. Create published lesson
    const lesson = await prisma.academyLesson.create({
      data: {
        courseId: course.id,
        slug: "what-is-money",
        title: "What is Money?",
        content: "Money is a medium of exchange.",
        order: 1,
        status: "PUBLISHED",
      },
    });

    // 3. Create flashcards intentionally inserted out of order
    await prisma.academyFlashcard.create({
      data: {
        lessonId: lesson.id,
        front: "Card 3: Medium of Exchange",
        back: "Facilitates trade of goods and services.",
        order: 3,
      },
    });
    await prisma.academyFlashcard.create({
      data: {
        lessonId: lesson.id,
        front: "Card 1: Unit of Account",
        back: "Common measure of the value of goods.",
        order: 1,
      },
    });
    await prisma.academyFlashcard.create({
      data: {
        lessonId: lesson.id,
        front: "Card 2: Store of Value",
        back: "Can be saved, retrieved, and exchanged later.",
        order: 2,
      },
    });

    // Record baseline counts for persistence guard
    const progressCountBefore = await prisma.academyUserCourseProgress.count();
    const lessonProgressBefore = await prisma.academyUserLessonProgress.count();
    const xpCountBefore = await prisma.academyUserXp.count();
    const rewardCountBefore = await prisma.academyRewardLedger.count();

    const res = await request(app)
      .get("/api/academy/courses/crypto-fundamentals/lessons/what-is-money/flashcards")
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(HTTP_STATUS.OK);

    expect(res.body).toHaveProperty("data");
    const { data } = res.body;

    expect(data.courseSlug).toBe("crypto-fundamentals");
    expect(data.lessonSlug).toBe("what-is-money");
    expect(data.lessonTitle).toBe("What is Money?");
    expect(data.totalCount).toBe(3);
    expect(data.flashcards).toHaveLength(3);

    // Verify strict order ASC
    expect(data.flashcards[0]).toEqual({
      front: "Card 1: Unit of Account",
      back: "Common measure of the value of goods.",
      order: 1,
    });
    expect(data.flashcards[1]).toEqual({
      front: "Card 2: Store of Value",
      back: "Can be saved, retrieved, and exchanged later.",
      order: 2,
    });
    expect(data.flashcards[2]).toEqual({
      front: "Card 3: Medium of Exchange",
      back: "Facilitates trade of goods and services.",
      order: 3,
    });

    // Assert zero internal UUIDs or timestamps leak
    for (const card of data.flashcards) {
      expect(card).not.toHaveProperty("id");
      expect(card).not.toHaveProperty("lessonId");
      expect(card).not.toHaveProperty("courseId");
      expect(card).not.toHaveProperty("createdAt");
      expect(card).not.toHaveProperty("updatedAt");
      expect(card).not.toHaveProperty("status");
    }

    // Assert zero database mutations occurred during request (Persistence Guard)
    expect(await prisma.academyUserCourseProgress.count()).toBe(progressCountBefore);
    expect(await prisma.academyUserLessonProgress.count()).toBe(lessonProgressBefore);
    expect(await prisma.academyUserXp.count()).toBe(xpCountBefore);
    expect(await prisma.academyRewardLedger.count()).toBe(rewardCountBefore);
  });

  it("returns 200 with empty array and totalCount 0 when lesson has zero flashcards", async () => {
    const course = await prisma.academyCourse.create({
      data: {
        slug: "empty-deck-course",
        title: "Empty Deck Course",
        level: "BEGINNER",
        order: 1,
        status: "PUBLISHED",
      },
    });

    await prisma.academyLesson.create({
      data: {
        courseId: course.id,
        slug: "empty-deck-lesson",
        title: "Empty Deck Lesson",
        order: 1,
        status: "PUBLISHED",
      },
    });

    const res = await request(app)
      .get("/api/academy/courses/empty-deck-course/lessons/empty-deck-lesson/flashcards")
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(HTTP_STATUS.OK);

    expect(res.body.data).toEqual({
      courseSlug: "empty-deck-course",
      lessonSlug: "empty-deck-lesson",
      lessonTitle: "Empty Deck Lesson",
      flashcards: [],
      totalCount: 0,
    });
  });

  it("returns 404 NOT_FOUND when parent course is in DRAFT status", async () => {
    const course = await prisma.academyCourse.create({
      data: {
        slug: "draft-course",
        title: "Draft Course",
        level: "BEGINNER",
        order: 1,
        status: "DRAFT",
      },
    });

    const lesson = await prisma.academyLesson.create({
      data: {
        courseId: course.id,
        slug: "lesson-in-draft-course",
        title: "Lesson in Draft Course",
        order: 1,
        status: "PUBLISHED",
      },
    });

    await prisma.academyFlashcard.create({
      data: {
        lessonId: lesson.id,
        front: "Secret Prompt",
        back: "Secret Answer",
        order: 1,
      },
    });

    const res = await request(app)
      .get("/api/academy/courses/draft-course/lessons/lesson-in-draft-course/flashcards")
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(HTTP_STATUS.NOT_FOUND);

    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
  });

  it("returns 404 NOT_FOUND when parent course is in ARCHIVED status", async () => {
    const course = await prisma.academyCourse.create({
      data: {
        slug: "archived-course",
        title: "Archived Course",
        level: "BEGINNER",
        order: 1,
        status: "ARCHIVED",
      },
    });

    const lesson = await prisma.academyLesson.create({
      data: {
        courseId: course.id,
        slug: "lesson-in-archived-course",
        title: "Lesson in Archived Course",
        order: 1,
        status: "PUBLISHED",
      },
    });

    await prisma.academyFlashcard.create({
      data: {
        lessonId: lesson.id,
        front: "Secret Prompt",
        back: "Secret Answer",
        order: 1,
      },
    });

    const res = await request(app)
      .get("/api/academy/courses/archived-course/lessons/lesson-in-archived-course/flashcards")
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(HTTP_STATUS.NOT_FOUND);

    expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
  });

  it("returns 404 NOT_FOUND when parent lesson is in DRAFT status", async () => {
    const course = await prisma.academyCourse.create({
      data: {
        slug: "published-course-draft-lesson",
        title: "Published Course",
        level: "BEGINNER",
        order: 1,
        status: "PUBLISHED",
      },
    });

    const lesson = await prisma.academyLesson.create({
      data: {
        courseId: course.id,
        slug: "draft-lesson",
        title: "Draft Lesson",
        order: 1,
        status: "DRAFT",
      },
    });

    await prisma.academyFlashcard.create({
      data: {
        lessonId: lesson.id,
        front: "Secret Prompt",
        back: "Secret Answer",
        order: 1,
      },
    });

    const res = await request(app)
      .get("/api/academy/courses/published-course-draft-lesson/lessons/draft-lesson/flashcards")
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(HTTP_STATUS.NOT_FOUND);

    expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
  });

  it("returns 404 NOT_FOUND when parent lesson is in ARCHIVED status", async () => {
    const course = await prisma.academyCourse.create({
      data: {
        slug: "published-course-archived-lesson",
        title: "Published Course",
        level: "BEGINNER",
        order: 1,
        status: "PUBLISHED",
      },
    });

    const lesson = await prisma.academyLesson.create({
      data: {
        courseId: course.id,
        slug: "archived-lesson",
        title: "Archived Lesson",
        order: 1,
        status: "ARCHIVED",
      },
    });

    await prisma.academyFlashcard.create({
      data: {
        lessonId: lesson.id,
        front: "Secret Prompt",
        back: "Secret Answer",
        order: 1,
      },
    });

    const res = await request(app)
      .get("/api/academy/courses/published-course-archived-lesson/lessons/archived-lesson/flashcards")
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(HTTP_STATUS.NOT_FOUND);

    expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
  });

  it("returns 404 NOT_FOUND on cross-course / cross-lesson slug mismatch", async () => {
    // Course A has Lesson A
    const courseA = await prisma.academyCourse.create({
      data: {
        slug: "course-alpha",
        title: "Course Alpha",
        level: "BEGINNER",
        order: 1,
        status: "PUBLISHED",
      },
    });
    const lessonA = await prisma.academyLesson.create({
      data: {
        courseId: courseA.id,
        slug: "lesson-alpha",
        title: "Lesson Alpha",
        order: 1,
        status: "PUBLISHED",
      },
    });
    await prisma.academyFlashcard.create({
      data: {
        lessonId: lessonA.id,
        front: "Alpha Front",
        back: "Alpha Back",
        order: 1,
      },
    });

    // Course B has Lesson B
    const courseB = await prisma.academyCourse.create({
      data: {
        slug: "course-beta",
        title: "Course Beta",
        level: "BEGINNER",
        order: 2,
        status: "PUBLISHED",
      },
    });
    const lessonB = await prisma.academyLesson.create({
      data: {
        courseId: courseB.id,
        slug: "lesson-beta",
        title: "Lesson Beta",
        order: 1,
        status: "PUBLISHED",
      },
    });
    await prisma.academyFlashcard.create({
      data: {
        lessonId: lessonB.id,
        front: "Beta Front",
        back: "Beta Back",
        order: 1,
      },
    });

    // Mismatched request: course-alpha with lesson-beta
    const res = await request(app)
      .get("/api/academy/courses/course-alpha/lessons/lesson-beta/flashcards")
      .set("Authorization", `Bearer ${learnerToken}`)
      .expect(HTTP_STATUS.NOT_FOUND);

    expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
  });
});
