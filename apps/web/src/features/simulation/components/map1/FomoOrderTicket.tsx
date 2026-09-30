import React, { useState } from "react";
import type { Map1OrderInput, Map1Phase } from "../../types/map-game.types";
import { Zap, Shield, AlertCircle, Lock, ArrowUpCircle, ArrowDownCircle, PauseCircle } from "lucide-react";

interface FomoOrderTicketProps {
  phase: Map1Phase;
  cash: number;
  shares: number;
  marginUsed: number;
  nav: number;
  currentPrice: number;
  canUseMargin: boolean;
  freeStopLossAwarded: boolean;
  isSubmitting: boolean;
  onSubmitOrder: (input: Map1OrderInput) => Promise<void>;
}

export const FomoOrderTicket: React.FC<FomoOrderTicketProps> = ({
  phase,
  cash,
  shares,
  marginUsed,
  nav,
  currentPrice,
  canUseMargin,
  freeStopLossAwarded,
  isSubmitting,
  onSubmitOrder,
}) => {
  const [selectedPercentage, setSelectedPercentage] = useState<number>(50);
  const [useMargin, setUseMargin] = useState<boolean>(false);
  const [hasStopLoss, setHasStopLoss] = useState<boolean>(false);

  const isTradingOpen = phase === "trading_window";

  // Calculate estimated buying power
  const buyingPower = useMargin && canUseMargin ? cash * 2 : cash;
  const estimatedCost = Math.floor(buyingPower * (selectedPercentage / 100));
  void estimatedCost;

  const handleQuickBuy = async (pct: number) => {
    setSelectedPercentage(pct);
    await onSubmitOrder({
      action: "BUY",
      percentage: pct,
      useMargin: useMargin && canUseMargin,
      hasStopLoss: hasStopLoss || freeStopLossAwarded,
    });
  };

  const handleSell = async (pct = 100) => {
    await onSubmitOrder({
      action: "SELL",
      percentage: pct,
    });
  };

  const handleHold = async () => {
    await onSubmitOrder({
      action: "HOLD",
      hasStopLoss: hasStopLoss || freeStopLossAwarded,
    });
  };

  return (
    <div className="fomo-order-ticket card-aura p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col gap-4">
      {/* Balances Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pb-3 border-b border-slate-100 text-xs">
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-slate-400 block mb-0.5">Tiền mặt</span>
          <span className="font-bold font-mono text-slate-800">{cash.toLocaleString("vi-VN")} đ</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-slate-400 block mb-0.5">Cổ phiếu $FOMO</span>
          <span className="font-bold font-mono text-slate-800">{shares.toLocaleString("vi-VN")} cp</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-slate-400 block mb-0.5">Margin đang vay</span>
          <span className={`font-bold font-mono ${marginUsed > 0 ? "text-rose-600" : "text-slate-800"}`}>
            {marginUsed.toLocaleString("vi-VN")} đ
          </span>
        </div>
        <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
          <span className="text-blue-600 block mb-0.5 font-semibold">Tài sản ròng (NAV)</span>
          <span className="font-black font-mono text-blue-900">{nav.toLocaleString("vi-VN")} đ</span>
        </div>
      </div>

      {/* Trading Window Alert */}
      {!isTradingOpen && (
        <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-center gap-2">
          <AlertCircle size={15} className="text-slate-500 flex-shrink-0" />
          <span>Lệnh giao dịch chỉ được tiếp nhận trong <strong>Cửa sổ đặt lệnh (giây 10s - 30s)</strong>.</span>
        </div>
      )}

      {/* Quick Buy Buttons */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Zap size={13} className="text-amber-500" />
            LỆNH MUA NHANH (QUICK BUY)
          </span>
          <span className="text-[11px] text-slate-400">Phí giao dịch: 0.15%</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[25, 50, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              disabled={!isTradingOpen || isSubmitting || cash < currentPrice}
              onClick={() => handleQuickBuy(pct)}
              className={`py-2 px-3 rounded-lg font-bold text-xs border transition-all flex flex-col items-center justify-center gap-0.5 ${
                pct === 100
                  ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 active:scale-95"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 active:scale-95"
              } disabled:opacity-40 disabled:pointer-events-none`}
            >
              <span>MUA {pct}% VỐN</span>
              <span className="text-[10px] font-normal opacity-80">
                ~{Math.floor((buyingPower * (pct / 100)) / (currentPrice || 1))} cp
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Leverage & Protection Controls */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-2.5 text-xs">
        {/* Margin x2 */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              disabled={!canUseMargin}
              checked={useMargin && canUseMargin}
              onChange={(e) => setUseMargin(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 disabled:opacity-50"
            />
            <span className="font-semibold text-slate-800">Kích hoạt Margin x2 (Đòn bẩy 1:1)</span>
          </label>
          {!canUseMargin ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-200 px-2 py-0.5 rounded">
              <Lock size={10} /> Mở khóa từ Round 3
            </span>
          ) : (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
              Đã mở khóa
            </span>
          )}
        </div>

        {/* Margin x5 Disabled Button with Tooltip */}
        <div className="flex items-center justify-between opacity-50">
          <div className="flex items-center gap-2">
            <Lock size={12} className="text-slate-400" />
            <span className="text-slate-500">Margin x5 (Kho hàng nóng)</span>
          </div>
          <span
            className="text-[10px] text-slate-500 bg-slate-200 px-2 py-0.5 rounded cursor-not-allowed"
            title="Mức đòn bẩy quá cao - Khóa để bảo vệ kỷ luật"
          >
            Khóa bảo vệ kỷ luật
          </span>
        </div>

        {/* Stop Loss Toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasStopLoss || freeStopLossAwarded}
              onChange={(e) => setHasStopLoss(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <Shield size={12} className="text-blue-600" />
              Đặt lệnh cắt lỗ Stop-loss tự động (-7%)
            </span>
          </label>
          {freeStopLossAwarded && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
              Thưởng miễn phí từ Quiz
            </span>
          )}
        </div>
      </div>

      {/* Main Order Buttons */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          type="button"
          disabled={!isTradingOpen || isSubmitting || cash < currentPrice}
          onClick={() => handleQuickBuy(selectedPercentage)}
          className="btn btn-primary py-2.5 rounded-lg font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-40"
        >
          <ArrowUpCircle size={16} />
          <span>MUA ({selectedPercentage}%)</span>
        </button>

        <button
          type="button"
          disabled={!isTradingOpen || isSubmitting || shares <= 0}
          onClick={() => handleSell(100)}
          className="btn btn-danger py-2.5 rounded-lg font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-40"
        >
          <ArrowDownCircle size={16} />
          <span>BÁN HẾT (100%)</span>
        </button>

        <button
          type="button"
          disabled={!isTradingOpen || isSubmitting}
          onClick={handleHold}
          className="btn btn-secondary py-2.5 rounded-lg font-bold text-sm bg-slate-700 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-40"
        >
          <PauseCircle size={16} />
          <span>GIỮ NGUYÊN</span>
        </button>
      </div>
    </div>
  );
};
