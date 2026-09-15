import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";
import type {
  ISimulationSessionRepository,
  ISimulationScenarioRepository,
  ISimulationPortfolioRepository,
} from "./simulation.repository.js";
import {
  SIMULATION_CONSTANTS,
  type SimulationSessionStatus,
} from "./simulation.types.js";
import type { ITransactionRunner } from "../../infrastructure/database/transaction-runner.js";
import { transactionRunner as defaultTransactionRunner } from "../../infrastructure/database/transaction-runner.js";
import {
  toSimulationSessionDto,
  type SimulationSessionDto,
  type ResetSessionResultDto,
  type RawSimulationSession,
} from "./simulation-session.dto.js";
import { assertNoAuthorityFields } from "./simulation-session.validation.js";

export class SimulationSessionService {
  constructor(
    private readonly sessionRepo: ISimulationSessionRepository,
    private readonly scenarioRepo: ISimulationScenarioRepository,
    private readonly portfolioRepo: ISimulationPortfolioRepository,
    private readonly txRunner: ITransactionRunner = defaultTransactionRunner,
  ) {}

  /**
   * Helper to resolve or lazily initialize the canonical default MVP scenario.
   */
  private async resolveDefaultScenario(
    scenarioRepo: ISimulationScenarioRepository = this.scenarioRepo,
  ) {
    let scenario = await scenarioRepo.findScenarioByKey("DEFAULT");
    if (!scenario) {
      const activeScenarios = await scenarioRepo.listScenarios({ status: "ACTIVE" });
      scenario = activeScenarios[0] ?? null;
    }
    if (!scenario) {
      scenario = await scenarioRepo.createScenario({
        key: "DEFAULT",
        name: "Default Simulation Scenario",
        status: "ACTIVE",
      });
    }
    return scenario;
  }

  /**
   * FR-001 / FR-002: Create private simulation session in CREATED status bound to default scenario.
   * Client-owned authority fields are strictly rejected.
   */
  async createSession(userId: string, body?: unknown): Promise<SimulationSessionDto> {
    assertNoAuthorityFields(body);

    const defaultScenario = await this.resolveDefaultScenario();

    return this.txRunner.run(async (ctx) => {
      const session = await ctx.repositories.simulationSessionRepo.createSession({
        userId,
        scenarioId: defaultScenario.id,
        status: "CREATED",
        startingCash: SIMULATION_CONSTANTS.STARTING_CASH_DEFAULT,
        currentCycle: SIMULATION_CONSTANTS.STARTING_CYCLE,
      });

      const portfolio = await ctx.repositories.simulationPortfolioRepo.createPortfolio({
        sessionId: session.id,
        cashBalance: SIMULATION_CONSTANTS.STARTING_CASH_DEFAULT,
        realizedPnl: SIMULATION_CONSTANTS.DEFAULT_REALIZED_PNL,
      });

      return toSimulationSessionDto({
        ...session,
        scenario: defaultScenario,
        portfolio,
      });
    });
  }

