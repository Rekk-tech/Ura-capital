import React from "react";
import type { Map2FinalReport } from "../../types/map-game.types";
import { Award, RotateCcw, ArrowRight, BarChart2, Shield, TrendingUp, Sparkles, Share2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../../portfolio/utils/portfolioCalculations";

interface ProRoomReportViewProps {
  report: Map2FinalReport;
  onReplay: () => void;
}

export const ProRoomReportView: React.FC<ProRoomReportViewProps> = ({
  report,
  onReplay,
}) => {
  const navigate = useNavigate();

  const handleShareToCommunity = () => {
    const prefillTitle = `Tổng kết 12 Quý Pro Room: Đạt chứng chỉ ${report.investmentStyle}`;
    const prefillContent = `Tôi vừa hoàn thành xuất sắc chu kỳ mô phỏng 12 quý vĩ mô tại Pro Room (Aura Capital):

📊 KẾT QUẢ DANH MỤC 3 NĂM:
- Tài sản ròng cuối cùng: ${formatCurrency(report.finalNav)}
- Tổng lợi nhuận chu kỳ: ${report.totalPnlPercent >= 0 ? `+${report.totalPnlPercent}%` : `${report.totalPnlPercent}%`}
- Tỷ suất sinh lời bình quân (CAGR): ${(report.cagr * 100).toFixed(2)}%/năm
- Alpha vượt trội so với VN-Index: ${report.alpha >= 0 ? `+${(report.alpha * 100).toFixed(2)}%` : `${(report.alpha * 100).toFixed(2)}%`}
- Mức sụt giảm tối đa (Max Drawdown): ${(report.maxDrawdown * 100).toFixed(2)}% (Mục tiêu ≤ 15%)
- Tỷ số Sharpe Ratio: ${report.sharpeRatio.toFixed(2)}
- Điểm kỷ luật (Credit Score): ${report.creditScore} điểm

🏆 PHONG CÁCH ĐẦU TƯ ĐƯỢC CÔNG NHẬN:
${report.investmentStyle} — ${report.styleDescription}

💡 LỜI KHUYÊN CỐ VẤN GRAHAM & BUFFETT:
"${report.advisorOverallSummary}"

#AuraCapital #ProRoom #MacroInvestment #ValueInvesting #AssetAllocation`;

    navigate("/community", {
      state: {
        prefillTitle,
        prefillContent,
      },
    });
  };

  return (
    <div className="pro-portfolio-report max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Certificate / Hero Header */}
      <div
        className="p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
        style={{
          background: "linear-gradient(135deg, #090d16 0%, #0f172a 45%, #1e1b4b 100%)",
          color: "#ffffff",
          borderColor: "rgba(59, 130, 246, 0.4)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="p-4 rounded-2xl flex-shrink-0 shadow-inner"
            style={{
              background: "rgba(59, 130, 246, 0.2)",
              color: "#60a5fa",
              border: "1px solid rgba(96, 165, 250, 0.3)",
            }}
          >
            <Award size={40} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                CHỨNG CHỈ TỐT NGHIỆP PRO ROOM
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 size={12} /> Hoàn Thành 12 Quý
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Báo Cáo Tổng Kết Danh Mục 3 Năm
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Phân loại phong cách đầu tư:{" "}
              <strong className="text-amber-300 underline decoration-amber-400 font-bold">
                {report.investmentStyle}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
          <span className="text-xs text-slate-300">Tài sản ròng chung cuộc</span>
          <div className="text-3xl font-black font-mono text-white">
            {formatCurrency(report.finalNav)}
          </div>
          <span className={`text-xs font-bold mt-1 ${report.totalPnlPercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {report.totalPnlPercent >= 0 ? `+${report.totalPnlPercent}%` : `${report.totalPnlPercent}%`} tổng lợi nhuận
          </span>
        </div>
      </div>

      {/* 4 Quantitative Portfolio Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* CAGR */}
        <div className="card-aura p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <TrendingUp size={14} className="text-blue-600" /> Tỷ Suất CAGR / Năm
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-2">
            {report.cagr.toFixed(2)}%
          </div>
          <span className="text-[11px] text-slate-400">VN-Index: 8.50%/năm</span>
        </div>

        {/* Alpha vs VN-Index */}
        <div className="card-aura p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <BarChart2 size={14} className="text-emerald-600" /> Alpha vs VN-Index
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-2">
            {report.alpha >= 0 ? `+${report.alpha.toFixed(2)}%` : `${report.alpha.toFixed(2)}%`}
          </div>
          <span className="text-[11px] text-slate-400">So với chuẩn VN-Index (+8.50%/năm)</span>
        </div>

        {/* Max Drawdown */}
        <div className="card-aura p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <Shield size={14} className="text-rose-600" /> Max Drawdown (MDD)
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-2">
            {report.maxDrawdown.toFixed(2)}%
          </div>
          <span className={`text-[11px] ${report.maxDrawdown <= 15 ? "text-emerald-600 font-semibold" : "text-amber-600"}`}>
            {report.maxDrawdown <= 15 ? "Đạt mục tiêu (≤ 15%)" : "Vượt ngưỡng mục tiêu"}
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
          <span className="text-[11px] text-slate-400">Credit Score: {report.creditScore} điểm</span>
        </div>
      </div>

      {/* Style Profile & Overall Summary */}
      <div className="card-aura p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            HỒ SƠ PHONG CÁCH ĐẦU TƯ
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

      {/* Action Footer */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-xs text-slate-500 text-center md:text-left">
          Chúc mừng bạn đã hoàn thành chu kỳ huấn luyện tài chính định chế Pro Room!
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
            className="btn btn-primary py-2 px-5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 shadow-md flex-1 sm:flex-initial"
          >
            <span>Về Sảnh Giả Lập</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
