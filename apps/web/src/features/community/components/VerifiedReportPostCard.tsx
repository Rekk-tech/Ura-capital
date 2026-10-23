import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Bookmark,
  Heart,
  MessageSquare,
  Share2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Award,
} from "lucide-react";

export const VerifiedReportPostCard: React.FC = () => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(142);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount((prev) => prev - 1);
    } else {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article className="verified-report-card">
      {/* Top Verified Header Bar */}
      <div className="verified-card-top-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <ShieldCheck size={16} />
          <span>Báo Cáo Chu Kỳ Được Kiểm Duyệt</span>
        </div>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.725rem", color: "#DBEAFE" }}>
          ID: #PRO-ROOM-012
        </div>
      </div>

      <div className="verified-report-body">
        {/* Author & Metadata */}
        <div className="verified-author-row">
          <div className="author-meta-group">
            <div className="author-shield-avatar">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <span className="author-name-text">
                  Aura System Admin
                </span>
                <span className="badge-system-verified">
                  Hệ Thống
                </span>
              </div>
              <div className="post-timestamp-sub">
                Oct 13, 2026, 11:50 PM • Khóa học: Chu kỳ Vĩ mô
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setBookmarked((prev) => !prev)}
            aria-label="Lưu bài viết"
            style={{
              padding: "0.45rem",
              borderRadius: "8px",
              border: "none",
              background: bookmarked ? "#EFF6FF" : "transparent",
              color: bookmarked ? "#1D6FF2" : "#94A3B8",
              cursor: "pointer",
            }}
          >
            <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Post Title */}
        <h2 className="verified-post-title">
          Tổng kết 12 Quý Pro Room: Đạt chứng chỉ Nhà đầu tư Phòng thủ (Defensive Investor)
        </h2>

        {/* Narrative description */}
        <p className="verified-post-intro">
          Tôi vừa hoàn thành xuất sắc chu kỳ mô phỏng 12 quý vĩ mô tại Pro Room (Aura Capital). Toàn bộ danh mục được thực hiện dưới áp lực của các pha biến động lãi suất thực tế:
        </p>

        {/* Pro Room 3-Year Stats Box */}
        <div className="pro-stats-container">
          <div className="pro-stats-header">
            <div className="pro-stats-title">
              <TrendingUp size={15} style={{ color: "#1D6FF2" }} />
              <span>KẾT QUẢ DANH MỤC 3 NĂM</span>
            </div>
            <span className="profit-badge-green">
              +25.75% Lãi Ròng
            </span>
          </div>

          {/* 4-Stat Grid */}
          <div className="pro-metrics-grid">
            <div className="metric-cell">
              <div className="metric-cell-label">Tài sản ròng cuối</div>
              <div className="metric-cell-val">123,745,933 ₫</div>
            </div>

            <div className="metric-cell">
              <div className="metric-cell-label">CAGR Hàng Năm</div>
              <div className="metric-cell-val" style={{ color: "#059669" }}>7.36% / năm</div>
              <div className="metric-cell-sub">VN-Index: 5.12%</div>
            </div>

            <div className="metric-cell">
              <div className="metric-cell-label">Max Drawdown (MDD)</div>
              <div className="metric-cell-val" style={{ color: "#059669" }}>4.71%</div>
              <div className="metric-cell-sub">Mục tiêu: &lt; 15%</div>
            </div>

            <div className="metric-cell">
              <div className="metric-cell-label">Tỷ số Sharpe Ratio</div>
              <div className="metric-cell-val" style={{ color: "#1D6FF2" }}>0.72</div>
              <div className="metric-cell-sub">Alpha: 1.14%</div>
            </div>
          </div>

          {/* Certificate row */}
          <div className="certificate-awarded-row">
            <span style={{ color: "#64748B", fontWeight: 600 }}>Chứng chỉ được cấp:</span>
            <span className="certificate-pill-gold">
              <Award size={13} style={{ color: "#D97706" }} />
              <span>Nhà đầu tư Phòng thủ (Defensive Investor)</span>
            </span>
          </div>
        </div>

        {/* CrediFin AI Advisor Assessment Box */}
        <div className="credifin-quote-box">
          <div className="credifin-quote-header">
            <Sparkles size={13} style={{ color: "#D97706" }} />
            <span>ĐÁNH GIÁ CỦA CỐ VẤN ĐỊNH CHẾ (CrediFin AI Advisor):</span>
          </div>
          <p className="credifin-quote-body">
            &ldquo;Chúc mừng bạn! Bạn đã hoàn thành 12 quý với mức sụt giảm tối đa 4.71%, đáp ứng mục tiêu kỷ luật khắt khe (&lt; 15%). Phong cách đầu tư Nhà đầu tư Phòng thủ (Defensive Investor) của bạn phản ánh sự kiên định và thấu hiểu sâu sắc bản chất chu kỳ kinh tế.&rdquo;
          </p>
        </div>

        <p className="verified-post-outro">
          Cùng thảo luận và giao lưu chiến lược phân bổ đa tài sản nhé!
        </p>

        {/* Interaction Footer */}
        <div className="post-interaction-footer">
          <div className="interaction-actions-group">
            <button
              type="button"
              onClick={handleLike}
              className={`btn-interaction ${liked ? "liked" : ""}`}
            >
              <Heart size={15} fill={liked ? "currentColor" : "none"} />
              <span>{likeCount}</span>
            </button>

            <Link to="/community" className="btn-interaction">
              <MessageSquare size={15} />
              <span>28 bình luận</span>
            </Link>

            <button
              type="button"
              onClick={handleShare}
              className="btn-interaction"
            >
              <Share2 size={15} />
              <span>{copied ? "Đã sao chép!" : "Chia sẻ"}</span>
            </button>
          </div>

          <Link to="/community" className="btn-view-details-link">
            <span>Xem Thảo Luận</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
};
