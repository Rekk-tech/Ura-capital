import React, { useState, useEffect } from "react";
import { Send, CheckCircle, AlertCircle, TrendingUp, TrendingDown, HelpCircle } from "lucide-react";
import {
  SimulationAssetDto,
  SimulationMarketSnapshotDto,
  SimulationOrderSide,
  SimulationOrderDto,
  SimulationApiError,
} from "../types/simulation-ui.types";

interface MarketOrderTicketProps {
  simulationId: string;
  sessionStatus: string;
  assets: SimulationAssetDto[];
  snapshots?: SimulationMarketSnapshotDto[];
  onSubmitOrder: (
    side: SimulationOrderSide,
    assetSymbol: string,
    quantity: number,
    idempotencyKey: string,
  ) => Promise<SimulationOrderDto>;
  isSubmitting?: boolean;
  selectedSymbol?: string;
  selectedSide?: SimulationOrderSide;
}

export const MarketOrderTicket: React.FC<MarketOrderTicketProps> = ({
  simulationId: _simulationId,
  sessionStatus,
  assets,
  snapshots = [],
  onSubmitOrder,
  isSubmitting = false,
  selectedSymbol,
  selectedSide = "BUY",
}) => {
  const [side, setSide] = useState<SimulationOrderSide>(selectedSide);
  const [symbol, setSymbol] = useState<string>(selectedSymbol ?? (assets[0]?.symbol ?? ""));
  const [quantity, setQuantity] = useState<number>(10);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<SimulationOrderDto | null>(null);

  // Sync external selection from Positions table quick action
  useEffect(() => {
    if (selectedSymbol) {
      setSymbol(selectedSymbol);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    if (selectedSide) {
      setSide(selectedSide);
    }
  }, [selectedSide]);

  // Default symbol if not selected
  useEffect(() => {
    if (!symbol && assets.length > 0) {
      setSymbol(assets[0]!.symbol);
    }
  }, [assets, symbol]);

  const activeAsset = assets.find((a) => a.symbol === symbol);
  const activeSnapshot = snapshots.find((s) => s.asset?.symbol === symbol || s.assetId === activeAsset?.id);
  const currentPrice = activeSnapshot?.price ?? null;

  // Informational estimated notional only (never submitted to backend)
  const estimatedNotional = currentPrice && !isNaN(Number(currentPrice)) && quantity > 0
    ? (Number(currentPrice) * quantity).toFixed(4)
    : null;

  const isActiveSession = sessionStatus === "ACTIVE";

  const handleSideChange = (newSide: SimulationOrderSide) => {
    setSide(newSide);
    setErrorMsg(null);
  };

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
    setErrorMsg(null);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setQuantity(isNaN(val) ? 0 : Math.max(0, val));
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isActiveSession || isSubmitting) return;

    if (!symbol) {
      setErrorMsg("Please select an asset to trade.");
      return;
    }

    if (quantity <= 0) {
      setErrorMsg("Order quantity must be at least 1 whole share.");
      return;
    }

    setErrorMsg(null);
    setSuccessOrder(null);

    // Client generates unique idempotency key for this distinct submission intent
    const idempotencyKey = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `ord-idem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    try {
      const order = await onSubmitOrder(side, symbol, quantity, idempotencyKey);
      setSuccessOrder(order);
    } catch (err: unknown) {
      if (err instanceof SimulationApiError) {
        switch (err.code) {
          case "INSUFFICIENT_CASH":
            setErrorMsg("Insufficient cash balance to place this market BUY order.");
            break;
          case "INSUFFICIENT_POSITION":
            setErrorMsg("Insufficient position quantity to place this market SELL order.");
            break;
          case "SIMULATION_NOT_ACTIVE":
            setErrorMsg("Simulation session is not currently active. Orders can only be placed in ACTIVE sessions.");
            break;
          case "IDEMPOTENCY_CONFLICT":
            setErrorMsg("This idempotency key has already been used with a different request payload.");
            break;
          case "VALIDATION_ERROR":
            setErrorMsg(err.message || "Invalid order parameters submitted.");
            break;
          case "NOT_FOUND":
            setErrorMsg("Requested asset or session was not found.");
            break;
          default:
            setErrorMsg(err.message || "Order execution failed. Please try again.");
        }
      } else if (err instanceof Error) {
        setErrorMsg(err.message || "Unable to submit order. Please check connection.");
      } else {
        setErrorMsg("An unexpected error occurred during order submission.");
      }
    }
  };

  return (
    <div className="card market-order-ticket" data-testid="market-order-ticket">
      <div className="card-header-flex">
        <h3 className="card-title">MARKET Order Ticket</h3>
        <span className="badge badge-info font-mono">MARKET ONLY</span>
      </div>

      {!isActiveSession && (
        <div className="ticket-inactive-notice" data-testid="ticket-inactive-banner">
          <HelpCircle size={15} style={{ marginRight: "6px" }} />
          <span>Trading disabled: Session status is <strong>{sessionStatus}</strong>. Start the session to enable order placement.</span>
        </div>
      )}

      {errorMsg && (
        <div className="ticket-alert ticket-alert-error" role="alert" data-testid="order-error-banner">
          <AlertCircle size={16} className="alert-icon" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successOrder && (
        <div className="ticket-alert ticket-alert-success" role="status" data-testid="order-success-banner">
          <CheckCircle size={16} className="alert-icon" />
          <div>
            <strong>Order {successOrder.status}!</strong>
            <p style={{ margin: "2px 0 0", fontSize: "0.85rem" }}>
              {successOrder.side} {successOrder.executedQuantity ?? successOrder.quantity} {successOrder.assetSymbol} @ ${successOrder.executionPrice ?? "Market"}
              {successOrder.realizedPnl && successOrder.realizedPnl !== "0.0000" && (
                <span> • Realized PnL: ${successOrder.realizedPnl}</span>
              )}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="order-form" data-testid="order-form">
        {/* Side Toggle */}
        <div className="form-group">
          <label className="form-label">Order Action</label>
          <div className="order-side-toggle" role="radiogroup" aria-label="Order Action">
            <button
              type="button"
              className={`side-button side-buy ${side === "BUY" ? "active" : ""}`}
              onClick={() => handleSideChange("BUY")}
              disabled={!isActiveSession || isSubmitting}
              data-testid="side-buy-button"
            >
              <TrendingUp size={16} style={{ marginRight: "6px" }} />
              BUY
            </button>
            <button
              type="button"
              className={`side-button side-sell ${side === "SELL" ? "active" : ""}`}
              onClick={() => handleSideChange("SELL")}
              disabled={!isActiveSession || isSubmitting}
              data-testid="side-sell-button"
            >
              <TrendingDown size={16} style={{ marginRight: "6px" }} />
              SELL
            </button>
          </div>
        </div>

        {/* Asset Selector */}
        <div className="form-group">
          <label htmlFor="asset-select" className="form-label">Asset to Trade</label>
          <select
            id="asset-select"
            className="input-select"
            value={symbol}
            onChange={(e) => handleSymbolChange(e.target.value)}
            disabled={!isActiveSession || isSubmitting || assets.length === 0}
            data-testid="asset-select"
            aria-label="Select Asset to Trade"
          >
            {assets.map((a) => (
              <option key={a.id} value={a.symbol}>
                {a.symbol} — {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Current Snapshot Price Display (Informational Reference) */}
        <div className="ticker-price-preview" data-testid="ticket-price-preview">
          <span className="price-preview-label">Authoritative Snapshot Price</span>
          <span className="price-preview-value font-mono">
            {currentPrice ? `$${currentPrice}` : "Awaiting Market Snapshot"}
          </span>
        </div>

        {/* Quantity Input */}
        <div className="form-group">
          <div className="label-with-hint">
            <label htmlFor="quantity-input" className="form-label">Quantity (Shares)</label>
            <span className="input-hint">Whole units only</span>
          </div>
          <input
            id="quantity-input"
            type="number"
            className="input-text font-mono"
            min="1"
            step="1"
            value={quantity}
            onChange={handleQuantityChange}
            disabled={!isActiveSession || isSubmitting}
            data-testid="quantity-input"
            aria-label="Order Quantity in whole shares"
            required
          />
        </div>

        {/* Estimated Notional Preview */}
        {estimatedNotional && (
          <div className="estimated-notional-box" data-testid="estimated-notional">
            <span className="notional-label">Estimated Notional</span>
            <span className="notional-value font-mono">${estimatedNotional}</span>
            <span className="notional-disclaimer">Informational display only. Final execution occurs at authoritative server price.</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className={`button order-submit-btn ${side === "BUY" ? "button-success" : "button-error"}`}
          disabled={!isActiveSession || isSubmitting || quantity <= 0}
          data-testid="submit-order-button"
        >
          <Send size={16} style={{ marginRight: "8px" }} />
          {isSubmitting ? "Submitting Order..." : `Place ${side} Order`}
        </button>
      </form>
    </div>
  );
};
