import { randomUUID } from "node:crypto";
import {
  map2AssetModel,
  type Map2AssetModel,
} from "../config/map2-asset-model.js";
import {
  map2AIAdvisorService,
  Map2AIAdvisorService,
} from "./map2-ai-advisor.service.js";

export type Map2SessionStatus = "active" | "completed" | "aborted";

export interface Map2Allocation {
  growth: number; // 0..100
  value: number; // 0..100
  bond: number; // 0..100
  cash: number; // 0..100
}

export interface Map2QuarterHistoryRecord {
  quarter: number;
  stage: string;
  stageKey: string;
  rate: number;
  inflation: number;
  gdp: number;
  allocation: Map2Allocation;
  returns: {
    growth: number;
    value: number;
    bond: number;
    cash: number;
    portfolio: number;
  };
  nav: number;
  pnlQuarterAmount: number;
  pnlQuarterPercent: number;
  drawdown: number;
  advisorNote: string;
  quizResult?: {
    quizId: string;
    selectedOption: string;
    isCorrect: boolean;
  };
}

export interface Map2Session {
  id: string;
  userId: string;
  status: Map2SessionStatus;
  currentQuarter: number; // 1..12
  initialCash: number;
  currentNav: number;
  peakNav: number;
  maxDrawdown: number;
  creditScore: number;
  currentAllocation: Map2Allocation;
  history: Map2QuarterHistoryRecord[];
  startedAt: Date;
  endedAt?: Date;
}

export interface Map2FinalReport {
  sessionId: string;
  status: Map2SessionStatus;
  initialCash: number;
  finalNav: number;
  totalPnlAmount: number;
  totalPnlPercent: number;
  cagr: number;
  benchmarkCagr: number;
  alpha: number;
  maxDrawdown: number;
  sharpeRatio: number;
  creditScore: number;
  investmentStyle: string;
  styleDescription: string;
  advisorOverallSummary: string;
  quarterHistory: Map2QuarterHistoryRecord[];
}

export class Map2MacroEngineService {
  private sessions = new Map<string, Map2Session>();
  private readonly config: Map2AssetModel = map2AssetModel;

  constructor(
    private readonly aiAdvisor: Map2AIAdvisorService = map2AIAdvisorService,
  ) {}

  /**
   * Helper to sample random Gaussian variable N(0, sigma) using Box-Muller
   */
  private sampleGaussian(sigma: number): number {
    if (sigma <= 0) return 0;
    const u1 = Math.max(1e-10, Math.random());
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * sigma;
  }

  /**
   * Start a new Map 2 simulation session
   */
  startSession(userId: string): Map2Session {
    const defaultAllocation: Map2Allocation = {
      growth: 30,
      value: 30,
      bond: 20,
      cash: 20,
    };

    const session: Map2Session = {
      id: randomUUID(),
      userId,
      status: "active",
      currentQuarter: 1,
      initialCash: this.config.initialCash,
      currentNav: this.config.initialCash,
      peakNav: this.config.initialCash,
      maxDrawdown: 0,
      creditScore: 50,
      currentAllocation: defaultAllocation,
      history: [],
      startedAt: new Date(),
    };

    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): Map2Session | null {
    return this.sessions.get(sessionId) ?? null;
  }

  /**
   * Update allocation for current quarter
   */
  setAllocation(
    sessionId: string,
    allocation: Map2Allocation,
  ): { success: boolean; allocation: Map2Allocation } {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    if (session.status !== "active") {
      throw new Error("Session is not active");
    }

    const total =
      allocation.growth + allocation.value + allocation.bond + allocation.cash;
    if (Math.abs(total - 100) > 0.01) {
      throw new Error(`Tổng tỷ trọng phân bổ phải bằng 100% (Hiện tại: ${total}%)`);
    }

    if (
      allocation.growth < 0 ||
      allocation.value < 0 ||
      allocation.bond < 0 ||
      allocation.cash < 0
    ) {
      throw new Error("Tỷ trọng từng nhóm tài sản không được âm");
    }

    session.currentAllocation = { ...allocation };
    return { success: true, allocation: session.currentAllocation };
  }

  /**
   * Submit disciplinary quiz answer for current quarter
   */
  submitQuiz(
    sessionId: string,
    quarter: number,
    quizId: string,
    selectedOption: string,
  ): { success: boolean; isCorrect: boolean; creditScore: number; feedback: string } {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const quiz = this.config.quizzes.find(
      (q) => q.quarter === quarter && q.id === quizId,
    );
    if (!quiz) {
      throw new Error("Không tìm thấy câu hỏi cho quý này");
    }

    const correctOption = quiz.options.find((opt) => opt.isCorrect);
    const isCorrect = correctOption?.id === selectedOption;

    if (isCorrect) {
      session.creditScore += 10;
    }

    return {
      success: true,
      isCorrect,
      creditScore: session.creditScore,
      feedback: isCorrect
        ? "Xuất sắc! Bạn đã nhận diện đúng tư duy kỷ luật (+10 Credit Score)."
        : "Chưa chính xác. Hãy bình tĩnh rà soát nguyên tắc quản trị rủi ro.",
    };
  }

