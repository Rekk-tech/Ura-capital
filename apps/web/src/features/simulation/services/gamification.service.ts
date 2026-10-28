/**
 * FEAT-085: Gamification & Simulation Scoreboard Service
 *
 * Tracks learner XP, Trader Level progression, achievement badges,
 * simulation game completion history, and community leaderboard rankings.
 */

export interface TraderBadge {
  id: "SURVIVOR" | "MACRO_TACTICIAN" | "MARKET_SCHOLAR" | "VIP_PATRON";
  name: string;
  subtitle: string;
  description: string;
  icon: "shield" | "zap" | "award" | "crown";
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface ScoreBreakdownItem {
  label: string;
  points: number;
  maxPoints?: number;
  description: string;
  type: "positive" | "negative" | "neutral";
}

export interface SimulationScoreDetail {
  compositeScore: number;
  grade: "S" | "A" | "B" | "C" | "D";
  breakdown: ScoreBreakdownItem[];
}

export interface SimulationRunRecord {
  id: string;
  map: "MAP1" | "MAP2";
  mapName: string;
  completedAt: string;
  finalNav: number;
  initialNav: number;
  returnPct: number;
  scoreMetric: string; // e.g. "FOMO Index: 38/100" or "Alpha: +4.2%"
  xpEarned: number;
  quizScore?: number;
  maxDrawdown?: number;
  compositeScore?: number;
  grade?: "S" | "A" | "B" | "C" | "D";
  scoreBreakdown?: ScoreBreakdownItem[];
}

export interface LeaderboardEntry {
  rank: number;
  handle: string;
  displayName: string;
  avatar: string;
  level: number;
  badge: string;
  map: string;
  returnPct: number;
  xp: number;
  isCurrentUser?: boolean;
}

export interface GamificationState {
  xp: number;
  level: number;
  levelTitle: string;
  currentLevelFloorXp: number;
  nextLevelXp: number;
  progressPct: number;
  badges: TraderBadge[];
  history: SimulationRunRecord[];
}

export const GAMIFICATION_UPDATE_EVENT = "aura:gamification-updated";

const STORAGE_KEY = "aura_gamification_state_v1";

const ALL_BADGES: TraderBadge[] = [
  {
    id: "MARKET_SCHOLAR",
    name: "Học Giả Aura",
    subtitle: "Nền tảng kiến thức vững chắc",
    description: "Đã hoàn thành các bài học nhập môn tại Aura Academy.",
    icon: "award",
    isUnlocked: true,
    unlockedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "SURVIVOR",
    name: "Huy Hiệu Sinh Tồn",
    subtitle: "Vượt bão FOMO Arena (Map 1)",
    description: "Sống sót qua 7 vòng bẫy tâm lý với NAV dương và chỉ số FOMO an toàn.",
    icon: "shield",
    isUnlocked: false,
  },
  {
    id: "MACRO_TACTICIAN",
    name: "Chiến Lược Gia Vĩ Mô",
    subtitle: "Tạo Alpha vượt trội (Map 2)",
    description: "Hoàn thành 12 quý phân bổ tài sản tại Pro Room và đạt hiệu suất vượt chuẩn.",
    icon: "zap",
    isUnlocked: false,
  },
  {
    id: "VIP_PATRON",
    name: "Hội Viên Ưu Tú",
    subtitle: "Đặc quyền Premium VIP",
    description: "Đăng ký gói hội viên cao cấp và nhận quyền truy cập toàn diện AI Coach.",
    icon: "crown",
    isUnlocked: false,
  },
];

export function calculateLevelFromXp(xp: number): {
  level: number;
  levelTitle: string;
  currentLevelFloorXp: number;
  nextLevelXp: number;
  progressPct: number;
} {
  if (xp < 200) {
    return {
      level: 1,
      levelTitle: "Level 1 • F0 Nhập Môn",
      currentLevelFloorXp: 0,
      nextLevelXp: 200,
      progressPct: Math.min(100, Math.round((xp / 200) * 100)),
    };
  }
  if (xp < 500) {
    return {
      level: 2,
      levelTitle: "Level 2 • Trader Kỷ Luật",
      currentLevelFloorXp: 200,
      nextLevelXp: 500,
      progressPct: Math.min(100, Math.round(((xp - 200) / 300) * 100)),
    };
  }
  if (xp < 1000) {
    return {
      level: 3,
      levelTitle: "Level 3 • Chuyên Viên Phân Bổ",
      currentLevelFloorXp: 500,
      nextLevelXp: 1000,
      progressPct: Math.min(100, Math.round(((xp - 500) / 500) * 100)),
    };
  }
  if (xp < 2000) {
    return {
      level: 4,
      levelTitle: "Level 4 • Bậc Thầy Thị Trường",
      currentLevelFloorXp: 1000,
      nextLevelXp: 2000,
      progressPct: Math.min(100, Math.round(((xp - 1000) / 1000) * 100)),
    };
  }
  return {
    level: 5,
    levelTitle: "Level 5 • Huyền Thoại Đầu Tư",
    currentLevelFloorXp: 2000,
    nextLevelXp: 5000,
    progressPct: Math.min(100, Math.round(((xp - 2000) / 3000) * 100)),
  };
}

class GamificationService {
  private state: GamificationState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): GamificationState {
    if (typeof window === "undefined") {
      const levelInfo = calculateLevelFromXp(50);
      return {
        xp: 50,
        ...levelInfo,
        badges: ALL_BADGES,
        history: [],
      };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const levelInfo = calculateLevelFromXp(parsed.xp ?? 50);
        return {
          xp: parsed.xp ?? 50,
          ...levelInfo,
          badges: Array.isArray(parsed.badges) ? parsed.badges : ALL_BADGES,
          history: Array.isArray(parsed.history) ? parsed.history : [],
        };
      }
    } catch {
      // fallback on error
    }

