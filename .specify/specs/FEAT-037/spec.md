# FEAT-037 Spec: Current PnL & Portfolio Valuation

## Routes

- `GET /api/simulation/sessions/:simulationId/portfolio`
- `GET /api/simulation/sessions/:simulationId/orders`
- `GET /api/simulation/sessions/:simulationId/trades`

No historical `GET .../valuations` endpoint is approved.

## Current Valuation

Current valuation returns:

- cash
- positions
- market value
- realized PnL
- unrealized PnL
- equity
- current cycle
- simulated marker

Unrealized values use current authoritative market snapshot price for the session `currentCycle`.
