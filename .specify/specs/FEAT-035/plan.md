# FEAT-035 Plan

## Implementation Approach

1. Implement strict MARKET order route and request schema.
2. Implement canonical request fingerprint and PostgreSQL idempotency uniqueness.
3. Implement current snapshot price lookup.
4. Implement BUY/SELL execution in one transaction with minimum locking.
5. Add same-key replay and conflict handling.
6. Add minimum concurrent overspend/oversell tests.
7. Run canonical validation and write `reports/implementation/phase-5/FEAT-035.md`.
