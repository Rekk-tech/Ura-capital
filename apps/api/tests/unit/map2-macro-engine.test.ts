import { describe, it, expect, beforeEach } from "vitest";
import {
  Map2MacroEngineService,
} from "../../src/modules/simulation/game/map2-macro-engine.service.js";
import {
  Map2AIAdvisorService,
} from "../../src/modules/simulation/game/map2-ai-advisor.service.js";

describe("Map 2 — Pro Room Macro Value Engine (AURA_MAP1_MAP2_GAME_SPEC §2.8-§2.12)", () => {
  let service: Map2MacroEngineService;
  const mockUserId = "pro-learner-1";

  beforeEach(() => {
    service = new Map2MacroEngineService();
  });

  describe("Session Initialization & Initial State", () => {
    it("starts session with initial cash 100,000,000 VND and 12 quarters", () => {
      const session = service.startSession(mockUserId);
      expect(session.id).toBeDefined();
      expect(session.userId).toBe(mockUserId);
      expect(session.status).toBe("active");
      expect(session.currentQuarter).toBe(1);
      expect(session.initialCash).toBe(100_000_000);
      expect(session.currentNav).toBe(100_000_000);
      expect(session.creditScore).toBe(50);

      // Default allocation sum must be 100%
      const totalAlloc =
        session.currentAllocation.growth +
        session.currentAllocation.value +
        session.currentAllocation.bond +
        session.currentAllocation.cash;
      expect(totalAlloc).toBe(100);
    });
  });

  describe("Allocation Validation (100% Sum Rule)", () => {
    it("accepts valid allocation summing to exactly 100%", () => {
      const session = service.startSession(mockUserId);
      const valid = service.setAllocation(session.id, {
        growth: 40,
        value: 30,
        bond: 20,
        cash: 10,
      });

      expect(valid.allocation.growth).toBe(40);
      expect(valid.allocation.value).toBe(30);
      expect(valid.allocation.bond).toBe(20);
      expect(valid.allocation.cash).toBe(10);
    });

    it("throws error if allocation does not sum to 100%", () => {
      const session = service.startSession(mockUserId);
      expect(() =>
        service.setAllocation(session.id, {
          growth: 50,
          value: 30,
          bond: 20,
          cash: 20, // sum = 120
        }),
      ).toThrow("Tổng tỷ trọng phân bổ phải bằng 100%");
    });
  });

  describe("Sensitivity Matrix & Macro Returns Computation", () => {
    it("computes asset returns based on macro changes (Rate, Inflation, GDP)", () => {
      // Delta changes between Q1 (rate 5%) and Q4 (rate 8.5%)
      const returns = service.computeQuarterReturns(4, {
        growth: 25,
        value: 25,
        bond: 25,
        cash: 25,
      });

      expect(returns.growth).toBeDefined();
      expect(returns.value).toBeDefined();
      expect(returns.bond).toBeDefined();
      expect(returns.cash).toBeDefined();
      expect(returns.portfolio).toBeDefined();

      // Rate increased by +3.5%, so EQ_GROWTH (betaRate = -2.0) should suffer more than EQ_VALUE (betaRate = -0.5)
      expect(returns.growth).toBeLessThan(returns.value);
    });
  });

  describe("Disciplinary Quizzes & Credit Score", () => {
    it("awards +10 Credit Score for correct disciplinary quiz answers", () => {
      const session = service.startSession(mockUserId);
      expect(session.creditScore).toBe(50);

      // Quiz on Q2: option B is correct
      const result = service.submitQuiz(session.id, 2, "quiz-q2", "B");
      expect(result.success).toBe(true);
      expect(result.isCorrect).toBe(true);
      expect(session.creditScore).toBe(60);
    });

    it("does not increment Credit Score for incorrect answer", () => {
      const session = service.startSession(mockUserId);
      const initialScore = session.creditScore;

      const result = service.submitQuiz(session.id, 2, "quiz-q2", "A");
      expect(result.success).toBe(true);
      expect(result.isCorrect).toBe(false);
      expect(session.creditScore).toBe(initialScore);
    });
  });

  describe("Quarter Commitment & Portfolio Progression", () => {
    it("commits quarters sequentially from Q1 to Q12", async () => {
      const session = service.startSession(mockUserId);

      // Commit Q1
      const resQ1 = await service.commitQuarter(session.id, {
        growth: 40,
        value: 30,
        bond: 20,
        cash: 10,
      });

      expect(resQ1.session.currentQuarter).toBe(2);
      expect(resQ1.historyRecord.quarter).toBe(1);
      expect(resQ1.historyRecord.advisorNote.length).toBeGreaterThan(10);
      expect(resQ1.session.history.length).toBe(1);
    });

    it("generates final report at Q12 with CAGR, Alpha, Max Drawdown, Sharpe, and Investment Style", async () => {
      const session = service.startSession(mockUserId);

      // Commit all 12 quarters
      for (let q = 1; q <= 12; q++) {
        await service.commitQuarter(session.id, {
          growth: 25,
          value: 35,
          bond: 25,
          cash: 15,
        });
      }

      expect(session.status).toBe("completed");
      expect(session.history.length).toBe(12);

      const report = service.generateFinalReport(session.id);
      expect(report.sessionId).toBe(session.id);
      expect(report.status).toBe("completed");
      expect(report.cagr).toBeDefined();
      expect(report.alpha).toBeDefined();
      expect(report.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(report.sharpeRatio).toBeDefined();
      expect(report.investmentStyle).toBeDefined();
      expect(report.styleDescription.length).toBeGreaterThan(10);
      expect(report.advisorOverallSummary.length).toBeGreaterThan(10);
    });
  });

  describe("AI Advisor (Graham & Buffett Value Philosophy)", () => {
    it("generates debrief note under 80 words with causal macro explanation", () => {
      const advisor = new Map2AIAdvisorService();

      const note = advisor.generateDeterministicValueAdvice({
        quarterNumber: 4,
        interestRate: 8.5,
        inflation: 6.0,
        gdpGrowth: 4.0,
        allocGrowth: 60,
        allocValue: 20,
        allocBond: 10,
        allocCash: 10,
        pnlPercent: -8.5,
        currentNav: 91_500_000,
        quarterEventDescription: "NHNN tăng lãi suất điều hành mạnh",
      });

      expect(note.length).toBeGreaterThan(20);
      const wordCount = note.trim().split(/\s+/).length;
      expect(wordCount).toBeLessThan(80);
      expect(note).toContain("Lãi suất");
    });
  });
});
