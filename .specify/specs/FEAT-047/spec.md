# FEAT-047 Specification: Phase 6 Community Integration Gate

Status: PLANNED / HUMAN MASTER PLANNING APPROVED / BLOCKED BY FEAT-041..FEAT-046

## Validation Architecture

FEAT-047 is validation-only. Codex executes independent source review, live service validation, migration tests, runtime E2E, security/adversarial tests, and evidence/governance reconciliation. Defects are assigned to the owning feature; FEAT-047 must not change earlier specs or implementation to hide them.

## Mandatory Cross-Feature Flows

### Community Journey

Authenticate learner A -> empty feed -> create post -> feed/detail -> learner B reads -> B comments -> A reads comment/count -> A and B like -> exact count 2 -> A unlikes -> exact count 1 -> B cannot remove A post -> A removes post -> post/comments/like mutation unavailable.

### Comment And Ownership

Visible post -> two users create comments -> deterministic cursor order -> each owner can remove own comment -> cross-user delete returns same safe unavailable contract -> visible count remains exact.

### Concurrency

Five concurrent likes by one user/post -> one durable row. Multiple users -> one row each. Concurrent create/remove and unavailable-resource paths must not corrupt counts or visibility.

### Moderation And Abuse

Forged identity/status/admin fields rejected; hidden/removed unavailable; no public moderation route/UI; exact rate thresholds and 429; spoofed XFF no bypass; Redis outage blocks writes before mutation while reads remain; recovery resumes writes.

### Frontend

Real auth -> feed -> create -> detail -> comment -> like/unlike -> owner removal. Validate loading/empty/404/429/503 states, safe text, keyboard/accessibility, explicit pagination, and no optimistic authoritative-count drift.

## Database Validation

- Fresh independent database: deploy all migrations from zero and verify status.
- Independent upgrade database: apply approved Phase 5 migrations, insert representative prior rows, capture rows/relationships/constraints/indexes, apply FEAT-041 migration, verify preservation and Community constraints.
- Confirm all applied migrations immutable and migration guard clean.

## Security Matrix

Validate authentication, ownership, IDOR, user enumeration, forbidden fields, length boundaries, XSS-safe UI, safe diagnostics, Redis key/log privacy, no `AuthSecurityAuditRecord` reuse, no public role/admin capability, and no durable Redis authority.

## Defect Severity

- P0: exploitable privilege/data loss/secret exposure or systemic integrity failure.
- P1: core journey, migration, authorization, concurrency, or durable-state failure.
- P2: material approved behavior/evidence/accessibility failure without P0/P1 impact.
- P3: non-blocking polish/advisory.

## Output

The report includes environment evidence, migration evidence, exact suite counts, security matrix, AC-001..AC-040, defect list, regression result, governance state, and final PASS/FAIL. PASS makes Phase 6 ready for Human Phase Final Gate; it does not approve Phase 6 or start Phase 7.
