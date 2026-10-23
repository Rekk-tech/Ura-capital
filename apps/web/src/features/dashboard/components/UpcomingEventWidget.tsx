import React from "react";
import { Link } from "react-router-dom";

export const UpcomingEventWidget: React.FC = () => {
  return (
    <div className="upcoming-event-dashboard-widget rounded-2xl p-5 border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
            <span>SỰ KIỆN SẮP TỚI</span>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
            Mùa giải Season 4
          </span>
        </div>

        {/* Event Content */}
        <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
          FOMO Arena Cup: Thử Thách Kỷ Luật Thị Trường Gấu
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Thi đấu mô phỏng 100 người, cân bằng NAV và tối thiểu tỷ lệ drawdown.
        </p>

        {/* Schedule Box */}
        <div className="mt-3.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">Thời gian khởi tranh:</span>
          <span className="font-bold text-amber-900 font-mono">Tối nay 20:00 (15/10)</span>
        </div>
      </div>

      {/* Action CTA Button */}
      <div className="mt-4">
        <Link
          to="/simulation"
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors block text-center shadow-xs"
        >
          Đăng Ký Tham Gia Đấu Trường
        </Link>
      </div>
    </div>
  );
};
