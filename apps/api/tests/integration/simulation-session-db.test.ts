import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage, cleanAllTestTables } from "../helpers/test-db-guard.js";
import {
  createRepositoryContainer,
  type IRepositoryContainer,
} from "../../src/infrastructure/database/repository-factory.js";
import { SimulationSessionService } from "../../src/modules/simulation/simulation-session.service.js";
import { transactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { AppError } from "../../src/shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

describe("FEAT-033 Simulation Session Lifecycle & Concurrency (Live PostgreSQL)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

  let prisma: PrismaClient;
  let repos: IRepositoryContainer;
  let sessionService: SimulationSessionService;

  let userA: { id: string; email: string };
  let userB: { id: string; email: string };

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
      sessionService = new SimulationSessionService(
        repos.simulationSessionRepo,
        repos.simulationScenarioRepo,
        repos.simulationPortfolioRepo,
        transactionRunner,
      );
    } catch (err: unknown) {
      const errorMessage = sanitizeDiagnosticMessage(err instanceof Error ? err.message : String(err));
      throw new Error(`[DB_CONNECTION_FAILED] Required PostgreSQL test database unreachable: ${errorMessage}`);
    }
  });

  afterAll(async () => {
    if (prisma) {
      await cleanAllTestTables(prisma);
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    await cleanAllTestTables(prisma);

    // Create User A
    userA = await prisma.user.create({
      data: {
        email: `usera-${Date.now()}@test.com`,
        displayName: "User Alpha",
        status: "ACTIVE",
      },
    });

    // Create User B
    userB = await prisma.user.create({
      data: {
        email: `userb-${Date.now()}@test.com`,
        displayName: "User Beta",
        status: "ACTIVE",
      },
    });

    // Seed default scenario
    await repos.simulationScenarioRepo.createScenario({
      key: "DEFAULT",
      name: "Default Simulation Scenario",
      status: "ACTIVE",
    });
  });

  describe("AC-002: Session Creation & Portfolio Binding", () => {
    it("creates private session with starting cash 100000.0000 and cycle 1", async () => {
      const session = await sessionService.createSession(userA.id, {});

      expect(session.id).toBeDefined();
      expect(session.userId).toBe(userA.id);
      expect(session.status).toBe("CREATED");
      expect(session.startingCash).toBe("100000.0000");
      expect(session.currentCycle).toBe(1);
      expect(session.cashBalance).toBe("100000.0000");
      expect(session.realizedPnl).toBe("0.0000");
      expect(session.simulated).toBe(true);

      // Verify in DB directly
      const dbSession = await prisma.simulationSession.findUnique({
        where: { id: session.id },
        include: { portfolio: true, scenario: true },
      });

      expect(dbSession).not.toBeNull();
      expect(dbSession?.status).toBe("CREATED");
      expect(dbSession?.portfolio?.cashBalance.toFixed(4)).toBe("100000.0000");
      expect(dbSession?.portfolio?.realizedPnl.toFixed(4)).toBe("0.0000");
      expect(dbSession?.scenario.key).toBe("DEFAULT");
    });
  });

  describe("AC-004, AC-005, AC-006: Concurrency & One-Active Invariant (Section 17)", () => {
    it("enforces at most one ACTIVE session per user under 5 concurrent start attempts", async () => {
      // Create 5 separate CREATED sessions for User A
      const sessions = await Promise.all([
        sessionService.createSession(userA.id),
        sessionService.createSession(userA.id),
        sessionService.createSession(userA.id),
        sessionService.createSession(userA.id),
        sessionService.createSession(userA.id),
      ]);

      expect(sessions).toHaveLength(5);

      // Concurrently attempt to activate all 5 sessions for User A
      const startPromises = sessions.map((s) =>
        sessionService.startSession(userA.id, s.id).then(
          (res) => ({ success: true, session: res, error: null }),
          (err) => ({ success: false, session: null, error: err }),
        ),
      );

      const results = await Promise.all(startPromises);

      const succeeded = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      // Exactly ONE start attempt must succeed
      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(4);

      // Failed attempts must receive 409 CONFLICT, not 500
      for (const f of failed) {
        expect(f.error).toBeInstanceOf(AppError);
        expect((f.error as AppError).code).toBe(ERROR_CODES.CONFLICT);
        expect((f.error as AppError).statusCode).toBe(HTTP_STATUS.CONFLICT);
      }

      // Hard DB verification: Query PostgreSQL directly
      const activeSessions = await prisma.simulationSession.findMany({
        where: {
          userId: userA.id,
          status: "ACTIVE",
        },
      });

      expect(activeSessions).toHaveLength(1);
      expect(activeSessions[0].id).toBe(succeeded[0].session?.id);
    });

    it("prevents duplicate active sessions for user when starting an already active session", async () => {
      const s1 = await sessionService.createSession(userA.id);
      await sessionService.startSession(userA.id, s1.id);

      const s2 = await sessionService.createSession(userA.id);

      await expect(sessionService.startSession(userA.id, s2.id))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.CONFLICT,
          statusCode: HTTP_STATUS.CONFLICT,
        });

      const activeCount = await prisma.simulationSession.count({
        where: { userId: userA.id, status: "ACTIVE" },
      });
      expect(activeCount).toBe(1);
    });
  });

  describe("AC-004, AC-007, AC-008: Canonical Lifecycle Transitions & Idempotency (Section 18)", () => {
    it("transitions CREATED -> ACTIVE -> COMPLETED and verifies timestamps", async () => {
      const session = await sessionService.createSession(userA.id);
      expect(session.status).toBe("CREATED");
      expect(session.startedAt).toBeNull();
      expect(session.completedAt).toBeNull();

      const activated = await sessionService.startSession(userA.id, session.id);
      expect(activated.status).toBe("ACTIVE");
      expect(activated.startedAt).not.toBeNull();

      const completed = await sessionService.completeSession(userA.id, session.id);
      expect(completed.status).toBe("COMPLETED");
      expect(completed.completedAt).not.toBeNull();

      // Repeated completion is idempotent
      const repeatedCompleted = await sessionService.completeSession(userA.id, session.id);
      expect(repeatedCompleted.status).toBe("COMPLETED");
      expect(repeatedCompleted.completedAt).toBe(completed.completedAt);
    });

    it("transitions CREATED -> CANCELLED", async () => {
      const session = await sessionService.createSession(userA.id);
      const cancelled = await sessionService.cancelSession(userA.id, session.id);

      expect(cancelled.status).toBe("CANCELLED");
      expect(cancelled.cancelledAt).not.toBeNull();

      // Repeated cancellation is idempotent
      const repeatedCancel = await sessionService.cancelSession(userA.id, session.id);
      expect(repeatedCancel.status).toBe("CANCELLED");
      expect(repeatedCancel.cancelledAt).toBe(cancelled.cancelledAt);
    });

    it("transitions ACTIVE -> CANCELLED", async () => {
      const session = await sessionService.createSession(userA.id);
      await sessionService.startSession(userA.id, session.id);

      const cancelled = await sessionService.cancelSession(userA.id, session.id);
      expect(cancelled.status).toBe("CANCELLED");
      expect(cancelled.cancelledAt).not.toBeNull();
    });

    it("rejects invalid lifecycle transitions with 409 CONFLICT", async () => {
      // 1. Cannot complete a CREATED session
      const createdSession = await sessionService.createSession(userA.id);
      await expect(sessionService.completeSession(userA.id, createdSession.id))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.CONFLICT,
          statusCode: HTTP_STATUS.CONFLICT,
        });

      // 2. Cannot start a COMPLETED session
      await sessionService.startSession(userA.id, createdSession.id);
      await sessionService.completeSession(userA.id, createdSession.id);

      await expect(sessionService.startSession(userA.id, createdSession.id))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.CONFLICT,
          statusCode: HTTP_STATUS.CONFLICT,
        });

      // 3. Cannot cancel a COMPLETED session
      await expect(sessionService.cancelSession(userA.id, createdSession.id))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.CONFLICT,
          statusCode: HTTP_STATUS.CONFLICT,
        });

      // 4. Cannot start a CANCELLED session
      const cancelledSession = await sessionService.createSession(userA.id);
      await sessionService.cancelSession(userA.id, cancelledSession.id);

      await expect(sessionService.startSession(userA.id, cancelledSession.id))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.CONFLICT,
          statusCode: HTTP_STATUS.CONFLICT,
        });
    });
  });

  describe("AC-009: Atomic Reset (Section 19)", () => {
    it("cancels old session and creates a new CREATED session preserving historical data", async () => {
      const oldSession = await sessionService.createSession(userA.id);
      await sessionService.startSession(userA.id, oldSession.id);

      const resetResult = await sessionService.resetSession(userA.id, oldSession.id);

      expect(resetResult.previousSession.id).toBe(oldSession.id);
      expect(resetResult.previousSession.status).toBe("CANCELLED");
      expect(resetResult.previousSession.cancelledAt).not.toBeNull();

      expect(resetResult.newSession.id).not.toBe(oldSession.id);
      expect(resetResult.newSession.status).toBe("CREATED");
      expect(resetResult.newSession.startingCash).toBe("100000.0000");
      expect(resetResult.newSession.currentCycle).toBe(1);
      expect(resetResult.newSession.cashBalance).toBe("100000.0000");

      // Verify old session still exists in DB (not deleted!)
      const dbOldSession = await prisma.simulationSession.findUnique({
        where: { id: oldSession.id },
      });
      expect(dbOldSession).not.toBeNull();
      expect(dbOldSession?.status).toBe("CANCELLED");

      // Verify new session exists in DB
      const dbNewSession = await prisma.simulationSession.findUnique({
        where: { id: resetResult.newSession.id },
        include: { portfolio: true },
      });
      expect(dbNewSession).not.toBeNull();
      expect(dbNewSession?.status).toBe("CREATED");
      expect(dbNewSession?.portfolio?.cashBalance.toFixed(4)).toBe("100000.0000");
    });
  });

  describe("AC-003, AC-010, AC-011: Ownership & IDOR Protection (Section 20)", () => {
    it("strictly isolates sessions between User A and User B", async () => {
      const sessionA = await sessionService.createSession(userA.id);

      // User B cannot read User A's session
      await expect(sessionService.getSessionById(userB.id, sessionA.id))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.NOT_FOUND,
          statusCode: HTTP_STATUS.NOT_FOUND,
        });

      // User B cannot start User A's session
      await expect(sessionService.startSession(userB.id, sessionA.id))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.NOT_FOUND,
          statusCode: HTTP_STATUS.NOT_FOUND,
        });

      // User B cannot complete User A's session
      await expect(sessionService.completeSession(userB.id, sessionA.id))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.NOT_FOUND,
          statusCode: HTTP_STATUS.NOT_FOUND,
        });

      // User B cannot cancel User A's session
      await expect(sessionService.cancelSession(userB.id, sessionA.id))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.NOT_FOUND,
          statusCode: HTTP_STATUS.NOT_FOUND,
        });

      // User B cannot reset User A's session
      await expect(sessionService.resetSession(userB.id, sessionA.id))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.NOT_FOUND,
          statusCode: HTTP_STATUS.NOT_FOUND,
        });

      // User B listing sessions does not show User A's session
      const userBSessions = await sessionService.listSessions(userB.id);
      expect(userBSessions).toHaveLength(0);

      // User A listing sessions shows session A
      const userASessions = await sessionService.listSessions(userA.id);
      expect(userASessions).toHaveLength(1);
      expect(userASessions[0].id).toBe(sessionA.id);
    });
  });
});
