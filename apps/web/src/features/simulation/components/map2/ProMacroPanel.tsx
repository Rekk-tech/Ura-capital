import React from "react";
import { Activity, Percent, ArrowUpRight, HelpCircle, Shield, Award } from "lucide-react";

interface ProMacroPanelProps {
  currentQuarter: number;
  totalQuarters: number;
  stageName: string;
  stageKey: string;
  interestRate: number;
  inflation: number;
  gdpGrowth: number;
  currentNav: number;
  initialCash: number;
  maxDrawdown: number;
  creditScore: number;
  onOpenMacroExplainer: () => void;
}

export const ProMacroPanel: React.FC<ProMacroPanelProps> = ({
  currentQuarter,
  totalQuarters,
  stageName,
  stageKey,
  interestRate,
  inflation,
  gdpGrowth,
  currentNav,
  initialCash,
  maxDrawdown,
  creditScore,
  onOpenMacroExplainer,
}) => {
  const pnlPercent = Number((((currentNav - initialCash) / initialCash) * 100).toFixed(2));
  const isPnlPositive = pnlPercent >= 0;

  const stageBadgeColors: Record<string, string> = {
    BOOM: "bg-emerald-100 text-emerald-800 border-emerald-300",
    STAGFLATION: "bg-amber-100 text-amber-800 border-amber-300",
    RECESSION: "bg-rose-100 text-rose-800 border-rose-300",
    RECOVERY: "bg-blue-100 text-blue-800 border-blue-300",
  };

  return (
    <div className="pro-macro-panel card-aura p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-4">
      {/* Top Banner: Stage & Quarter Progression */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              CHU KỲ VĨ MÔ 3 NĂM
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              DỮ LIỆU MÔ PHỎNG QUÝ {currentQuarter}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                stageBadgeColors[stageKey] || "bg-slate-100 text-slate-800"
              }`}
            >
              {stageName} (Quý {currentQuarter}/{totalQuarters})
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Phòng Quản Lý Danh Mục Pro Room
          </h3>
        </div>

        <button
          type="button"
          onClick={onOpenMacroExplainer}
          className="btn btn-outline py-1.5 px-3 rounded-lg text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 flex items-center gap-1.5"
        >
          <HelpCircle size={14} />
          <span>Sơ đồ phản ứng dây chuyền vĩ mô</span>
        </button>
      </div>

      {/* 4 Macro Stages Timeline Tracker */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[11px] font-semibold text-slate-400">
          <span>Q1-Q3 Bùng nổ</span>
          <span>Q4-Q6 Đình lạm</span>
          <span>Q7-Q9 Suy thoái</span>
          <span>Q10-Q12 Hồi phục</span>
        </div>
        <div className="grid grid-cols-12 gap-1 h-2">
          {Array.from({ length: totalQuarters }).map((_, idx) => {
            const q = idx + 1;
            const isCompleted = q < currentQuarter;
            const isCurrent = q === currentQuarter;
            return (
              <div
                key={q}
                className={`h-full rounded-sm transition-all ${
                  isCurrent
                    ? "bg-blue-600 ring-2 ring-blue-300 ring-offset-1"
                    : isCompleted
                    ? "bg-slate-700"
                    : "bg-slate-200"
                }`}
                title={`Quý ${q}`}
              />
            );
          })}
        </div>
      </div>

      {/* KPI Cards: Indicators & Portfolio Status */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1">
        {/* Interest Rate */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <Percent size={12} className="text-blue-500" /> Lãi Suất Điều Hành
          </span>
          <div className="text-xl font-black font-mono text-slate-900 mt-1">
            {interestRate}%
          </div>
          <span className="text-[10px] text-slate-400">Độ nhạy: Growth &lt; 0</span>
        </div>

        {/* Inflation */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <Activity size={12} className="text-amber-500" /> Lạm Phát (CPI)
          </span>
          <div className="text-xl font-black font-mono text-slate-900 mt-1">
            {inflation}%
          </div>
          <span className="text-[10px] text-slate-400">Áp lực giá cả</span>
        </div>

        {/* GDP Growth */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <ArrowUpRight size={12} className="text-emerald-500" /> Tăng Trưởng GDP
          </span>
          <div className="text-xl font-black font-mono text-slate-900 mt-1">
            {gdpGrowth}%
          </div>
          <span className="text-[10px] text-slate-400">Sức khỏe nền kinh tế</span>
        </div>

        {/* Current NAV & PnL */}
        <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col justify-between">
          <span className="text-[11px] text-blue-600 font-semibold">Tài Sản Ròng (NAV)</span>
          <div className="text-xl font-black font-mono text-slate-900 mt-1">
            {currentNav.toLocaleString("vi-VN")} đ
          </div>
          <span className={`text-[10px] font-bold ${isPnlPositive ? "text-emerald-600" : "text-rose-600"}`}>
            {isPnlPositive ? `+${pnlPercent}%` : `${pnlPercent}%`} tổng chu kỳ
          </span>
        </div>

        {/* Risk & Credit Score */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1"><Shield size={12} className="text-indigo-500" /> Drawdown</span>
            <span className="flex items-center gap-1"><Award size={12} className="text-blue-500" /> Credit</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black font-mono text-slate-800">
              {(maxDrawdown * 100).toFixed(1)}%
            </span>
            <span className="text-lg font-black font-mono text-indigo-600">
              {creditScore}đ
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Mục tiêu MDD &lt; 15%</span>
        </div>
      </div>
    </div>
  );
};
