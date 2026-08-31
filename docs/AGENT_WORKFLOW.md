# IDE Human-in-the-Loop Workflow: Codex + Antigravity

## 1. Mục tiêu

Thiết lập quy trình làm việc hoàn toàn trên IDE, không yêu cầu sử dụng CLI.

Vai trò:

- **Human / Product Owner**: duyệt Spec, duyệt thay đổi, quyết định cho phép chuyển bước.
- **Codex**: Requirement Analysis, Planner, Architect, QA/QC, Code Reviewer.
- **Antigravity**: Implementation Agent, thực thi code, UI, logic và test theo Spec đã được duyệt.

Hai Agent **không cần chat trực tiếp với nhau**. Chúng giao tiếp thông qua các file dùng chung trong repository.

---

## 2. Nguyên tắc cốt lõi

```text
Human
  |
  v
Codex
  |
  | tạo Spec / Plan / Checklist
  v
.specify/
  |
  | Human duyệt
  v
Antigravity
  |
  | implementation + test
  v
Source Code / Diff / Report
  |
  v
Codex QA/QC
  |
  | PASS / FAIL
  v
Human
```

Quy tắc:

1. Codex quyết định **WHAT** cần xây dựng và kiểm tra kết quả.
2. Antigravity quyết định **HOW** để implementation.
3. Human quyết định **WHEN** được phép chuyển sang bước tiếp theo.
4. Antigravity không tự ý thay đổi Requirement hoặc Acceptance Criteria đã được duyệt.
5. Codex trong giai đoạn QA không tự sửa implementation code; Codex chỉ báo lỗi và yêu cầu Antigravity sửa.
6. Mọi thông tin quan trọng phải được ghi vào file trong project, không chỉ tồn tại trong cửa sổ chat của Agent.

---

## 3. Cấu trúc thư mục đề xuất

```text
project/
│
├── AGENT_WORKFLOW.md
│
├── AGENTS.md
│
├── README.md
│
├── .gitignore
│
├── .specify/
│   └── specs/
│       └── FEAT-001/
│           ├── requirement.md
│           ├── spec.md
│           ├── plan.md
│           ├── tasks.md
│           └── acceptance.md
│
├── docs/
│   ├── project-overview.md
│   ├── architecture-context.md
│   ├── code-standards.md
│   ├── ui-context.md
│   └── progress-tracker.md
│
├── reports/
│   ├── implementation/
│   │   ├── phase-1/
│   │   ├── phase-2/
│   │   └── phase-3/
│   └── qa/
│       ├── phase-1/
│       ├── phase-2/
│       └── phase-3/
│
├── src/
└── tests/
```

`AGENT_WORKFLOW.md` là file mô tả protocol chung để cả Codex và Antigravity hiểu cách phối hợp.

Report convention:

- Antigravity writes implementation reports to `reports/implementation/phase-N/FEAT-XXX.md`.
- Codex writes QA reports to `reports/qa/phase-N/FEAT-XXX-QA.md`.
- Future features must not create flat reports directly under `reports/implementation/` or `reports/qa/`.

---

# 4. Workflow thực tế trên IDE

## STEP 0 — Khởi tạo Project Context

Human đặt các file quản trị vào repository:

- `AGENT_WORKFLOW.md`
- `AGENTS.md`
- `docs/project-overview.md`
- `docs/architecture-context.md`
- `docs/code-standards.md`
- `docs/ui-context.md`
- `docs/progress-tracker.md`

Sau đó yêu cầu **cả Codex và Antigravity đọc các file này trước khi làm bất kỳ task nào**.

Không cần copy toàn bộ nội dung giữa hai cửa sổ Agent.

---

## STEP 1 — Human giao Requirement cho Codex

Human đưa Requirement/User Story cho Codex.

Ví dụ prompt:

```text
Đọc AGENT_WORKFLOW.md và toàn bộ project context trong docs/.

Bạn đang đóng vai trò Planner + Architect + QA/QC.

Phân tích requirement sau và tạo bộ tài liệu Spec-Driven trong:

.specify/specs/FEAT-001/

Bao gồm:
- requirement.md
- spec.md
- plan.md
- tasks.md
- acceptance.md

Không implementation code.

Sau khi hoàn thành hãy dừng lại để tôi review và approve.
```

Codex tạo Spec, Plan, Tasks và Acceptance Criteria.

---

## STEP 2 — Human review và duyệt Spec

Human mở trực tiếp các file trong:

```text
.specify/specs/FEAT-001/
```

Kiểm tra:

- Requirement có đúng không?
- Scope có rõ không?
- Architecture có phù hợp không?
- Tasks có đủ không?
- Acceptance Criteria có test được không?
- Có requirement nào bị thiếu không?

