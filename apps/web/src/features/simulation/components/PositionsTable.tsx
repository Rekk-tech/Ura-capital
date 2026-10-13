import React from "react";
import { Package, TrendingUp, TrendingDown } from "lucide-react";
import { SimulationPositionValuationDto } from "../types/simulation-ui.types";
import { formatCurrency } from "../../portfolio/utils/portfolioCalculations";

interface PositionsTableProps {
  positions: SimulationPositionValuationDto[];
  onSelectAsset?: (symbol: string, side?: "BUY" | "SELL") => void;
}

export const PositionsTable: React.FC<PositionsTableProps> = ({
  positions,
  onSelectAsset,
}) => {

  return (
    <div className="card simulation-positions-card" data-testid="simulation-positions-card">
      <div className="card-header-flex">
        <h3 className="card-title">Vị Thế Đang Nắm Giữ (Open Positions)</h3>
        <span className="badge badge-info">{positions.length} Mã</span>
      </div>

      {positions.length === 0 ? (
        <div className="empty-state-wrap" data-testid="positions-empty-state">
          <div className="empty-state-icon">
            <Package size={24} />
          </div>
          <p className="empty-state-title">
            Chưa Có Vị Thế Nắm Giữ <span className="sr-only">No Open Positions</span>
          </p>
          <p className="empty-state-desc">
            Danh mục của bạn hiện nắm giữ 100% tiền mặt. Sử dụng phiếu đặt lệnh bên dưới để thực hiện lệnh MUA tích luỹ.
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="simulation-table" data-testid="positions-table" aria-label="Open Positions">
            <thead>
              <tr>
                <th scope="col">Mã Chứng Khoán</th>
                <th scope="col" className="text-right">Khối Lượng</th>
                <th scope="col" className="text-right">Giá Vốn TB</th>
                <th scope="col" className="text-right">Giá Hiện Tại</th>
                <th scope="col" className="text-right">Giá Trị Thị Trường</th>
                <th scope="col" className="text-right">Lãi/Lỗ Dự Kiến</th>
                {onSelectAsset && <th scope="col" className="text-center">Thao Tác</th>}
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => {
                const isPositive = !pos.unrealizedPnl.startsWith("-") && pos.unrealizedPnl !== "0.0000";
                const isNegative = pos.unrealizedPnl.startsWith("-");

                return (
                  <tr key={pos.assetId} data-testid={`position-row-${pos.symbol}`}>
                    <td>
                      <div className="asset-cell">
                        <span className="asset-symbol font-mono">{pos.symbol}</span>
                        <span className="asset-name">{pos.name}</span>
                      </div>
                    </td>
                    <td className="text-right font-mono font-medium">{pos.quantity}</td>
                    <td className="text-right font-mono text-muted">{formatCurrency(pos.averageCost)}</td>
                    <td className="text-right font-mono">{formatCurrency(pos.currentPrice)}</td>
                    <td className="text-right font-mono font-medium">{formatCurrency(pos.marketValue)}</td>
                    <td className="text-right font-mono">
                      <span className={`pnl-inline ${isPositive ? "pnl-text-pos" : isNegative ? "pnl-text-neg" : ""}`}>
                        {isNegative ? (
                          <TrendingDown size={14} className="pnl-icon" />
                        ) : isPositive ? (
                          <TrendingUp size={14} className="pnl-icon" />
                        ) : null}
                        {isPositive ? `+${formatCurrency(pos.unrealizedPnl)}` : formatCurrency(pos.unrealizedPnl)}
                      </span>
                    </td>
                    {onSelectAsset && (
                      <td className="text-center">
                        <div className="table-actions">
                          <button
                            type="button"
                            className="button-link text-primary"
                            onClick={() => onSelectAsset(pos.symbol, "BUY")}
                            title={`Buy more ${pos.symbol}`}
                          >
                            Buy
                          </button>
                          <span className="action-divider">|</span>
                          <button
                            type="button"
                            className="button-link text-error"
                            onClick={() => onSelectAsset(pos.symbol, "SELL")}
                            title={`Sell ${pos.symbol}`}
                            disabled={pos.quantity <= 0}
                          >
                            Sell
                          </button>
                        </div>
                      </td>
                    )}
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
