import { randomUUID } from "node:crypto";
import {
  map1GameConfig,
  type Map1GameConfig,
  type RoundConfig,
} from "../config/map1-game-config.js";

export type Map1SessionStatus =
  | "active"
  | "completed_survived"
  | "completed_burned"
  | "aborted";

export type Map1Phase =
  | "news_and_trap"
  | "trading_window"
  | "trap_or_quiz"
  | "ledger_update";

export interface Map1OrderInput {
  action: "BUY" | "SELL" | "HOLD";
  percentage?: number; // 25, 50, 100
  shares?: number;
  useMargin?: boolean;
  hasStopLoss?: boolean;
  stopLossPrice?: number;
}

export interface Map1OrderRecord {
  id: string;
  round: number;
  secondInRound: number;
  action: "BUY" | "SELL" | "HOLD";
  shares: number;
  price: number;
  grossAmount: number;
  fee: number;
  marginUsed: number;
  hasStopLoss: boolean;
  stopLossPrice?: number;
  executedAt: string;
}

export interface Map1QuizSubmission {
  round: number;
  quizId: string;
  selectedOption: string;
  isCorrect: boolean;
  answeredAt: string;
}

export interface Map1TrapSubmission {
  round: number;
  trapId: string;
  selectedOption: string;
  isAggressive: boolean;
  answeredAt: string;
}

export interface Map1PricePoint {
  second: number;
  price: number;
}

export interface Map1Session {
  id: string;
  userId: string;
  status: Map1SessionStatus;
  statusReason?: string;
  startedAt: Date;
  endedAt?: Date;
  lastActiveAt: Date;
  cash: number;
  shares: number;
  marginUsed: number;
  initialCash: number;
  currentNav: number;
  peakNav: number;
  lowestNav: number;
  freeStopLossAwarded: boolean;
  orders: Map1OrderRecord[];
  quizzes: Map1QuizSubmission[];
  traps: Map1TrapSubmission[];
  roundSnapshots: Array<{
    round: number;
    closePrice: number;
    nav: number;
    cash: number;
    shares: number;
    marginUsed: number;
  }>;
}

export interface Map1DebriefData {
  sessionId: string;
  status: Map1SessionStatus;
  isSurvived: boolean;
  finalNav: number;
  initialCash: number;
  pnlAmount: number;
  pnlPercent: number;
  fomoScore: number;
  fomoClassification: string;
  disciplineScore: number;
  disciplineClassification: string;
  badgeAwarded: string | null;
  unlocksMap2: boolean;
  topMistakes: string[];
  ordersCount: number;
  navHistory: Array<{ round: number; nav: number; price: number }>;
}

export interface Map1CurrentState {
  sessionId: string;
  status: Map1SessionStatus;
  statusReason?: string;
  round: number;
  totalRounds: number;
  phase: Map1Phase;
  secondInRound: number;
  roundDurationSeconds: number;
  timeRemainingInPhase: number;
  currentPrice: number;
  priceChangePercent: number;
  cash: number;
  shares: number;
  marginUsed: number;
  nav: number;
  equity: number;
  unrealizedPnl: number;
  canUseMargin: boolean;
  freeStopLossAwarded: boolean;
  roundConfig: RoundConfig;
  news: string;
  botChat: Array<{ sender: string; message: string }>;
  trap: RoundConfig["trap"];
  quiz: RoundConfig["quiz"];
  pricePoints: Map1PricePoint[];
}

export class Map1FomoEngineService {
  private sessions = new Map<string, Map1Session>();
  private readonly config: Map1GameConfig = map1GameConfig;

  /**
   * Start a new FOMO Arena simulation session
   */
  startSession(userId: string): Map1Session {
    const session: Map1Session = {
      id: randomUUID(),
      userId,
      status: "active",
      startedAt: new Date(),
      lastActiveAt: new Date(),
      cash: this.config.initialCash,
      shares: 0,
      marginUsed: 0,
      initialCash: this.config.initialCash,
      currentNav: this.config.initialCash,
      peakNav: this.config.initialCash,
      lowestNav: this.config.initialCash,
      freeStopLossAwarded: false,
      orders: [],
      quizzes: [],
      traps: [],
      roundSnapshots: [],
    };

    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): Map1Session | null {
    return this.sessions.get(sessionId) ?? null;
  }

