<!--
Sync Impact Report:
- Version Change: 1.1.0 -> 1.2.0 (MINOR: Formalized 5-Role Segregation of Duties (SoD), 4 Core Governance Principles, and Full Cross-Module RBAC Matrix)
- Modified Principles:
  * Principle I: Server Authority & Financial Data Integrity (Maintained - Non-Negotiable)
  * Principle II: Persistence Boundary & Infrastructure Integrity (Maintained)
  * Principle III: Model-Based AI Guardrails & Tiered Access Governance (Maintained)
  * Principle IV: Canonical Route Governance & Honest Presentation (Maintained)
  * Principle V: Test-First Rigor & Type Safety Gates (Maintained)
  * Principle VI: Broker Credibility Passport, 2-Tier Gatekeeping Barrier & Verified Role Boundary (Enhanced)
  * Principle VII: Two-Way Marketplace Monetization & Server-Authoritative Escrow (Maintained)
  * Principle VIII: Financial Compliance, Academic Non-Advisory Boundary & Content Decoupling (Enhanced)
  * Principle IX (NEW): Segregation of Duties (SoD) & 5-Role Ecosystem Boundary (NON-NEGOTIABLE)
  * Principle X (NEW): Account Governance Cross-Protection & Immutable Audit Logging (NON-NEGOTIABLE)
- Added Sections:
  * 5-Role Ecosystem Definitions (GUEST, LEARNER, BROKER, MODERATOR, SYSTEM_ADMIN)
  * Complete Cross-Module RBAC Matrix (Academy, Broker Hub, Simulation, Community, Admin Governance)
  * 4 Core Architectural & Operational Invariants
- Removed Sections: None
- Follow-up TODOs: None
-->

# Aura Capital Project Constitution

## Core Principles

### I. Server Authority & Financial Data Integrity (NON-NEGOTIABLE)
All financial figures, portfolio NAV, cash balances, transaction orders, simulation cycles, XP rewards, marketplace entrance fees, SaaS subscription billings, and revenue shares are strictly server-authoritative. The client is purely a presentation and interaction surface; it MUST NEVER compute authoritative monetary balances, adjust payout splits, alter order fills, or forge subscription entitlements.

### II. Persistence Boundary & Infrastructure Integrity
PostgreSQL managed via Prisma ORM and transaction runners is the sole authoritative persistence layer. Direct mutable filesystem persistence (`writeFile`, `appendFile`, file-based database engines like `lowdb` or `db.json`) is strictly prohibited in runtime code and continuously enforced by automated boundary test guards.

### III. Model-Based AI Guardrails & Tiered Access Governance
All LLM and AI Agent interactions must pass through Model-Based Safety Guardrails assessing domain relevance (financial education, investment analysis) and eliminating toxic/adversarial prompt injections before agent processing. Access to real-time AI advisory is strictly limited to authenticated VIP Patron members and System Administrators, protected by token-bucket rate limiting to guarantee infrastructure resilience.

### IV. Canonical Route Governance & Honest Presentation
Every route registered in `ROUTE_REGISTRY` must reflect true system capability. No routes may falsely advertise unimplemented features. Once marked `AVAILABLE`, routes must provide a complete, accessible, keyboard-navigable experience with deterministic loading and error boundaries.

### V. Test-First Rigor & Type Safety Gates
Every business domain (Academy, Simulation, Portfolio, Community, Subscription, AI Studio, Admin, Broker Hub) requires comprehensive unit, integration, and contract tests. Zero TypeScript errors (`tsc --noEmit` exit code 0) and zero persistence guard violations are mandatory preconditions for all merged code.

### VI. Broker Credibility Passport, 2-Tier Gatekeeping Barrier & Verified Role Boundary (NON-NEGOTIABLE)
Access to broker publishing, room creation, and monetization is gated behind verified identity credentials and a strict 2-tier barrier ("Chống lùa gà"):
1. **Tier 1 (Input Gate — Governed exclusively by SYSTEM_ADMIN)**: A user requesting promotion to `BROKER` MUST submit state-verified eKYC (National ID/CCCD) and an authoritative State Securities Commission of Vietnam (UBCKNN) practicing license number and affiliated securities firm (CTCK). Only `SYSTEM_ADMIN` possesses the authority to verify, approve, and grant the `BROKER` role and blue badge.
2. **Tier 2 (Operational Gate — Governed primarily by MODERATOR)**: All publications, course lessons, and strategy notes within a Broker's Room are subject to automated compliance scanning and post-publication moderation. Any user report or flagged keyword routing to the moderation queue must be evaluated by `MODERATOR` to hide offending content or escalate for room suspension.
3. Anonymous, unverified, or self-promoted broker rooms are strictly prohibited.

