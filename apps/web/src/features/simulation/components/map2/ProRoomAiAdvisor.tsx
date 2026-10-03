import React from "react";
import type { Map2QuarterHistoryRecord } from "../../types/map-game.types";
import { Bot, Lightbulb, Quote } from "lucide-react";

interface ProRoomAiAdvisorProps {
  lastRecord: Map2QuarterHistoryRecord | null;
  currentQuarter?: number;
  stageKey?: string;
}

export const ProRoomAiAdvisor: React.FC<ProRoomAiAdvisorProps> = ({
  lastRecord,
  currentQuarter = 1,
  stageKey = "BOOM",
}) => {
  const isBoom = stageKey === "BOOM";
  const isStagflation = stageKey === "STAGFLATION";
  const isRecession = stageKey === "RECESSION";

  // Contextual Core Directive Quotes matching Figma design
  const coreQuote = isBoom
    ? "Ở Map này, tốc độ không quan trọng bằng sự kiên nhẫn và logic phân tích."
    : isStagflation
    ? "Lạm phát chạm đỉnh và lãi suất 8.5% đang bóp nghẹt nhóm cổ phiếu tăng trưởng. Khuyến nghị gia tăng tỷ trọng tài sản phòng thủ và tiền mặt."
    : isRecession
    ? "Thị trường tạo đáy trong bi quan tột độ. Hãy kiên định giải ngân từng phần vào các doanh nghiệp giá trị có bảng cân đối kế toán lành mạnh."
    : "Chính sách tiền tệ nới lỏng đang mở ra chu kỳ phục hồi mới. Tái cơ cấu danh mục để đón đầu làn sóng tăng trưởng.";

  // Actionable strategic recommendation matching Figma
  const strategySuggestion = isBoom
    ? "Cân bằng 60/40 giữa Cổ phiếu (Growth & Value) và Tài sản phòng thủ (Bonds & Cash) để tối ưu hóa Sharpe Ratio và giữ vững kỷ luật vốn."
    : isStagflation
    ? "Hạ tỷ trọng Growth ($EQ_GROWTH) xuống dưới 20%, nâng tỷ trọng Trái phiếu ($BOND) và Tiền gửi ($CASH) lên trên 55% để bảo toàn vốn."
    : isRecession
    ? "Nâng tỷ trọng Value ($EQ_VALUE) lên 35–45% để tận dụng mức định giá P/B < 1, duy trì 20% tiền mặt dự trữ."
    : "Gia tăng tỷ trọng Growth ($EQ_GROWTH) lên 40–50% khi lãi suất duy trì ở mức thấp và chỉ số CPI ổn định.";

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-3">
      {/* Header with Avatar & Level Badge */}
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          {/* Avatar with beacon */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Bot size={20} className="text-teal-400" />
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"
              title="CrediFin Online"
            />
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>CrediFin AI Advisor</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </h4>
            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
              <span>Cố Vấn Đầu Tư Giá Trị (AI Advisor)</span>
              <span>•</span>
              <span>Level 2 Verified</span>
            </span>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
          Q{currentQuarter} Directive
        </span>
      </div>

      {/* Core Directive Quote Bubble */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 relative flex flex-col gap-1.5">
        <div className="text-slate-400 mb-0.5">
          <Quote size={16} className="rotate-180 text-blue-500" />
        </div>
        <p className="text-xs text-slate-800 italic leading-relaxed font-serif">
          "{lastRecord?.advisorNote || coreQuote}"
        </p>
        <span className="text-[10px] text-slate-400 font-sans font-semibold text-right block">
          — CrediFin Core Directive
        </span>
      </div>

      {/* Strategic Recommendation */}
      <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 flex items-start gap-2.5">
        <Lightbulb size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-slate-900 font-bold block mb-0.5">
            Gợi ý chiến lược Q{currentQuarter}:
          </strong>
          <span>{strategySuggestion}</span>
        </div>
      </div>
    </div>
  );
};
