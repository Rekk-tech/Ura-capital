# FEAT-033 Plan

## Implementation Approach

1. Implement session routes under `/api/simulation/sessions`.
2. Use authenticated principal as sole user authority.
3. Bind sessions to approved default scenario and cycle `1`.
4. Enforce active-session uniqueness with PostgreSQL partial unique protection.
5. Implement reset in one transaction.
6. Add unit and live PostgreSQL tests.
7. Run canonical validation and write `reports/implementation/phase-5/FEAT-033.md`.
