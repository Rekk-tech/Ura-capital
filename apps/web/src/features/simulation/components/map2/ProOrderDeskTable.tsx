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
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200">
            <FileText size={16} />
          </span>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Sổ Lệnh &amp; Biên Bản Khởi Tạo Quý (Order Desk)
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Audit Hash: #0x82A...FD4 · Q{currentQuarter}
        </span>
      </div>

      {/* Structured Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200/60">
            <tr>
              <th className="py-2.5 px-3">Mã Tài Sản</th>
              <th className="py-2.5 px-3">Loại Lệnh</th>
              <th className="py-2.5 px-3">Tỷ Trọng Dự Kiến</th>
              <th className="py-2.5 px-3">Giá Trị Quy Đổi</th>
              <th className="py-2.5 px-3">Rủi Ro / Sharpe</th>
              <th className="py-2.5 px-3 text-right">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.ticker} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                    <div>
                      <strong className="font-mono font-bold text-slate-900 block">{r.ticker}</strong>
                      <span className="text-[11px] text-slate-400">{r.name}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-slate-700 font-medium">{r.orderType}</td>
                <td className="py-3 px-3 font-mono font-bold text-slate-900">{r.pct.toFixed(1)}%</td>
                <td className="py-3 px-3 font-mono font-bold text-slate-900">{formatCurrency(r.amount)}</td>
                <td className={`py-3 px-3 font-medium ${r.riskColor}`}>{r.riskSharpe}</td>
                <td className="py-3 px-3 text-right">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${r.statusBadge}`}>
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
