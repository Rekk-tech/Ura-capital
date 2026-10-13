import { describe, it, expect, beforeEach } from "vitest";
import {
  gamificationService,
  calculateLevelFromXp,
} from "./gamification.service";

describe("GamificationService Unit Tests", () => {
  beforeEach(() => {
    // Reset service state
    gamificationService["state"] = {
      xp: 50,
      ...calculateLevelFromXp(50),
      badges: [
        {
          id: "MARKET_SCHOLAR",
          name: "Học Giả Aura",
          subtitle: "Nền tảng kiến thức vững chắc",
          description: "Đã hoàn thành các bài học nhập môn tại Aura Academy.",
          icon: "award",
          isUnlocked: true,
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
      ],
      history: [],
    };
  });

  it("calculates levels correctly across XP tiers", () => {
    expect(calculateLevelFromXp(50).level).toBe(1);
    expect(calculateLevelFromXp(200).level).toBe(2);
    expect(calculateLevelFromXp(550).level).toBe(3);
    expect(calculateLevelFromXp(1200).level).toBe(4);
    expect(calculateLevelFromXp(2500).level).toBe(5);
  });

  it("adds XP and upgrades level dynamically", () => {
    const updated = gamificationService.addXp(200); // 50 + 200 = 250 XP
    expect(updated.xp).toBe(250);
    expect(updated.level).toBe(2);
    expect(updated.levelTitle).toContain("Trader Kỷ Luật");
  });

  it("unlocks badge when criteria are met", () => {
    gamificationService.unlockBadge("VIP_PATRON");
    const state = gamificationService.getState();
    const vipBadge = state.badges.find((b) => b.id === "VIP_PATRON");
    expect(vipBadge?.isUnlocked).toBe(true);
  });

  it("records Map 1 completion, awards XP, and unlocks Survivor Badge when eligible", () => {
    const res = gamificationService.recordMap1Run({
      finalNav: 112000000,
      initialNav: 100000000,
      fomoIndex: 35, // disciplined FOMO <= 50
    });

    expect(res.xpAwarded).toBe(200); // 100 base + 50 profit + 50 return>=10%
    expect(res.badgeUnlocked).toContain("Huy Hiệu Sinh Tồn");

    const state = gamificationService.getState();
    expect(state.history).toHaveLength(1);
    expect(state.history[0]?.map).toBe("MAP1");
    expect(state.history[0]?.returnPct).toBe(12);
  });

  it("records Map 2 completion, awards XP, and unlocks Macro Tactician Badge when Alpha > 0", () => {
    const res = gamificationService.recordMap2Run({
      finalNav: 135000000,
      initialNav: 100000000,
      alpha: 4.5,
    });

    expect(res.xpAwarded).toBe(250); // 150 base + 50 alpha>0 + 50 alpha>=3%
    expect(res.badgeUnlocked).toContain("Chiến Lược Gia Vĩ Mô");

    const state = gamificationService.getState();
    expect(state.history).toHaveLength(1);
    expect(state.history[0]?.map).toBe("MAP2");
  });

  it("generates leaderboard with currentUser injected and ranked", () => {
    const leaderboard = gamificationService.getLeaderboard("Học Viên Long");
    expect(leaderboard.length).toBeGreaterThanOrEqual(4);
    const currentUserEntry = leaderboard.find((e) => e.isCurrentUser);
    expect(currentUserEntry).toBeDefined();
    expect(currentUserEntry?.displayName).toContain("Học Viên Long (Bạn)");
  });
});
