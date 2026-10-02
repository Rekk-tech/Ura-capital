import React, { useState } from "react";
import type { Map1OrderInput, Map1Phase } from "../../types/map-game.types";
import { Zap, Shield, Lock, ArrowRight, ShoppingCart, TrendingDown, AlertOctagon, CheckCircle2 } from "lucide-react";

interface FomoOrderTicketProps {
  phase: Map1Phase;
  round?: number;
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
  round = 1,
  cash,
  shares,
  marginUsed: _marginUsed,
  nav: _nav,
  currentPrice,
  canUseMargin,
  freeStopLossAwarded,
  isSubmitting,
  onSubmitOrder,
}) => {
  const [activeTab, setActiveTab] = useState<"BUY" | "SELL">("BUY");
  const [selectedPercentage, setSelectedPercentage] = useState<number>(25);
  const [leverageMode, setLeverageMode] = useState<"1x" | "2x" | "5x">("1x");
  const [hasStopLoss, setHasStopLoss] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showLockedTooltip, setShowLockedTooltip] = useState<boolean>(false);

  const isTradingOpen = phase === "trading_window";
  const isRound5SellLocked = round === 5;
  const isRound7Settling = round === 7 && phase === "ledger_update";

  const triggerLockedSellAnimation = () => {
    setIsShaking(true);
    setShowLockedTooltip(true);
    setTimeout(() => setIsShaking(false), 800);
  };

  // Effective leverage & buying power
  const isMarginAllowed = canUseMargin && round >= 3;
  const useMargin = leverageMode !== "1x" && isMarginAllowed;
  const leverageMultiplier = leverageMode === "5x" ? 5 : leverageMode === "2x" ? 2 : 1;
  const buyingPower = useMargin ? cash * leverageMultiplier : cash;

  // Order summary calculations
  const rawTargetAmount = activeTab === "BUY"
    ? Math.floor(buyingPower * (selectedPercentage / 100))
    : Math.floor(shares * (selectedPercentage / 100)) * currentPrice;

  // Shares calculated (50 for 25% of 10M at 46,350 or default in Round 1)
  const sharesCalculated = activeTab === "BUY"
    ? Math.floor(rawTargetAmount / (currentPrice || 46350))
    : Math.floor(shares * (selectedPercentage / 100));

  const actualTradeValue = sharesCalculated * (currentPrice || 46350);
  const transactionFee = Math.round(actualTradeValue * 0.0015);
  const totalSettlementCost = actualTradeValue + transactionFee;

  // Mini account overview
  const totalAssets = cash + shares * currentPrice;
  const unrealizedPnlAmount = totalAssets - 10000000;
  const unrealizedPnlPercent = Number(((unrealizedPnlAmount / 10000000) * 100).toFixed(2));

  const handleExecute = async () => {
    if (!isTradingOpen || isSubmitting) return;

    if (activeTab === "SELL" && isRound5SellLocked) {
      triggerLockedSellAnimation();
      return;
    }

    if (activeTab === "BUY") {
      await onSubmitOrder({
        action: "BUY",
        percentage: selectedPercentage,
        useMargin,
        hasStopLoss: hasStopLoss || freeStopLossAwarded,
      });
    } else {
      await onSubmitOrder({
        action: "SELL",
        percentage: selectedPercentage,
      });
    }
  };

  return (
    <div className="fomo-card">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>Đặt Lệnh Nhanh</span>
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Fast Execution Desk • Kỳ hạn: 45 giây
          </p>
        </div>

        <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shadow-2xs">
          <Zap size={16} />
        </div>
      </div>

      {/* Mini Account Overview Card */}
      <div className="fomo-summary-box">
        <div className="flex items-center justify-between text-slate-500 font-semibold">
          <span className="text-[10px] uppercase tracking-wider">TỔNG TÀI SẢN (NAV)</span>
          <span className="font-mono text-slate-900 font-bold">
            {totalAssets.toLocaleString("vi-VN")} VND
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500 font-semibold">
          <span className="text-[10px] uppercase tracking-wider">TIỀN MẶT (CASH)</span>
          <span className="font-mono text-slate-900 font-bold">
            {cash.toLocaleString("vi-VN")} VND
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500 font-semibold">
          <span className="text-[10px] uppercase tracking-wider">LÃI/LỖ (P&amp;L)</span>
          <span className="font-mono text-slate-900 font-bold">
            {unrealizedPnlAmount === 0 ? "0" : (unrealizedPnlAmount > 0 ? `+${unrealizedPnlAmount.toLocaleString("vi-VN")}` : unrealizedPnlAmount.toLocaleString("vi-VN"))} VND ({unrealizedPnlPercent >= 0 ? `+${unrealizedPnlPercent.toFixed(2)}` : unrealizedPnlPercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Special Round 7 Settlement Summary Banner if settling */}
      {isRound7Settling && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-blue-600" />
              Đang tổng kết phiên giao dịch...
            </span>
            <span className="font-mono text-blue-700">95% Hoàn thành</span>
          </div>
          <p className="text-[11px] text-blue-800 leading-snug">
            Chuẩn bị xuất báo cáo tài sản & đánh giá Điểm Kỷ Luật (Discipline Score) của bạn.
          </p>
        </div>
      )}

      {/* 2. Buy / Sell Tab Switcher */}
      <div className="fomo-order-tabs">
        <button
          type="button"
          onClick={() => setActiveTab("BUY")}
          className={`fomo-tab-btn fomo-tab-buy ${activeTab === "BUY" ? "active" : ""}`}
        >
          <ShoppingCart size={13} className="mr-1" />
          <span>MUA (BUY)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SELL")}
          className={`fomo-tab-btn fomo-tab-sell ${activeTab === "SELL" ? "active" : ""}`}
        >
          <TrendingDown size={13} className="mr-1" />
          <span>BÁN (SELL)</span>
          {isRound5SellLocked && <Lock size={11} className="ml-1" />}
        </button>
      </div>

      {/* 3. KHỐI LƯỢNG VÀO LỆNH: 25%, 50%, 100% ALL-IN */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            KHỐI LƯỢNG VÀO LỆNH:
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {activeTab === "BUY" ? `Khả dụng: ${cash.toLocaleString("vi-VN")} đ` : `Cổ phiếu: ${shares} cp`}
          </span>
        </div>

        <div className="fomo-pill-grid">
          {[25, 50, 100].map((pct) => {
            const isAllIn = pct === 100;
            const isSelected = selectedPercentage === pct;
            return (
              <button
                key={pct}
                type="button"
                onClick={() => setSelectedPercentage(pct)}
                className={`fomo-vol-pill ${isSelected ? "active" : ""}`}
              >
                {isAllIn ? "100% ALL-IN" : `${pct}%`}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. ĐÒN BẨY (LEVERAGE): 1x, MARGIN x2, MARGIN x5 Booster */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            ĐÒN BẨY (LEVERAGE):
          </span>
          {!isMarginAllowed && (
            <span className="text-[10px] font-semibold text-amber-700 flex items-center gap-1">
              <Lock size={10} /> Mở khóa đòn bẩy từ Round 3
            </span>
          )}
        </div>

        <div className="fomo-pill-grid">
          {/* 1x (Gốc) */}
          <button
            type="button"
            onClick={() => setLeverageMode("1x")}
            className={`fomo-lev-pill ${leverageMode === "1x" ? "active" : ""}`}
          >
            1x (Gốc)
          </button>

          {/* MARGIN x2 */}
          <button
            type="button"
            disabled={!isMarginAllowed}
            onClick={() => setLeverageMode("2x")}
            title={!isMarginAllowed ? "Mở khóa đòn bẩy từ Round 3" : "Kích hoạt đòn bẩy Margin x2"}
            className={`fomo-lev-pill ${isMarginAllowed ? "" : "disabled"}`}
          >
            {!isMarginAllowed && <Lock size={10} />}
            <span>MARGIN x2</span>
          </button>

          {/* MARGIN x5 FOMO Booster */}
          <div className="relative">
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase px-1.5 py-0.2 rounded-full bg-rose-500 text-white shadow-2xs z-10 whitespace-nowrap">
              FOMO Booster
            </span>
            <button
              type="button"
              disabled={round < 3}
              onClick={() => {
                if (round >= 3) {
                  setLeverageMode("5x");
                }
              }}
              title={round < 3 ? "Mở khóa đòn bẩy từ Round 3" : "Cảnh báo: Đòn bẩy x5 có rủi ro cháy tài khoản cực cao!"}
              className={`fomo-lev-pill booster w-full ${round < 3 ? "disabled" : ""}`}
            >
              {round < 3 && <Lock size={9} />}
              <span>MARGIN x5</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Stop-loss Hedge Toggle */}
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasStopLoss || freeStopLossAwarded}
            onChange={(e) => setHasStopLoss(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
          <span className="font-semibold text-slate-800 flex items-center gap-1">
            <Shield size={13} className="text-blue-600" />
            Cắt lỗ tự động (-7%)
          </span>
        </label>
        {freeStopLossAwarded && (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            Thưởng từ Quiz
          </span>
        )}
      </div>

      {/* 6. Order Summary Calculation with Transparent 0.15% Fee */}
      <div className="fomo-summary-box">
        <div className="flex items-center justify-between text-slate-600">
          <span>Khối lượng dự tính:</span>
          <span className="font-bold font-mono text-slate-900">
            {sharesCalculated || 50} Cổ phiếu VIN
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <span>Mức giá khớp:</span>
          <span className="font-bold font-mono text-slate-900">
            {(currentPrice || 46350).toLocaleString("vi-VN")} VND (+3.0%)
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Phí giao dịch mô phỏng (0.15%):</span>
          <span className="font-mono text-slate-700 font-semibold">
            Miễn phí
          </span>
        </div>
        <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
          <span className="font-bold text-slate-900">Tổng tiền thanh toán:</span>
          <div className="text-right">
            <span className="text-base font-bold font-mono text-slate-900">
              {(totalSettlementCost || 2317500).toLocaleString("vi-VN")}
            </span>
            <span className="text-xs font-semibold text-slate-500 ml-1">VND</span>
          </div>
        </div>
      </div>

      {/* 7. Big Execution Action Button / Special Round 5 State */}
      {isRound5SellLocked && activeTab === "SELL" ? (
        <div className="flex flex-col gap-2 relative">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertOctagon size={16} className="text-rose-600 flex-shrink-0" />
            <span>LỆNH BÁN BỊ KHÓA (NO LIQUIDITY / SÀN NGHẼN LỆNH)</span>
          </div>
          {showLockedTooltip && (
            <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-400 text-rose-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertOctagon size={14} className="text-rose-600 flex-shrink-0" />
              <span>LỆNH BÁN BỊ KHÓA DO KHÔNG CÓ BÊN MUA ĐỐI ỨNG (MẤT THANH KHOẢN)</span>
            </div>
          )}
          <button
            type="button"
            onClick={triggerLockedSellAnimation}
            className={`fomo-btn-locked-sell ${isShaking ? "fomo-shake" : ""}`}
            title="Nhấp chuột để kiểm tra trạng thái thanh khoản"
          >
            <Lock size={14} />
            <span>Không Thể Khớp Lệnh Bán (Order Blocked)</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={!isTradingOpen || isSubmitting || (activeTab === "BUY" && cash < currentPrice) || (activeTab === "SELL" && shares <= 0)}
          onClick={handleExecute}
          className="fomo-btn-execute"
        >
          <span>Khớp Lệnh Ngay (Execute Order)</span>
          <ArrowRight size={15} />
        </button>
      )}

      {/* 8. Pedagogical insight note at bottom */}
      <p className="text-[11px] text-slate-600 leading-snug bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center font-normal">
        {round === 1 && "ⓘ Vòng 1: Giai đoạn bắt đầu tích lũy. Hãy lựa chọn tỷ lệ giải ngân ban đầu hợp lý trước khi giá biến động mạnh."}
        {round === 2 && "⚠️ Cảnh báo: Giá đang chạm trần và dư mua cực lớn. Coi chừng bẫy FOMO đu đỉnh!"}
        {round === 3 && "⚠️ Cảnh báo: Giá rơi sàn đột ngột. Đừng dùng Margin bắt dao rơi khi chưa rõ xu hướng!"}
        {round === 4 && "💡 Gợi ý: Cây nến hồi nhưng khối lượng thấp thường là Bull-trap lừa nhà đầu tư non tay."}
        {round === 5 && "❄️ Bài học thực tế: Khi thị trường mất thanh khoản, việc đặt lệnh bán là bất khả thi!"}
        {round === 6 && "💡 Gợi ý: Vùng đáy kiệt quệ là lúc cần kỷ luật đo mức chịu đựng rủi ro, không bỏ cuộc."}
        {round === 7 && "🏆 Tổng kết: Sống sót qua bão táp đòi hỏi bản lĩnh và khả năng kiểm soát cảm xúc thép."}
      </p>
    </div>
  );
};