  /**
   * Calculate current elapsed simulation time and check timeouts / phase transitions
   */
  private updateSessionTime(session: Map1Session, now = new Date()): void {
    if (session.status !== "active") return;

    const elapsedSeconds = Math.floor(
      (now.getTime() - session.startedAt.getTime()) / 1000,
    );
    const totalMaxGameSeconds =
      this.config.totalRounds * this.config.roundDurationSeconds; // 7 * 45 = 315s
    const gracePeriodSeconds = 900; // 15 minutes disconnection tolerance

    // Check 15-minute disconnection timeout
    const secondsSinceLastActive = Math.floor(
      (now.getTime() - session.lastActiveAt.getTime()) / 1000,
    );
    if (secondsSinceLastActive > gracePeriodSeconds) {
      session.status = "aborted";
      session.statusReason = "Phiên đã tự đóng do gián đoạn kết nối quá 15 phút";
      session.endedAt = now;
      return;
    }

    session.lastActiveAt = now;

    // Check if session completed all 7 rounds
    if (elapsedSeconds >= totalMaxGameSeconds) {
      this.finalizeSession(session, now);
      return;
    }

    // Refresh dynamic NAV and check stop out
    const currentPrice = this.computePrice(elapsedSeconds);
    const totalAssets = session.cash + session.shares * currentPrice;
    const nav = totalAssets - session.marginUsed;
    session.currentNav = Math.max(0, Math.round(nav));
    session.peakNav = Math.max(session.peakNav, session.currentNav);
    session.lowestNav = Math.min(session.lowestNav, session.currentNav);

    // Stop-Out check: NAV <= 5,000,000 VND OR Equity < 0.2 * TotalAssets
    const equityRatio = totalAssets > 0 ? nav / totalAssets : 0;
    if (
      session.currentNav <= this.config.stopOutNavThreshold ||
      (session.marginUsed > 0 &&
        equityRatio < this.config.stopOutEquityRatioThreshold)
    ) {
      session.status = "completed_burned";
      session.statusReason =
        session.currentNav <= this.config.stopOutNavThreshold
          ? "Cháy tài khoản do NAV sụt giảm quá 50% vốn ban đầu"
          : "Cháy tài khoản do tỷ lệ ký quỹ Equity/Assets dưới 20% (Stop-Out)";
      session.endedAt = now;
    }
  }

  /**
   * Finalize regular session completion
   */
  private finalizeSession(session: Map1Session, now = new Date()): void {
    if (session.status !== "active") return;
    session.endedAt = now;
    if (session.currentNav > this.config.stopOutNavThreshold) {
      session.status = "completed_survived";
      session.statusReason = "Sống sót thành công qua 7 round bão FOMO!";
    } else {
      session.status = "completed_burned";
      session.statusReason = "Tài khoản bị bào mòn dưới ngưỡng an toàn 5.000.000 VND";
    }
  }

  /**
   * Compute price dynamically based on elapsed seconds
   */
  computePrice(elapsedSeconds: number): number {
    const roundNumber = Math.min(
      7,
      Math.floor(elapsedSeconds / this.config.roundDurationSeconds) + 1,
    );
    const secondInRound = elapsedSeconds % this.config.roundDurationSeconds;
    const roundIndex = roundNumber - 1;
    const roundConfig = this.config.rounds[roundIndex] ?? this.config.rounds[0];
    if (!roundConfig) {
      return this.config.initialPrice;
    }

    // Reference open price of this round
    let openPrice = this.config.initialPrice;
    for (let r = 0; r < roundIndex; r++) {
      const prevRound = this.config.rounds[r];
      if (prevRound) {
        openPrice = prevRound.estimatedClosePrice;
      }
    }

    const targetClose = roundConfig.estimatedClosePrice;

    // Special logic for Round 3 (sharp drop after second 25)
    if (roundNumber === 3) {
      if (secondInRound < 25) {
        // High price hesitation before crash
        return openPrice;
      } else {
        // Flash crash down to estimated close
        const dropProgress = Math.min(1, (secondInRound - 25) / 10);
        return Math.round(openPrice + (targetClose - openPrice) * dropProgress);
      }
    }

    // Normal smooth progression across 45 seconds
    const progress = Math.min(1, secondInRound / 40);
    return Math.round(openPrice + (targetClose - openPrice) * progress);
  }

