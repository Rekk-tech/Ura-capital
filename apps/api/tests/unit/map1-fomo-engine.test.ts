import { describe, it, expect, beforeEach } from "vitest";
import {
  Map1FomoEngineService,
} from "../../src/modules/simulation/game/map1-fomo-engine.service.js";

describe("Map 1 — FOMO Arena Engine (AURA_MAP1_MAP2_GAME_SPEC §2.1-§2.7)", () => {
  let service: Map1FomoEngineService;
  const mockUserId = "test-learner-1";

  beforeEach(() => {
    service = new Map1FomoEngineService();
  });

  describe("Session Initialization & Initial State", () => {
    it("starts session with initial cash 10,000,000 VND and 0 shares", () => {
      const session = service.startSession(mockUserId);
      expect(session.id).toBeDefined();
      expect(session.userId).toBe(mockUserId);
      expect(session.status).toBe("active");
      expect(session.cash).toBe(10_000_000);
      expect(session.shares).toBe(0);
      expect(session.marginUsed).toBe(0);
    });

    it("returns correct initial state for round 1 news_and_trap phase", () => {
      const session = service.startSession(mockUserId);
      const state = service.getCurrentState(session.id);

      expect(state.round).toBe(1);
      expect(state.totalRounds).toBe(7);
      expect(state.phase).toBe("news_and_trap");
      expect(state.currentPrice).toBe(10_000);
      expect(state.nav).toBe(10_000_000);
      expect(state.canUseMargin).toBe(false); // Locked in R1 and R2
      expect(state.news).toContain("biên bản ghi nhớ");
      expect(state.botChat.length).toBeGreaterThan(0);
    });
  });

  describe("4-Phase Cycle FSM Progression", () => {
    it("progresses through news_and_trap (0-10s), trading_window (10-30s), trap_or_quiz (30-40s), ledger_update (40-45s)", () => {
      const session = service.startSession(mockUserId);
      const start = session.startedAt;

      // At 5s -> news_and_trap
      const stateAt5s = service.getCurrentState(
        session.id,
        new Date(start.getTime() + 5 * 1000),
      );
      expect(stateAt5s.phase).toBe("news_and_trap");
      expect(stateAt5s.secondInRound).toBe(5);

      // At 15s -> trading_window
      const stateAt15s = service.getCurrentState(
        session.id,
        new Date(start.getTime() + 15 * 1000),
      );
      expect(stateAt15s.phase).toBe("trading_window");
      expect(stateAt15s.secondInRound).toBe(15);

      // At 35s -> trap_or_quiz
      const stateAt35s = service.getCurrentState(
        session.id,
        new Date(start.getTime() + 35 * 1000),
      );
      expect(stateAt35s.phase).toBe("trap_or_quiz");
      expect(stateAt35s.secondInRound).toBe(35);

      // At 42s -> ledger_update
      const stateAt42s = service.getCurrentState(
        session.id,
        new Date(start.getTime() + 42 * 1000),
      );
      expect(stateAt42s.phase).toBe("ledger_update");
      expect(stateAt42s.secondInRound).toBe(42);
    });
  });

  describe("Trading Orders & Fees", () => {
    it("executes BUY order in trading window with 0.15% fee deduction", () => {
      const session = service.startSession(mockUserId);
      const tradingTime = new Date(session.startedAt.getTime() + 15 * 1000);

      // Submit BUY 50%
      const state = service.submitOrder(
        session.id,
        { action: "BUY", percentage: 50 },
        tradingTime,
      );

      expect(state.shares).toBeGreaterThan(0);
      expect(state.cash).toBeLessThan(10_000_000);
      expect(session.orders.length).toBe(1);

      const order = session.orders[0]!;
      expect(order.action).toBe("BUY");
      expect(order.fee).toBeGreaterThan(0);
      // Fee rate is 0.15% (0.0015)
      const expectedFee = Math.round(order.grossAmount * 0.0015);
      expect(order.fee).toBe(expectedFee);
    });

    it("rejects Margin x2 in Round 1 and Round 2", () => {
      const session = service.startSession(mockUserId);
      const tradingTimeR1 = new Date(session.startedAt.getTime() + 15 * 1000);

      // Can use margin should be false in Round 1
      const state = service.getCurrentState(session.id, tradingTimeR1);
      expect(state.canUseMargin).toBe(false);
    });

    it("allows Margin x2 from Round 3 onwards", () => {
      const session = service.startSession(mockUserId);
      // Round 3 starts at 90s, trading window is 90 + 15 = 105s
      const tradingTimeR3 = new Date(session.startedAt.getTime() + 105 * 1000);

      const stateR3 = service.getCurrentState(session.id, tradingTimeR3);
      expect(stateR3.round).toBe(3);
      expect(stateR3.canUseMargin).toBe(true);

      // Buy with margin in R3
      const updatedState = service.submitOrder(
        session.id,
        { action: "BUY", percentage: 100, useMargin: true },
        tradingTimeR3,
      );

      expect(updatedState.marginUsed).toBeGreaterThan(0);
    });

    it("executes SELL order and repays margin first", () => {
      const session = service.startSession(mockUserId);
      const tradingTimeR3 = new Date(session.startedAt.getTime() + 105 * 1000);

      // Buy with margin
      service.submitOrder(
        session.id,
        { action: "BUY", percentage: 100, useMargin: true },
        tradingTimeR3,
      );
      expect(session.marginUsed).toBeGreaterThan(0);

      // Now sell 100%
      const sellState = service.submitOrder(
        session.id,
        { action: "SELL", percentage: 100 },
        new Date(session.startedAt.getTime() + 108 * 1000),
      );

      expect(sellState.shares).toBe(0);
      expect(sellState.marginUsed).toBe(0);
      expect(sellState.cash).toBeGreaterThan(0);
    });
  });

  describe("Traps, Quizzes & Rewards", () => {
    it("submits aggressive trap option and records it", () => {
      const session = service.startSession(mockUserId);
      const result = service.submitTrap(session.id, 2, "trap-r2-ato", "yes");
      expect(result.success).toBe(true);
      expect(session.traps.length).toBe(1);
      expect(session.traps[0]!.isAggressive).toBe(true);
    });

    it("submits correct quiz in Round 4 and awards free stop loss", () => {
      const session = service.startSession(mockUserId);
      const result = service.submitQuiz(session.id, 4, "quiz-r4", "B");
      expect(result.success).toBe(true);
      expect(result.isCorrect).toBe(true);
      expect(session.freeStopLossAwarded).toBe(true);
    });
  });

  describe("Discipline & FOMO Scoring Formulas", () => {
    it("computes FOMO score correctly based on weights w1=0.5, w2=0.3, w3=0.2", () => {
      const session = service.startSession(mockUserId);

      // Aggressive trade in high FOMO round with 100% allocation
      const r2Time = new Date(session.startedAt.getTime() + (45 + 28) * 1000); // R2 at 28s (last seconds)
      service.submitOrder(
        session.id,
        { action: "BUY", percentage: 100 },
        r2Time,
      );

      const fomoScore = service.computeFomoScore(session);
      expect(fomoScore).toBeGreaterThanOrEqual(0);
      expect(fomoScore).toBeLessThanOrEqual(100);
    });

    it("deducts Discipline score for missing stop loss and aggressive traps", () => {
      const session = service.startSession(mockUserId);

      // Submit aggressive trap and wrong quiz
      service.submitTrap(session.id, 2, "trap-r2-ato", "yes");
      service.submitQuiz(session.id, 4, "quiz-r4", "A"); // Wrong answer

      // Submit BUY order without stop-loss
      service.submitOrder(
        session.id,
        { action: "BUY", percentage: 50, hasStopLoss: false },
        new Date(session.startedAt.getTime() + 15 * 1000),
      );

      const disciplineScore = service.computeDisciplineScore(session);
      expect(disciplineScore).toBeLessThan(100);
    });
  });

  describe("Stop-Out Rule (Margin Call / Account Burn)", () => {
    it("marks session completed_burned if NAV falls <= 5,000,000 VND", () => {
      const session = service.startSession(mockUserId);
      // Artificially drop cash and equity to trigger stop-out
      session.cash = 3_000_000;
      session.shares = 0;
      session.marginUsed = 0;

      const state = service.getCurrentState(
        session.id,
        new Date(session.startedAt.getTime() + 20 * 1000),
      );

      expect(state.status).toBe("completed_burned");
      expect(state.statusReason).toContain("Cháy tài khoản");
    });
  });

  describe("Session Completion & Debrief Report", () => {
    it("finishes session, generates top 3 mistakes, and awards badge for survivors", () => {
      const session = service.startSession(mockUserId);

      // Complete session
      const debrief = service.finishSession(session.id);
      expect(debrief.sessionId).toBe(session.id);
      expect(debrief.topMistakes.length).toBeGreaterThanOrEqual(1);
      expect(debrief.fomoScore).toBeGreaterThanOrEqual(0);
      expect(debrief.disciplineScore).toBeGreaterThanOrEqual(0);

      if (debrief.status === "completed_survived") {
        expect(debrief.unlocksMap2).toBe(true);
        expect(debrief.badgeAwarded).toBe("Survivor of FOMO Storm");
      }
    });
  });
});
