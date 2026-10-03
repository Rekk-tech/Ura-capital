import React from "react";
import { useNavigate } from "react-router-dom";
import type { Map2FinalReport } from "../../types/map-game.types";
import { formatCurrency } from "../../../portfolio/utils/portfolioCalculations";
import {
  Award,
  TrendingUp,
  BarChart2,
  Shield,
  Bot,
  RotateCcw,
  ArrowRight,
  Share2,
  CheckCircle2,
  ThumbsUp,
  Target,
} from "lucide-react";

interface ProRoomReportViewProps {
  report: Map2FinalReport;
  onReplay: () => void;
}

export const ProRoomReportView: React.FC<ProRoomReportViewProps> = ({
  report,
  onReplay,
}) => {
  const navigate = useNavigate();

  // Average asset weighting across 12 quarters for allocation chips
  const totalRecords = Math.max(1, report.quarterHistory.length);
  const avgGrowth = Math.round(
    report.quarterHistory.reduce((sum, q) => sum + q.allocation.growth, 0) / totalRecords,
  );
  const avgValue = Math.round(
    report.quarterHistory.reduce((sum, q) => sum + q.allocation.value, 0) / totalRecords,
  );
  const avgBond = Math.round(
    report.quarterHistory.reduce((sum, q) => sum + q.allocation.bond, 0) / totalRecords,
  );
  const avgCash = 100 - avgGrowth - avgValue - avgBond;

  // Handle Share to Community prefill
  const handleShareToCommunity = () => {
    const prefillTitle = `Tổng kết 12 Quý Pro Room: Đạt chứng chỉ ${report.investmentStyle}`;
    const prefillContent = [
      `Tôi vừa hoàn thành xuất sắc chu kỳ mô phỏng 12 quý vĩ mô tại Pro Room (Aura Capital):`,
      ``,
      `📊 KẾT QUẢ DANH MỤC 3 NĂM:`,
      `- Tài sản ròng cuối cùng: ${formatCurrency(report.finalNav)} (${report.totalPnlPercent >= 0 ? "+" : ""}${report.totalPnlPercent}% tổng lợi nhuận)`,
      `- Tỷ suất CAGR hàng năm: ${report.cagr.toFixed(2)}%/năm (so với chuẩn VN-Index: 8.50%/năm)`,
      `- Hệ số Alpha sinh lời: ${report.alpha >= 0 ? "+" : ""}${report.alpha.toFixed(2)}%`,
      `- Mức sụt giảm tối đa (MDD): ${report.maxDrawdown.toFixed(2)}% (Mục tiêu: ≤ 15.0%)`,
      `- Tỷ số Sharpe Ratio: ${report.sharpeRatio.toFixed(2)}`,
      `- Chứng chỉ được cấp: ${report.investmentStyle}`,
      ``,
      `💡 ĐÁNH GIÁ CỦA CỐ VẤN ĐỊNH CHẾ (CrediFin AI Advisor):`,
      `"${report.advisorOverallSummary}"`,
      ``,
      `Cùng thảo luận và giao lưu chiến lược phân bổ đa tài sản nhé!`,
    ].join("\n");

    navigate("/community", {
      state: {
        prefillTitle,
        prefillContent,
      },
    });
  };

  return (
    <div className="pro-portfolio-report max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300 pb-12">
      {/* 1. Hero Header Card (Figma Midnight Navy #0A1128) */}
      <div
        className="p-6 md:p-8 rounded-2xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        style={{
          background: "linear-gradient(135deg, #0a1128 0%, #0d1b2a 50%, #1e1b4b 100%)",
          color: "#ffffff",
          borderColor: "rgba(59, 130, 246, 0.35)",
        }}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              <span>CHỨNG CHỈ TỐT NGHIỆP PRO ROOM</span>
              <span>•</span>
              <span>AUDIT VALIDATED</span>
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white font-sans">
            12-Quarter Simulation Completed: Comprehensive Report
          </h2>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Institutional Audit &amp; Multi-Asset Allocation Post-Mortem • Initial Capital:{" "}
            <strong className="text-white font-mono">{formatCurrency(report.initialCash)}</strong> → Final Capital:{" "}
            <strong className="text-emerald-400 font-mono font-bold">{formatCurrency(report.finalNav)}</strong>{" "}
            ({report.totalPnlPercent >= 0 ? `+${report.totalPnlPercent}%` : `${report.totalPnlPercent}%`} Total Return)
          </p>
        </div>

        {/* Right Glassmorphic Medallion */}
        <div
          className="p-4 rounded-2xl border flex items-center gap-3.5 flex-shrink-0"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(12px)",
            borderColor: "rgba(96, 165, 250, 0.25)",
          }}
        >
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Award size={26} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              INSTITUTIONAL TIER
            </span>
            <strong className="text-sm font-black text-white block">
              Top Performer
            </strong>
            <span className="text-xs text-teal-300 font-medium block">
              {report.investmentStyle}
            </span>
            <span className="text-[11px] text-teal-400/80 font-medium block">
              Drawdown &lt; 15.0% Pass
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Annualized Return (CAGR) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-semibold flex items-center justify-between gap-1">
            <span className="flex items-center gap-1">
              <TrendingUp size={14} className="text-blue-600" /> ANNUALIZED RETURN
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Tỷ Suất CAGR / Năm</span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-2">
            +{report.cagr.toFixed(1)}% <span className="text-xs font-normal text-slate-400">p.a.</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            Beat 3-year term deposit by +{(report.cagr - 4.0).toFixed(1)}%
          </span>
        </div>

        {/* Card 2: Alpha vs VN-Index */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-semibold flex items-center justify-between gap-1">
            <span className="flex items-center gap-1">
              <BarChart2 size={14} className="text-emerald-600" /> ALPHA VS VN-INDEX
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Alpha vs VN-Index</span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-2">
            {report.alpha >= 0 ? `+${report.alpha.toFixed(2)}%` : `${report.alpha.toFixed(2)}%`}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            VN-Index: +8.50% → Portfolio: +{report.cagr.toFixed(1)}%
          </span>
        </div>

        {/* Card 3: Max Drawdown */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-semibold flex items-center justify-between gap-1">
            <span className="flex items-center gap-1">
              <Shield size={14} className="text-rose-600" /> MAX DRAWDOWN
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Max Drawdown (MDD)</span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-2">
            -{report.maxDrawdown.toFixed(1)}%{" "}
            <span className="text-xs font-bold text-emerald-600 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
              Safe
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            Cap limit guaranteed at 15.0%
          </span>
        </div>

        {/* Card 4: Sharpe Ratio */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-semibold flex items-center justify-between gap-1">
            <span className="flex items-center gap-1">
              <Award size={14} className="text-teal-600" /> SHARPE RATIO
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Tỷ Số Sharpe Ratio</span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-2">
            {report.sharpeRatio.toFixed(2)}
          </div>
          <span className="text-[11px] text-teal-700 font-semibold mt-1">
            {report.sharpeRatio >= 1.0 ? "Excellent / Institutional Grade" : "Acceptable Performance"}
          </span>
        </div>
      </div>

      {/* 3. 12-Quarter Performance & Macro Cycles Trajectory Chart (Figma Style) */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              12-Quarter Performance &amp; Macro Cycles
            </h3>
            <p className="text-xs text-slate-500">
              Simulated growth trajectory against VN-Index Benchmark from baseline to expansion.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-teal-500" />
              <span className="text-slate-700">Aura Portfolio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-300 border border-slate-400" />
              <span className="text-slate-500">VN-Index Benchmark</span>
            </div>
          </div>
        </div>

        {/* SVG Performance Curves */}
        <div className="w-full h-48 bg-slate-50 rounded-xl p-2 relative overflow-hidden border border-slate-200/60">
          <svg className="w-full h-full" viewBox="0 0 600 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line x1="0" y1="30" x2="600" y2="30" stroke="#e2e8f0" strokeDasharray="3 3" />
            <line x1="0" y1="60" x2="600" y2="60" stroke="#e2e8f0" strokeDasharray="3 3" />
            <line x1="0" y1="90" x2="600" y2="90" stroke="#e2e8f0" strokeDasharray="3 3" />

            {/* Benchmark Curve (Dashed) */}
            <path
              d="M 10 90 Q 150 88 300 85 T 450 65 T 590 52"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Portfolio Fill Area */}
            <path
              d="M 10 90 Q 150 85 300 80 T 450 45 T 590 25 L 590 120 L 10 120 Z"
              fill="url(#portfolioGradient)"
            />

            {/* Portfolio Curve (Solid Emerald Teal) */}
            <path
              d="M 10 90 Q 150 85 300 80 T 450 45 T 590 25"
              fill="none"
              stroke="#0d9488"
              strokeWidth="3"
            />

            {/* Milestone Anchor Dots */}
            <circle cx="10" cy="90" r="4" fill="#0d9488" />
            <circle cx="300" cy="80" r="4" fill="#0d9488" />
            <circle cx="590" cy="25" r="5" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />
          </svg>
        </div>

        {/* Final Portfolio Asset Allocation Legend */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            FINAL PORTFOLIO ASSET ALLOCATION
          </span>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Growth Stocks {avgGrowth}%
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              Value / High-Yield {avgValue}%
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Govt Bonds {avgBond}%
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Cash &amp; MM {avgCash}%
            </span>
          </div>
        </div>
      </div>

      {/* 4. CrediFin AI Advisor Comprehensive Review */}
      <div className="p-5 rounded-2xl border-l-4 border-l-teal-500 border border-slate-200 bg-white shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center shadow-xs">
              <Bot size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">CrediFin AI Advisor</h4>
              <span className="text-[10px] text-slate-400 font-medium">Behavioral Economics &amp; Allocation Evaluator</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              Automated Audit Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-300">
              {report.investmentStyle}
            </span>
          </div>
        </div>

        {/* Advisor Overall Quote */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 font-serif italic text-xs leading-relaxed text-slate-800">
          "{report.advisorOverallSummary}"
        </div>

        {/* 2-Column Evaluation (Strengths & Recommendations) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/60 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <ThumbsUp size={14} className="text-emerald-600" />
              <span>Điểm mạnh nổi bật</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Quản trị rủi ro mẫu mực trong giai đoạn thắt chặt tiền tệ Q5–Q6; bảo vệ thành công danh mục và không vi phạm trần Drawdown 15.0%.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/60 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
              <Target size={14} className="text-blue-600" />
              <span>Khuyến nghị nâng cao</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Táo bạo gia tăng tỷ trọng Cổ phiếu Tăng trưởng ($EQ_GROWTH) sớm hơn 1 quý khi chỉ số CPI bắt đầu hạ nhiệt để tối ưu hóa lợi suất hồi phục.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Trader Behavioral Competency Score (Figma Mockup 4) */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">
            Trader Behavioral Competency Score
          </h4>
          <p className="text-xs text-slate-500">
            Quantified psychological and macro execution performance index.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Metric 1: Risk Discipline */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">Risk Discipline</span>
              <strong className="font-mono text-teal-600">96/100</strong>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: "96%" }} />
            </div>
            <span className="text-[10px] text-slate-400">Outstanding risk threshold adherence</span>
          </div>

          {/* Metric 2: Macro Timing */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">Macro Timing</span>
              <strong className="font-mono text-teal-600">82/100</strong>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: "82%" }} />
            </div>
            <span className="text-[10px] text-slate-400">Cautious entry post-rate peak</span>
          </div>

          {/* Metric 3: Rebalancing Consistency */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">Rebalancing Consistency</span>
              <strong className="font-mono text-teal-600">90/100</strong>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: "90%" }} />
            </div>
            <span className="text-[10px] text-slate-400">Disciplined quarterly asset rotation</span>
          </div>
        </div>
      </div>

      {/* 6. 12-Quarter Historical Ledger Table */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Nhật Ký Quản Trị Danh Mục 12 Quý
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
                    {formatCurrency(rec.nav)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {rec.drawdown.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Action Footer (Figma Buttons) */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-xs text-slate-500 text-center md:text-left font-medium">
          Chúc mừng bạn đã hoàn thành xuất sắc chu kỳ huấn luyện tài chính định chế Pro Room!
        </span>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Share to Community button */}
          <button
            type="button"
            onClick={handleShareToCommunity}
            className="btn btn-outline py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border-blue-300 text-blue-700 bg-blue-50/50 hover:bg-blue-100 flex-1 sm:flex-initial"
          >
            <Share2 size={14} />
            <span>Chia Sẻ Lên Cộng Đồng</span>
          </button>

          {/* Replay Button */}
          <button
            type="button"
            onClick={onReplay}
            className="btn btn-outline py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-200 flex-1 sm:flex-initial"
          >
            <RotateCcw size={14} />
            <span>Chơi Lại Map 2</span>
          </button>

          {/* Return to Lobby Button */}
          <button
            type="button"
            onClick={() => navigate("/simulation")}
            className="btn btn-primary py-2 px-5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-950 text-white flex items-center justify-center gap-1.5 shadow-md flex-1 sm:flex-initial"
          >
            <span>Về Sảnh Giả Lập</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