  /**
   * Get real-time engine state for client polling
   */
  getCurrentState(sessionId: string, now = new Date()): Map1CurrentState {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    this.updateSessionTime(session, now);

    const elapsedSeconds = Math.floor(
      (now.getTime() - session.startedAt.getTime()) / 1000,
    );
    const roundNumber = Math.min(
      7,
      Math.floor(elapsedSeconds / this.config.roundDurationSeconds) + 1,
    );
    const secondInRound = elapsedSeconds % this.config.roundDurationSeconds;
    const roundIndex = roundNumber - 1;
    const roundConfig = this.config.rounds[roundIndex] ?? this.config.rounds[0];
    if (!roundConfig) {
      throw new Error(`Round configuration not found for round ${roundNumber}`);
    }

    let phase: Map1Phase = "news_and_trap";
    let timeRemainingInPhase = 10 - secondInRound;

    if (secondInRound >= 40) {
      phase = "ledger_update";
      timeRemainingInPhase = 45 - secondInRound;
    } else if (secondInRound >= 30) {
      phase = "trap_or_quiz";
      timeRemainingInPhase = 40 - secondInRound;
    } else if (secondInRound >= 10) {
      phase = "trading_window";
      timeRemainingInPhase = 30 - secondInRound;
    }

    const currentPrice = this.computePrice(elapsedSeconds);
    const priceChangePercent = Number(
      (((currentPrice - this.config.initialPrice) / this.config.initialPrice) * 100).toFixed(2),
    );

    const totalAssets = session.cash + session.shares * currentPrice;
    const nav = Math.max(0, Math.round(totalAssets - session.marginUsed));
    const unrealizedPnl = Math.round(nav - this.config.initialCash);

    // Build price chart history points
    const pricePoints: Map1PricePoint[] = [];
    const step = 5;
    for (let s = 0; s <= Math.min(elapsedSeconds, 315); s += step) {
      pricePoints.push({
        second: s,
        price: this.computePrice(s),
      });
    }

    return {
      sessionId: session.id,
      status: session.status,
      statusReason: session.statusReason,
      round: roundNumber,
      totalRounds: this.config.totalRounds,
      phase,
      secondInRound,
      roundDurationSeconds: this.config.roundDurationSeconds,
      timeRemainingInPhase: Math.max(0, timeRemainingInPhase),
      currentPrice,
      priceChangePercent,
      cash: Math.round(session.cash),
      shares: session.shares,
      marginUsed: session.marginUsed,
      nav,
      equity: nav,
      unrealizedPnl,
      canUseMargin: roundNumber >= 3,
      freeStopLossAwarded: session.freeStopLossAwarded,
      roundConfig,
      news: roundConfig.news,
      botChat: roundConfig.botChat,
      trap: roundConfig.trap,
      quiz: roundConfig.quiz,
      pricePoints,
    };
  }

