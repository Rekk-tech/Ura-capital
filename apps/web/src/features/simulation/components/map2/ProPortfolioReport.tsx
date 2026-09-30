import React from "react";
import type { Map2FinalReport } from "../../types/map-game.types";
import { Award, RotateCcw, ArrowRight, BarChart2, Shield, TrendingUp, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProPortfolioReportProps {
  report: Map2FinalReport;
  onReplay: () => void;
}

export const ProPortfolioReport: React.FC<ProPortfolioReportProps> = ({
  report,
  onReplay,
}) => {
  const navigate = useNavigate();

  return (
    <div className="pro-portfolio-report max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Certificate / Hero Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white border border-blue-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-400/20 flex-shrink-0 shadow-inner">
            <Award size={40} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500 text-slate-950">
                CHỨNG CHỈ TỐT NGHIỆP PRO ROOM
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                HOÀN THÀNH 12 QUÝ
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Báo Cáo Tổng Kết Danh Mục 3 Năm
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Phân loại phong cách đầu tư: <strong className="text-white">{report.investmentStyle}</strong>
            </p>
          </div>
        </div>

        <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
          <span className="text-xs text-slate-400">Tài sản ròng chung cuộc</span>
          <div className="text-3xl font-black font-mono">
            {report.finalNav.toLocaleString("vi-VN")} đ
          </div>
          <span className={`text-xs font-bold mt-1 ${report.totalPnlPercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {report.totalPnlPercent >= 0 ? `+${report.totalPnlPercent}%` : `${report.totalPnlPercent}%`} tổng lợi nhuận
          </span>
        </div>
      </div>

      {/* 4 Quantitative Portfolio Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* CAGR vs Benchmark */}
        <div className="card-aura p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <TrendingUp size={14} className="text-blue-600" /> Tỷ Suất CAGR / Năm
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-2">
            {(report.cagr * 100).toFixed(2)}%
          </div>
          <span className="text-[11px] text-slate-400">Benchmark: 8.50%/năm</span>
        </div>

        {/* Alpha */}
        <div className="card-aura p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <BarChart2 size={14} className="text-emerald-600" /> Alpha vs VN-Index
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-2">
            {report.alpha >= 0 ? `+${(report.alpha * 100).toFixed(2)}%` : `${(report.alpha * 100).toFixed(2)}%`}
          </div>
          <span className="text-[11px] text-slate-400">So với VN-Index (+8.50%/năm)</span>
        </div>

        {/* Max Drawdown */}
        <div className="card-aura p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <Shield size={14} className="text-rose-600" /> Max Drawdown (MDD)
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-2">
            {(report.maxDrawdown * 100).toFixed(2)}%
          </div>
          <span className={`text-[11px] ${report.maxDrawdown <= 0.15 ? "text-emerald-600 font-semibold" : "text-amber-600"}`}>
            {report.maxDrawdown <= 0.15 ? "Đạt mục tiêu (≤ 15%)" : "Vượt ngưỡng mục tiêu"}
          </span>
        </div>

        {/* Sharpe Ratio */}
        <div className="card-aura p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <Award size={14} className="text-indigo-600" /> Tỷ Số Sharpe Ratio
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-2">
            {report.sharpeRatio.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400">Credit Score: {report.creditScore}đ</span>
        </div>
      </div>

      {/* Style Profile & Overall Summary */}
      <div className="card-aura p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            HỒ SƠ ĐẦU TƯ
          </span>
          <h4 className="text-base font-bold text-slate-900 mt-0.5">
            {report.investmentStyle}
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            {report.styleDescription}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Sparkles size={14} className="text-blue-600" />
            <span>Đánh Giá Toàn Diện Của Cố Vấn Trưởng (Graham &amp; Buffett)</span>
          </div>
          <p className="text-xs text-slate-600 italic leading-relaxed">
            "{report.advisorOverallSummary}"
          </p>
        </div>
      </div>

      {/* 12-Quarter Historical Ledger Table */}
      <div className="card-aura p-5 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Nhật Ký Quản Trị 12 Quý
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Quý</th>
                <th className="py-2.5 px-3">Giai Đoạn</th>
                <th className="py-2.5 px-3">Lãi Suất</th>
                <th className="py-2.5 px-3">Phân Bổ (G/V/B/C)</th>
                <th className="py-2.5 px-3">Lợi Nhuận Quý</th>
                <th className="py-2.5 px-3">NAV</th>
                <th className="py-2.5 px-3">Drawdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {report.quarterHistory.map((rec) => (
                <tr key={rec.quarter} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-bold font-sans">Q{rec.quarter}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-600">{rec.stage}</td>
                  <td className="py-2.5 px-3">{rec.rate}%</td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-500 font-sans">
                    {rec.allocation.growth}/{rec.allocation.value}/{rec.allocation.bond}/{rec.allocation.cash}
                  </td>
                  <td className={`py-2.5 px-3 font-bold ${rec.pnlQuarterPercent >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {rec.pnlQuarterPercent >= 0 ? `+${rec.pnlQuarterPercent}%` : `${rec.pnlQuarterPercent}%`}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {rec.nav.toLocaleString("vi-VN")} đ
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {(rec.drawdown * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-xs text-slate-500">
          Chúc mừng bạn đã hoàn thành chu kỳ huấn luyện tài chính chuyên nghiệp Pro Room!
        </span>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={onReplay}
            className="btn btn-outline py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-200 flex-1 md:flex-initial"
          >
            <RotateCcw size={14} />
            <span>Chơi Lại Map 2</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/simulation")}
            className="btn btn-primary py-2 px-5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 shadow-md flex-1 md:flex-initial"
          >
            <span>Về Đấu Trường Giả Lập</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
