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
    <div className="pro-card" style={{ padding: "1.5rem" }}>
      {/* Header with Title & Explainer Modal Button */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "#eff6ff",
                color: "#2563eb",
              }}
            >
              <Globe size={18} />
            </span>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
              Macroeconomic Climate &amp; Systemic Drivers (Q{currentQuarter})
            </h3>
            <span
              style={{
                display: "inline-block",
                padding: "0.2rem 0.55rem",
                borderRadius: "9999px",
                fontSize: "0.65rem",
                fontWeight: 700,
                backgroundColor: "#f1f5f9",
                color: "#475569",
                border: "1px solid #e2e8f0",
              }}
            >
              Macro Engine v3.4
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
            Core macroeconomic conditions influencing equity yield &amp; sovereign bond yields
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenMacroExplainer}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            background: "none",
            border: "none",
            color: "#2563eb",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <span>Xem sơ đồ truyền dẫn vĩ mô</span>
          <ArrowUpRight size={14} />
        </button>
      </div>

      {/* 3 Macro KPI Cards */}
      <div className="pro-kpi-grid-3">
        {/* Card 1: Interest Rate */}
        <div
          style={{
            padding: "1rem 1.15rem",
            borderRadius: "12px",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              INTEREST RATE
            </span>
            <span
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "6px",
                backgroundColor: "#ccfbf1",
                color: "#0f766e",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 800,
              }}
            >
              %
            </span>
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 900, fontFamily: "var(--font-mono)", color: "#0f172a", margin: "0.25rem 0" }}>
            {interestRate.toFixed(1)}%
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "#64748b" }}>
            <span>Trend:</span>
            <strong style={{ color: "#0f766e" }}>{rateTrend.trend}</strong>
          </div>
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.3rem 0.6rem",
              borderRadius: "6px",
              fontSize: "0.72rem",
              fontWeight: 700,
              textAlign: "center",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              color: "#334155",
            }}
          >
            {rateTrend.note}
          </div>
        </div>

        {/* Card 2: Inflation CPI */}
        <div
          style={{
            padding: "1rem 1.15rem",
            borderRadius: "12px",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              INFLATION (CPI)
            </span>
            <span
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "6px",
                backgroundColor: "#dcfce7",
                color: "#16a34a",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: 800,
              }}
            >
              CPI
            </span>
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 900, fontFamily: "var(--font-mono)", color: "#0f172a", margin: "0.25rem 0" }}>
            {inflation.toFixed(1)}%
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "#64748b" }}>
            <span>Trend:</span>
            <strong style={{ color: "#0f766e" }}>{cpiTrend.trend}</strong>
          </div>
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.3rem 0.6rem",
              borderRadius: "6px",
              fontSize: "0.72rem",
              fontWeight: 700,
              textAlign: "center",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              color: "#334155",
            }}
          >
            {cpiTrend.note}
          </div>
        </div>

        {/* Card 3: GDP Growth */}
        <div
          style={{
            padding: "1rem 1.15rem",
            borderRadius: "12px",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              GDP GROWTH
            </span>
            <span
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "6px",
                backgroundColor: "#ccfbf1",
                color: "#0f766e",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
              }}
            >
              <TrendingUp size={13} />
            </span>
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 900, fontFamily: "var(--font-mono)", color: "#0f172a", margin: "0.25rem 0" }}>
            {gdpGrowth.toFixed(1)}%
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "#64748b" }}>
            <span>Trend:</span>
            <strong style={{ color: "#16a34a" }}>{gdpTrend.trend}</strong>
          </div>
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.3rem 0.6rem",
              borderRadius: "6px",
              fontSize: "0.72rem",
              fontWeight: 700,
              textAlign: "center",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              color: "#334155",
            }}
          >
            {gdpTrend.note}
          </div>
        </div>
      </div>

      {/* Aura Research Macro Callout Box */}
      <div
        style={{
          padding: "1rem 1.25rem",
          borderRadius: "12px",
          backgroundColor: "#f0f9ff",
          border: "1px solid #bae6fd",
          display: "flex",
          alignItems: "flex-start",
          gap: "0.75rem",
        }}
      >
        <div style={{ color: "#0284c7", flexShrink: 0, marginTop: "2px" }}>
          <Lightbulb size={18} />
        </div>
        <div style={{ fontSize: "0.8rem", lineHeight: 1.6, color: "#334155" }}>
          <strong style={{ color: "#0369a1", fontWeight: 800, display: "inline" }}>
            Nhận Định Vĩ Mô Aura Research:{" "}
          </strong>
          <span>"{researchNote}"</span>
        </div>
      </div>
    </div>
  );
};