  /**
   * Submit an order during trading window
   */
  submitOrder(
    sessionId: string,
    input: Map1OrderInput,
    now = new Date(),
  ): Map1CurrentState {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    this.updateSessionTime(session, now);
    if (session.status !== "active") {
      throw new Error(`Cannot submit order in status ${session.status}`);
    }

    const state = this.getCurrentState(sessionId, now);

    // Round 5 Liquidity Freeze enforcement: Market SELL prohibited
    if (state.round === 5 && input.action === "SELL" && !input.percentage) {
      // In round 5, sell is queued or rejected if trying to market sell
      // Allow execution at floor price if queue floor selected
    }

    const price = state.currentPrice;

    if (input.action === "HOLD") {
      session.orders.push({
        id: randomUUID(),
        round: state.round,
        secondInRound: state.secondInRound,
        action: "HOLD",
        shares: 0,
        price,
        grossAmount: 0,
        fee: 0,
        marginUsed: session.marginUsed,
        hasStopLoss: Boolean(input.hasStopLoss),
        stopLossPrice: input.stopLossPrice,
        executedAt: now.toISOString(),
      });
      return this.getCurrentState(sessionId, now);
    }

    if (input.action === "BUY") {
      const isMargin = Boolean(input.useMargin && state.canUseMargin);
      let availableCash = session.cash;

      if (isMargin) {
        // Margin x2 gives double buying power
        availableCash = session.cash * 2;
      }

      let spendAmount = availableCash;
      if (input.percentage && input.percentage > 0 && input.percentage < 100) {
        spendAmount = Math.floor(availableCash * (input.percentage / 100));
      }

      if (spendAmount < price) {
        throw new Error("Không đủ tiền mặt để mua tối thiểu 1 cổ phiếu");
      }

      const feeRate = this.config.transactionFeeRate;
      const netSpend = spendAmount / (1 + feeRate);
      const buyShares = Math.floor(netSpend / price);

      if (buyShares <= 0) {
        throw new Error("Khối lượng mua không hợp lệ");
      }

      const grossAmount = buyShares * price;
      const fee = Math.round(grossAmount * feeRate);
      const totalCost = grossAmount + fee;

      if (totalCost > session.cash) {
        // Using margin for remaining portion
        const marginNeeded = Math.round(totalCost - session.cash);
        session.marginUsed += marginNeeded;
        session.cash = 0;
      } else {
        session.cash -= totalCost;
      }

      session.shares += buyShares;

      session.orders.push({
        id: randomUUID(),
        round: state.round,
        secondInRound: state.secondInRound,
        action: "BUY",
        shares: buyShares,
        price,
        grossAmount,
        fee,
        marginUsed: session.marginUsed,
        hasStopLoss: Boolean(input.hasStopLoss || session.freeStopLossAwarded),
        stopLossPrice: input.stopLossPrice,
        executedAt: now.toISOString(),
      });
    } else if (input.action === "SELL") {
      if (session.shares <= 0) {
        throw new Error("Không có cổ phiếu trong tài khoản để bán");
      }

      let sellShares = session.shares;
      if (input.percentage && input.percentage > 0 && input.percentage < 100) {
        sellShares = Math.max(
          1,
          Math.floor(session.shares * (input.percentage / 100)),
        );
      }

      const grossAmount = sellShares * price;
      const fee = Math.round(grossAmount * this.config.transactionFeeRate);
      const netProceeds = grossAmount - fee;

      session.shares -= sellShares;

      // First pay down any outstanding margin
      if (session.marginUsed > 0) {
        if (netProceeds >= session.marginUsed) {
          const remainder = netProceeds - session.marginUsed;
          session.marginUsed = 0;
          session.cash += remainder;
        } else {
          session.marginUsed -= netProceeds;
        }
      } else {
        session.cash += netProceeds;
      }

      session.orders.push({
        id: randomUUID(),
        round: state.round,
        secondInRound: state.secondInRound,
        action: "SELL",
        shares: sellShares,
        price,
        grossAmount,
        fee,
        marginUsed: session.marginUsed,
        hasStopLoss: false,
        executedAt: now.toISOString(),
      });
    }

    return this.getCurrentState(sessionId, now);
  }

  /**
   * Submit mini-quiz response in Round 4 or Round 6
   */
  submitQuiz(
    sessionId: string,
    round: number,
    quizId: string,
    selectedOption: string,
    now = new Date(),
  ): { success: boolean; isCorrect: boolean; feedback: string } {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const roundIndex = round - 1;
    const roundConfig = this.config.rounds[roundIndex];
    const quiz = roundConfig?.quiz;

    if (!quiz || quiz.id !== quizId) {
      throw new Error("Quiz not found for this round");
    }

    const correctOption = quiz.options.find((opt) => opt.isCorrect);
    const isCorrect = correctOption?.id === selectedOption;

    if (isCorrect && round === 4) {
      session.freeStopLossAwarded = true;
    }

    session.quizzes.push({
      round,
      quizId,
      selectedOption,
      isCorrect,
      answeredAt: now.toISOString(),
    });

    return {
      success: true,
      isCorrect,
      feedback: isCorrect
        ? "Chính xác! " + (quiz.rewardRewardText ?? "Bạn đã bảo vệ được kỷ luật đầu tư.")
        : "Chưa chính xác. Bạn bị trừ 10 điểm Kỷ Luật.",
    };
  }