### VII. Two-Way Marketplace Monetization & Server-Authoritative Escrow
Monetization in the Creator Marketplace operates through strict two-way server-managed cashflows:
1. **Learner Entrance Fee (One-Time Take-Rate)**: Learners pay a single entrance fee per room. Aura Capital acts as an escrow intermediary, automatically retaining a 10%–15% platform take-rate and allocating 85%–90% to the verified broker account.
2. **Broker Tiered SaaS Fee (Monthly Recurring Infrastructure)**: Brokers pay a monthly tiered infrastructure fee (Starter: <50 members, 5GB; Pro: 50–250 members, 20GB; Master: >250 members, high bandwidth/streaming) enforced server-side. Failure to renew downgrades room visibility and locks publishing privileges without disrupting active learners' educational material access.

### VIII. Financial Compliance, Academic Non-Advisory Boundary & Content Decoupling
To eliminate fraudulent pump-and-dump groups and protect market integrity:
1. **Clear Course Content Decoupling**: Official curriculum on Aura Academy (`/academy`) represents the standardized institutional educational syllabus; ONLY `MODERATOR` and `SYSTEM_ADMIN` may create, update, or publish official academy courses. Broker Hub materials (`/broker-hub`) are specialized proprietary lessons and research authored by individual Brokers strictly within their own Room boundaries.
2. **Academic/Educational Disclaimer**: All room materials, posts, and analyses are strictly educational and academic in nature. They MUST NOT constitute unauthorized collective asset management, discretionary fund management, or guaranteed return promises.
3. **Automated Compliance Engine**: All publications, discussion posts, and room announcements are screened by an automated keyword filter flagging illicit promises (e.g., "cam kết lãi 100%", "chắc chắn ăn bằng lần", "ủy thác đầu tư", unlicensed forex/crypto schemes). Flagged content is held in the moderation queue for compliance review.
4. **Verified Reviews & Traceability**: Only enrolled learners who have maintained active room participation can submit reviews. Star ratings and performance metrics must be tamper-proof and verifiable.

### IX. Segregation of Duties (SoD) & 5-Role Ecosystem Boundary (NON-NEGOTIABLE)
The ecosystem enforces a strict 5-Role Segregation of Duties architecture:
1. `GUEST`: Unauthenticated public visitor. Read-only access to landing pages, public course catalogs, public community feed, and public broker credibility profiles. Zero mutation or learning progression access.
2. `LEARNER`: Standard authenticated investor (default post-OTP). Enjoys full learning progression (lessons, flashcards, quizzes, XP rewards), simulation arena participation (Map 1 & Map 2), community interactions, room enrollment, and verified review submissions.
3. `BROKER`: State-certified creator holding UBCKNN credentials. Inherits full `LEARNER` capabilities plus proprietary room administration (`/broker-hub/rooms/:id`), exclusive course/insight publishing inside their own room, and combat scenario creation for room members. Strictly barred from modifying system-wide Academy courses or platform administrative settings.
4. `MODERATOR`: Academic editor & content moderation guardian. Authoritative curator of official Academy courses, global community queue supervisor, and broker room content inspector. Granted temporary mute (up to 24h) and content removal powers. Strictly barred from modifying user roles, financial ledger parameters, or virtual portfolio balances.
5. `SYSTEM_ADMIN`: Supreme operational, identity, and financial administrator. Exclusive authority over broker credential approval, role assignments (`LEARNER` ↔ `BROKER` ↔ `MODERATOR`), global user account suspension/activation, simulation server recovery, marketplace fee/take-rate parameters, and immutable audit logs.

### X. Account Governance Cross-Protection & Immutable Audit Logging (NON-NEGOTIABLE)
1. **Cross-Protection Invariants**:
   - `SYSTEM_ADMIN` CANNOT self-suspend or self-demote their own account. Any change to a `SYSTEM_ADMIN` role requires a distinct active administrator.
   - `MODERATOR` cannot alter user account roles, fee structures, or account balances; their punitive scope is strictly bounded to hiding offending posts/comments and temporary communication mutes (≤ 24 hours).
2. **Immutable Audit Trail**:
   - Every privileged operation (role transition, broker verification, content suppression, account suspension/activation, simulation reset, fee parameter update) MUST atomically append a record to the immutable audit log (`AuthSecurityAuditRecord` / `AuditLog`).
   - Each audit entry MUST capture `actorUserId`, `subjectUserId` (or target resource ID), `eventType`, `outcome`, `requestId`, `occurredAt`, and detailed `metadata` containing the human or operational `reason`.
   - Audit logs are append-only; update and deletion permissions are strictly revoked at both database and application layers.

---

## Role Definitions & Authority Matrix (RBAC Matrix)

