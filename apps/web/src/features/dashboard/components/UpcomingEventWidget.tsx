import React from "react";
import { Link } from "react-router-dom";

export const UpcomingEventWidget: React.FC = () => {
  return (
    <div className="overview-event-card">
      <div>
        {/* Header */}
        <div className="event-card-header">
          <div className="event-tag-title">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D97706", display: "inline-block" }} />
            <span>SỰ KIỆN SẮP TỚI</span>
          </div>
          <span className="event-season-pill">
            Mùa giải Season 4
          </span>
        </div>

        {/* Event Content */}
        <h3 className="event-card-title">
          FOMO Arena Cup: Thử Thách Kỷ Luật Thị Trường Gấu
        </h3>
        <p className="event-card-desc">
          Thi đấu mô phỏng 100 người, cân bằng NAV và tối thiểu tỷ lệ drawdown.
        </p>

        {/* Schedule Box */}
        <div className="event-schedule-box">
          <span className="event-time-label">Thời gian khởi tranh:</span>
          <span className="event-time-val">Tối nay 20:00 (15/10)</span>
        </div>
      </div>

      {/* Action CTA Button */}
      <Link
        to="/simulation"
        className="btn-event-register"
      >
        Đăng Ký Tham Gia Đấu Trường
      </Link>
    </div>
  );
};
