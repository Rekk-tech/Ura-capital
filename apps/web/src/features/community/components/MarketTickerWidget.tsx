import React from "react";
import { TrendingUp } from "lucide-react";

export const MarketTickerWidget: React.FC = () => {
  return (
    <div className="market-ticker-card">
      <div className="market-ticker-header">
        <h4>THỊ TRƯỜNG HÔM NAY</h4>
        <span className="market-live-pill">
          <span className="community-online-dot" />
          Đang giao dịch
        </span>
      </div>

      <div>
        {/* VN-INDEX */}
        <div className="market-ticker-row">
          <div>
            <div className="market-symbol-name">VN-INDEX</div>
            <div className="market-symbol-sub">Thanh khoản 18.4K Tỷ</div>
          </div>
          <div>
            <div className="market-price-val">1,286.42</div>
            <div className="market-change-val">
              <TrendingUp size={11} />
              <span>+11.55 (+0.89%)</span>
            </div>
          </div>
        </div>

        {/* VN30 */}
        <div className="market-ticker-row">
          <div>
            <div className="market-symbol-name">VN30</div>
            <div className="market-symbol-sub">Khối ngoại: Ròng +240 tỷ</div>
          </div>
          <div>
            <div className="market-price-val">1,324.80</div>
            <div className="market-change-val">
              <TrendingUp size={11} />
              <span>+14.20 (+1.08%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
