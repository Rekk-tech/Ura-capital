import React from "react";
import type { Map2QuarterHistoryRecord } from "../../types/map-game.types";
import { Sparkles, TrendingUp, TrendingDown, Quote } from "lucide-react";

interface ProAdvisorSpeechBoxProps {
  lastRecord: Map2QuarterHistoryRecord | null;
}

export const ProAdvisorSpeechBox: React.FC<ProAdvisorSpeechBoxProps> = ({
  lastRecord,
}) => {
  if (!lastRecord) {
    return (
      <div className="pro-advisor-speech-box p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white border border-blue-800 shadow-md flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center flex-shrink-0">
          <Sparkles size={24} className="text-blue-300" />
        </div>
        <div>
          <h5 className="text-sm font-bold text-blue-200">
            Cố Vấn Đầu Tư Giá Trị (AI Advisor)
          </h5>
          <p className="text-xs text-slate-300 mt-0.5">
            Phòng Pro Room đã sẵn sàng. Hãy cân nhắc các chỉ số vĩ mô (Lãi suất, Lạm phát, GDP) và chốt tỷ trọng phân bổ để nhận nhận xét khách quan theo triết lý Benjamin Graham &amp; Warren Buffett.
          </p>
        </div>
      </div>
    );
  }

  const isPositive = lastRecord.pnlQuarterPercent >= 0;

  return (
    <div className="pro-advisor-speech-box card-aura p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white border border-blue-800/50 shadow-lg flex flex-col gap-3 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/20">
            <Sparkles size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
              NHẬN XÉT CỐ VẤN TRƯỞNG · QUÝ {lastRecord.quarter}
            </span>
            <h5 className="text-sm font-bold text-white">
              Triết Lý Giá Trị Graham &amp; Buffett
            </h5>
          </div>
        </div>

        {/* Quarter Performance Chip */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Hiệu suất Quý:</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono flex items-center gap-1 ${
              isPositive
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
            }`}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{isPositive ? `+${lastRecord.pnlQuarterPercent}%` : `${lastRecord.pnlQuarterPercent}%`}</span>
          </span>
        </div>
      </div>

      {/* Speech Content */}
      <div className="relative pl-6 pr-2 py-1 text-xs text-slate-200 leading-relaxed font-normal">
        <Quote size={16} className="text-blue-400 absolute left-0 top-1 opacity-50" />
        <p className="italic">{lastRecord.advisorNote}</p>
      </div>

      {/* Asset Returns Breakdown for this Quarter */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10 text-[11px]">
        <div className="p-1.5 rounded bg-white/5 border border-white/10 text-center">
          <span className="text-slate-400 block text-[10px]">Growth</span>
          <span className={`font-mono font-bold ${lastRecord.returns.growth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {(lastRecord.returns.growth * 100).toFixed(1)}%
          </span>
        </div>
        <div className="p-1.5 rounded bg-white/5 border border-white/10 text-center">
          <span className="text-slate-400 block text-[10px]">Value</span>
          <span className={`font-mono font-bold ${lastRecord.returns.value >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {(lastRecord.returns.value * 100).toFixed(1)}%
          </span>
        </div>
        <div className="p-1.5 rounded bg-white/5 border border-white/10 text-center">
          <span className="text-slate-400 block text-[10px]">Bond</span>
          <span className={`font-mono font-bold ${lastRecord.returns.bond >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {(lastRecord.returns.bond * 100).toFixed(1)}%
          </span>
        </div>
        <div className="p-1.5 rounded bg-white/5 border border-white/10 text-center">
          <span className="text-slate-400 block text-[10px]">Cash</span>
          <span className={`font-mono font-bold ${lastRecord.returns.cash >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {(lastRecord.returns.cash * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};
