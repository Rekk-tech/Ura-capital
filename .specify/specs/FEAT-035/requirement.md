# FEAT-035 Requirement: Market Order Submission & Execution

Status: PLANNED / BLOCKED BY FEAT-034
Phase: Phase 5 - Simulation Engine
Type: Implementation feature

## Human Decisions

HUMAN APPROVED: MARKET only, whole-share integer quantity, short selling deferred, margin/leverage deferred, fee = 0, slippage = 0, execution price = current authoritative market snapshot price, idempotency scope `userId + simulationId + idempotencyKey`.

## Goal

Implement financially safe MARKET order submission and synchronous execution. FEAT-035 must not ship an unsafe order checkpoint.

## Functional Requirements

- FR-001 Route: `POST /api/simulation/sessions/:simulationId/orders`.
- FR-002 Strict request body contains only `side`, `type`, `assetSymbol`, `quantity`, `idempotencyKey`.
- FR-003 Any unapproved authority field returns `400 VALIDATION_ERROR`.
- FR-004 MARKET is the only order type.
- FR-005 Execution price comes from current authoritative market snapshot.
- FR-006 BUY prevents concurrent overspend.
- FR-007 SELL prevents concurrent oversell.
- FR-008 Execution transaction atomically writes order, trade, cash mutation, position mutation, and realized PnL.
- FR-009 Minimum complete idempotency semantics are implemented in FEAT-035.
- FR-010 Same idempotency key + same canonical fingerprint returns original result.
- FR-011 Same idempotency key + different canonical payload returns `409 IDEMPOTENCY_CONFLICT`.
- FR-012 PostgreSQL unique constraints are final idempotency authority.
- FR-013 Redis is not idempotency/order/portfolio authority.
- FR-014 Response whitelist is deterministic for replay and safe for clients.
- FR-015 Record implementation evidence in `reports/implementation/phase-5/FEAT-035.md`.
