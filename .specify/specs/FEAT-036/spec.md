# FEAT-036 Spec: Order Idempotency & Concurrency Adversarial Hardening

FEAT-035 already owns:

- canonical idempotency scope
- DB uniqueness
- request fingerprint
- same request replay
- conflicting request rejection
- minimum BUY/SELL locking
- atomic execution

FEAT-036 hardens this with high-contention and failure-injection tests.

Required scenarios:

- same-key concurrent identical requests
- same-key concurrent conflicting requests
- concurrent distinct BUY orders near cash limit
- concurrent distinct SELL orders near position limit
- duplicate unique constraint race
- simulated transport retry after committed order
- safe diagnostics for deadlock/constraint/unavailable DB paths
