import React from "react";
import { useGamification } from "../hooks/useGamification";
import { useAuth } from "../../auth/context/AuthContext";
import { Trophy, Medal, TrendingUp, Sparkles } from "lucide-react";

export interface SimulationLeaderboardProps {
  title?: string;
  subtitle?: string;
}

export const SimulationLeaderboard: React.FC<SimulationLeaderboardProps> = ({
  title = "Bảng Xếp Hạng Đấu Trường Giả Lập",
  subtitle = "Vinh danh các nhà giao dịch có tỷ suất sinh lời vượt trội và kỷ luật kiểm soát rủi ro vững vàng nhất Aura Capital.",
}) => {
  const { user } = useAuth();
  const currentUserName = user?.email ? user.email.split("@")[0] : "Bạn";
  const { getLeaderboard } = useGamification();
  const entries = getLeaderboard(currentUserName);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-md">
            <Trophy size={15} />
          </div>
        );
      case 2:
        return (
          <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-bold flex items-center justify-center shadow-sm">
            <Medal size={15} />
          </div>
        );
      case 3:
        return (
          <div className="w-7 h-7 rounded-full bg-amber-700 text-white font-bold flex items-center justify-center shadow-sm">
            <Medal size={15} />
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center font-mono text-xs">
            #{rank}
          </div>
        );
    }
  };

  return (
    <div
      className="simulation-leaderboard-card p-6 md:p-8 rounded-2xl border shadow-sm flex flex-col gap-5 bg-white"
      style={{ borderColor: "var(--color-border, #e2e8f0)" }}
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 flex items-center gap-1">
            <Sparkles size={12} />
            <span>GLOBAL LEADERBOARD</span>
          </span>
        </div>
        <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-xs md:text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Leaderboard Table / Rows */}
      <div className="flex flex-col gap-2.5">
        {entries.map((entry) => (
          <div
            key={entry.rank}
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
              entry.isCurrentUser
                ? "bg-blue-50/80 border-blue-300 shadow-sm ring-1 ring-blue-300/50"
                : "bg-slate-50/50 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {/* Left: Rank & Trader Info */}
            <div className="flex items-center gap-3">
              {getRankBadge(entry.rank)}

              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-2xs ${
                  entry.isCurrentUser
                    ? "bg-blue-600"
                    : entry.rank === 1
                    ? "bg-amber-600"
                    : "bg-indigo-600"
                }`}
              >
                {entry.avatar}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    {entry.displayName}
                  </span>
                  {entry.isCurrentUser && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-blue-600 text-white">
                      BẠN
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {entry.handle}
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                    {entry.badge}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {entry.map}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Return & XP */}
            <div className="text-right flex-shrink-0">
              <div className="text-sm sm:text-base font-black font-mono text-emerald-600 flex items-center justify-end gap-1">
                <TrendingUp size={15} />
                <span>+{entry.returnPct}%</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono font-medium">
                {entry.xp} XP
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