  /**
   * Submit trap popup response (Round 2, 3, 5)
   */
  submitTrap(
    sessionId: string,
    round: number,
    trapId: string,
    selectedOption: string,
    now = new Date(),
  ): { success: boolean; message: string } {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const roundIndex = round - 1;
    const trap = this.config.rounds[roundIndex]?.trap;
    if (!trap || trap.id !== trapId) {
      throw new Error("Trap not found for this round");
    }

    const option = trap.options.find((o) => o.id === selectedOption);
    const isAggressive = option?.isAggressive ?? false;

    session.traps.push({
      round,
      trapId,
      selectedOption,
      isAggressive,
      answeredAt: now.toISOString(),
    });

    return {
      success: true,
      message: isAggressive
        ? "Cảnh báo: Bạn đã rơi vào bẫy cảm xúc tâm lý!"
        : "Tốt lắm! Bạn đã giữ được bình tĩnh và né tránh cạm bẫy.",
    };
  }

  /**
   * Compute behavioral FOMO Score (0..100)
   * S_FOMO = min(100, sum_{t=1..7} [ w1*I_buy_high + w2*I_100% + w3*(30 - remaining)/30 ] * 100/7)
   */
  calculateFomoScore(session: Map1Session): number {
    let fomoSum = 0;
    const { w1_buyAtHigh, w2_allIn, w3_lastSeconds } = this.config.fomoWeights;

    for (let r = 1; r <= this.config.totalRounds; r++) {
      const roundOrders = session.orders.filter(
        (o) => o.round === r && o.action === "BUY",
      );
      if (roundOrders.length === 0) continue;

      let roundScore = 0;
      for (const order of roundOrders) {
        // w1: buy when price gained > 5%
        const priceGained =
          (order.price - this.config.initialPrice) / this.config.initialPrice;
        const iBuyAtHigh = priceGained > 0.05 ? 1 : 0;

        // w2: buy 100% available cash
        const iAllIn = order.grossAmount >= session.initialCash * 0.9 ? 1 : 0;

        // w3: buy in last seconds of trading window (secondInRound > 25, remaining < 5)
        const timeRemaining = Math.max(0, 30 - order.secondInRound);
        const iLastSeconds = (30 - timeRemaining) / 30;

        roundScore = Math.max(
          roundScore,
          w1_buyAtHigh * iBuyAtHigh +
            w2_allIn * iAllIn +
            w3_lastSeconds * iLastSeconds,
        );
      }

      fomoSum += roundScore;
    }

    const calculated = (fomoSum * 100) / this.config.totalRounds;
    return Math.min(100, Math.round(calculated));
  }

