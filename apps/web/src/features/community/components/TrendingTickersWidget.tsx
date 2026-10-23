import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TickerItem {
  symbol: string;
  change: string;
  isPositive: boolean;
  postCount: string;
}

export const TrendingTickersWidget: React.FC = () => {
  const tickers: TickerItem[] = [
    { symbol: "$FPT", change: "+2.4%", isPositive: true, postCount: "1.4k post" },
    { symbol: "$TCB", change: "+1.6%", isPositive: true, postCount: "980 post" },
    { symbol: "$MWG", change: "+3.2%", isPositive: true, postCount: "860 post" },
    { symbol: "$HPG", change: "-0.9%", isPositive: false, postCount: "720 post" },
  ];

  return (
    <div className="trending-tickers-card">
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", paddingBottom: "0.65rem", borderBottom: "1px solid #F1F5F9", marginBottom: "0.75rem" }}>
        <TrendingUp size={14} style={{ color: "#1D6FF2" }} />
        <h4 style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
          MÃ THẢO LUẬN SÔI NỔI
        </h4>
      </div>

      <div className="trending-tickers-grid">
        {tickers.map((t) => (
          <div key={t.symbol} className="trending-ticker-cell">
            <div className="trending-ticker-top">
              <span className="trending-ticker-symbol">{t.symbol}</span>
              <span className={`trending-ticker-rate ${t.isPositive ? "rate-up" : "rate-down"}`}>
                {t.isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {t.change}
              </span>
            </div>
            <div className="trending-ticker-posts">{t.postCount}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
