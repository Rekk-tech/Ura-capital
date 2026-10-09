import React from "react";
import type { Map2Allocation } from "../../types/map-game.types";
import { formatCurrency } from "../../../portfolio/utils/portfolioCalculations";
import { RefreshCw, Lock, ArrowRight } from "lucide-react";

interface ProAllocationCockpitProps {
  currentQuarter: number;
  stageKey: string;
  allocation: Map2Allocation;
  currentNav: number;
  isCommitting: boolean;
  onAllocationChange: (newAllocation: Map2Allocation) => void;
  onCommit: () => void;
}

export const ProAllocationCockpit: React.FC<ProAllocationCockpitProps> = ({
  currentQuarter,
  stageKey,
  allocation,
  currentNav,
  isCommitting,
  onAllocationChange,
  onCommit,
}) => {
  const total = allocation.growth + allocation.value + allocation.bond + allocation.cash;
  const isValid = total === 100;

  const handleSliderChange = (key: keyof Map2Allocation, val: number) => {
    onAllocationChange({
      ...allocation,
      [key]: val,
    });
  };

  const handleAutoBalance = () => {
    // Stage-aware recommended balance
    if (stageKey === "BOOM") {
      onAllocationChange({ growth: 40, value: 30, bond: 15, cash: 15 });
    } else if (stageKey === "STAGFLATION") {
      onAllocationChange({ growth: 15, value: 25, bond: 30, cash: 30 });
    } else if (stageKey === "RECESSION") {
      onAllocationChange({ growth: 20, value: 40, bond: 25, cash: 15 });
    } else {
      onAllocationChange({ growth: 45, value: 25, bond: 20, cash: 10 });
    }
  };

  // Asset configurations matching Figma mockups
  const assetSpecs = [
    {
      key: "growth" as const,
      ticker: "EQ_GROWTH",
      name: "1. Growth Equity ($EQ_GROWTH)",
      desc: "VinAlpha, Tech Leaders, Clean Energy",
      badge: stageKey === "STAGFLATION" ? "-6.8% QoQ" : stageKey === "BOOM" ? "+4.2% QoQ" : null,
      badgeColor: stageKey === "STAGFLATION" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200",
      color: "#3b82f6",
      sliderAccent: "accent-blue-600",
      pct: allocation.growth,
      amount: Math.round((currentNav * allocation.growth) / 100),
    },
    {
      key: "value" as const,
      ticker: "EQ_VALUE",
      name: "2. Value Equity ($EQ_VALUE)",
      desc: "Ngân hàng, Tiêu dùng, BĐS Khu Công Nghiệp",
      badge: "Beta 0.7",
      badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
      color: "#06b6d4",
      sliderAccent: "accent-cyan-600",
      pct: allocation.value,
      amount: Math.round((currentNav * allocation.value) / 100),
    },
    {
      key: "bond" as const,
      ticker: "BOND",
      name: "3. Government Bonds ($BOND)",
      desc: "Trái phiếu chính phủ 5Y (Lợi suất cố định)",
      badge: stageKey === "STAGFLATION" ? "Yield 6.8%" : "Yield 7.5%",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      color: "#10b981",
      sliderAccent: "accent-emerald-600",
      pct: allocation.bond,
      amount: Math.round((currentNav * allocation.bond) / 100),
    },
    {
      key: "cash" as const,
      ticker: "CASH",
      name: "4. Cash & Reserves ($CASH)",
      desc: "Tiền gửi thanh khoản cao & Quản trị rủi ro",
      badge: "An toàn",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      color: "#f59e0b",
      sliderAccent: "accent-amber-500",
      pct: allocation.cash,
      amount: Math.round((currentNav * allocation.cash) / 100),
    },
  ];

  return (
    <div className="pro-card" style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          paddingBottom: "0.85rem",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
              Phân Bổ Danh Mục Quý {currentQuarter}
            </h3>
            <span
              style={{
                display: "inline-block",
                padding: "0.15rem 0.5rem",
                borderRadius: "9999px",
                fontSize: "0.68rem",
                fontWeight: 800,
                backgroundColor: isValid ? "#ccfbf1" : "#ffe4e6",
                color: isValid ? "#0f766e" : "#be123c",
              }}
            >
              {isValid ? "Hợp Lệ: 100%" : `Chưa Đủ: ${total}%`}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b" }}>
            Thiết lập tỷ trọng phân bổ vốn trước khi đóng chu kỳ quý
          </p>
        </div>

        <button
          type="button"
          onClick={handleAutoBalance}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            background: "none",
            border: "none",
            color: "#2563eb",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={12} />
          <span>Tự Động Cân Bằng 100%</span>
        </button>
      </div>

      {/* Segmented Distribution Progress Bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div
          style={{
            width: "100%",
            height: "8px",
            borderRadius: "9999px",
            backgroundColor: "#f1f5f9",
            overflow: "hidden",
            display: "flex",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ width: `${allocation.growth}%`, backgroundColor: "#0284c7", transition: "width 0.2s" }} />
          <div style={{ width: `${allocation.value}%`, backgroundColor: "#8b5cf6", transition: "width 0.2s" }} />
          <div style={{ width: `${allocation.bond}%`, backgroundColor: "#0d9488", transition: "width 0.2s" }} />
          <div style={{ width: `${allocation.cash}%`, backgroundColor: "#a5f3fc", transition: "width 0.2s" }} />
        </div>

        {/* Legend with Color Dots */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            fontSize: "0.72rem",
            color: "#64748b",
            fontWeight: 500,
            padding: "0 2px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#0284c7" }} />
            <span>Growth ({allocation.growth}%)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#8b5cf6" }} />
            <span>Value ({allocation.value}%)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#0d9488" }} />
            <span>Bonds ({allocation.bond}%)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#a5f3fc" }} />
            <span>Cash ({allocation.cash}%)</span>
          </div>
        </div>
      </div>

      {/* 4 Asset Allocation Sliders */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", boxSizing: "border-box" }}>
        {assetSpecs.map((item) => (
          <div
            key={item.key}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "12px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              boxSizing: "border-box",
              width: "100%",
              overflow: "hidden",
            }}
          >
            {/* Title and Percent */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                  <h4 style={{ margin: 0, fontSize: "0.82rem", fontWeight: 800, color: "#0f172a" }}>
                    {item.name}
                  </h4>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#64748b" }}>
                  {item.desc}
                </p>
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 900, fontFamily: "var(--font-mono)", color: "#0f172a" }}>
                  {item.pct}{" "}
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>%</span>
                </span>
              </div>
            </div>

            {/* Slider track container */}
            <div style={{ width: "100%", boxSizing: "border-box", padding: "2px 0" }}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={item.pct}
                onChange={(e) => handleSliderChange(item.key, Number(e.target.value))}
                className={`pro-slider-input pro-slider-${item.key}`}
                style={{
                  background: `linear-gradient(to right, ${item.color} 0%, ${item.color} ${item.pct}%, #e2e8f0 ${item.pct}%, #e2e8f0 100%)`,
                }}
                aria-label={item.name}
              />
            </div>

            {/* Amount display */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.72rem",
                color: "#64748b",
                paddingTop: "0.25rem",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <span>Số tiền phân bổ:</span>
              <strong style={{ color: "#0f172a", fontFamily: "var(--font-mono)", fontWeight: 800 }}>
                {formatCurrency(item.amount)}
              </strong>
            </div>
          </div>
        ))}
      </div>

      {/* Total Verification Bar */}
      <div
        style={{
          padding: "0.75rem 1rem",
          borderRadius: "10px",
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569" }}>
          Tổng tỷ lệ xác lập:
        </span>
        <strong
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.95rem",
            fontWeight: 900,
            color: isValid ? "#0f766e" : "#e11d48",
          }}
        >
          {total}% / 100%
        </strong>
      </div>

      {/* Primary Confirmation CTA Button */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <button
          type="button"
          disabled={!isValid || isCommitting}
          onClick={onCommit}
          style={{
            width: "100%",
            padding: "0.95rem 1.25rem",
            borderRadius: "12px",
            fontWeight: 900,
            fontSize: "0.85rem",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            border: "none",
            backgroundColor: isValid && !isCommitting ? "#0b192c" : "#e2e8f0",
            color: isValid && !isCommitting ? "#ffffff" : "#94a3b8",
            cursor: isValid && !isCommitting ? "pointer" : "not-allowed",
            boxShadow: isValid ? "0 4px 12px rgba(11, 25, 44, 0.2)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          {isCommitting ? (
            <span>Đang ghi nhận phân bổ...</span>
          ) : (
            <>
              <span>XÁC NHẬN &amp; CHỐT QUÝ {currentQuarter}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <p
          style={{
            margin: 0,
            fontSize: "0.72rem",
            color: "#94a3b8",
            textAlign: "center",
            lineHeight: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
          }}
        >
          <Lock size={12} style={{ flexShrink: 0 }} />
          <span>Quyết định sẽ chốt phân bổ cho 3 tháng tiếp theo. Không thể rút lệnh sau khi xác nhận chốt quý.</span>
        </p>
      </div>
    </div>
  );
};

