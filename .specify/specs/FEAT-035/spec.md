# FEAT-035 Spec: Market Order Submission & Execution

## Request DTO

```json
{
  "side": "BUY",
  "type": "MARKET",
  "assetSymbol": "AURA",
  "quantity": 1,
  "idempotencyKey": "opaque-client-key"
}
```

Canonical asset identifier: stable `assetSymbol`.

Forbidden fields cause `400 VALIDATION_ERROR`:

- `executionPrice`
- `cashAfter`
- `positionAfter`
- `realizedPnl`
- `unrealizedPnl`
- `status`
- `filledAt`
- `userId`
- `scenario`
- `cycle`

## Minimum Locking Strategy

- Use one TransactionRunner boundary.
- Lock session portfolio row before cash/position mutation.
- Lock target position row when it exists.
- Create missing position under unique `(portfolioId, assetId)` constraint.
- Re-check cash/position after locks.
- Prevent negative cash and negative position with PostgreSQL constraints.

## Response DTO

Response must include only safe fields:

- order id
- side
- type
- asset symbol
- quantity
- status
- execution price as decimal string when filled
- executed quantity
- realized PnL as decimal string
- submittedAt
- filledAt
- idempotency replay indicator if needed
- `simulated: true`
