import React from "react";
import type { Map2QuarterHistoryRecord } from "../../types/map-game.types";
import { Bot, Lightbulb } from "lucide-react";

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
    <div className="pro-card" style={{ padding: "1.5rem" }}>
      {/* Header with Avatar & Online Dot */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "0.85rem",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Avatar box */}
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              backgroundColor: "#0f172a",
              color: "#2dd4bf",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Bot size={20} />
          </div>

          <div>
            <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>
              CrediFin AI Advisor
            </h4>
            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 500, display: "block", marginTop: "1px" }}>
              AI Strategic Co-Pilot • Level 2 Verified
            </span>
          </div>
        </div>

        {/* Online Indicator Green Dot */}
        <span
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "#10b981",
            boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)",
          }}
          title="CrediFin Active"
        />
      </div>

      {/* Quote Card (Ice Blue Tint) */}
      <div
        style={{
          padding: "1.15rem 1.25rem",
          borderRadius: "12px",
          backgroundColor: "#f0f7ff",
          border: "1px solid #e0f2fe",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <div style={{ color: "#0284c7", fontSize: "1.5rem", lineHeight: 1, fontWeight: 900, fontFamily: "serif" }}>
          “
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "0.85rem",
            color: "#0f172a",
            fontStyle: "italic",
            lineHeight: 1.6,
            fontFamily: "Georgia, serif",
          }}
        >
          {lastRecord?.advisorNote || coreQuote}
        </p>
        <span style={{ fontSize: "0.72rem", color: "#64748b", textAlign: "right", display: "block" }}>
          — CrediFin Core Directive
        </span>
      </div>

      {/* Actionable Strategy Tip */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", fontSize: "0.8rem", lineHeight: 1.6, color: "#334155" }}>
        <span style={{ color: "#0d9488", flexShrink: 0, marginTop: "2px" }}>
          <Lightbulb size={16} />
        </span>
        <div>
          <strong style={{ color: "#0f172a", fontWeight: 800 }}>
            Gợi ý chiến lược Q{currentQuarter}:{" "}
          </strong>
          <span>{strategySuggestion}</span>
        </div>
      </div>
    </div>
  );
};

