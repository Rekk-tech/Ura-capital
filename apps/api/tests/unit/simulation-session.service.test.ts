import { describe, it, expect, beforeEach, vi } from "vitest";
import { Prisma, type SimulationScenario, type SimulationPortfolio, type SimulationSession } from "@prisma/client";
import { SimulationSessionService } from "../../src/modules/simulation/simulation-session.service.js";
import type {
  ISimulationSessionRepository,
  ISimulationScenarioRepository,
  ISimulationPortfolioRepository,
} from "../../src/modules/simulation/simulation.repository.js";
import type { ITransactionRunner } from "../../src/infrastructure/database/transaction-runner.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

type MockSessionWithRelations = SimulationSession & {
  scenario: SimulationScenario;
  portfolio: SimulationPortfolio;
};

describe("SimulationSessionService (Unit)", () => {
  let sessionRepo: ISimulationSessionRepository;
  let scenarioRepo: ISimulationScenarioRepository;
  let portfolioRepo: ISimulationPortfolioRepository;
  let txRunner: ITransactionRunner;
  let service: SimulationSessionService;

  const mockScenario: SimulationScenario = {
    id: "scen-uuid-1",
    key: "DEFAULT",
    name: "Default Simulation Scenario",
    status: "ACTIVE",
    createdAt: new Date("2026-09-01T00:00:00Z"),
    updatedAt: new Date("2026-09-01T00:00:00Z"),
  };

  const mockPortfolio: SimulationPortfolio = {
    id: "port-uuid-1",
    sessionId: "sess-uuid-1",
    cashBalance: new Prisma.Decimal("100000.0000"),
    realizedPnl: new Prisma.Decimal("0.0000"),
    createdAt: new Date("2026-09-01T00:00:00Z"),
    updatedAt: new Date("2026-09-01T00:00:00Z"),
  };

  const createMockSession = (overrides: Partial<MockSessionWithRelations> = {}): MockSessionWithRelations => ({
    id: "sess-uuid-1",
    userId: "user-1",
    scenarioId: "scen-uuid-1",
    status: "CREATED",
    startingCash: new Prisma.Decimal("100000.0000"),
    currentCycle: 1,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    createdAt: new Date("2026-09-01T00:00:00Z"),
    updatedAt: new Date("2026-09-01T00:00:00Z"),
    scenario: mockScenario,
    portfolio: mockPortfolio,
    ...overrides,
  });

  beforeEach(() => {
    sessionRepo = {
      createSession: vi.fn(),
      findSessionById: vi.fn(),
      findActiveSessionByUserId: vi.fn(),
      listSessionsByUserId: vi.fn(),
      updateSessionStatus: vi.fn(),
      advanceCycle: vi.fn(),
    };

    scenarioRepo = {
      createScenario: vi.fn().mockResolvedValue(mockScenario),
      findScenarioById: vi.fn(),
      findScenarioByKey: vi.fn().mockResolvedValue(mockScenario),
      listScenarios: vi.fn().mockResolvedValue([mockScenario]),
    };

    portfolioRepo = {
      createPortfolio: vi.fn().mockResolvedValue(mockPortfolio),
      findPortfolioBySessionId: vi.fn().mockResolvedValue(mockPortfolio),
      findPortfolioById: vi.fn().mockResolvedValue(mockPortfolio),
      updateCashBalance: vi.fn(),
      updateRealizedPnl: vi.fn(),
      createPosition: vi.fn(),
      findPosition: vi.fn(),
      listPositions: vi.fn(),
      upsertPosition: vi.fn(),
    };

    txRunner = {
      run: vi.fn().mockImplementation(async (cb) => {
        return cb({
          repositories: {
            simulationSessionRepo: sessionRepo,
            simulationScenarioRepo: scenarioRepo,
            simulationPortfolioRepo: portfolioRepo,
          },
        } as unknown as Parameters<Parameters<ITransactionRunner["run"]>[0]>[0]);
      }),
    };

    service = new SimulationSessionService(sessionRepo, scenarioRepo, portfolioRepo, txRunner);
  });

  describe("AC-001: Strict Schema Authority Checks", () => {
    it("rejects client-provided userId with 400 VALIDATION_ERROR", async () => {
      await expect(service.createSession("user-1", { userId: "attacker-id" }))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.VALIDATION_ERROR,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
    });

    it("rejects client-provided status with 400 VALIDATION_ERROR", async () => {
      await expect(service.createSession("user-1", { status: "ACTIVE" }))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.VALIDATION_ERROR,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
    });

    it("rejects client-provided startingCash or cash with 400 VALIDATION_ERROR", async () => {
      await expect(service.createSession("user-1", { startingCash: 999999 }))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.VALIDATION_ERROR,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });

      await expect(service.createSession("user-1", { cash: 999999 }))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.VALIDATION_ERROR,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
    });

    it("rejects client-provided currentCycle with 400 VALIDATION_ERROR", async () => {
      await expect(service.createSession("user-1", { currentCycle: 10 }))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.VALIDATION_ERROR,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
    });

    it("rejects client-provided scenarioId or scenario with 400 VALIDATION_ERROR", async () => {
      await expect(service.createSession("user-1", { scenarioId: "arbitrary-id" }))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.VALIDATION_ERROR,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
    });

    it("rejects non-object body with 400 VALIDATION_ERROR", async () => {
      await expect(service.createSession("user-1", "invalid-body" as unknown as Record<string, unknown>))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.VALIDATION_ERROR,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        });
    });
  });

  describe("AC-002: Create Session", () => {
    it("creates session in CREATED status bound to default scenario and startingCash 100000.0000", async () => {
      const mockCreated = createMockSession({ status: "CREATED" });
      vi.mocked(sessionRepo.createSession).mockResolvedValue(mockCreated);

      const result = await service.createSession("user-1", {});

      expect(result.status).toBe("CREATED");
      expect(result.currentCycle).toBe(1);
      expect(result.startingCash).toBe("100000.0000");
      expect(result.cashBalance).toBe("100000.0000");
      expect(result.simulated).toBe(true);
      expect(portfolioRepo.createPortfolio).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: mockCreated.id,
          cashBalance: "100000.0000",
        }),
      );
    });
  });

  describe("AC-003 & AC-010: Ownership & Read Isolation", () => {
    it("returns session when requested by owner", async () => {
      const session = createMockSession({ userId: "user-1" });
      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(session);

      const result = await service.getSessionById("user-1", "sess-uuid-1");
      expect(result.id).toBe("sess-uuid-1");
      expect(result.userId).toBe("user-1");
    });

    it("throws 404 NOT_FOUND when requested by another user (safe IDOR rejection)", async () => {
      const session = createMockSession({ userId: "user-1" });
      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(session);

      await expect(service.getSessionById("user-2", "sess-uuid-1"))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.NOT_FOUND,
          statusCode: HTTP_STATUS.NOT_FOUND,
        });
    });

    it("throws 404 NOT_FOUND for non-existent session", async () => {
      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(null);

      await expect(service.getSessionById("user-1", "non-existent"))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.NOT_FOUND,
          statusCode: HTTP_STATUS.NOT_FOUND,
        });
    });

    it("lists only sessions owned by the authenticated user", async () => {
      const sessions = [
        createMockSession({ id: "sess-1", userId: "user-1" }),
        createMockSession({ id: "sess-2", userId: "user-1" }),
      ];
      vi.mocked(sessionRepo.listSessionsByUserId).mockResolvedValue(sessions);

      const result = await service.listSessions("user-1");
      expect(result).toHaveLength(2);
      expect(sessionRepo.listSessionsByUserId).toHaveBeenCalledWith("user-1", undefined);
    });
  });

  describe("AC-004 & AC-005: Start / Activation & One-Active Invariant", () => {
    it("transitions CREATED -> ACTIVE and sets startedAt", async () => {
      const session = createMockSession({ status: "CREATED" });
      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(session);
      vi.mocked(sessionRepo.findActiveSessionByUserId).mockResolvedValue(null);
      vi.mocked(sessionRepo.updateSessionStatus).mockResolvedValue({
        ...session,
        status: "ACTIVE",
        startedAt: new Date(),
      });

      const result = await service.startSession("user-1", "sess-uuid-1");
      expect(result.status).toBe("ACTIVE");
      expect(sessionRepo.updateSessionStatus).toHaveBeenCalledWith(
        "sess-uuid-1",
        "ACTIVE",
        "startedAt",
        expect.any(Date),
      );
    });

    it("rejects starting a session that is already ACTIVE with 409 CONFLICT", async () => {
      const session = createMockSession({ status: "ACTIVE" });
      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(session);

      await expect(service.startSession("user-1", "sess-uuid-1"))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.CONFLICT,
          statusCode: HTTP_STATUS.CONFLICT,
        });
    });

    it("rejects starting when another session is already ACTIVE (service pre-check)", async () => {
      const session = createMockSession({ id: "sess-1", status: "CREATED" });
      const activeSession = createMockSession({ id: "sess-2", status: "ACTIVE" });
      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(session);
      vi.mocked(sessionRepo.findActiveSessionByUserId).mockResolvedValue(activeSession);

      await expect(service.startSession("user-1", "sess-1"))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.CONFLICT,
          statusCode: HTTP_STATUS.CONFLICT,
        });
    });

    it("handles PostgreSQL partial unique constraint violation (P2002) as 409 CONFLICT", async () => {
      const session = createMockSession({ status: "CREATED" });
      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(session);
      vi.mocked(sessionRepo.findActiveSessionByUserId).mockResolvedValue(null);

      const p2002Err = Object.assign(new Error("Unique constraint failed on simulation_sessions_user_active_idx"), {
        code: "P2002",
      });
      vi.mocked(sessionRepo.updateSessionStatus).mockRejectedValue(p2002Err);

      await expect(service.startSession("user-1", "sess-uuid-1"))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.CONFLICT,
          statusCode: HTTP_STATUS.CONFLICT,
        });
    });

    it("rejects cross-user session start with 404 NOT_FOUND", async () => {
      const session = createMockSession({ userId: "user-1", status: "CREATED" });
      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(session);

      await expect(service.startSession("user-2", "sess-uuid-1"))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.NOT_FOUND,
          statusCode: HTTP_STATUS.NOT_FOUND,
        });
    });
  });

  describe("AC-007: Completion", () => {
    it("transitions ACTIVE -> COMPLETED and sets completedAt", async () => {
      const session = createMockSession({ status: "ACTIVE" });
      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(session);
      vi.mocked(sessionRepo.updateSessionStatus).mockResolvedValue({
        ...session,
        status: "COMPLETED",
        completedAt: new Date(),
      });

      const result = await service.completeSession("user-1", "sess-uuid-1");
      expect(result.status).toBe("COMPLETED");
      expect(sessionRepo.updateSessionStatus).toHaveBeenCalledWith(
        "sess-uuid-1",
        "COMPLETED",
        "completedAt",
        expect.any(Date),
      );
    });

    it("is idempotent when session is already COMPLETED", async () => {
      const session = createMockSession({
        status: "COMPLETED",
        completedAt: new Date("2026-09-02T12:00:00Z"),
      });
      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(session);

      const result = await service.completeSession("user-1", "sess-uuid-1");
      expect(result.status).toBe("COMPLETED");
      expect(sessionRepo.updateSessionStatus).not.toHaveBeenCalled();
    });

    it("rejects completing a CREATED session with 409 CONFLICT", async () => {
      const session = createMockSession({ status: "CREATED" });
      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(session);

      await expect(service.completeSession("user-1", "sess-uuid-1"))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.CONFLICT,
          statusCode: HTTP_STATUS.CONFLICT,
        });
    });

    it("rejects cross-user completion with 404 NOT_FOUND", async () => {
      const session = createMockSession({ userId: "user-1", status: "ACTIVE" });
      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(session);

      await expect(service.completeSession("user-2", "sess-uuid-1"))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.NOT_FOUND,
          statusCode: HTTP_STATUS.NOT_FOUND,
        });
    });
  });

  describe("AC-008: Cancellation", () => {
    it("supports CREATED -> CANCELLED", async () => {
      const session = createMockSession({ status: "CREATED" });
      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(session);
      vi.mocked(sessionRepo.updateSessionStatus).mockResolvedValue({
        ...session,
        status: "CANCELLED",
        cancelledAt: new Date(),
      });

      const result = await service.cancelSession("user-1", "sess-uuid-1");
      expect(result.status).toBe("CANCELLED");
    });

    it("supports ACTIVE -> CANCELLED", async () => {
      const session = createMockSession({ status: "ACTIVE" });
      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(session);
      vi.mocked(sessionRepo.updateSessionStatus).mockResolvedValue({
        ...session,
        status: "CANCELLED",
        cancelledAt: new Date(),
      });

      const result = await service.cancelSession("user-1", "sess-uuid-1");
      expect(result.status).toBe("CANCELLED");
    });

    it("is idempotent when session is already CANCELLED", async () => {
      const session = createMockSession({
        status: "CANCELLED",
        cancelledAt: new Date("2026-09-02T12:00:00Z"),
      });
      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(session);

      const result = await service.cancelSession("user-1", "sess-uuid-1");
      expect(result.status).toBe("CANCELLED");
      expect(sessionRepo.updateSessionStatus).not.toHaveBeenCalled();
    });

    it("rejects cancelling a COMPLETED session with 409 CONFLICT", async () => {
      const session = createMockSession({ status: "COMPLETED" });
      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(session);

      await expect(service.cancelSession("user-1", "sess-uuid-1"))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.CONFLICT,
          statusCode: HTTP_STATUS.CONFLICT,
        });
    });

    it("rejects cross-user cancellation with 404 NOT_FOUND", async () => {
      const session = createMockSession({ userId: "user-1", status: "ACTIVE" });
      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(session);

      await expect(service.cancelSession("user-2", "sess-uuid-1"))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.NOT_FOUND,
          statusCode: HTTP_STATUS.NOT_FOUND,
        });
    });
  });

  describe("AC-009: Atomic Reset", () => {
    it("cancels old session and creates new session in CREATED status without deleting data", async () => {
      const oldSession = createMockSession({ id: "old-sess", status: "ACTIVE" });
      const newSession = createMockSession({ id: "new-sess", status: "CREATED" });

      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(oldSession);
      vi.mocked(sessionRepo.updateSessionStatus).mockResolvedValue({
        ...oldSession,
        status: "CANCELLED",
        cancelledAt: new Date(),
      });
      vi.mocked(sessionRepo.createSession).mockResolvedValue(newSession);

      const result = await service.resetSession("user-1", "old-sess");

      expect(result.previousSession.status).toBe("CANCELLED");
      expect(result.newSession.id).toBe("new-sess");
      expect(result.newSession.status).toBe("CREATED");
      expect(result.newSession.startingCash).toBe("100000.0000");
      expect(sessionRepo.updateSessionStatus).toHaveBeenCalledWith(
        "old-sess",
        "CANCELLED",
        "cancelledAt",
        expect.any(Date),
      );
      expect(sessionRepo.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          status: "CREATED",
          startingCash: "100000.0000",
          currentCycle: 1,
        }),
      );
    });

    it("rejects cross-user reset with 404 NOT_FOUND", async () => {
      const oldSession = createMockSession({ userId: "user-1", status: "ACTIVE" });
      vi.mocked(sessionRepo.findSessionById).mockResolvedValue(oldSession);

      await expect(service.resetSession("user-2", "old-sess"))
        .rejects
        .toMatchObject({
          code: ERROR_CODES.NOT_FOUND,
          statusCode: HTTP_STATUS.NOT_FOUND,
        });
    });
  });
});
