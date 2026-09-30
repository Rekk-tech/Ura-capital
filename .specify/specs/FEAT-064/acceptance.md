# FEAT-064 Acceptance Criteria: Academy Retrieval / RAG Foundation

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED

- AC-001 Only approved published learner-visible Academy content is eligible; drafts, hidden/removed content, answer keys, and internal fields are absent.
- AC-002 Retrieval uses one approved port and deterministic lexical reads through existing Academy boundaries.
- AC-003 Hostile queries cannot become SQL/Prisma/provider/system configuration, and all read values remain safely parameterized.
- AC-004 Results are top-k bounded and each citation has stable safe source/title/freshness/version provenance.
- AC-005 Retrieved instructions remain untrusted evidence and cannot override policy, authorize actions, or modify security/context selection.
- AC-006 Per-document and aggregate byte/token/result limits are enforced before model invocation.
- AC-007 Empty, stale, removed, malformed, and unavailable corpus states produce deterministic no-evidence/error behavior without invented citations.
- AC-008 Learner-specific evidence remains scoped to the authenticated user and cross-user/draft probes fail safely.
- AC-009 No vector database, embedding service, product table, migration, or provider file store is introduced in Phase 8.
- AC-010 Relevance/citation/injection/answer-secrecy/determinism/live PostgreSQL/Phase 4 regression and exact-source CI pass.

## Traceability

| Requirement | Task | Acceptance |
|---|---|---|
| FR-001 | T001 | AC-001 |
| FR-002 | T002 | AC-002 |
| FR-003 | T003 | AC-003 |
| FR-004 | T004 | AC-004 |
| FR-005 | T005 | AC-005 |
| FR-006 | T006 | AC-006 |
| FR-007 | T007 | AC-007 |
| FR-008 | T008 | AC-008 |
| FR-009 | T009 | AC-009 |
| FR-010 | T010 | AC-010 |

## M1..M8 Acceptance Traceability

- M2 -> FR-002..004 and FR-010/T002..T004 and T010/AC-002..004 and AC-010: NFKC, accent/no-accent comparison, original-text citations, versioned Vietnamese fixtures, and approved relevance judgments.
- M3 -> FR-001 and FR-008/T001 and T008/AC-001 and AC-008: strict published-content and current-user data allowlist.
- M4 -> FR-004 and FR-006/T004 and T006/AC-004 and AC-006: enforce frozen top-k/document/aggregate byte-token bounds.
- M6 -> FR-004/T004/AC-004: preserve citation language while the answer follows query language.
- M7 -> FR-009/T009/AC-009: no response/user-context/vector/hidden cross-user cache.
- M8 -> FR-004 and FR-010/T004 and T010/AC-004 and AC-010: version corpus, normalization, relevance judgments, ranking, and threshold evidence.
- P8-D12 proposal -> FR-001..004 and FR-010/T001..T004 and T010/AC-001..004 and AC-010: after explicit Human approval, evidence must reproduce section 12.5 and identify the approved corpus/judgment/scoring manifest hashes. A proposal or unadjudicated fixture set cannot pass.

## Hard-Fail Conditions

Open P0/P1, mandatory validation skipped, secret/privacy leakage, cross-user access, provider/model/client authority over business state, unsafe fallback, unauthorized schema/migration, scope leakage, or falsified evidence results in FAIL.