  /**
   * Compute sensitivity matrix returns for a quarter given an allocation
   */
  computeQuarterReturns(
    qNumber: number,
    allocation: Map2Allocation,
  ): {
    growth: number;
    value: number;
    bond: number;
    cash: number;
    portfolio: number;
  } {
    const currentQuarterConfig = this.config.quarters[qNumber - 1];
    if (!currentQuarterConfig) {
      throw new Error(`Cấu hình quý ${qNumber} không tồn tại`);
    }

    let deltaRate = 0;
    let deltaInflation = 0;
    let deltaGdp = 0;

    if (qNumber > 1) {
      const prevQuarterConfig = this.config.quarters[qNumber - 2]!;
      deltaRate = currentQuarterConfig.rate - prevQuarterConfig.rate;
      deltaInflation = currentQuarterConfig.inflation - prevQuarterConfig.inflation;
      deltaGdp = currentQuarterConfig.gdp - prevQuarterConfig.gdp;
    }

    const { assets } = this.config;

    const rGrowth =
      assets.EQ_GROWTH.alpha +
      assets.EQ_GROWTH.betaRate * (deltaRate / 100) +
      assets.EQ_GROWTH.betaInflation * (deltaInflation / 100) +
      assets.EQ_GROWTH.betaGdp * (deltaGdp / 100) +
      this.sampleGaussian(assets.EQ_GROWTH.sigma);

    const rValue =
      assets.EQ_VALUE.alpha +
      assets.EQ_VALUE.betaRate * (deltaRate / 100) +
      assets.EQ_VALUE.betaInflation * (deltaInflation / 100) +
      assets.EQ_VALUE.betaGdp * (deltaGdp / 100) +
      this.sampleGaussian(assets.EQ_VALUE.sigma);

    const rBond =
      assets.BOND.alpha +
      assets.BOND.betaRate * (deltaRate / 100) +
      assets.BOND.betaInflation * (deltaInflation / 100) +
      assets.BOND.betaGdp * (deltaGdp / 100) +
      this.sampleGaussian(assets.BOND.sigma);

    const rCash =
      assets.CASH.alpha +
      assets.CASH.betaRate * (deltaRate / 100) +
      assets.CASH.betaInflation * (deltaInflation / 100) +
      assets.CASH.betaGdp * (deltaGdp / 100) +
      this.sampleGaussian(assets.CASH.sigma);

    const wGrowth = allocation.growth / 100;
    const wValue = allocation.value / 100;
    const wBond = allocation.bond / 100;
    const wCash = allocation.cash / 100;

    const portfolio =
      wGrowth * rGrowth + wValue * rValue + wBond * rBond + wCash * rCash;

    return {
      growth: rGrowth,
      value: rValue,
      bond: rBond,
      cash: rCash,
      portfolio,
    };
  }

  /**
   * Advance quarter: compute sensitivity matrix returns, apply allocation, update NAV & AI Advisor
   */
  async commitQuarter(
    sessionId: string,
    allocationInput?: Map2Allocation,
    quizInput?: { quizId: string; selectedOption: string },
  ): Promise<{
    session: Map2Session;
    historyRecord: Map2QuarterHistoryRecord;
    isFinalQuarter: boolean;
  }> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    if (session.status !== "active") {
      throw new Error("Session is not active");
    }

    const qNumber = session.currentQuarter;
    if (qNumber > this.config.totalQuarters) {
      throw new Error("Đã hoàn thành tất cả 12 quý");
    }

    // Apply allocation if provided
    if (allocationInput) {
      this.setAllocation(sessionId, allocationInput);
    }

    // Process quiz if provided
    let quizResult: Map2QuarterHistoryRecord["quizResult"] = undefined;
    if (quizInput) {
      const qRes = this.submitQuiz(
        sessionId,
        qNumber,
        quizInput.quizId,
        quizInput.selectedOption,
      );
      quizResult = {
        quizId: quizInput.quizId,
        selectedOption: quizInput.selectedOption,
        isCorrect: qRes.isCorrect,
      };
    }

    const currentQuarterConfig = this.config.quarters[qNumber - 1];
    if (!currentQuarterConfig) {
      throw new Error(`Cấu hình quý ${qNumber} không tồn tại`);
    }

    const returns = this.computeQuarterReturns(
      qNumber,
      session.currentAllocation,
    );
    const rGrowth = returns.growth;
    const rValue = returns.value;
    const rBond = returns.bond;
    const rCash = returns.cash;
    const portfolioReturn = returns.portfolio;

