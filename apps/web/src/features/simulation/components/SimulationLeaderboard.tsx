import React from "react";
import { Link } from "react-router-dom";
import { useGamification } from "../hooks/useGamification";
import { useAuth } from "../../auth/context/AuthContext";
import { Trophy, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

export interface SimulationLeaderboardProps {
  title?: string;
  subtitle?: string;
  variant?: "table" | "sidebar";
  limit?: number;
}

export const SimulationLeaderboard: React.FC<SimulationLeaderboardProps> = ({
  title,
  subtitle,
  variant = "table",
  limit,
}) => {
  const { user } = useAuth();
  const currentUserName = user?.email ? user.email.split("@")[0] : "Bạn";
  const { getLeaderboard } = useGamification();
  const allEntries = getLeaderboard(currentUserName);
  const entries = limit ? allEntries.slice(0, limit) : allEntries;

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[11px] shadow-2xs mx-auto">
            1
          </div>
        );
      case 2:
        return (
          <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-900 font-black flex items-center justify-center text-[11px] shadow-2xs mx-auto">
            2
          </div>
        );
      case 3:
        return (
          <div className="w-5 h-5 rounded-full bg-amber-700 text-white font-black flex items-center justify-center text-[11px] shadow-2xs mx-auto">
            3
          </div>
        );
      default:
        return (
          <span className="text-xs font-mono font-bold text-slate-400 block text-center">
            {rank}
          </span>
        );
    }
  };

  // Variant 2: Compact Sidebar Widget (Top 5 for Community page 30% column)
  if (variant === "sidebar") {
    return (
      <div
        className="simulation-leaderboard-sidebar rounded-2xl border bg-white p-5 shadow-xs"
        style={{ borderColor: "var(--color-border, #e2e8f0)" }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              {title || "Top 5 Nhà Đầu Tư"}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {subtitle || "Hiệu suất sinh lời cao nhất"}
            </p>
          </div>
          <Trophy size={16} className="text-amber-500 flex-shrink-0" />
        </div>

        <div className="flex flex-col divide-y divide-slate-100">
          {entries.map((entry) => (
            <div
              key={entry.rank}
              className={`py-2.5 flex items-center justify-between gap-2.5 transition-colors ${
                entry.isCurrentUser ? "bg-blue-50/50 -mx-2 px-2 rounded-lg" : ""
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-5 text-center flex-shrink-0">
                  {getRankBadge(entry.rank)}
                </div>
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {entry.avatar}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {entry.displayName}
                    </span>
                    {entry.isCurrentUser && (
                      <span className="text-[9px] font-black uppercase bg-blue-600 text-white px-1 py-0.2 rounded">
                        BẠN
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">
                    {entry.handle}
                  </span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span
                  className={`text-xs font-mono font-bold flex items-center justify-end gap-0.5 ${
                    entry.returnPct >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {entry.returnPct >= 0 ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  <span>{entry.returnPct >= 0 ? `+${entry.returnPct}%` : `${entry.returnPct}%`}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {entry.xp.toLocaleString()} XP
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-3 mt-2 text-center">
          <Link
            to="/simulation"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition-colors"
          >
            <span>Vào Đấu Trường Giả Lập</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    );
  }

  // Variant 1: Clean Financial Data Table (for /simulation under map cards)
  return (
    <div
      className="simulation-leaderboard-card rounded-2xl border bg-white p-6 md:p-8 shadow-xs flex flex-col gap-5"
      style={{ borderColor: "var(--color-border, #e2e8f0)" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {title || "Bảng Xếp Hạng Đấu Trường Giả Lập"}
          </h3>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {subtitle ||
              "Bảng dữ liệu hiệu suất sinh lời và kỷ luật kiểm soát rủi ro của các nhà đầu tư tại Aura Capital."}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 self-start sm:self-auto font-mono">
          {entries.length} Nhà Đầu Tư
        </span>
      </div>

      {/* Clean Financial Data Table */}
      <div className="overflow-x-auto -mx-6 md:-mx-8 px-6 md:px-8">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-3 text-center w-16">Hạng</th>
              <th className="py-3 px-3">Nhà Đầu Tư</th>
              <th className="py-3 px-3">Bản Đồ</th>
              <th className="py-3 px-3 text-right">Lợi Nhuận ROI</th>
              <th className="py-3 px-3 text-right">Điểm XP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {entries.map((entry) => (
              <tr
                key={entry.rank}
                className={`transition-colors hover:bg-slate-50/80 ${
                  entry.isCurrentUser ? "bg-blue-50/60 font-semibold" : ""
                }`}
              >
                {/* Hạng */}
                <td className="py-3 px-3 text-center align-middle">
                  {getRankBadge(entry.rank)}
                </td>

                {/* Nhà đầu tư */}
                <td className="py-3 px-3 align-middle">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {entry.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 font-bold">
                          {entry.displayName}
                        </span>
                        {entry.isCurrentUser && (
                          <span className="text-[10px] font-black uppercase bg-blue-600 text-white px-1.5 py-0.2 rounded">
                            BẠN
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-mono block">
                        {entry.handle}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Bản đồ */}
                <td className="py-3 px-3 align-middle">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {entry.map}
                  </span>
                </td>

                {/* Lợi nhuận ROI */}
                <td className="py-3 px-3 text-right align-middle font-mono">
                  <span
                    className={`inline-flex items-center justify-end gap-1 font-bold ${
                      entry.returnPct >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {entry.returnPct >= 0 ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                    <span>{entry.returnPct >= 0 ? `+${entry.returnPct}%` : `${entry.returnPct}%`}</span>
                  </span>
                </td>

                {/* Điểm XP */}
                <td className="py-3 px-3 text-right align-middle font-mono font-bold text-slate-800">
                  {entry.xp.toLocaleString()} XP
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
