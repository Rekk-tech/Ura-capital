import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGamification } from "../hooks/useGamification";
import { useAuth } from "../../auth/context/AuthContext";
import { Trophy, TrendingUp, TrendingDown, ArrowRight, CheckCircle2, BarChart2 } from "lucide-react";

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
  const currentUserName = user?.email ? user.email.split("@")[0] : "hoangtuan2004";
  const { getLeaderboard } = useGamification();
  const allEntries = getLeaderboard(currentUserName);
  const [activeFilter, setActiveFilter] = useState<"all" | "week" | "fomo" | "macro">("all");

  const filteredEntries = allEntries.filter((e) => {
    if (activeFilter === "fomo") return e.map.includes("FOMO");
    if (activeFilter === "macro") return e.map.includes("Pro");
    return true;
  });

  const entries = limit ? filteredEntries.slice(0, limit) : filteredEntries;

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 border border-amber-300 font-black flex items-center justify-center text-xs shadow-2xs mx-auto">
            1
          </div>
        );
      case 2:
        return (
          <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 border border-slate-300 font-black flex items-center justify-center text-xs shadow-2xs mx-auto">
            2
          </div>
        );
      case 3:
        return (
          <div className="w-6 h-6 rounded-md bg-orange-100 text-orange-800 border border-orange-300 font-black flex items-center justify-center text-xs shadow-2xs mx-auto">
            3
          </div>
        );
      case 4:
        return (
          <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-black flex items-center justify-center text-xs shadow-2xs mx-auto">
            4
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

  const getAvatarInfo = (rank: number, fallback: string) => {
    switch (rank) {
      case 1:
        return { bg: "bg-slate-900 text-white", label: "TQ" };
      case 2:
        return { bg: "bg-indigo-600 text-white", label: "LY" };
      case 3:
        return { bg: "bg-teal-700 text-white", label: "NK" };
      case 4:
        return { bg: "bg-blue-600 text-white", label: "TH" };
      case 5:
        return { bg: "bg-rose-700 text-white", label: "PV" };
      case 6:
        return { bg: "bg-emerald-800 text-white", label: "GH" };
      default:
        return { bg: "bg-indigo-600 text-white", label: fallback };
    }
  };


  const renderDisplayName = (
    entry: { displayName: string; isCurrentUser?: boolean; rank: number },
    textClass = "text-xs"
  ) => {
    if (entry.isCurrentUser) {
      const rawName = entry.displayName.replace(/\s*\([Bb]ạn\)\s*/g, "").trim();
      return (
        <span className={`${textClass} font-bold text-slate-900 truncate inline-flex items-center gap-1`}>
          <span className="truncate">{rawName}</span>
          <span
            className="font-extrabold flex-shrink-0"
            style={{ color: "var(--aura-blue-600, #1D6FF2)" }}
          >
            (Bạn)
          </span>
        </span>
      );
    }
    return (
      <span className={`${textClass} font-bold text-slate-900 truncate inline-flex items-center gap-1`}>
        <span>{entry.displayName}</span>
        {entry.rank === 1 && (
          <CheckCircle2 size={13} className="text-blue-500 fill-blue-500 text-white flex-shrink-0" />
        )}
      </span>
    );
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
                <div
                  className={`w-7 h-7 rounded-full ${
                    getAvatarInfo(entry.rank, entry.avatar).bg
                  } font-bold text-xs flex items-center justify-center flex-shrink-0`}
                >
                  {getAvatarInfo(entry.rank, entry.avatar).label}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    {renderDisplayName(entry, "text-xs")}
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
      className="simulation-leaderboard-card rounded-2xl border bg-white p-6 md:p-8 shadow-xs flex flex-col gap-6"
      style={{ borderColor: "var(--color-border, #e2e8f0)" }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex-1 min-w-[280px]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 mb-1">
            <BarChart2 size={14} />
            <span>BẢNG THÀNH TÍCH XẾP HẠNG</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {title || "Bảng Xếp Hạng Đấu Trường Giả Lập"}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {subtitle ||
              "Dữ liệu hiệu xuất sinh lời và kỷ luật kiểm soát rủi ro thực tế của các nhà đầu tư trên toàn hệ sinh thái Aura Capital."}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-full self-start lg:self-auto flex-shrink-0">
          <button
            type="button"
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setActiveFilter("all")}
          >
            Toàn Mùa Giải
          </button>
          <button
            type="button"
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === "week"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setActiveFilter("week")}
          >
            Tuần Này
          </button>
          <button
            type="button"
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === "fomo"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setActiveFilter("fomo")}
          >
            Map 1 (FOMO)
          </button>
          <button
            type="button"
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === "macro"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setActiveFilter("macro")}
          >
            Map 2 (Macro)
          </button>
        </div>
      </div>

      {/* Clean Financial Data Table */}
      <div className="overflow-x-auto -mx-6 md:-mx-8 px-6 md:px-8">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-3 text-center w-14">HẠNG</th>
              <th className="py-3 px-3">NHÀ ĐẦU TƯ</th>
              <th className="py-3 px-3 text-center">ĐẤU TRƯỜNG</th>
              <th className="py-3 px-3 text-center">LỢI NHUẬN ROI</th>
              <th className="py-3 px-3 text-right">ĐIỂM KỶ LUẬT XP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {entries.map((entry) => {
              const avatar = getAvatarInfo(entry.rank, entry.avatar);
              const isProRoom = entry.map.includes("Pro");
              return (
                <tr
                  key={entry.rank}
                  className={`transition-colors hover:bg-slate-50/80 ${
                    entry.isCurrentUser ? "bg-blue-50/50" : ""
                  }`}
                >
                  {/* Hạng */}
                  <td className="py-3.5 px-3 text-center align-middle">
                    {getRankBadge(entry.rank)}
                  </td>

                  {/* Nhà đầu tư */}
                  <td className="py-3.5 px-3 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full ${avatar.bg} font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs`}
                      >
                        {avatar.label}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          {renderDisplayName(entry, "text-sm")}
                        </div>
                        <span className="text-xs text-slate-400 font-mono block">
                          {entry.handle}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Đấu trường */}
                  <td className="py-3.5 px-3 align-middle text-center">
                    <span
                      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        isProRoom
                          ? "bg-cyan-50 text-cyan-800 border-cyan-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {entry.map}
                    </span>
                  </td>

                  {/* Lợi nhuận ROI */}
                  <td className="py-3.5 px-3 text-center align-middle font-mono">
                    <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {entry.returnPct >= 0 ? `+${entry.returnPct}%` : `${entry.returnPct}%`}
                    </span>
                  </td>

                  {/* Điểm XP */}
                  <td className="py-3.5 px-3 text-right align-middle font-mono font-bold text-slate-800">
                    {entry.xp.toLocaleString()} XP
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary & Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <span>Hiển thị top 6 trên tổng số 1,280 nhà giao dịch đang hoạt động</span>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            className="px-2.5 py-1 rounded border border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed text-xs font-medium"
            disabled
          >
            Trang trước
          </button>
          <span className="font-mono font-bold text-slate-700 px-1">1 / 128</span>
          <button
            type="button"
            className="px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
          >
            Trang kế
          </button>
        </div>
      </div>
    </div>
  );
};