Nếu chưa đạt:

```text
REJECT / REQUEST CHANGES
```

và yêu cầu Codex cập nhật.

Nếu đạt:

```text
APPROVED
```

Sau khi Human approve thì Spec được xem là baseline cho implementation.

---

## STEP 3 — Human giao implementation cho Antigravity

Human chuyển sang cửa sổ Antigravity.

Prompt mẫu:

```text
Đọc AGENT_WORKFLOW.md.

Đọc toàn bộ project context trong docs/.

Feature hiện tại:

.specify/specs/FEAT-001/

Spec đã được Human APPROVE.

Hãy đọc:
- requirement.md
- spec.md
- plan.md
- tasks.md
- acceptance.md

Sau đó implementation đúng theo Spec.

Không tự ý thay đổi requirement.md, spec.md hoặc acceptance.md.

Thực hiện:
1. implementation source code
2. unit/integration tests cần thiết
3. kiểm tra UI nếu feature có UI
4. chạy các kiểm tra nội bộ có thể thực hiện
5. tạo implementation report tại:

reports/implementation/phase-N/FEAT-XXX.md

Khi hoàn thành hãy dừng lại và chờ QA.
```

Antigravity thực hiện code.

Khi Antigravity chuẩn bị thay đổi file hoặc thực hiện thao tác cần quyền, Human dùng:

- **Approve**
- **Review Changes**

trực tiếp trên IDE.

---

## STEP 4 — Antigravity tạo Implementation Report

Report nên mô tả tối thiểu:

```text
Feature
Files changed
Tasks completed
Tests created
Tests passed
Known limitations
Remaining issues
Acceptance Criteria mapping
```

Ví dụ:

```text
reports/implementation/phase-N/FEAT-XXX.md
```

Sau đó Antigravity dừng.

---

## STEP 5 — Human giao QA/QC lại cho Codex

Human quay lại cửa sổ Codex.

Prompt mẫu:

```text
Đọc AGENT_WORKFLOW.md.

Feature cần QA:

.specify/specs/FEAT-001/

Antigravity đã implementation.

Hãy thực hiện QA/QC độc lập.

Đọc:
- requirement.md
- spec.md
- plan.md
- tasks.md
- acceptance.md
- reports/implementation/phase-N/FEAT-XXX.md

Sau đó:
1. review source code thay đổi
2. kiểm tra implementation so với Spec
3. kiểm tra từng Acceptance Criterion
4. kiểm tra test coverage
5. kiểm tra lỗi logic
6. kiểm tra regression
7. kiểm tra code standards
8. kiểm tra security nếu liên quan
9. không tự sửa implementation code

Tạo QA report tại:

reports/qa/phase-N/FEAT-XXX-QA.md

Kết luận bắt buộc:
PASS hoặc FAIL.

Nếu FAIL, liệt kê defect cụ thể để Antigravity sửa.
```

---

# 5. QA FAIL Loop

Nếu Codex kết luận:

```text
FAIL
```

Human chuyển sang Antigravity và yêu cầu:

```text
Đọc:

reports/qa/phase-N/FEAT-XXX-QA.md

Sửa toàn bộ blocking defects được Codex QA ghi nhận.

Không thay đổi Spec hoặc Acceptance Criteria để né lỗi.

Sau khi sửa:
- cập nhật implementation report
- chạy lại test
- dừng để Codex QA lại.
```

Workflow:

```text
Antigravity
     |
     v
READY FOR QA
     |
     v
Codex
     |
     +---- FAIL ----> Antigravity Fix
     |                    |
     |                    v
     |               READY FOR QA
     |                    |
     +--------------------+
     |
     +---- PASS
```

Vòng lặp tiếp tục cho đến khi Codex PASS.

---

# 6. Human Final Gate

Nếu Codex kết luận:

```text
PASS
```

Human kiểm tra:

- QA report
- UI/result thực tế
- các thay đổi chính
- known limitations

Human quyết định:

```text
APPROVE
```

hoặc:

```text
REJECT
```

Chỉ Human mới có quyền quyết định feature được xem là hoàn thành.

---

# 7. Progress Tracker

Sau mỗi feature/phase, cập nhật:

```text
docs/progress-tracker.md
```

Ví dụ:

```markdown
## FEAT-001

Status: DONE

Spec:
APPROVED

Implementation:
COMPLETED

QA:
PASS

Human Approval:
APPROVED

Artifacts:

- .specify/specs/FEAT-001/requirement.md
- .specify/specs/FEAT-001/spec.md
- .specify/specs/FEAT-001/plan.md
- .specify/specs/FEAT-001/tasks.md
- .specify/specs/FEAT-001/acceptance.md
- reports/implementation/phase-N/FEAT-XXX.md
- reports/qa/phase-N/FEAT-XXX-QA.md
```

