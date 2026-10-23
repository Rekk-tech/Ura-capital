import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGamification } from "../hooks/useGamification";
import { useAuth } from "../../auth/context/AuthContext";
import { Trophy, TrendingUp, TrendingDown, ArrowRight, BarChart2 } from "lucide-react";

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
        return <div className="arena-rank-badge arena-rank-1">1</div>;
      case 2:
        return <div className="arena-rank-badge arena-rank-2">2</div>;
      case 3:
        return <div className="arena-rank-badge arena-rank-3">3</div>;
      case 4:
        return <div className="arena-rank-badge arena-rank-4">4</div>;
      default:
        return <span className="arena-rank-plain">{rank}</span>;
    }
  };

  const getAvatarInfo = (rank: number, fallback: string) => {
    switch (rank) {
      case 1:
        return { cls: "avatar-tq", label: "TQ" };
      case 2:
        return { cls: "avatar-ly", label: "LY" };
      case 3:
        return { cls: "avatar-nk", label: "NK" };
      case 4:
        return { cls: "avatar-th", label: "TH" };
      case 5:
        return { cls: "avatar-pv", label: "PV" };
      case 6:
        return { cls: "avatar-gh", label: "GH" };
      default:
        return { cls: "avatar-th", label: fallback };
    }
  };

  const getStatusIndicator = (rank: number) => {
    switch (rank) {
      case 1:
      case 2:
      case 6:
        return (
          <span className="arena-status-live">
            <span className="arena-dot-green" />
            <span>Đang giao dịch</span>
          </span>
        );
      case 4:
        return (
          <span className="arena-status-online">
            <span className="arena-dot-green" />
            <span>Trực tuyến</span>
          </span>
        );
      case 3:
      case 5:
      default:
        return <span className="arena-status-idle">Nghỉ phiên</span>;
    }
  };

  const renderTraderIdentity = (
    entry: { displayName: string; handle: string; isCurrentUser?: boolean; rank: number }
  ) => {
    if (entry.isCurrentUser) {
      const rawName = entry.displayName.replace(/\s*\([Bb]ạn\)\s*/g, "").trim();
      return (
        <div>
          <div className="arena-trader-name-row">
            <span className="arena-trader-name">{rawName}</span>
            <span className="arena-user-tag">BẠN</span>
          </div>
          <span className="arena-trader-handle">{entry.handle}</span>
        </div>
      );
    }

    return (
      <div>
        <div className="arena-trader-name-row">
          <span className="arena-trader-name">{entry.displayName}</span>
          {entry.rank === 1 && (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="arena-verified-icon" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill="#2563EB" />
              <path d="m8.5 12 2.5 2.5 5-5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className="arena-trader-handle">{entry.handle}</span>
      </div>
    );
  };

  const getSidebarRankClass = (rank: number) => {
    switch (rank) {
      case 1:
        return "rank-1";
      case 2:
        return "rank-2";
      case 3:
        return "rank-3";
      case 4:
        return "rank-4";
      default:
        return "rank-default";
    }
  };

  // Variant 2: Compact Sidebar Widget (for Community page 30% column)
  if (variant === "sidebar") {
    return (
      <div className="sidebar-leaderboard-card">
        {/* Header */}
        <div className="sidebar-leaderboard-header">
          <div>
            <h4 className="sidebar-leaderboard-title">
              {title || "Top 5 Nhà Đầu Tư"}
            </h4>
            <p className="sidebar-leaderboard-sub">
              {subtitle || "Hiệu suất sinh lời cao nhất"}
            </p>
          </div>
          <div className="sidebar-trophy-wrap">
            <Trophy size={16} />
          </div>
        </div>

        {/* List of traders */}
        <div className="sidebar-leaderboard-list">
          {entries.map((entry) => {
            const avatar = getAvatarInfo(entry.rank, entry.avatar);
            const isRankPositive = entry.returnPct >= 0;
            return (
              <div
                key={entry.rank}
                className={`sidebar-trader-row ${entry.isCurrentUser ? "is-current-user" : ""}`}
              >
                <div className="sidebar-trader-left">
                  <div className={`sidebar-rank-num ${getSidebarRankClass(entry.rank)}`}>
                    {entry.rank}
                  </div>
                  <div className={`sidebar-avatar-circle ${avatar.cls}`}>
                    {avatar.label}
                  </div>
                  <div className="sidebar-name-col">
                    <span className="sidebar-name-main">
                      <span>{entry.displayName}</span>
                      {entry.isCurrentUser && <span className="sidebar-you-tag">(Bạn)</span>}
                    </span>
                    <span className="sidebar-handle-main">
                      {entry.handle}
                    </span>
                  </div>
                </div>

                <div className="sidebar-trader-right">
                  <span className={`sidebar-roi-text ${isRankPositive ? "" : "roi-negative"}`}>
                    {isRankPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    <span>{isRankPositive ? `+${entry.returnPct}%` : `${entry.returnPct}%`}</span>
                  </span>
                  <span className="sidebar-xp-count">
                    {entry.xp.toLocaleString()} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Link */}
        <div className="sidebar-leaderboard-footer">
          <Link
            to="/simulation"
            className="sidebar-view-more-link"
          >
            <span>Vào Đấu Trường Giả Lập</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    );
  }

  // Variant 1: High-Fidelity Main Table (Exact replica of Image 1)
  return (
    <div className="arena-leaderboard-container">
      {/* Header Row */}
      <div className="arena-leaderboard-header">
        <div className="arena-leaderboard-title-block">
          <div className="arena-leaderboard-subtag">
            <BarChart2 size={14} />
            <span>BẢNG THÀNH TÍCH XẾP HẠNG</span>
          </div>
          <h2 className="arena-leaderboard-title">
            {title || "Bảng Xếp Hạng Đấu Trường Giả Lập"}
          </h2>
          <p className="arena-leaderboard-desc">
            {subtitle ||
              "Dữ liệu hiệu suất sinh lời và kỷ luật kiểm soát rủi ro thực tế của các nhà đầu tư trên toàn hệ sinh thái Aura Capital."}
          </p>
        </div>

        {/* Filter Capsule Tabs */}
        <div className="arena-tabs-pill-wrap">
          <button
            type="button"
            className={`arena-tab-pill-btn ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            Toàn Mùa Giải
          </button>
          <button
            type="button"
            className={`arena-tab-pill-btn ${activeFilter === "week" ? "active" : ""}`}
            onClick={() => setActiveFilter("week")}
          >
            Tuần Này
          </button>
          <button
            type="button"
            className={`arena-tab-pill-btn ${activeFilter === "fomo" ? "active" : ""}`}
            onClick={() => setActiveFilter("fomo")}
          >
            Map 1 (FOMO)
          </button>
          <button
            type="button"
            className={`arena-tab-pill-btn ${activeFilter === "macro" ? "active" : ""}`}
            onClick={() => setActiveFilter("macro")}
          >
            Map 2 (Macro)
          </button>
        </div>
      </div>

      {/* Financial Data Table */}
      <div className="arena-leaderboard-table-wrap">
        <table className="arena-leaderboard-table">
          <thead className="arena-table-head">
            <tr>
              <th className="arena-table-th col-rank">HẠNG</th>
              <th className="arena-table-th col-trader">NHÀ ĐẦU TƯ</th>
              <th className="arena-table-th col-map">ĐẤU TRƯỜNG</th>
              <th className="arena-table-th col-roi">LỢI NHUẬN ROI</th>
              <th className="arena-table-th col-xp">ĐIỂM KỶ LUẬT XP</th>
              <th className="arena-table-th col-status">TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const avatar = getAvatarInfo(entry.rank, entry.avatar);
              const isProRoom = entry.map.includes("Pro");
              return (
                <tr
                  key={entry.rank}
                  className={`arena-table-row ${entry.isCurrentUser ? "current-user-row" : ""}`}
                >
                  {/* Col 1: HẠNG */}
                  <td className="arena-table-td col-rank">
                    {getRankBadge(entry.rank)}
                  </td>

                  {/* Col 2: NHÀ ĐẦU TƯ */}
                  <td className="arena-table-td col-trader">
                    <div className="arena-trader-cell">
                      <div className={`arena-trader-avatar ${avatar.cls}`}>
                        {avatar.label}
                      </div>
                      {renderTraderIdentity(entry)}
                    </div>
                  </td>

                  {/* Col 3: ĐẤU TRƯỜNG */}
                  <td className="arena-table-td col-map">
                    <span
                      className={`arena-map-pill ${
                        isProRoom ? "arena-map-pro" : "arena-map-fomo"
                      }`}
                    >
                      {entry.map}
                    </span>
                  </td>

                  {/* Col 4: LỢI NHUẬN ROI */}
                  <td className="arena-table-td col-roi">
                    <span className="arena-roi-pill">
                      {entry.returnPct >= 0 ? `+${entry.returnPct}%` : `${entry.returnPct}%`}
                    </span>
                  </td>

                  {/* Col 5: ĐIỂM KỶ LUẬT XP */}
                  <td className="arena-table-td col-xp">
                    <span className="arena-xp-val">
                      {entry.xp.toLocaleString()} XP
                    </span>
                  </td>

                  {/* Col 6: TRẠNG THÁI */}
                  <td className="arena-table-td col-status">
                    {getStatusIndicator(entry.rank)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination */}
      <div className="arena-leaderboard-footer">
        <span>Hiển thị top 6 trên tổng số 1,280 nhà giao dịch đang hoạt động</span>
        <div className="arena-pagination-controls">
          <button
            type="button"
            className="arena-page-btn"
            disabled
          >
            Trang trước
          </button>
          <span className="arena-page-num">1 / 128</span>
          <button
            type="button"
            className="arena-page-btn"
          >
            Trang kế
          </button>
        </div>
      </div>
    </div>
  );
};
