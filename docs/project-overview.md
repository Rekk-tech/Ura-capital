# Aura Capital — Project Overview

## 1. Purpose

Aura Capital is an AI-assisted financial learning and investment simulation platform.

The new implementation will be a **greenfield rebuild**. The existing application is used only as:

- Product reference
- UX reference
- Business-rule reference
- Source of lessons learned
- Regression reference for useful functionality

The new system must **not inherit the old architecture by default**.

## 2. Rebuild Goal

Target evolution:

```text
Existing Functional MVP
        ↓
Greenfield Rebuild
        ↓
Production MVP
        ↓
Production-grade AI Platform
```

The main objective is not to reproduce the previous source code with cleaner syntax.

The objective is to rebuild Aura Capital on production-oriented foundations.

## 3. Product Domains

### Identity & Access
- Registration
- Login
- Authentication
- Authorization
- Roles
- Sessions
- Premium entitlements

### Academy
- Courses
- Lessons
- Flashcards
- Quizzes
- Quiz attempts
- XP / progression
- Explanations

### Simulation
- Simulation sessions
- Assets
- Market phases
- Events
- Orders
- Trades
- Positions
- Portfolios
- Settlement
- Leaderboards

### Community
- Posts
- Likes
- Comments
- Moderation

### Aura Intelligence
- Learning assistant
- Simulation coaching
- Portfolio explanation
- Course-context assistance
- RAG
- Structured AI output
- Guardrails

## 4. Product Principles

Aura Capital should feel:

- Modern
- Premium
- Financial
- Educational
- Calm
- Data-oriented

The platform must avoid:

- Gambling-like UX
- Misleading profit guarantees
- Fake market claims
- Unclear distinction between simulation and real markets
- AI outputs presented as guaranteed investment advice

## 5. Rebuild Strategy

The rebuild follows this order:

```text
Foundation
   ↓
Identity & Security
   ↓
Data Architecture
   ↓
Academy
   ↓
Simulation
   ↓
Community
   ↓
Aura Intelligence
   ↓
Observability & Hardening
   ↓
Production Readiness
```

Every phase has:

```text
Requirement
   ↓
Implementation
   ↓
Tests
   ↓
QA Review
   ↓
Quality Gate
   ↓
Next Phase
```

No phase may be considered complete without its acceptance criteria.

## 6. Existing System Assessment

The existing Aura Capital is useful as a product prototype but not approved as a production foundation.

Main architectural issues identified:

- Hard-coded JWT fallback secret
- Client-controlled simulation timing
- Global mutable simulation state
- JSON-file persistence
- Quiz answer leakage
- Weak entitlement model
- Incorrect post-like model
- Missing schema validation
- Minimal automated tests
- Minimal observability
- Generic Gemini wrapper without application context

These are **lessons for the new system**, not a patch backlog.

## 7. Definition of Success

The rebuilt Aura Capital reaches Production MVP when:

- No unresolved P0 security issues
- Authentication and authorization are server-enforced
- PostgreSQL owns durable state
- Redis owns appropriate transient/distributed state
- Simulation is server-authoritative
- User/session isolation is verified
- External input is schema validated
- Critical business flows are tested
- CI blocks broken changes
- Structured logs and audit events exist
- AI usage is rate-limited and observable
- AI responses use controlled application context
- Public-facing simulation data is clearly identified as simulated