---

# 8. Quy trình tổng thể

```text
1. HUMAN
   |
   | Requirement / User Story
   v
2. CODEX
   |
   | Requirement Analysis
   | Architecture
   | Spec
   | Plan
   | Tasks
   | Acceptance Criteria
   v
3. HUMAN GATE
   |
   | Review Spec
   |
   +---- REJECT ---> CODEX sửa Spec
   |
   +---- APPROVE
             |
             v
4. ANTIGRAVITY
   |
   | Implementation
   | Unit Test
   | Integration Test
   | UI Verification
   | Implementation Report
   v
5. CODEX QA/QC
   |
   | Code Review
   | Spec Verification
   | Acceptance Test Review
   | Regression
   | Security / Standards
   |
   +---- FAIL ---> ANTIGRAVITY sửa
   |                 |
   |                 +----> CODEX QA lại
   |
   +---- PASS
             |
             v
6. HUMAN FINAL GATE
   |
   +---- REJECT
   |
   +---- APPROVE
             |
             v
           DONE
```

---

# 9. Phân quyền

## Codex

Được phép:

- phân tích Requirement
- thiết kế architecture
- tạo Spec
- tạo Plan
- tạo Tasks
- tạo Acceptance Criteria
- đọc source code
- review diff
- kiểm tra tests
- QA/QC
- tạo defect report

Không được:

- tự implementation feature trong QA workflow
- tự approve Spec
- tự approve release
- tự thay đổi Acceptance Criteria sau khi Human approve để làm cho implementation PASS

---

## Antigravity

Được phép:

- đọc toàn bộ Spec
- implementation source code
- tạo/sửa tests
- sửa UI
- chạy kiểm tra
- sửa defect do QA report
- tạo implementation report

Không được:

- tự thay đổi Requirement đã approve
- tự thay đổi Acceptance Criteria đã approve
- tự tuyên bố release được Human approve
- bỏ qua defect blocking của QA

---

## Human

Có quyền:

- approve/reject Spec
- approve/reject IDE changes
- yêu cầu sửa Requirement
- override kế hoạch khi cần
- approve/reject kết quả cuối
- quyết định chuyển phase

---

# 10. Source of Truth

Thứ tự ưu tiên:

```text
Human Decision
     >
Approved Requirement / Spec
     >
Acceptance Criteria
     >
Architecture / Code Standards
     >
Implementation Plan
     >
Implementation
```

Conversation của Agent không phải Source of Truth.

Các file trong repository mới là Source of Truth.

---

# 11. Quy tắc trước khi Agent bắt đầu

Cả Codex và Antigravity phải:

1. đọc `AGENT_WORKFLOW.md`
2. đọc `docs/project-overview.md`
3. đọc `docs/architecture-context.md`
4. đọc `docs/code-standards.md`
5. đọc `docs/ui-context.md` nếu liên quan UI
6. đọc `docs/progress-tracker.md`
7. đọc Spec của feature hiện tại
8. chỉ thực hiện đúng role được giao

Nếu có conflict giữa tài liệu:

**STOP và yêu cầu Human quyết định.**

---

# 12. Mô hình vận hành IDE

Không yêu cầu:

- Codex CLI
- Antigravity CLI
- shell orchestrator
- Agent API gọi lẫn nhau
- MCP Agent-to-Agent

Chỉ cần:

```text
Shared Repository
+
Codex IDE Agent
+
Antigravity IDE Agent
+
Human Approval
```

Hai Agent giao tiếp gián tiếp qua:

```text
.specify/
docs/
reports/
source code
tests/
```

Human là orchestration layer ở giai đoạn đầu.

---

# 13. Quy tắc vàng

```text
CODEX
Plans WHAT should be built
and verifies WHAT was built.

ANTIGRAVITY
Implements HOW it is built.

HUMAN
Decides WHETHER the workflow
is allowed to proceed.
```

Đây là mô hình Human-in-the-Loop + Spec-Driven Development được sử dụng cho toàn bộ project.

## Git / GitHub Ownership

### Antigravity

- May inspect Git state.
- May stage implementation changes.
- May create local feature/rework commits.
- MUST NOT push implementation commits to remote before:
  1. Codex QA PASS
  2. Human Final Gate APPROVED
  3. Explicit Human push authorization

### Codex

- May inspect Git diff/history for QA.
- MUST NOT modify implementation code.
- SHOULD NOT push implementation commits.
- May recommend commit/push readiness after QA PASS.

### Human

- Owns remote publication gate.
- Explicitly authorizes push/merge after QA PASS.
- Owns merge/release decision.

### Rule

No feature implementation may be pushed/merged to the protected main branch
before Human Final Gate approval.
