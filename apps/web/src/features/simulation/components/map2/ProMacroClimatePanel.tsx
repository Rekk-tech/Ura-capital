import React from "react";
import { Globe, TrendingUp, TrendingDown, Minus, ArrowUpRight, Lightbulb } from "lucide-react";

interface ProMacroClimatePanelProps {
  currentQuarter: number;
  stageKey: string;
  interestRate: number;
  inflation: number;
  gdpGrowth: number;
  onOpenMacroExplainer: () => void;
}

export const ProMacroClimatePanel: React.FC<ProMacroClimatePanelProps> = ({
  currentQuarter,
  stageKey,
  interestRate,
  inflation,
  gdpGrowth,
  onOpenMacroExplainer,
}) => {
  const isBoom = stageKey === "BOOM";
  const isStagflation = stageKey === "STAGFLATION";
  const isRecession = stageKey === "RECESSION";

  // Contextual trends and research commentary based on macro regime
  const rateTrend = isBoom
    ? { trend: "— Stable", note: "Chính Sách Tiền Tệ Trung Tính", badge: "bg-slate-100 text-slate-700", deltaIcon: Minus }
    : isStagflation
    ? { trend: "+350 bps hike", note: "Siết Chặt Tiền Tệ Quyết Liệt", badge: "bg-rose-50 text-rose-700 border border-rose-200", deltaIcon: TrendingUp }
    : isRecession
    ? { trend: "-150 bps cut", note: "Nới Lỏng Hỗ Trợ Thanh Khoản", badge: "bg-blue-50 text-blue-700 border border-blue-200", deltaIcon: TrendingDown }
    : { trend: "— Dừng Tăng", note: "Lãi Suất Đáy Chu Kỳ", badge: "bg-emerald-50 text-emerald-700 border border-emerald-200", deltaIcon: Minus };

  const cpiTrend = isBoom
    ? { trend: "-0.2% MoM", note: "Dưới Ngưỡng Kiểm Soát 4.0%", badge: "bg-emerald-50 text-emerald-700" }
    : isStagflation
    ? { trend: "+6.0% YoY", note: "Vượt Trần Mục Tiêu 4.5%", badge: "bg-rose-50 text-rose-700 border border-rose-200" }
    : isRecession
    ? { trend: "-2.0% YoY", note: "Hạ Nhiệt Áp Lực Lạm Phát", badge: "bg-slate-100 text-slate-700" }
    : { trend: "+0.5% MoM", note: "Lạm Phát Cân Bằng Hồi Phục", badge: "bg-emerald-50 text-emerald-700" };

  const gdpTrend = isBoom
    ? { trend: "+0.4% YoY", note: "Sản Xuất Công Nghiệp Bùng Nổ", badge: "bg-emerald-50 text-emerald-700" }
    : isStagflation
    ? { trend: "Giảm tốc YoY", note: "Đứt Gãy Chuỗi Cung Ứng", badge: "bg-amber-50 text-amber-700 border border-amber-200" }
    : isRecession
    ? { trend: "Chạm Đáy Chu Kỳ", note: "Tăng Trưởng Thu Hẹp", badge: "bg-rose-50 text-rose-700 border border-rose-200" }
    : { trend: "+1.2% QoQ", note: "Kinh Tế Tái Thiết Mạnh Mẽ", badge: "bg-blue-50 text-blue-700 border border-blue-200" };

  const researchNote = isBoom
    ? "Môi trường vĩ mô ổn định với lạm phát kiềm chế và tăng trưởng GDP cao tạo điều kiện thuận lợi cho nhóm Cổ phiếu Giá trị và Tăng trưởng bứt phá. Lãi suất điều hành 5.0% hỗ trợ dòng tiền rẻ luân chuyển vào thị trường tài sản."
    : isStagflation
    ? "Áp lực lạm phát và chu kỳ thắt chặt tiền tệ mạnh đẩy mặt bằng lãi suất lên 8.5%. Dòng tiền suy giảm trên toàn thị trường, nhóm cổ phiếu beta cao chịu áp lực định giá lại gay gắt. Cần nâng tỷ trọng tài sản phòng thủ."
    : isRecession
    ? "Nền kinh tế bước vào vùng trũng suy thoái. Lãi suất bắt đầu hạ nhiệt và định giá cổ phiếu cơ bản rơi vào vùng chiết khấu sâu (P/B < 1). Đây là thời điểm vàng để tích lũy tài sản giá trị theo kỷ luật biên an toàn."
    : "Chính sách tiền tệ nới lỏng phát huy tác dụng kích thích tăng trưởng kinh tế. Thanh khoản dồi dào trở lại, mở đường cho chu kỳ tăng trưởng mới của thị trường chứng khoán.";

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-4">
      {/* Header with Title & Explainer Modal Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200">
              <Globe size={16} />
            </span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Macroeconomic Climate &amp; Systemic Drivers (Q{currentQuarter})
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              Macro Engine v3.4
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Core macroeconomic conditions influencing equity yield &amp; sovereign bond yields
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenMacroExplainer}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline transition-all"
        >
          <span>Xem sơ đồ truyền dẫn vĩ mô</span>
          <ArrowUpRight size={13} />
        </button>
      </div>

      {/* 3 Macro KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Interest Rate */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>LÃI SUẤT ĐIỀU HÀNH</span>
            <span className="font-mono text-[11px]">%</span>
          </div>
          <div className="text-3xl font-black font-mono text-slate-900 tracking-tight my-1">
            {interestRate.toFixed(1)}%
          </div>
          <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 mt-1">
            <span>Trend:</span>
            <strong className="text-slate-700">{rateTrend.trend}</strong>
          </div>
          <div className={`mt-2 px-2 py-0.5 rounded text-[10px] font-bold text-center ${rateTrend.badge}`}>
            {rateTrend.note}
          </div>
        </div>

        {/* Card 2: Inflation CPI */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>LẠM PHÁT (CPI)</span>
            <span className="font-mono text-[11px]">CPI</span>
          </div>
          <div className="text-3xl font-black font-mono text-slate-900 tracking-tight my-1">
            {inflation.toFixed(1)}%
          </div>
          <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 mt-1">
            <span>Trend:</span>
            <strong className="text-slate-700">{cpiTrend.trend}</strong>
          </div>
          <div className={`mt-2 px-2 py-0.5 rounded text-[10px] font-bold text-center ${cpiTrend.badge}`}>
            {cpiTrend.note}
          </div>
        </div>

        {/* Card 3: GDP Growth */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>TĂNG TRƯỞNG GDP</span>
            <span className="font-mono text-[11px]">GDP</span>
          </div>
          <div className="text-3xl font-black font-mono text-slate-900 tracking-tight my-1">
            {gdpGrowth.toFixed(1)}%
          </div>
          <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 mt-1">
            <span>Trend:</span>
            <strong className="text-slate-700">{gdpTrend.trend}</strong>
          </div>
          <div className={`mt-2 px-2 py-0.5 rounded text-[10px] font-bold text-center ${gdpTrend.badge}`}>
            {gdpTrend.note}
          </div>
        </div>
      </div>

      {/* Aura Research Macro Callout Box */}
      <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/60 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 flex-shrink-0 mt-0.5">
          <Lightbulb size={16} />
        </div>
        <div className="text-xs leading-relaxed text-slate-700">
          <strong className="text-slate-900 font-bold block mb-0.5">
            Nhận Định Vĩ Mô Aura Research:
          </strong>
          <span>"{researchNote}"</span>
        </div>
      </div>
    </div>
  );
};