| Nghiệp Vụ / Chức Năng Cụ Thể | GUEST | LEARNER | BROKER | MODERATOR | SYSTEM_ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Học Viện Chính Thống (`Aura Academy`)** | | | | | |
| Xem danh mục khóa học & đọc bài mở đầu | ✅ | ✅ | ✅ | ✅ | ✅ |
| Học toàn bộ bài, lật Flashcard, làm Quiz nhận XP | ❌ | ✅ | ✅ | ✅ | ✅ |
| Đăng mới / Chỉnh sửa khóa học gốc của hệ thống | ❌ | ❌ | ❌ | ✅ *(Chính)* | ✅ |
| **2. Phòng Chuyên Gia (`Broker Hub`)** | | | | | |
| Xem Hồ sơ tín nhiệm & Chứng chỉ của Broker | ✅ | ✅ | ✅ | ✅ | ✅ |
| Nộp hồ sơ (Chứng chỉ UBCKNN + eKYC) xin lên Broker | ❌ | ✅ | ➖ | ❌ | ❌ |
| Duyệt hồ sơ & Cấp tích xanh mở quyền BROKER | ❌ | ❌ | ❌ | ❌ | ✅ *(Duy nhất)* |
| Tạo Room riêng, đăng khóa học/nhận định trong Room | ❌ | ❌ | ✅ *(Room mình)* | ❌ | ❌ |
| Mua vé vào Room của Broker & chấm điểm Review | ❌ | ✅ | ✅ | ❌ | ❌ |
| Kiểm duyệt / Gỡ bài giảng Broker vi phạm quy chế | ❌ | ❌ | ❌ | ✅ *(Chính)* | ✅ |
| **3. Đấu Trường Giả Lập (`Map 1 & Map 2`)** | | | | | |
| Tham gia thi đấu Map 1 & mở khóa Map 2 | ❌ | ✅ | ✅ | ✅ | ✅ |
| Tạo kịch bản bài tập thực chiến cho học viên trong Room | ❌ | ❌ | ✅ | ✅ | ✅ |
| Giám sát phiên lỗi & Reset phiên bị treo (`/admin`) | ❌ | ❌ | ❌ | ❌ | ✅ *(Duy nhất)* |
| **4. Diễn Đàn Cộng Đồng (`/community`)** | | | | | |
| Xem bài thảo luận & Bảng xếp hạng | ✅ | ✅ | ✅ | ✅ | ✅ |
| Đăng bài viết, bình luận, thả tim & báo cáo (Report) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Xử lý hàng đợi báo cáo, ẩn bài/bình luận vi phạm | ❌ | ❌ | *(Chỉ trong Room mình)* | ✅ *(Toàn sàn)* | ✅ |
| **5. Quản Lý Tài Khoản & Hệ Thống (`/admin`)** | | | | | |
| Khóa / Mở khóa (Suspend / Activate) người dùng | ❌ | ❌ | ❌ | *(Tạm khóa 24h)* | ✅ *(Toàn quyền)* |
| Thay đổi Role (`LEARNER` ↔ `BROKER` ↔ `MODERATOR`) | ❌ | ❌ | ❌ | ❌ | ✅ *(Duy nhất)* |
| Quản lý gói cước, phí duy trì Room & đối soát doanh thu | ❌ | ❌ | *(Xem doanh thu Room)* | ❌ | ✅ *(Duy nhất)* |
| Xem Nhật ký Kiểm toán bất biến (`Immutable Audit Logs`) | ❌ | ❌ | ❌ | ❌ | ✅ *(Duy nhất)* |

---

## Four Core Architectural & Operational Invariants

1. **Strict Course Authoring Decoupling**:
   - Official Academy courses (`/academy`): Institutional curriculum managed exclusively by `MODERATOR` and `SYSTEM_ADMIN`.
   - Broker Hub Room materials (`/broker-hub`): Expert proprietary content created solely by the room's certified `BROKER`, under post-publication compliance review by `MODERATOR`.
2. **Two-Tier Broker Gatekeeping Barrier ("Chống Lùa Gà")**:
   - **Gate 1 (Admission)**: Controlled strictly by `SYSTEM_ADMIN` via verified UBCKNN license & eKYC credentials.
   - **Gate 2 (Operation)**: Supervised continuously by `MODERATOR` via automated keywords & user violation reports.
3. **Account Governance Cross-Protection**:
   - Self-suspension and self-demotion by `SYSTEM_ADMIN` are rejected at the domain service layer.
   - `MODERATOR` scope is restricted to content removal and 24-hour mutes; role elevation, billing edits, and virtual balance tampering are prohibited.
4. **Universal Immutable Auditability**:
   - Every administrative, moderation, and role-mutation action commits an unalterable audit log entry containing actor, subject, timestamp, outcome, and mandatory justification.

---

## Quality Standards & Technical Stack
- **Web**: React 19, Vite, TypeScript (strict), TanStack Query, Lucide Icons, Vanilla CSS with design tokens.
- **API**: Node.js, Express, TypeScript, Prisma ORM, Redis (rate-limiting & session cache), Zod validation schemas.
- **Shared**: Canonical schemas, DTOs, and error envelopes shared via `@aura/shared`.
- **Compliance & Security**: In-memory access tokens (ADR-004), HttpOnly refresh cookies, automated keyword compliance filtering, server-enforced role-based access control (RBAC).

## Governance
This constitution supersedes all ad-hoc conventions. Any architectural modifications to persistence, auth/role tiers, financial split rules, or routing invariants require formal specification under `.specify/specs/` and verification against the automated test suites and persistence boundary guards.

**Version**: 1.2.0 | **Ratified**: 2026-10-13 | **Last Amended**: 2026-10-25 | **Status**: ACTIVE
