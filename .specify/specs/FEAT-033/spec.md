# FEAT-033 Spec: Simulation Session Lifecycle

## Routes

- `GET /api/simulation/sessions`
- `POST /api/simulation/sessions`
- `GET /api/simulation/sessions/:simulationId`
- `POST /api/simulation/sessions/:simulationId/start`
- `POST /api/simulation/sessions/:simulationId/complete`
- `POST /api/simulation/sessions/:simulationId/cancel`
- `POST /api/simulation/sessions/:simulationId/reset`

Authentication is required for every route.

## Lifecycle

```text
CREATED -> ACTIVE -> COMPLETED
CREATED -> CANCELLED
ACTIVE -> CANCELLED
```

No other transition is valid.

## Active Session Policy

PostgreSQL partial unique protection must enforce at most one `ACTIVE` session per user. Service pre-checks may improve UX but are not race protection.

## Reset

Reset is atomic: cancel old current session, create new `CREATED` session with approved starting cash and default scenario. Never delete historical data.

## Strict Body

Any client-owned authority field returns `400 VALIDATION_ERROR`.
