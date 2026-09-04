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

describe("FEAT-020 Course & Lesson Read Model APIs (Live PostgreSQL Integration)", () => {
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

    // Create an active learner user
    const learner = await prisma.user.create({
      data: {
        email: "learner@auracapital.io",
        displayName: "Learner User",
        status: "ACTIVE",
      },
    });
    learnerToken = accessTokenService.issueAccessToken(learner.id).accessToken;

    // Create Course A: PUBLISHED, BEGINNER
    const courseA = await prisma.academyCourse.create({
      data: {
        slug: "financial-literacy-101",
        title: "Financial Literacy 101",
        description: "Introduction to personal finance and investing.",
        level: "BEGINNER",
        status: "PUBLISHED",
        order: 1,
      },
    });

    // Create Course B: PUBLISHED, ADVANCED
    const courseB = await prisma.academyCourse.create({
      data: {
        slug: "advanced-derivatives",
        title: "Advanced Derivatives & Options",
        description: "In-depth study of derivatives markets.",
        level: "ADVANCED",
        status: "PUBLISHED",
        order: 2,
      },
    });

    // Create Course C: DRAFT
    await prisma.academyCourse.create({
      data: {
        slug: "crypto-trading-draft",
        title: "Crypto Trading Masterclass",
        description: "Unpublished draft curriculum.",
        level: "BEGINNER",
        status: "DRAFT",
        order: 3,
      },
    });

    // Create Course D: ARCHIVED
    await prisma.academyCourse.create({
      data: {
        slug: "legacy-finance-archived",
        title: "Legacy Banking 1990",
        description: "Deprecated curriculum.",
        level: "INTERMEDIATE",
        status: "ARCHIVED",
        order: 4,
      },
    });

    // Lessons under Course A
    await prisma.academyLesson.createMany({
      data: [
        {
          courseId: courseA.id,
          slug: "budgeting-basics",
          title: "Budgeting Basics",
          content: "# Budgeting Basics\n\nLearn how to create your first monthly budget.",
          order: 1,
          status: "PUBLISHED",
        },
        {
          courseId: courseA.id,
          slug: "emergency-fund",
          title: "Building an Emergency Fund",
          content: "# Emergency Fund\n\nAim for 3-6 months of expenses.",
          order: 2,
          status: "PUBLISHED",
        },
        {
          courseId: courseA.id,
          slug: "draft-secret-lesson",
          title: "Unpublished Secret Lesson",
          content: "Draft secret text.",
          order: 3,
          status: "DRAFT",
        },
        {
          courseId: courseA.id,
          slug: "archived-lesson",
          title: "Old Lesson",
          content: "Archived lesson text.",
          order: 4,
          status: "ARCHIVED",
        },
      ],
    });

    // Lessons under Course B
    await prisma.academyLesson.create({
      data: {
        courseId: courseB.id,
        slug: "black-scholes-model",
        title: "Black-Scholes Option Pricing",
        content: "# Black Scholes\n\nContinuous-time finance mathematics.",
        order: 1,
        status: "PUBLISHED",
      },
    });
  });

  describe("AC-001 & AC-002: Scope Boundaries & Zero Schema Changes", () => {
    it("prohibits mutation on read-only Academy routes (POST/PUT/DELETE return 404)", async () => {
      const postRes = await request(app).post("/api/academy/courses").send({ title: "New" });
      expect(postRes.status).toBe(HTTP_STATUS.NOT_FOUND);

      const putRes = await request(app).put("/api/academy/courses/financial-literacy-101").send({});
      expect(putRes.status).toBe(HTTP_STATUS.NOT_FOUND);

      const deleteRes = await request(app).delete("/api/academy/courses/financial-literacy-101");
      expect(deleteRes.status).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it("verifies expected FEAT-019 database indexes exist on PostgreSQL", async () => {
      const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
        SELECT indexname FROM pg_indexes 
        WHERE tablename IN ('academy_courses', 'academy_lessons')
      `;
      const indexNames = indexes.map((idx) => idx.indexname);

      expect(indexNames).toContain("academy_courses_slug_key");
      expect(indexNames).toContain("academy_lessons_course_id_idx");
      expect(indexNames).toContain("academy_lessons_course_id_order_key");
      expect(indexNames).toContain("academy_lessons_course_id_slug_key");
    });
  });

  describe("AC-003: Public Course Catalog Read & Pagination", () => {
    it("returns 200 OK with only PUBLISHED courses to unauthenticated callers", async () => {
      const res = await request(app).get("/api/academy/courses");

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("pagination");

      const courses = res.body.data;
      expect(courses).toHaveLength(2);

      const slugs = courses.map((c: { slug: string }) => c.slug);
      expect(slugs).toContain("financial-literacy-101");
      expect(slugs).toContain("advanced-derivatives");
      // DRAFT and ARCHIVED courses are strictly omitted
      expect(slugs).not.toContain("crypto-trading-draft");
      expect(slugs).not.toContain("legacy-finance-archived");

      // Verify pagination envelope
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });

      // Verify lessonCount accurately reflects published lessons only
      const courseA = courses.find((c: { slug: string }) => c.slug === "financial-literacy-101");
      expect(courseA.lessonCount).toBe(2); // 2 published lessons (draft & archived excluded)
    });

    it("returns totalPages = 0 when matching total = 0", async () => {
      // Filter for INTERMEDIATE (Course D is ARCHIVED so 0 published match)
      const res = await request(app).get("/api/academy/courses?level=INTERMEDIATE");

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    });

    it("respects custom pagination parameters within limits", async () => {
      const res = await request(app).get("/api/academy/courses?page=1&limit=1");

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 1,
        total: 2,
        totalPages: 2,
      });
    });
  });

  describe("AC-004: Ordering & Level Filtering & 400 Bad Request", () => {
    it("returns courses in deterministic order (order ASC, title ASC, id ASC)", async () => {
      const res = await request(app).get("/api/academy/courses");

      expect(res.status).toBe(HTTP_STATUS.OK);
      const courses = res.body.data;
      expect(courses[0].slug).toBe("financial-literacy-101");
      expect(courses[0].order).toBe(1);
      expect(courses[1].slug).toBe("advanced-derivatives");
      expect(courses[1].order).toBe(2);
    });

    it("filters courses by level", async () => {
      const res = await request(app).get("/api/academy/courses?level=ADVANCED");

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].slug).toBe("advanced-derivatives");
      expect(res.body.data[0].level).toBe("ADVANCED");
    });

    it("returns 400 Bad Request on invalid query parameters", async () => {
      // Invalid page < 1
      const resPage = await request(app).get("/api/academy/courses?page=0");
      expect(resPage.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(resPage.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

      // Invalid limit > 50
      const resLimit = await request(app).get("/api/academy/courses?limit=51");
      expect(resLimit.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(resLimit.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

      // Invalid level value
      const resLevel = await request(app).get("/api/academy/courses?level=EXPERT");
      expect(resLevel.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(resLevel.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe("AC-005 & AC-006: Public Course Detail & Visibility Rules", () => {
    it("returns published course detail with ordered published lesson outline", async () => {
      const res = await request(app).get("/api/academy/courses/financial-literacy-101");

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body).toHaveProperty("data");

      const course = res.body.data;
      expect(course.slug).toBe("financial-literacy-101");
      expect(course.title).toBe("Financial Literacy 101");
      expect(course.description).toBe("Introduction to personal finance and investing.");
      expect(course.level).toBe("BEGINNER");
      expect(course.order).toBe(1);

      // Lessons outline
      expect(course.lessons).toHaveLength(2);
      expect(course.lessons[0]).toEqual({
        slug: "budgeting-basics",
        title: "Budgeting Basics",
        order: 1,
      });
      expect(course.lessons[1]).toEqual({
        slug: "emergency-fund",
        title: "Building an Emergency Fund",
        order: 2,
      });

      // DRAFT (order 3) and ARCHIVED (order 4) lessons are NOT returned in outline
      const lessonSlugs = course.lessons.map((l: { slug: string }) => l.slug);
      expect(lessonSlugs).not.toContain("draft-secret-lesson");
      expect(lessonSlugs).not.toContain("archived-lesson");
    });

    it("returns 404 Not Found for nonexistent course slug", async () => {
      const res = await request(app).get("/api/academy/courses/does-not-exist");

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("returns 404 Not Found for DRAFT or ARCHIVED courses without distinguishing from nonexistent", async () => {
      const draftRes = await request(app).get("/api/academy/courses/crypto-trading-draft");
      expect(draftRes.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(draftRes.body.error.code).toBe(ERROR_CODES.NOT_FOUND);

      const archivedRes = await request(app).get("/api/academy/courses/legacy-finance-archived");
      expect(archivedRes.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(archivedRes.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("returns 400 Bad Request on malformed slug format", async () => {
      const res = await request(app).get("/api/academy/courses/INVALID_SLUG!");
      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe("AC-007: Lesson Detail Authentication Boundary", () => {
    it("returns 401 Unauthorized when missing Authorization header", async () => {
      const res = await request(app).get(
        "/api/academy/courses/financial-literacy-101/lessons/budgeting-basics",
      );

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHENTICATED);
    });

    it("returns 401 Unauthorized on malformed or invalid Bearer token", async () => {
      const resMalformed = await request(app)
        .get("/api/academy/courses/financial-literacy-101/lessons/budgeting-basics")
        .set("Authorization", "Bearer");
      expect(resMalformed.status).toBe(HTTP_STATUS.UNAUTHORIZED);

      const resInvalid = await request(app)
        .get("/api/academy/courses/financial-literacy-101/lessons/budgeting-basics")
        .set("Authorization", "Bearer invalid.jwt.token");
      expect(resInvalid.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it("authenticates active learner without requiring admin or special roles", async () => {
      const res = await request(app)
        .get("/api/academy/courses/financial-literacy-101/lessons/budgeting-basics")
        .set("Authorization", `Bearer ${learnerToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.slug).toBe("budgeting-basics");
    });
  });

  describe("AC-008: Published Lesson Success Path", () => {
    it("returns 200 OK with full educational content for published lesson", async () => {
      const res = await request(app)
        .get("/api/academy/courses/financial-literacy-101/lessons/budgeting-basics")
        .set("Authorization", `Bearer ${learnerToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data).toEqual({
        courseSlug: "financial-literacy-101",
        slug: "budgeting-basics",
        title: "Budgeting Basics",
        content: "# Budgeting Basics\n\nLearn how to create your first monthly budget.",
        order: 1,
      });
    });
  });

  describe("AC-009: Relational Ownership Enforcement (Cross-Course Guard)", () => {
    it("returns 404 Not Found if lesson belongs to another course", async () => {
      // budgeting-basics belongs to financial-literacy-101, NOT advanced-derivatives
      const res = await request(app)
        .get("/api/academy/courses/advanced-derivatives/lessons/budgeting-basics")
        .set("Authorization", `Bearer ${learnerToken}`);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });

  describe("AC-010: Draft and Archived Lesson 404 Guard", () => {
    it("returns 404 Not Found for draft lesson under published course", async () => {
      const res = await request(app)
        .get("/api/academy/courses/financial-literacy-101/lessons/draft-secret-lesson")
        .set("Authorization", `Bearer ${learnerToken}`);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("returns 404 Not Found for archived lesson under published course", async () => {
      const res = await request(app)
        .get("/api/academy/courses/financial-literacy-101/lessons/archived-lesson")
        .set("Authorization", `Bearer ${learnerToken}`);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it("returns 404 Not Found if parent course is DRAFT", async () => {
      // Create a published lesson under draft course
      const draftCourse = await prisma.academyCourse.findUnique({
        where: { slug: "crypto-trading-draft" },
      });
      await prisma.academyLesson.create({
        data: {
          courseId: draftCourse!.id,
          slug: "bitcoin-intro",
          title: "Bitcoin Intro",
          content: "Content",
          order: 1,
          status: "PUBLISHED",
        },
      });

      const res = await request(app)
        .get("/api/academy/courses/crypto-trading-draft/lessons/bitcoin-intro")
        .set("Authorization", `Bearer ${learnerToken}`);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });

  describe("AC-011: Safe Learner DTO Whitelist & Leakage Prevention", () => {
    it("verifies course catalog projection does not leak internal fields", async () => {
      const res = await request(app).get("/api/academy/courses");
      expect(res.status).toBe(HTTP_STATUS.OK);

      const course = res.body.data[0];
      const allowedKeys = new Set(["slug", "title", "description", "level", "order", "lessonCount"]);
      Object.keys(course).forEach((key) => {
        expect(allowedKeys.has(key)).toBe(true);
      });

      expect(course).not.toHaveProperty("id");
      expect(course).not.toHaveProperty("createdAt");
      expect(course).not.toHaveProperty("updatedAt");
      expect(course).not.toHaveProperty("status");
    });

    it("verifies course detail projection does not leak internal fields", async () => {
      const res = await request(app).get("/api/academy/courses/financial-literacy-101");
      expect(res.status).toBe(HTTP_STATUS.OK);

      const course = res.body.data;
      const allowedCourseKeys = new Set(["slug", "title", "description", "level", "order", "lessons"]);
      Object.keys(course).forEach((key) => {
        expect(allowedCourseKeys.has(key)).toBe(true);
      });

      const lessonSummary = course.lessons[0];
      const allowedLessonKeys = new Set(["slug", "title", "order"]);
      Object.keys(lessonSummary).forEach((key) => {
        expect(allowedLessonKeys.has(key)).toBe(true);
      });
    });

    it("verifies lesson detail projection does not leak internal fields or quiz data", async () => {
      const res = await request(app)
        .get("/api/academy/courses/financial-literacy-101/lessons/budgeting-basics")
        .set("Authorization", `Bearer ${learnerToken}`);
      expect(res.status).toBe(HTTP_STATUS.OK);

      const lesson = res.body.data;
      const allowedLessonKeys = new Set(["courseSlug", "slug", "title", "content", "order"]);
      Object.keys(lesson).forEach((key) => {
        expect(allowedLessonKeys.has(key)).toBe(true);
      });

      expect(lesson).not.toHaveProperty("id");
      expect(lesson).not.toHaveProperty("courseId");
      expect(lesson).not.toHaveProperty("status");
      expect(lesson).not.toHaveProperty("isCorrect");
      expect(lesson).not.toHaveProperty("quizzes");
      expect(lesson).not.toHaveProperty("flashcards");
    });
  });

  describe("AC-013 & AC-014: Zero Redis State & Zero Product Audit Emission", () => {
    it("emits zero product audit records and zero auth security audit records on read traffic", async () => {
      const auditCountBefore = await prisma.authSecurityAuditRecord.count();

      // Perform multiple read operations
      await request(app).get("/api/academy/courses");
      await request(app).get("/api/academy/courses/financial-literacy-101");
      await request(app)
        .get("/api/academy/courses/financial-literacy-101/lessons/budgeting-basics")
        .set("Authorization", `Bearer ${learnerToken}`);

      const auditCountAfter = await prisma.authSecurityAuditRecord.count();
      expect(auditCountAfter).toBe(auditCountBefore);
    });
  });
});
