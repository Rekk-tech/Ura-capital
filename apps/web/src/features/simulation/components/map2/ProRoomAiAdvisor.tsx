import React from "react";
import type { Map2QuarterHistoryRecord } from "../../types/map-game.types";
import { Sparkles, TrendingUp, TrendingDown, Quote, Award } from "lucide-react";

interface ProRoomAiAdvisorProps {
  lastRecord: Map2QuarterHistoryRecord | null;
  currentQuarter?: number;
}

/**
 * Institutional Value Advisor Speech Box (Benjamin Graham & Warren Buffett philosophy)
 * Provides concise educational debrief (<80 words) evaluating allocation against macro regime.
 * Powered by Phase 8 Gemini AI Gateway with deterministic value investing fallback.
 */
export const ProRoomAiAdvisor: React.FC<ProRoomAiAdvisorProps> = ({
  lastRecord,
  currentQuarter = 1,
}) => {
  if (!lastRecord) {
    return (
      <div
        className="pro-advisor-speech-box card-aura p-5 rounded-2xl text-white border shadow-lg flex flex-col md:flex-row items-start md:items-center gap-4"
        style={{
          background: "linear-gradient(135deg, #090d16 0%, #0f172a 45%, #1e1b4b 100%)",
          color: "#ffffff",
          borderColor: "rgba(59, 130, 246, 0.35)",
        }}
      >
        {/* Advisor Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white">
              <Award size={26} className="text-blue-400" />
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" title="AI Advisor Online" />
        </div>

        {/* Speech Bubble */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
              CỐ VẤN ĐẦU TƯ GIÁ TRỊ · GRAHAM &amp; BUFFETT
            </span>
            <span className="text-[10px] text-slate-300">
              Khởi động Quý {currentQuarter}
            </span>
          </div>
          <h5 className="text-sm font-bold text-white tracking-tight">
            Cố Vấn Đầu Tư Giá Trị (AI Advisor)
          </h5>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            "Không cần dự đoán chính xác bước đi của thị trường; sự phân bổ kỷ luật và biên an toàn sẽ bảo vệ tài sản của bạn. Hãy quan sát kỹ 3 biến số vĩ mô (Lãi suất, Lạm phát, GDP) và chốt tỷ trọng phân bổ để bắt đầu chu kỳ 12 quý."
          </p>
        </div>
      </div>
    );
  }

  const isPositive = lastRecord.pnlQuarterPercent >= 0;

  return (
    <div
      className="pro-advisor-speech-box card-aura p-5 rounded-2xl text-white border shadow-lg flex flex-col gap-4 animate-in fade-in duration-300"
      style={{
        background: "linear-gradient(135deg, #090d16 0%, #0f172a 45%, #1e1b4b 100%)",
        color: "#ffffff",
        borderColor: "rgba(59, 130, 246, 0.35)",
      }}
    >
      {/* Top Header with Avatar & Performance Tag */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          {/* Advisor Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 p-0.5 shadow-md">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white">
                <Sparkles size={22} className="text-blue-400" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" title="Cố vấn trực tuyến" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">
                NHẬN XÉT CỐ VẤN TRƯỞNG · QUÝ {lastRecord.quarter}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-mono">
                {lastRecord.stage}
              </span>
            </div>
            <h5 className="text-sm font-bold text-white tracking-tight">
              Cố Vấn Đầu Tư Giá Trị (Graham &amp; Buffett Advisor)
            </h5>
          </div>
        </div>

        {/* Quarter Performance Chip */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-400">Hiệu suất Quý {lastRecord.quarter}:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 border shadow-2xs ${
              isPositive
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : "bg-rose-500/20 text-rose-300 border-rose-500/30"
            }`}
          >
            {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>{isPositive ? `+${lastRecord.pnlQuarterPercent}%` : `${lastRecord.pnlQuarterPercent}%`}</span>
          </span>
        </div>
      </div>

      {/* Speech Content Bubble */}
      <div className="relative pl-6 pr-2 py-1 text-xs text-slate-200 leading-relaxed">
        <Quote size={18} className="text-blue-400 absolute left-0 top-0.5 opacity-50" />
        <p className="italic font-normal">{lastRecord.advisorNote}</p>
      </div>

      {/* 4 Asset Returns Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-[11px]">
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center flex flex-col justify-between">
          <span className="text-slate-400 text-[10px]">EQ_GROWTH</span>
          <span className={`font-mono font-bold text-xs mt-0.5 ${lastRecord.returns.growth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {(lastRecord.returns.growth * 100).toFixed(1)}%
          </span>
        </div>
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center flex flex-col justify-between">
          <span className="text-slate-400 text-[10px]">EQ_VALUE</span>
          <span className={`font-mono font-bold text-xs mt-0.5 ${lastRecord.returns.value >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {(lastRecord.returns.value * 100).toFixed(1)}%
          </span>
        </div>
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center flex flex-col justify-between">
          <span className="text-slate-400 text-[10px]">BOND</span>
          <span className={`font-mono font-bold text-xs mt-0.5 ${lastRecord.returns.bond >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {(lastRecord.returns.bond * 100).toFixed(1)}%
          </span>
        </div>
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center flex flex-col justify-between">
          <span className="text-slate-400 text-[10px]">CASH</span>
          <span className={`font-mono font-bold text-xs mt-0.5 ${lastRecord.returns.cash >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {(lastRecord.returns.cash * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};