  /**
   * FR-003 / FR-004 / FR-005: Start/activate a CREATED session.
   * Enforces at most one ACTIVE session per user with PostgreSQL partial unique index protection.
   */
  async startSession(userId: string, sessionId: string): Promise<SimulationSessionDto> {
    const session = await this.sessionRepo.findSessionById(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError(
        "Simulation session not found",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    if (session.status !== "CREATED") {
      throw new AppError(
        `Cannot start session in status: ${session.status}`,
        ERROR_CODES.CONFLICT,
        HTTP_STATUS.CONFLICT,
      );
    }

    // Fast pre-check for active session
    const existingActive = await this.sessionRepo.findActiveSessionByUserId(userId);
    if (existingActive && existingActive.id !== sessionId) {
      throw new AppError(
        "User already has an active simulation session",
        ERROR_CODES.CONFLICT,
        HTTP_STATUS.CONFLICT,
      );
    }

    try {
      const started = await this.txRunner.run(async (ctx) => {
        return ctx.repositories.simulationSessionRepo.updateSessionStatus(
          sessionId,
          "ACTIVE",
          "startedAt",
          new Date(),
        );
      });

      return toSimulationSessionDto({
        ...started,
        scenario: (session as RawSimulationSession).scenario,
        portfolio: (session as RawSimulationSession).portfolio,
      });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const message = String(err);
      if (
        code === "P2002" ||
        message.includes("simulation_sessions_user_active_idx") ||
        message.includes("unique constraint")
      ) {
        throw new AppError(
          "User already has an active simulation session",
          ERROR_CODES.CONFLICT,
          HTTP_STATUS.CONFLICT,
        );
      }
      throw err;
    }
  }

  /**
   * FR-006: Explicit server-authorized completion: transitions ACTIVE -> COMPLETED.
   * Idempotent if already COMPLETED.
   */
  async completeSession(userId: string, sessionId: string): Promise<SimulationSessionDto> {
    const session = await this.sessionRepo.findSessionById(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError(
        "Simulation session not found",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    if (session.status === "COMPLETED") {
      return toSimulationSessionDto(session as RawSimulationSession);
    }

    if (session.status !== "ACTIVE") {
      throw new AppError(
        `Cannot complete session in status: ${session.status}`,
        ERROR_CODES.CONFLICT,
        HTTP_STATUS.CONFLICT,
      );
    }

    const completed = await this.sessionRepo.updateSessionStatus(
      sessionId,
      "COMPLETED",
      "completedAt",
      new Date(),
    );

    return toSimulationSessionDto({
      ...completed,
      scenario: (session as RawSimulationSession).scenario,
      portfolio: (session as RawSimulationSession).portfolio,
    });
  }

  /**
   * FR-007: Cancellation supports CREATED -> CANCELLED and ACTIVE -> CANCELLED.
   * Idempotent if already CANCELLED.
   */
  async cancelSession(userId: string, sessionId: string): Promise<SimulationSessionDto> {
    const session = await this.sessionRepo.findSessionById(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError(
        "Simulation session not found",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    if (session.status === "CANCELLED") {
      return toSimulationSessionDto(session as RawSimulationSession);
    }

    if (session.status === "COMPLETED") {
      throw new AppError(
        "Cannot cancel a completed simulation session",
        ERROR_CODES.CONFLICT,
        HTTP_STATUS.CONFLICT,
      );
    }

    const cancelled = await this.sessionRepo.updateSessionStatus(
      sessionId,
      "CANCELLED",
      "cancelledAt",
      new Date(),
    );

    return toSimulationSessionDto({
      ...cancelled,
      scenario: (session as RawSimulationSession).scenario,
      portfolio: (session as RawSimulationSession).portfolio,
    });
  }

  /**
   * FR-008: Atomic reset cancels the old current session and creates a new CREATED session.
   * Historical session data, orders, trades, and portfolio history remain preserved.
   */
  async resetSession(userId: string, sessionId: string): Promise<ResetSessionResultDto> {
    const session = await this.sessionRepo.findSessionById(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError(
        "Simulation session not found",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    return this.txRunner.run(async (ctx) => {
      // 1. Cancel targeted session if currently CREATED or ACTIVE
      let cancelledSession = session;
      if (session.status === "CREATED" || session.status === "ACTIVE") {
        cancelledSession = await ctx.repositories.simulationSessionRepo.updateSessionStatus(
          session.id,
          "CANCELLED",
          "cancelledAt",
          new Date(),
        );
      }

      // 2. Cancel any other lingering ACTIVE session for this user to guarantee clean slate
      const otherActive = await ctx.repositories.simulationSessionRepo.findActiveSessionByUserId(userId);
      if (otherActive && otherActive.id !== session.id) {
        await ctx.repositories.simulationSessionRepo.updateSessionStatus(
          otherActive.id,
          "CANCELLED",
          "cancelledAt",
          new Date(),
        );
      }

      // 3. Resolve default scenario
      const scenario = await this.resolveDefaultScenario(ctx.repositories.simulationScenarioRepo);

      // 4. Create new fresh session in CREATED status
      const newSession = await ctx.repositories.simulationSessionRepo.createSession({
        userId,
        scenarioId: scenario.id,
        status: "CREATED",
        startingCash: SIMULATION_CONSTANTS.STARTING_CASH_DEFAULT,
        currentCycle: SIMULATION_CONSTANTS.STARTING_CYCLE,
      });

      // 5. Create fresh portfolio with canonical starting cash
      const newPortfolio = await ctx.repositories.simulationPortfolioRepo.createPortfolio({
        sessionId: newSession.id,
        cashBalance: SIMULATION_CONSTANTS.STARTING_CASH_DEFAULT,
        realizedPnl: SIMULATION_CONSTANTS.DEFAULT_REALIZED_PNL,
      });

      return {
        previousSession: toSimulationSessionDto(cancelledSession as RawSimulationSession),
        newSession: toSimulationSessionDto({
          ...newSession,
          scenario,
          portfolio: newPortfolio,
        }),
      };
    });
  }

  /**
   * FR-010: Read specific session by ID with ownership isolation.
   */
  async getSessionById(userId: string, sessionId: string): Promise<SimulationSessionDto> {
    const session = await this.sessionRepo.findSessionById(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError(
        "Simulation session not found",
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    const raw = session as RawSimulationSession;
    const portfolio = raw.portfolio ?? (await this.portfolioRepo.findPortfolioBySessionId(sessionId));

    return toSimulationSessionDto({
      ...raw,
      portfolio,
    });
  }

  /**
   * FR-010: List all simulation sessions owned by authenticated user.
   */
  async listSessions(
    userId: string,
    filter?: { status?: SimulationSessionStatus },
  ): Promise<SimulationSessionDto[]> {
    const sessions = await this.sessionRepo.listSessionsByUserId(userId, filter);
    return sessions.map((s) => toSimulationSessionDto(s as RawSimulationSession));
  }
}
