# FEAT-064 Tasks: Academy Retrieval / RAG Foundation

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED

- [ ] T001 Define corpus inclusion/exclusion and provenance rules. (FR-001; AC-001).
- [ ] T002 Implement the retrieval port and deterministic lexical Academy adapter. (FR-002; AC-002).
- [ ] T003 Implement safe query normalization and parameterized read behavior. (FR-003; AC-003).
- [ ] T004 Implement bounded evidence results and citation projection. (FR-004; AC-004).
- [ ] T005 Implement untrusted-document framing and action/override denial. (FR-005; AC-005).
- [ ] T006 Implement per-document and aggregate resource budgets. (FR-006; AC-006).
- [ ] T007 Implement empty/stale/removed/malformed/unavailable outcomes. (FR-007; AC-007).
- [ ] T008 Add learner-scope, draft, and cross-user isolation protections. (FR-008; AC-008).
- [ ] T009 Verify zero vector/embedding/file-store/schema/migration scope. (FR-009; AC-009).
- [ ] T010 Run retrieval evaluation, live DB/security/Phase 4 regression, exact-source CI, and publish the implementation report. (FR-010; AC-010).

## M1..M8 Task Traceability

- M2 -> FR-002..004 and FR-010/T002..T004 and T010/AC-002..004 and AC-010: NFKC, accent/no-accent comparison, original-text citations, versioned Vietnamese fixtures, and approved relevance judgments.
- M3 -> FR-001 and FR-008/T001 and T008/AC-001 and AC-008: strict published-content and current-user data allowlist.
- M4 -> FR-004 and FR-006/T004 and T006/AC-004 and AC-006: enforce frozen top-k/document/aggregate byte-token bounds.
- M6 -> FR-004/T004/AC-004: preserve citation language while the answer follows query language.
- M7 -> FR-009/T009/AC-009: no response/user-context/vector/hidden cross-user cache.
- M8 -> FR-004 and FR-010/T004 and T010/AC-004 and AC-010: version corpus, normalization, relevance judgments, ranking, and threshold evidence.
- P8-D12 proposal -> FR-001..004 and FR-010/T001..T004 and T010/AC-001..004 and AC-010: after Human approval, build and score the exact section-12.5 corpus/query manifests, language strata, 0..3 judgments, adjudication, Recall@5/MRR@5, and separate no-evidence suite.

## Dependency Order

T001 -> T002/T003 -> T004..T009 -> T010.

## Completion Rule

A task is complete only when its implementation and mapped evidence pass on the exact source. Task completion does not imply independent QA or Human Final Gate approval.
