import React, { useState } from "react";
import { Activity, Search, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import {
  SimulationAssetDto,
  SimulationMarketSnapshotDto,
  SimulationOrderSide,
} from "../types/simulation-ui.types";

interface MarketPriceViewProps {
  assets: SimulationAssetDto[];
  snapshots: SimulationMarketSnapshotDto[];
  currentCycle?: number;
  onSelectAsset?: (symbol: string, side?: SimulationOrderSide) => void;
}

export const MarketPriceView: React.FC<MarketPriceViewProps> = ({
  assets,
  snapshots,
  currentCycle = 1,
  onSelectAsset,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAssets = assets.filter(
    (asset) =>
      asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="card market-price-view-card" data-testid="market-price-view" role="region" aria-label="Market Price Board">
      <div className="card-header-flex" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Activity size={18} className="text-accent" aria-hidden="true" />
          <h3 className="card-title" style={{ margin: 0 }}>Market Quotes & Snapshot Prices</h3>
          <span className="badge badge-info font-mono" data-testid="market-cycle-badge">
            Cycle {currentCycle}
          </span>
        </div>

        {/* Search input */}
        <div className="market-search-box" style={{ position: "relative", minWidth: "180px" }}>
          <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} aria-hidden="true" />
          <input
            type="text"
            className="input-text"
            placeholder="Search symbol or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: "30px", fontSize: "0.85rem", height: "34px" }}
            aria-label="Search assets by symbol or name"
            data-testid="market-search-input"
          />
        </div>
      </div>

      {assets.length === 0 ? (
        <div className="empty-state-wrap" data-testid="market-empty-state">
          <div className="empty-state-icon">
            <DollarSign size={24} />
          </div>
          <p className="empty-state-title">No Assets Available</p>
          <p className="empty-state-desc">The asset universe is currently unpopulated for this simulation scenario.</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="empty-state-wrap" data-testid="market-no-match-state">
          <p className="empty-state-title">No matching assets found</p>
          <p className="empty-state-desc">No asset symbol or name matches &quot;{searchTerm}&quot;.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="simulation-table" data-testid="market-prices-table" aria-label="Market Asset Prices">
            <thead>
              <tr>
                <th scope="col">Symbol</th>
                <th scope="col">Asset Name</th>
                <th scope="col">Type</th>
                <th scope="col" className="text-right">Snapshot Price</th>
                <th scope="col" className="text-right">Cycle</th>
                {onSelectAsset && <th scope="col" className="text-center">Action</th>}
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => {
                const snapshot = snapshots.find(
                  (s) => s.asset?.symbol === asset.symbol || s.assetId === asset.id,
                );
                const price = snapshot?.price ?? "—";

                return (
                  <tr key={asset.id} data-testid={`market-asset-row-${asset.symbol}`}>
                    <td>
                      <span className="asset-symbol font-mono font-bold" data-testid={`asset-symbol-${asset.symbol}`}>
                        {asset.symbol}
                      </span>
                    </td>
                    <td>
                      <span className="asset-name">{asset.name}</span>
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: "0.75rem" }}>
                        {asset.assetType}
                      </span>
                    </td>
                    <td className="text-right font-mono font-medium" data-testid={`asset-price-${asset.symbol}`}>
                      {price !== "—" ? `$${price}` : <span className="text-muted">Awaiting Snapshot</span>}
                    </td>
                    <td className="text-right font-mono text-muted" style={{ fontSize: "0.85rem" }}>
                      {snapshot ? `C${snapshot.cycle}` : `C${currentCycle}`}
                    </td>
                    {onSelectAsset && (
                      <td className="text-center">
                        <div className="table-actions">
                          <button
                            type="button"
                            className="button-link text-primary"
                            onClick={() => onSelectAsset(asset.symbol, "BUY")}
                            data-testid={`trade-buy-btn-${asset.symbol}`}
                            title={`Select ${asset.symbol} to buy`}
                          >
                            <TrendingUp size={12} style={{ marginRight: "3px" }} aria-hidden="true" />
                            Buy
                          </button>
                          <span className="action-divider">|</span>
                          <button
                            type="button"
                            className="button-link text-error"
                            onClick={() => onSelectAsset(asset.symbol, "SELL")}
                            data-testid={`trade-sell-btn-${asset.symbol}`}
                            title={`Select ${asset.symbol} to sell`}
                          >
                            <TrendingDown size={12} style={{ marginRight: "3px" }} aria-hidden="true" />
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
