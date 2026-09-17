import React from "react";
import { CheckCheck, TrendingUp, TrendingDown } from "lucide-react";
import { SimulationTradeDto } from "../types/simulation-ui.types";

interface TradesTableProps {
  trades: SimulationTradeDto[];
}

export const TradesTable: React.FC<TradesTableProps> = ({ trades }) => {
  const formatCurrency = (val: string) => {
    if (val.startsWith("-")) {
      return `-$${val.slice(1)}`;
    }
    return `$${val}`;
  };

  return (
    <div className="card simulation-trades-card" data-testid="simulation-trades-card">
      <div className="card-header-flex">
        <h3 className="card-title">Executed Trades Log</h3>
        <span className="badge badge-info">{trades.length} Trades</span>
      </div>

      {trades.length === 0 ? (
        <div className="empty-state-wrap" data-testid="trades-empty-state">
          <div className="empty-state-icon">
            <CheckCheck size={24} />
          </div>
          <p className="empty-state-title">No Executed Trades</p>
          <p className="empty-state-desc">Trades will appear here automatically once your market orders are filled.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="simulation-table" data-testid="trades-table" aria-label="Executed Trades Log">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Asset</th>
                <th scope="col">Side</th>
                <th scope="col" className="text-right">Quantity</th>
                <th scope="col" className="text-right">Execution Price</th>
                <th scope="col" className="text-right">Notional</th>
                <th scope="col" className="text-right">Realized PnL</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => {
                const isPositive = !trade.realizedPnl.startsWith("-") && trade.realizedPnl !== "0.0000";
                const isNegative = trade.realizedPnl.startsWith("-");

                return (
                  <tr key={trade.id} data-testid={`trade-row-${trade.id}`}>
                    <td className="text-muted font-mono" style={{ fontSize: "0.85rem" }}>
                      {new Date(trade.executedAt).toLocaleTimeString()}
                    </td>
                    <td className="font-mono font-medium">{trade.assetSymbol}</td>
                    <td>
                      <span className={`badge ${trade.side === "BUY" ? "badge-success" : "badge-error"}`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="text-right font-mono">{trade.quantity}</td>
                    <td className="text-right font-mono">${trade.executionPrice}</td>
                    <td className="text-right font-mono font-medium">${trade.notional}</td>
                    <td className="text-right font-mono">
                      {trade.realizedPnl !== "0.0000" ? (
                        <span className={`pnl-inline ${isPositive ? "pnl-text-pos" : isNegative ? "pnl-text-neg" : ""}`}>
                          {isNegative ? <TrendingDown size={13} className="pnl-icon" /> : <TrendingUp size={13} className="pnl-icon" />}
                          {isPositive ? `+${formatCurrency(trade.realizedPnl)}` : formatCurrency(trade.realizedPnl)}
                        </span>
                      ) : (
                        <span className="text-muted">$0.0000</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
