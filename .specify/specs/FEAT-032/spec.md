# FEAT-032 Spec: Asset Universe & Market Snapshot Read Model

## Routes

- `GET /api/simulation/assets`
- `GET /api/simulation/scenarios/:scenarioKey/snapshots/:cycle`

Authentication: required for both routes.

## DTO Rules

Asset DTO:

- `symbol`
- `name`
- `assetType`
- `status`
- `displayOrder`
- `simulated: true`

Snapshot DTO:

- `scenarioKey`
- `cycle`
- `assetSymbol`
- `price`
- `occurredAt`
- `simulated: true`

Prices are serialized as decimal strings.

## Authority

Only persisted `SimulationMarketSnapshot` rows are authoritative. The browser cannot provide price, cycle, scenario status, or asset availability.

## Non-Mutation

GET routes must not create sessions, advance cycles, seed snapshots, mutate assets, or perform portfolio/order changes.
