# Feature Specification: FEAT-085 Commercial Subscription Center, Gamification Loop & Simulation Scoreboard

**Feature Code**: `FEAT-085`  
**Created**: 2026-10-13  
**Status**: APPROVED  
**Owners**: Antigravity Pair Programmer & Codex Architecture  
**Dependencies**: FEAT-071 (Auth), FEAT-072 (Dashboard), FEAT-076 (Subscription APIs), FEAT-082 (Simulation Maps), FEAT-084 (AI Access Control)  

---

## 1. Executive Summary

FEAT-085 elevates Aura Capital from an educational MVP into a complete commercial-grade product by executing two critical pillars:
1. **Commercial Subscription & Membership Center**: Un-gates `/subscription` from placeholder status to render the full `SubscriptionPage` and mock checkout upgrade flow, enabling instant entitlement unlocks that synchronize immediately with the Aura Intelligence AI Coach and navigation header.
2. **Simulation Gamification & Scoreboard Loop**: Integrates Map 1 (FOMO Arena) and Map 2 (Pro Room) run completions into learner progression (XP ledger, Trader Level, Achievement Badges like *Survivor Badge* and *Macro Tactician*), showcased dynamically on the Learner Dashboard (`/dashboard`), User Profile (`/profile`), and Global Leaderboard.

---

## 2. User Stories & Acceptance Criteria

### User Story 1 - Commercial Subscription & Instant Plan Upgrade (Priority: P1)
As a learner on the Free tier,  
I want to visit the Subscription Center (`/subscription`), review tier benefits (Free, Premium VIP, Institutional Pro), and upgrade my account with a simulated instant checkout,  
So that my subscription status activates immediately and unblocks the Aura Intelligence AI Coach and premium features without manual administrator intervention.

**Independent Test**:
Visit `/subscription`, click "Nâng Cấp Gói Premium" on the Premium tier card, complete confirmation dialog. Verify that:
1. Active plan transitions to `PREMIUM`.
2. AI Coach modal immediately displays `PREMIUM VIP` badge and allows active questioning.
3. Cancellation and plan details update cleanly.

**Acceptance Scenarios**:
1. **Given** an authenticated user on the Free tier, **When** they navigate to `/subscription`, **Then** the page renders the comparison grid of plans with active plan indicated on Free tier.
2. **Given** an authenticated user selects "Nâng Cấp Gói Premium", **When** checkout executes, **Then** `/api/subscriptions` updates the user's active plan, queries invalidate, and user receives +500 XP bonus.
3. **Given** unauthenticated visitor visits `/subscription`, **When** viewing plans, **Then** they see pricing and "Đăng nhập để nâng cấp" CTAs.

---

### User Story 2 - Map 1 & Map 2 Simulation Gamification Integration (Priority: P1)
As a simulation participant,  
I want my trading decisions in Map 1 (FOMO Arena) and Map 2 (Pro Room) to record high scores, calculate behavioral FOMO ratings, and award XP and Badges upon round completion,  
So that my learning progress and psychological trading discipline are tangibly rewarded.

**Independent Test**:
Complete all 7 rounds of Map 1 or a game session of Map 2. Verify:
1. Game summary modal displays NAV, Profit %, and Behavioral Rating.
2. Earned XP is added to total profile XP.
3. Badges unlocked (e.g. *Huy Hiệu Sinh Tồn - Survivor Badge* if final portfolio > initial and FOMO < 45%).

**Acceptance Scenarios**:
1. **Given** Map 1 completes Round 7, **When** the debrief screen displays, **Then** it calculates final score, shows XP earned (+150 XP), and offers "Lưu điểm & Trở về Dashboard".
2. **Given** Map 2 completes Quarter 12, **When** Graham & Buffett debrief finishes, **Then** it calculates Alpha vs VN30, records run stats, and awards the *Macro Tactician* badge if Alpha > 0.

---

### User Story 3 - Learner Dashboard & Profile Gamification Cockpit (Priority: P2)
As a dedicated learner,  
I want to view my Trader Level, XP progress bar, unlocked badges, and recent simulation performance on my Dashboard and Profile,  
So that I have a clear visual roadmap of my progress from novice investor to disciplined market operator.

**Acceptance Scenarios**:
1. **Given** user navigates to `/dashboard`, **When** the page renders, **Then** the Gamification Cockpit card shows:
   - Level (e.g. Level 1: F0 Nhập Môn, Level 2: Trader Kỷ Luật, Level 3: Bậc Thầy Phân Bổ).
   - Progress bar towards next level.
   - Total XP counter.
   - Badges carousel or grid.
   - Recent Simulation Games summary.
2. **Given** user navigates to `/profile`, **When** viewing the profile card, **Then** achievements and simulation accolades are proudly displayed.

---

### User Story 4 - Global Simulation Leaderboard & Social Validation (Priority: P2)
As a competitive learner,  
I want to view a Leaderboard showcasing top performers in the FOMO Arena and Pro Room,  
So that I am motivated to practice risk management and climb the rankings.

**Acceptance Scenarios**:
1. **Given** user views the Leaderboard section on Dashboard or Community, **When** inspecting rankings, **Then** it displays rank, learner handle, simulation map, profit %, and badges.
2. **Given** user has completed simulation runs, **When** inspecting leaderboard, **Then** their best score is highlighted.

---

### User Story 5 - Design System Token Compliance & Luxury UI/UX Polish (Priority: P3)
All new components and screens must strictly utilize `tokens.css` design variables:
- Dark mode & light mode harmonious contrasts.
- Card elevations, subtle borders, glassmorphic glows (`var(--color-primary)`, `var(--color-accent)`).
- Micro-animations for badge unlock notifications and level-up popups.
- 100% accessible buttons, ARIA labels, and responsive mobile breakpoints.