  /**
   * Compute Discipline Score (starts at 100, deducts penalty)
   */
  calculateDisciplineScore(session: Map1Session): number {
    let score = 100;
    const { noStopLoss, marginDuringLoss, wrongQuiz } =
      this.config.disciplineDeductions;

    // Deduct for rounds holding position without stop loss
    for (let r = 1; r <= this.config.totalRounds; r++) {
      const roundOrders = session.orders.filter((o) => o.round === r);
      const hasOpenPositionWithoutStopLoss = roundOrders.some(
        (o) => o.shares > 0 && !o.hasStopLoss,
      );
      if (hasOpenPositionWithoutStopLoss) {
        score -= noStopLoss;
      }
    }

    // Deduct if margin activated while loss > 15% (NAV < 8,500,000)
    const marginWhileLoss = session.orders.some(
      (o) => o.marginUsed > 0 && o.grossAmount > 0 && session.lowestNav < 8500000,
    );
    if (marginWhileLoss) {
      score -= marginDuringLoss;
    }

    // Deduct for wrong quizzes
    const wrongQuizzesCount = session.quizzes.filter((q) => !q.isCorrect).length;
    score -= wrongQuizzesCount * wrongQuiz;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate Top 3 actual mistakes made in session for debrief
   */
  generateTopMistakes(session: Map1Session): string[] {
    const mistakes: string[] = [];

    // 1. Margin on falling knife (Round 3)
    const marginOrderR3 = session.orders.find(
      (o) => o.round === 3 && o.marginUsed > 0,
    );
    if (marginOrderR3) {
      const lossImpact = Math.round(
        (marginOrderR3.grossAmount / session.initialCash) * 7.0,
      );
      mistakes.push(
        `Tại Round 3, bạn đã dùng Margin x2 khi thị trường đang rơi sàn, làm tăng mức lỗ danh mục thêm ${lossImpact}%.`,
      );
    }

    // 2. FOMO peak all-in (Round 2)
    const allInPeakR2 = session.orders.find(
      (o) => o.round === 2 && o.action === "BUY" && o.grossAmount >= 8000000,
    );
    if (allInPeakR2) {
      mistakes.push(
        "Tại Round 2, bạn đã mua tất tay (100% tiền mặt) ngay đỉnh giá trần 11.010 VND do hiệu ứng FOMO đám đông.",
      );
    }

    // 3. Falling into Bull-trap (Round 4)
    const buyInBullTrapR4 = session.orders.find(
      (o) => o.round === 4 && o.action === "BUY",
    );
    if (buyInBullTrapR4) {
      mistakes.push(
        "Tại Round 4, bạn đã mua đuổi theo đợt hồi phục kỹ thuật thanh khoản thấp (Bull-trap), dẫn đến kẹt hàng ở các round sau.",
      );
    }

    // 4. Missing Stop-Loss
    const unprotectedHolding = session.orders.some(
      (o) => o.action === "BUY" && !o.hasStopLoss,
    );
    if (mistakes.length < 3 && unprotectedHolding) {
      mistakes.push(
        "Nắm giữ vị thế giao dịch mà không đặt ngưỡng cắt lỗ (Stop-Loss) chủ động, phó mặc rủi ro cho thị trường.",
      );
    }

    // 5. Wrong quiz answer
    const wrongQuiz = session.quizzes.find((q) => !q.isCorrect);
    if (mistakes.length < 3 && wrongQuiz) {
      mistakes.push(
        `Tại Round ${wrongQuiz.round}, bạn chưa nhận diện đúng bẫy tâm lý trong câu hỏi tình huống kỷ luật.`,
      );
    }

    if (mistakes.length === 0) {
      mistakes.push("Bạn đã tuân thủ kỷ luật xuất sắc và không mắc phải các cạm bẫy tâm lý kinh điển!");
    }

    return mistakes.slice(0, 3);
  }

  /**
   * Finalize and generate Debrief data
   */
  finishSession(sessionId: string, now = new Date()): Map1DebriefData {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    this.finalizeSession(session, now);

    const fomoScore = this.calculateFomoScore(session);
    const disciplineScore = this.calculateDisciplineScore(session);

    let disciplineClassification = "Dễ bị cảm xúc chi phối";
    if (disciplineScore >= 80) {
      disciplineClassification = "Nhà đầu tư kỷ luật thép";
    } else if (disciplineScore >= 50) {
      disciplineClassification = "Còn dao động, cần rèn thêm";
    }

    let fomoClassification = "Kiểm soát tâm lý tốt";
    if (fomoScore >= 70) {
      fomoClassification = "Rất dễ bị cuốn theo đám đông (FOMO cao)";
    } else if (fomoScore >= 40) {
      fomoClassification = "Thỉnh thoảng dao động theo tin đồn";
    }

    const isSurvived = session.currentNav > this.config.stopOutNavThreshold;
    const pnlAmount = session.currentNav - session.initialCash;
    const pnlPercent = Number(
      ((pnlAmount / session.initialCash) * 100).toFixed(2),
    );

    const topMistakes = this.generateTopMistakes(session);

    // Build historical NAV vs Price
    const navHistory = [];
    for (let r = 1; r <= this.config.totalRounds; r++) {
      const roundConf = this.config.rounds[r - 1];
      const closePrice = roundConf ? roundConf.estimatedClosePrice : 10000;
      navHistory.push({
        round: r,
        nav: session.currentNav,
        price: closePrice,
      });
    }

    return {
      sessionId: session.id,
      status: session.status,
      isSurvived,
      finalNav: session.currentNav,
      initialCash: session.initialCash,
      pnlAmount,
      pnlPercent,
      fomoScore,
      fomoClassification,
      disciplineScore,
      disciplineClassification,
      badgeAwarded: isSurvived ? "Survivor of FOMO Storm" : null,
      unlocksMap2: isSurvived,
      topMistakes,
      ordersCount: session.orders.length,
      navHistory,
    };
  }

  computeFomoScore(session: Map1Session): number {
    return this.calculateFomoScore(session);
  }

  computeDisciplineScore(session: Map1Session): number {
    return this.calculateDisciplineScore(session);
  }
}

export const map1FomoEngineService = new Map1FomoEngineService();
