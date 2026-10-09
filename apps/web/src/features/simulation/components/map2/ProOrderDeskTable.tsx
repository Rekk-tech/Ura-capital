import React from "react";
import type { Map2Allocation } from "../../types/map-game.types";
import { formatCurrency } from "../../../portfolio/utils/portfolioCalculations";
import { FileText } from "lucide-react";

interface ProOrderDeskTableProps {
  currentQuarter: number;
  stageKey: string;
  allocation: Map2Allocation;
  currentNav: number;
}

export const ProOrderDeskTable: React.FC<ProOrderDeskTableProps> = ({
  currentQuarter,
  stageKey,
  allocation,
  currentNav,
}) => {
  const isBoom = stageKey === "BOOM";
  const isStagflation = stageKey === "STAGFLATION";
  const isRecession = stageKey === "RECESSION";

  const rows = [
    {
      ticker: "$EQ_GROWTH",
      name: "Cổ phiếu Tăng trưởng",
      color: "#3b82f6",
      pct: allocation.growth,
      amount: Math.round((currentNav * allocation.growth) / 100),
      orderType: isStagflation
        ? "Hạ tỷ trọng / Cắt giảm rủi ro"
        : isRecession
        ? "Gom tích lũy giá rẻ"
        : "Mua phân bổ kỳ hạn",
      riskSharpe: isStagflation
        ? "Sharpe 0.72 (Áp lực cao)"
        : isBoom
        ? "Sharpe 1.84 (Tích cực)"
        : "Beta 1.40 (Phục hồi)",
      riskColor: isStagflation ? "text-rose-600" : "text-emerald-600",
      status: isStagflation ? "Giảm vị thế" : "Sẵn sàng",
      statusBadge: isStagflation ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-100 text-slate-700 border-slate-200",
    },
    {
      ticker: "$EQ_VALUE",
      name: "Cổ phiếu Giá trị",
      color: "#06b6d4",
      pct: allocation.value,
      amount: Math.round((currentNav * allocation.value) / 100),
      orderType: isStagflation
        ? "Duy trì tích sản chọn lọc"
        : isRecession
        ? "Tích sản biên an toàn"
        : "Mua tích sản dài hạn",
      riskSharpe: isStagflation
        ? "Sharpe 1.45 (Bền bỉ)"
        : "Sharpe 2.10 (Bền vững)",
      riskColor: "text-emerald-600",
      status: "Sẵn sàng",
      statusBadge: "bg-slate-100 text-slate-700 border-slate-200",
    },
    {
      ticker: "$BOND",
      name: "Trái phiếu Chính phủ",
      color: "#10b981",
      pct: allocation.bond,
      amount: Math.round((currentNav * allocation.bond) / 100),
      orderType: isStagflation
        ? "Tăng phân bổ cố định"
        : isRecession
        ? "Tái cơ cấu kỳ hạn"
        : "Phòng vệ lãi suất",
      riskSharpe: isStagflation ? "Yield 6.80% Fixed" : "Yield 7.50% Fixed",
      riskColor: "text-blue-600",
      status: isStagflation ? "Gia tăng" : "Sẵn sàng",
      statusBadge: isStagflation ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-200",
    },
    {
      ticker: "$CASH",
      name: "Tiền gửi tiết kiệm",
      color: "#f59e0b",
      pct: allocation.cash,
      amount: Math.round((currentNav * allocation.cash) / 100),
      orderType: isStagflation
        ? "Dự phòng rủi ro & thanh khoản"
        : "Duy trì thanh khoản",
      riskSharpe: "Risk Zero (Cash 4.0%)",
      riskColor: "text-slate-600",
      status: "Tối ưu",
      statusBadge: "bg-teal-50 text-teal-700 border-teal-200",
    },
  ];

  return (
    <div className="pro-card" style={{ padding: "1.25rem", borderRadius: "1rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          paddingBottom: "0.75rem",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span
            style={{
              padding: "4px",
              borderRadius: "6px",
              backgroundColor: "#f0fdf4",
              color: "#16a34a",
              border: "1px solid #bbf7d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileText size={16} />
          </span>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>
            Sổ Lệnh &amp; Biên Bản Khởi Tạo Quý (Order Desk)
          </h3>
        </div>
        <span style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "#94a3b8" }}>
          Audit Hash: #0x82A...FD4 · Q{currentQuarter}
        </span>
      </div>

      {/* Structured Table */}
      <div style={{ overflowX: "auto", width: "100%" }}>
        <table className="pro-order-desk-table">
          <thead>
            <tr>
              <th>Mã Tài Sản</th>
              <th>Loại Lệnh</th>
              <th>Tỷ Trọng Dự Kiến</th>
              <th>Giá Trị Quy Đổi</th>
              <th>Rủi Ro / Sharpe</th>
              <th style={{ textAlign: "right" }}>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ticker}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: r.color,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <strong style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>
                        {r.ticker}
                      </strong>
                    </div>
                  </div>
                </td>
                <td style={{ color: "#334155", fontWeight: 500 }}>{r.orderType}</td>
                <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>
                  {r.pct.toFixed(1)}%
                </td>
                <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>
                  {formatCurrency(r.amount)}
                </td>
                <td style={{ fontWeight: 600, color: isStagflation ? "#e11d48" : "#16a34a" }}>
                  {r.riskSharpe}
                </td>
                <td style={{ textAlign: "right" }}>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      backgroundColor: r.status === "Tối ưu" ? "#f0fdfa" : "#f1f5f9",
                      color: r.status === "Tối ưu" ? "#0f766e" : "#475569",
                      border: `1px solid ${r.status === "Tối ưu" ? "#99f6e4" : "#e2e8f0"}`,
                    }}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
