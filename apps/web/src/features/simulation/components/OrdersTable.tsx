import React from "react";
import { ClipboardList, CheckCircle2, XCircle, Clock } from "lucide-react";
import { SimulationOrderDto } from "../types/simulation-ui.types";

interface OrdersTableProps {
  orders: SimulationOrderDto[];
}

export const OrdersTable: React.FC<OrdersTableProps> = ({ orders }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FILLED":
        return (
          <span className="badge badge-success" data-testid="order-status-badge">
            <CheckCircle2 size={12} style={{ marginRight: "3px" }} />
            FILLED
          </span>
        );
      case "REJECTED":
        return (
          <span className="badge badge-error" data-testid="order-status-badge">
            <XCircle size={12} style={{ marginRight: "3px" }} />
            REJECTED
          </span>
        );
      default:
        return (
          <span className="badge badge-warning" data-testid="order-status-badge">
            <Clock size={12} style={{ marginRight: "3px" }} />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="card simulation-orders-card" data-testid="simulation-orders-card">
      <div className="card-header-flex">
        <h3 className="card-title">Order History</h3>
        <span className="badge badge-info">{orders.length} Orders</span>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state-wrap" data-testid="orders-empty-state">
          <div className="empty-state-icon">
            <ClipboardList size={24} />
          </div>
          <p className="empty-state-title">No Orders Submitted</p>
          <p className="empty-state-desc">You have not submitted any market orders in this session yet.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="simulation-table" data-testid="orders-table" aria-label="Order History">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Asset</th>
                <th scope="col">Action</th>
                <th scope="col">Type</th>
                <th scope="col" className="text-right">Quantity</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-right">Execution Price</th>
                <th scope="col" className="text-right">Realized PnL</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} data-testid={`order-row-${order.id}`}>
                  <td className="text-muted font-mono" style={{ fontSize: "0.85rem" }}>
                    {new Date(order.submittedAt).toLocaleTimeString()}
                  </td>
                  <td className="font-mono font-medium">{order.assetSymbol}</td>
                  <td>
                    <span className={`badge ${order.side === "BUY" ? "badge-success" : "badge-error"}`}>
                      {order.side}
                    </span>
                  </td>
                  <td className="font-mono text-muted">{order.type}</td>
                  <td className="text-right font-mono">{order.executedQuantity ?? order.quantity}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td className="text-right font-mono">
                    {order.executionPrice ? `$${order.executionPrice}` : "—"}
                  </td>
                  <td className="text-right font-mono">
                    {order.realizedPnl && order.realizedPnl !== "0.0000"
                      ? `${order.realizedPnl.startsWith("-") ? "" : "+"}$${order.realizedPnl}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