    const prevNav = session.currentNav;
    const newNav = Math.max(1000, Math.round(prevNav * (1 + portfolioReturn)));
    const pnlQuarterAmount = newNav - prevNav;
    const pnlQuarterPercent = Number(
      ((pnlQuarterAmount / prevNav) * 100).toFixed(2),
    );

    session.currentNav = newNav;
    session.peakNav = Math.max(session.peakNav, newNav);

    const currentDrawdown = (session.peakNav - newNav) / session.peakNav;
    session.maxDrawdown = Math.max(session.maxDrawdown, currentDrawdown);

    const alloc = session.currentAllocation;
    // Call AI Advisor for quarter feedback note
    const advisorNote = await this.aiAdvisor.generateQuarterlyDebrief({
      quarterNumber: qNumber,
      interestRate: currentQuarterConfig.rate,
      inflation: currentQuarterConfig.inflation,
      gdpGrowth: currentQuarterConfig.gdp,
      allocGrowth: alloc.growth,
      allocValue: alloc.value,
      allocBond: alloc.bond,
      allocCash: alloc.cash,
      pnlPercent: pnlQuarterPercent,
      currentNav: newNav,
      quarterEventDescription: currentQuarterConfig.description,
    });

    const historyRecord: Map2QuarterHistoryRecord = {
      quarter: qNumber,
      stage: currentQuarterConfig.stage,
      stageKey: currentQuarterConfig.stageKey,
      rate: currentQuarterConfig.rate,
      inflation: currentQuarterConfig.inflation,
      gdp: currentQuarterConfig.gdp,
      allocation: { ...alloc },
      returns: {
        growth: Number((rGrowth * 100).toFixed(2)),
        value: Number((rValue * 100).toFixed(2)),
        bond: Number((rBond * 100).toFixed(2)),
        cash: Number((rCash * 100).toFixed(2)),
        portfolio: Number((portfolioReturn * 100).toFixed(2)),
      },
      nav: newNav,
      pnlQuarterAmount,
      pnlQuarterPercent,
      drawdown: Number((currentDrawdown * 100).toFixed(2)),
      advisorNote,
      quizResult,
    };

    session.history.push(historyRecord);

    const isFinalQuarter = qNumber === this.config.totalQuarters;
    if (isFinalQuarter) {
      session.status = "completed";
      session.endedAt = new Date();
    } else {
      session.currentQuarter += 1;
    }