    const levelInfo = calculateLevelFromXp(200);
    return {
      xp: 200,
      ...levelInfo,
      badges: ALL_BADGES,
      history: [],
    };
  }

  private saveState(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      window.dispatchEvent(new CustomEvent(GAMIFICATION_UPDATE_EVENT, { detail: this.state }));
    } catch {
      // storage unavailable
    }
  }

  public getState(): GamificationState {
    return { ...this.state };
  }

  public syncXp(authoritativeXp: number): GamificationState {
    const targetXp = Math.max(this.state.xp, authoritativeXp);
    if (targetXp !== this.state.xp) {
      const levelInfo = calculateLevelFromXp(targetXp);
      this.state = {
        ...this.state,
        xp: targetXp,
        ...levelInfo,
      };
      this.saveState();
    }
    return this.getState();
  }

  public addXp(amount: number): GamificationState {
    const newXp = Math.max(0, this.state.xp + amount);
    const levelInfo = calculateLevelFromXp(newXp);
    this.state = {
      ...this.state,
      xp: newXp,
      ...levelInfo,
    };
    this.saveState();
    return this.getState();
  }

  public unlockBadge(badgeId: TraderBadge["id"]): GamificationState {
    const updatedBadges = this.state.badges.map((b) => {
      if (b.id === badgeId && !b.isUnlocked) {
        return {
          ...b,
          isUnlocked: true,
          unlockedAt: new Date().toISOString(),
        };
      }
      return b;
    });

    this.state = {
      ...this.state,
      badges: updatedBadges,
    };
    this.saveState();
    return this.getState();
  }

  public recordMap1Run(result: {
    finalNav: number;
    initialNav: number;
    fomoIndex: number;
    quizScore?: number;
    maxDrawdown?: number;
  }): {
    xpAwarded: number;
    badgeUnlocked?: string;
    compositeScore: number;
    grade: "S" | "A" | "B" | "C" | "D";
    breakdown: ScoreBreakdownItem[];
  } {
    const returnPct = Number(
      (((result.finalNav - result.initialNav) / result.initialNav) * 100).toFixed(2),
    );

    // Composite scoring calculation:
    // S_ROI: up to 40 pts
    const roiPoints = Math.min(40, Math.max(0, returnPct * 2));
    // S_FOMO: up to 40 pts (lower FOMO index = higher score)
    const fomoPoints = Math.max(0, 40 - result.fomoIndex * 0.4);
    // S_Quiz: up to 20 pts
    const quizPoints = result.quizScore !== undefined ? Math.min(20, Math.max(0, result.quizScore)) : 15;
    // Penalty Drawdown: max drawdown > 15% deducts points
    const dd = result.maxDrawdown ?? 0;
    const ddPenalty = dd > 15 ? Math.min(20, (dd - 15) * 1.5) : 0;

    const compositeScore = Math.max(
      0,
      Math.min(100, Math.round(roiPoints + fomoPoints + quizPoints - ddPenalty)),
    );

    const grade: "S" | "A" | "B" | "C" | "D" =
      compositeScore >= 85 ? "S" :
      compositeScore >= 70 ? "A" :
      compositeScore >= 55 ? "B" :
      compositeScore >= 40 ? "C" : "D";

    const breakdown: ScoreBreakdownItem[] = [
      {
        label: "Hiệu Suất Lợi Nhuận (ROI)",
        points: Math.round(roiPoints),
        maxPoints: 40,
        description: `Tăng trưởng NAV ${returnPct >= 0 ? "+" : ""}${returnPct}%`,
        type: roiPoints > 0 ? "positive" : "neutral",
      },
      {
        label: "Kỷ Luật Tâm Lý (FOMO)",
        points: Math.round(fomoPoints),
        maxPoints: 40,
        description: `Chỉ số kiểm soát bẫy tâm lý: ${result.fomoIndex}/100`,
        type: result.fomoIndex <= 50 ? "positive" : "neutral",
      },
      {
        label: "Kiến Thức Thực Chiến (Quiz)",
        points: Math.round(quizPoints),
        maxPoints: 20,
        description: `Điểm trả lời câu hỏi trắc nghiệm giữa vòng`,
        type: "positive",
      },
    ];

    if (ddPenalty > 0) {
      breakdown.push({
        label: "Phạt Sụt Giảm Danh Mục (Drawdown)",
        points: -Math.round(ddPenalty),
        maxPoints: 0,
        description: `Sụt giảm tài khoản sâu nhất đạt ${dd.toFixed(1)}% (ngưỡng an toàn ≤ 15%)`,
        type: "negative",
      });
    }

    // Award XP: base 100 XP + bonus for profitability
    let xpAwarded = 100;
    if (returnPct > 0) xpAwarded += 50;
    if (returnPct >= 10) xpAwarded += 50;

    const runRecord: SimulationRunRecord = {
      id: `map1-${Date.now()}`,
      map: "MAP1",
      mapName: "FOMO Arena (Map 1)",
      completedAt: new Date().toISOString(),
      finalNav: result.finalNav,
      initialNav: result.initialNav,
      returnPct,
      scoreMetric: `Chỉ số FOMO: ${result.fomoIndex}/100`,
      xpEarned: xpAwarded,
      quizScore: result.quizScore,
      maxDrawdown: result.maxDrawdown,
      compositeScore,
      grade,
      scoreBreakdown: breakdown,
    };

    let badgeUnlocked: string | undefined;
    // Unlock Survivor badge if finished positive with FOMO index <= 50
    if (returnPct >= 0 && result.fomoIndex <= 50) {
      this.unlockBadge("SURVIVOR");
      badgeUnlocked = "Huy Hiệu Sinh Tồn (Survivor Badge)";
    }

    this.state.history.unshift(runRecord);
    if (this.state.history.length > 20) {
      this.state.history = this.state.history.slice(0, 20);
    }

    this.addXp(xpAwarded);
    return { xpAwarded, badgeUnlocked, compositeScore, grade, breakdown };
  }

  public recordMap2Run(result: {
    finalNav: number;
    initialNav: number;
    alpha: number;
    sharpeRatio?: number;
    maxDrawdown?: number;
    quizScore?: number;
  }): {
    xpAwarded: number;
    badgeUnlocked?: string;
    compositeScore: number;
    grade: "S" | "A" | "B" | "C" | "D";
    breakdown: ScoreBreakdownItem[];
  } {
    const returnPct = Number(
      (((result.finalNav - result.initialNav) / result.initialNav) * 100).toFixed(2),
    );

    // Composite scoring calculation:
    // S_Alpha: up to 40 pts
    const alphaPoints = Math.min(40, Math.max(0, 20 + result.alpha * 4));
    // S_Sharpe: up to 25 pts
    const sharpe = result.sharpeRatio ?? 1.2;
    const sharpePoints = Math.min(25, Math.max(0, sharpe * 12.5));
    // S_DD: up to 20 pts
    const dd = result.maxDrawdown ?? 8;
    const ddPoints = Math.max(0, 20 - dd * 0.8);
    // S_Quiz: up to 15 pts
    const quizPoints = result.quizScore !== undefined ? Math.min(15, Math.max(0, result.quizScore)) : 12;

    const compositeScore = Math.max(
      0,
      Math.min(100, Math.round(alphaPoints + sharpePoints + ddPoints + quizPoints)),
    );

    const grade: "S" | "A" | "B" | "C" | "D" =
      compositeScore >= 85 ? "S" :
      compositeScore >= 70 ? "A" :
      compositeScore >= 55 ? "B" :
      compositeScore >= 40 ? "C" : "D";

    const breakdown: ScoreBreakdownItem[] = [
      {
        label: "Tạo Alpha Vượt Trội (vs VN30)",
        points: Math.round(alphaPoints),
        maxPoints: 40,
        description: `Hiệu suất thặng dư Alpha đạt ${result.alpha >= 0 ? "+" : ""}${result.alpha.toFixed(1)}%`,
        type: result.alpha >= 0 ? "positive" : "neutral",
      },
      {
        label: "Tỷ Lệ Sharpe Đo Lường Rủi Ro",
        points: Math.round(sharpePoints),
        maxPoints: 25,
        description: `Chỉ số Sharpe đạt ${sharpe.toFixed(2)} (Chuẩn tổ chức ≥ 1.0)`,
        type: sharpe >= 1.0 ? "positive" : "neutral",
      },
      {
        label: "Kiểm Soát Drawdown Đa Quý",
        points: Math.round(ddPoints),
        maxPoints: 20,
        description: `Mức sụt giảm tối đa 12 quý giữ ở mức ${dd.toFixed(1)}%`,
        type: dd <= 15 ? "positive" : "neutral",
      },
      {
        label: "Trắc Nghiệm Định Giá & Phân Bổ",
        points: Math.round(quizPoints),
        maxPoints: 15,
        description: `Độ chuẩn xác trong quyết định phân bổ vĩ mô`,
        type: "positive",
      },
    ];

    let xpAwarded = 150;
    if (result.alpha > 0) xpAwarded += 50;
    if (result.alpha >= 3) xpAwarded += 50;

    const runRecord: SimulationRunRecord = {
      id: `map2-${Date.now()}`,
      map: "MAP2",
      mapName: "Pro Room Vĩ Mô (Map 2)",
      completedAt: new Date().toISOString(),
      finalNav: result.finalNav,
      initialNav: result.initialNav,
      returnPct,
      scoreMetric: `Alpha vs VN30: ${result.alpha >= 0 ? "+" : ""}${result.alpha.toFixed(1)}%`,
      xpEarned: xpAwarded,
      quizScore: result.quizScore,
      maxDrawdown: result.maxDrawdown,
      compositeScore,
      grade,
      scoreBreakdown: breakdown,
    };

    let badgeUnlocked: string | undefined;
    if (result.alpha > 0) {
      this.unlockBadge("MACRO_TACTICIAN");
      badgeUnlocked = "Chiến Lược Gia Vĩ Mô (Macro Tactician)";
    }

    this.state.history.unshift(runRecord);
    if (this.state.history.length > 20) {
      this.state.history = this.state.history.slice(0, 20);
    }

    this.addXp(xpAwarded);
    return { xpAwarded, badgeUnlocked, compositeScore, grade, breakdown };
  }

  public getMonthlyMap2RunsCount(): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return this.state.history.filter((record) => {
      if (record.map !== "MAP2") return false;
      const recordDate = new Date(record.completedAt);
      return (
        recordDate.getMonth() === currentMonth &&
        recordDate.getFullYear() === currentYear
      );
    }).length;
  }

  public hasCompletedMap1(): boolean {
    const state = this.getState();
    return (
      state.history.some((r) => r.map === "MAP1") ||
      state.badges.some((b) => b.id === "SURVIVOR" && b.isUnlocked)
    );
  }

  public canPlayMap2(planKey: string = "FREE"): {
    allowed: boolean;
    runsUsed: number;
    limit: number;
    remaining: number;
  } {
    const runsUsed = this.getMonthlyMap2RunsCount();
    if (planKey === "PREMIUM") {
      return {
        allowed: true,
        runsUsed,
        limit: Infinity,
        remaining: Infinity,
      };
    }
    const limit = 3;
    const remaining = Math.max(0, limit - runsUsed);
    return {
      allowed: runsUsed < limit,
      runsUsed,
      limit,
      remaining,
    };
  }

  public getLeaderboard(currentUserName = "Bạn"): LeaderboardEntry[] {
    const bestRun = this.state.history.length > 0
      ? this.state.history.reduce((prev, curr) => (curr.returnPct > prev.returnPct ? curr : prev))
      : null;

    const currentUserReturn = bestRun ? bestRun.returnPct : 8.5;
    const currentUserMap = bestRun ? bestRun.mapName : "FOMO Arena (Map 1)";

    const entries: LeaderboardEntry[] = [
      {
        rank: 1,
        handle: "@shark_alpha",
        displayName: "Trần Minh Quân",
        avatar: "MQ",
        level: 5,
        badge: "Huyền Thoại Đầu Tư",
        map: "Pro Room (Map 2)",
        returnPct: 24.8,
        xp: 3250,
      },
      {
        rank: 2,
        handle: "@fomo_slayer",
        displayName: "Lê Hoàng Yến",
        avatar: "HY",
        level: 4,
        badge: "Huy Hiệu Sinh Tồn",
        map: "FOMO Arena (Map 1)",
        returnPct: 19.4,
        xp: 1850,
      },
      {
        rank: 3,
        handle: "@buffett_disciple",
        displayName: "Nguyễn Tuấn Kiệt",
        avatar: "TK",
        level: 4,
        badge: "Chiến Lược Gia Vĩ Mô",
        map: "Pro Room (Map 2)",
        returnPct: 15.2,
        xp: 1420,
      },
      {
        rank: 4,
        handle: "@auratrader_me",
        displayName: `${currentUserName} (Bạn)`,
        avatar: "ME",
        level: this.state.level,
        badge: this.state.levelTitle.split("•")[1]?.trim() ?? "Trader Kỷ Luật",
        map: currentUserMap,
        returnPct: currentUserReturn,
        xp: this.state.xp,
        isCurrentUser: true,
      },
      {
        rank: 5,
        handle: "@danhmuc_vang",
        displayName: "Phạm Thảo Vy",
        avatar: "TV",
        level: 3,
        badge: "Chuyên Viên Phân Bổ",
        map: "Pro Room (Map 2)",
        returnPct: 7.8,
        xp: 820,
      },
      {
        rank: 6,
        handle: "@f0_pro",
        displayName: "Vũ Gia Huy",
        avatar: "GH",
        level: 2,
        badge: "Trader Kỷ Luật",
        map: "FOMO Arena (Map 1)",
        returnPct: 4.5,
        xp: 410,
      },
    ];

    // Sort by returnPct descending and re-rank
    entries.sort((a, b) => b.returnPct - a.returnPct);
    return entries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }
}

export const gamificationService = new GamificationService();
