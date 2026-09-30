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

export interface Map1PricePoint {
  second: number;
  price: number;
}

export interface Map1TrapOption {
  id: string;
  label: string;
  isAggressive: boolean;
}

export interface Map1TrapConfig {
  id: string;
  title: string;
  prompt: string;
  options: Map1TrapOption[];
}

export interface Map1QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Map1QuizConfig {
  id: string;
  prompt: string;
  options: Map1QuizOption[];
  rewardRewardText?: string;
}

export interface Map1RoundConfig {
  roundNumber: number;
  name: string;
  priceChangePercent: number;
  estimatedClosePrice: number;
  news: string;
  botChat: Array<{ sender: string; message: string }>;
  trap: Map1TrapConfig | null;
  quiz: Map1QuizConfig | null;
  hint?: string;
  dropAtSecond?: number;
  isLiquidityFreeze?: boolean;
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
  roundConfig: Map1RoundConfig;
  news: string;
  botChat: Array<{ sender: string; message: string }>;
  trap: Map1TrapConfig | null;
  quiz: Map1QuizConfig | null;
  pricePoints: Map1PricePoint[];
}

export interface Map1DebriefReport {
  sessionId: string;
  status: Map1SessionStatus;
  statusReason?: string;
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

export interface Map2Allocation {
  growth: number;
  value: number;
  bond: number;
  cash: number;
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
  status: "active" | "completed" | "aborted";
  currentQuarter: number;
  initialCash: number;
  currentNav: number;
  peakNav: number;
  maxDrawdown: number;
  creditScore: number;
  currentAllocation: Map2Allocation;
  history: Map2QuarterHistoryRecord[];
  startedAt: string;
}

export interface Map2FinalReport {
  sessionId: string;
  status: string;
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
