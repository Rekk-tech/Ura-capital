# FEAT-034 Spec: Portfolio & Position Accounting Foundation

## Authority

```text
trade history = historical execution record
portfolio/position = operational current state
```

## Formulas

- Buy notional = `executionPrice * quantity`.
- Buy cash delta = `-notional`.
- Buy average cost = `(oldQuantity * oldAverageCost + buyNotional) / newQuantity`.
- Sell notional = `executionPrice * quantity`.
- Sell cash delta = `sellNotional`.
- Sell realized PnL = `(executionPrice - averageCost) * quantity`.
- Current market value = `quantity * currentSnapshotPrice`.
- Unrealized PnL = `(currentSnapshotPrice - averageCost) * quantity`.
- Equity = `cashBalance + sum(current market value)`.

All calculations use Decimal operations and approved rounding/normalization.

## Reconciliation

Where practical, tests reconstruct cash, positions, and realized PnL from immutable trades and verify materialized state matches.
