<!--
Sync Impact Report:
- Version Change: 1.0.0 -> 1.1.0 (MINOR: Added architectural principles for Aura Broker Hub, Broker Credibility Passport, Two-Way Marketplace Monetization, and Financial Compliance Governance)
- Modified Principles:
  * Principle I: Server Authority & Financial Data Integrity (Maintained - Non-Negotiable)
  * Principle II: Persistence Boundary & Infrastructure Integrity (Maintained)
  * Principle III: Model-Based AI Guardrails & Tiered Access Governance (Maintained)
  * Principle IV: Canonical Route Governance & Honest Presentation (Maintained)
  * Principle V: Test-First Rigor & Type Safety Gates (Maintained)
  * Principle VI (NEW): Broker Credibility Passport & Verified Role Boundary (NON-NEGOTIABLE)
  * Principle VII (NEW): Two-Way Marketplace Monetization & Server-Authoritative Escrow
  * Principle VIII (NEW): Financial Compliance, Academic Non-Advisory Boundary & Anti-Fraud Safety
- Added Sections:
  * Role Definitions & Authority Matrix (Learner, Broker, Admin)
  * Compliance & Security Stack Specs
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

### VI. Broker Credibility Passport & Verified Role Boundary (NON-NEGOTIABLE)
Access to broker publishing, room creation, and monetization is gated behind verified identity credentials. A user MUST NOT act as a Broker or launch an Exclusive Room without:
1. Valid eKYC verification (full legal name and national ID verification).
2. Authoritative verification of a State Securities Commission of Vietnam (UBCKNN) practicing license number and affiliated securities firm (CTCK).
3. Explicit administrative approval recorded in the immutable audit log.
Anonymous or unverified broker rooms are strictly prohibited.

### VII. Two-Way Marketplace Monetization & Server-Authoritative Escrow
Monetization in the Creator Marketplace operates through strict two-way server-managed cashflows:
1. **Learner Entrance Fee (One-Time Take-Rate)**: Learners pay a single entrance fee per room. Aura Capital acts as an escrow intermediary, automatically retaining a 10%–15% platform take-rate and allocating 85%–90% to the verified broker account.
2. **Broker Tiered SaaS Fee (Monthly Recurring Infrastructure)**: Brokers pay a monthly tiered infrastructure fee (Starter: <50 members, 5GB; Pro: 50–250 members, 20GB; Master: >250 members, high bandwidth/streaming) enforced server-side. Failure to renew downgrades room visibility and locks publishing privileges without disrupting active learners' educational material access.

### VIII. Financial Compliance, Academic Non-Advisory Boundary & Anti-Fraud Safety
To eliminate the rampant "lùa gà" and fraudulent pump-and-dump groups prevalent in Vietnamese social media:
1. **Academic/Educational Disclaimer**: All room materials, posts, and analyses are strictly educational and academic in nature. They MUST NOT constitute unauthorized collective asset management, discretionary fund management, or guaranteed return promises.
2. **Automated Compliance Engine**: All publications, discussion posts, and room announcements are screened by an automated keyword filter flagging illicit promises (e.g., "cam kết lãi 100%", "ủy thác đầu tư", unlicensed forex/crypto schemes). Flagged content is held in the moderation queue for compliance officer review.
3. **Verified Reviews & Traceability**: Only enrolled learners who have maintained active room participation can submit reviews. Star ratings and performance metrics must be tamper-proof and verifiable.

## Role Definitions & Authority Matrix

| Role Key | Name | Capabilities & Scope | Regulatory & Platform Constraints |
|---|---|---|---|
| `LEARNER` | Nhà Đầu Tư / Học Viên (F0) | Khám phá phòng học xác thực, xem Broker Passport, thanh toán phí vào phòng 1 lần, tham gia thảo luận, làm bài tập mô phỏng (Map 1/Map 2), gửi đánh giá minh bạch sau trải nghiệm. | Không được xuất bản room, không được thu phí, không được lôi kéo đầu tư. Được bảo vệ bởi chính sách chống gian lận. |
| `BROKER` | Môi Giới / Chuyên Gia Xác Thực | Xuất bản Exclusive Room, phân phối bài giảng/tài liệu bài bản, nhận định thị trường, tạo kịch bản thực chiến mô phỏng, nhận 85%–90% doanh thu phí vào phòng. | Bắt buộc hoàn tất eKYC và CCHN do UBCKNN cấp; thanh toán phí SaaS hàng tháng theo quy mô thành viên; tuân thủ nghiêm ngặt bộ quy tắc chống cam kết lợi nhuận. |
| `ADMIN` | Quản Trị Viên / Cán Bộ Tuân Thủ | Thẩm định hồ sơ & chứng chỉ UBCKNN của Broker, quản lý tham số chiết khấu sàn (10%–15%) và các gói SaaS, xử lý báo cáo vi phạm, phong tỏa phòng gian lận, truy vết nhật ký kiểm toán. | Mọi thao tác phê duyệt, đình chỉ, can thiệp tài chính đều phải được ghi log kiểm toán bất biến (`AuditLog`). |

## Quality Standards & Technical Stack
- **Web**: React 19, Vite, TypeScript (strict), TanStack Query, Lucide Icons, Vanilla CSS with design tokens.
- **API**: Node.js, Express, TypeScript, Prisma ORM, Redis (rate-limiting & session cache), Zod validation schemas.
- **Shared**: Canonical schemas, DTOs, and error envelopes shared via `@aura/shared`.
- **Compliance & Security**: In-memory access tokens (ADR-004), HttpOnly refresh cookies, automated keyword compliance filtering, server-enforced role-based access control (RBAC).

## Governance
This constitution supersedes all ad-hoc conventions. Any architectural modifications to persistence, auth/role tiers, financial split rules, or routing invariants require formal specification under `.specify/specs/` and verification against the automated test suites and persistence boundary guards.

**Version**: 1.1.0 | **Ratified**: 2026-10-13 | **Last Amended**: 2026-10-23 | **Status**: ACTIVE