    return {
      session,
      historyRecord,
      isFinalQuarter,
    };
  }

  /**
   * Determine Investment Style Classification from 12 quarters history (Section 2.9)
   */
  classifyInvestmentStyle(
    session: Map2Session,
    sharpeRatio: number,
  ): { style: string; description: string } {
    if (session.history.length === 0) {
      return {
        style: "Chưa xác định",
        description: "Cần tích luỹ lịch sử phân bổ qua các quý.",
      };
    }

    const n = session.history.length;
    let sumDefensive = 0;
    let sumGrowth = 0;
    let sumValue = 0;
    const growthAllocations: number[] = [];

    for (const h of session.history) {
      const defensive = h.allocation.value + h.allocation.bond + h.allocation.cash;
      sumDefensive += defensive;
      sumGrowth += h.allocation.growth;
      sumValue += h.allocation.value;
      growthAllocations.push(h.allocation.growth);
    }

    const avgDefensive = sumDefensive / n;
    const avgGrowth = sumGrowth / n;
    const avgValue = sumValue / n;

    // Calculate std deviation of growth allocation
    const meanGrowth = avgGrowth;
    const variance =
      growthAllocations.reduce(
        (acc, val) => acc + Math.pow(val - meanGrowth, 2),
        0,
      ) / n;
    const stdDevAlloc = Math.sqrt(variance);

    // Rule 1: alloc_value + alloc_bond + alloc_cash avg >= 60%
    if (avgDefensive >= 60) {
      if (avgValue >= 35) {
        return {
          style: "Nhà đầu tư Giá trị (Value Investor)",
          description:
            "Bạn kiên định phân bổ vào các doanh nghiệp nền tảng tài chính lành mạnh, P/E hấp dẫn và dòng cổ tức tiền mặt bền vững vượt qua biến động thị trường.",
        };
      }
      return {
        style: "Nhà đầu tư Phòng thủ (Defensive Investor)",
        description:
          "Bạn ưu tiên bảo toàn vốn và quản trị rủi ro vững chắc, duy trì đệm tiền mặt và trái phiếu ổn định xuyên suốt các chu kỳ thắt chặt tiền tệ.",
      };
    }

    // Rule 2: std dev of allocation > 15% (active tactical rebalancing)
    if (stdDevAlloc > 15) {
      return {
        style: "Nhà đầu cơ Năng động (Tactical Allocator)",
        description:
          "Bạn chủ động luân chuyển tài sản nhạy bén theo từng bước ngoặt vĩ mô, tận dụng hiệu quả chu kỳ chuyển pha của thị trường.",
      };
    }

    // Rule 3: avg growth >= 60%
    if (avgGrowth >= 60) {
      if (sharpeRatio > 1.0) {
        return {
          style: "Nhà đầu tư Tăng trưởng (Growth Investor)",
          description:
            "Bạn khai thác tối đa tiềm năng sinh lời của nhóm cổ phiếu tăng trưởng cao với tỷ số Sharpe ấn tượng, kiểm soát tốt biến động danh mục.",
        };
      }
      return {
        style: "Nhà đầu tư Tăng trưởng (Growth Investor)",
        description:
          "Bạn khai thác tối đa tiềm năng sinh lời của nhóm cổ phiếu tăng trưởng cao nhưng luôn cần củng cố kỷ luật quản trị drawdown danh mục.",
      };
    }

    return {
      style: "Nhà đầu tư Giá trị (Value Investor)",
      description:
        "Bạn duy trì kỷ luật phân bổ tài sản hài hòa giữa cổ phiếu giá trị và đệm an toàn theo trường phái đầu tư giá trị kinh điển Benjamin Graham & Warren Buffett.",
    };
  }

  /**
   * Generate Final Portfolio Review Report (Quarter 12)
   */
  generateFinalReport(sessionId: string): Map2FinalReport {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const initialCash = session.initialCash;
    const finalNav = session.currentNav;
    const totalPnlAmount = finalNav - initialCash;
    const totalPnlPercent = Number(
      ((totalPnlAmount / initialCash) * 100).toFixed(2),
    );

    // CAGR: (finalNav / initialCash) ^ (1 / 3) - 1 (12 quarters = 3 years)
    const cagr = Number(
      ((Math.pow(finalNav / initialCash, 1 / 3) - 1) * 100).toFixed(2),
    );

    const benchmarkCagr = Number((this.config.benchmarkAnnualReturn * 100).toFixed(2));
    const alpha = Number((cagr - benchmarkCagr).toFixed(2));

    // Calculate Sharpe Ratio
    // Risk-free quarterly rate = 4% / 4 = 1.0%
    const quarterlyReturns = session.history.map((h) => h.returns.portfolio / 100);
    const meanReturn =
      quarterlyReturns.reduce((acc, r) => acc + r, 0) /
      Math.max(1, quarterlyReturns.length);
    const riskFreeQuarterly = 0.01;
    const variance =
      quarterlyReturns.reduce(
        (acc, r) => acc + Math.pow(r - meanReturn, 2),
        0,
      ) / Math.max(1, quarterlyReturns.length);
    const stdDev = Math.sqrt(variance);

    let sharpeRatio = 0;
    if (stdDev > 0.001) {
      // Annualized Sharpe Ratio = (mean_excess / std_dev) * sqrt(4)
      sharpeRatio = Number(
        (((meanReturn - riskFreeQuarterly) / stdDev) * Math.sqrt(4)).toFixed(2),
      );
    }

    const { style, description } = this.classifyInvestmentStyle(
      session,
      sharpeRatio,
    );

    const advisorOverallSummary =
      session.maxDrawdown <= this.config.targetMaxDrawdown
        ? `Chúc mừng bạn! Bạn đã hoàn thành 12 quý với mức sụt giảm tối đa ${Number((session.maxDrawdown * 100).toFixed(1))}%, đáp ứng mục tiêu kỷ luật khắt khe (< 15%). Phong cách đầu tư '${style}' của bạn phản ánh sự kiên định và thấu hiểu sâu sắc bản chất chu kỳ kinh tế.`
        : `Bạn đã hoàn thành 12 quý kinh tế thực chiến. Mặc dù sụt giảm tối đa đạt ${Number((session.maxDrawdown * 100).toFixed(1))}%, trải nghiệm qua các đợt siết tiền tệ đã trang bị cho bạn bài học đắt giá về tầm quan trọng của việc duy trì tỷ trọng tài sản phòng thủ.`;

    return {
      sessionId: session.id,
      status: session.status,
      initialCash,
      finalNav,
      totalPnlAmount,
      totalPnlPercent,
      cagr,
      benchmarkCagr,
      alpha,
      maxDrawdown: Number((session.maxDrawdown * 100).toFixed(2)),
      sharpeRatio,
      creditScore: session.creditScore,
      investmentStyle: style,
      styleDescription: description,
      advisorOverallSummary,
      quarterHistory: session.history,
    };
  }
}

export const map2MacroEngineService = new Map2MacroEngineService();
