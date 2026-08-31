# Aura Capital — Architecture Context

## 1. Architecture Strategy

Aura Capital will be rebuilt as a **modular monolith first**.

Do not introduce microservices unless scale, deployment isolation, team ownership, or operational requirements justify them.

Recommended baseline:

```text
Frontend
React + TypeScript

Backend
Node.js + TypeScript
Express or NestJS

Primary Database
PostgreSQL

Transient / Distributed State
Redis

AI Provider
Gemini

Validation
Zod

Tests
Vitest + Supertest + Playwright

Observability
OpenTelemetry

CI/CD
GitHub Actions

Deployment
Docker
```

## 2. Target System

```text
                         ┌──────────────────────┐
                         │      Aura Web        │
                         │ React + TypeScript   │
                         └──────────┬───────────┘
                                    │ HTTPS
                                    ▼
                         ┌──────────────────────┐
                         │ Application Backend  │
                         │  Modular Monolith    │
                         └──────────┬───────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       │                            │                            │
       ▼                            ▼                            ▼
 Identity/Auth                  Simulation                  AI Module
       │                            │                            │
       ├──────────────┐             ├─────────────┐              ├── Gemini
       ▼              ▼             ▼             ▼              └── RAG
 PostgreSQL        Redis        PostgreSQL      Redis

       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
    Academy                     Community                  Admin/Audit
```

## 3. Backend Module Layout

```text
src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── academy/
│   ├── simulation/
│   ├── community/
│   ├── subscriptions/
│   ├── ai/
│   └── admin/
├── infrastructure/
│   ├── database/
│   ├── redis/
│   ├── logging/
│   ├── telemetry/
│   └── config/
├── middleware/
├── shared/
│   ├── errors/
│   ├── validation/
│   ├── constants/
│   └── types/
└── server.ts
```

Recommended module structure:

```text
simulation/
├── simulation.controller.ts
├── simulation.service.ts
├── simulation.repository.ts
├── simulation.schema.ts
├── simulation.types.ts
└── simulation.test.ts
```

## 4. Frontend Architecture

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── layout/
├── features/
│   ├── auth/
│   ├── academy/
│   ├── simulation/
│   ├── community/
│   ├── profile/
│   └── ai-assistant/
├── components/
│   ├── ui/
│   └── shared/
├── api/
│   ├── api-client.ts
│   ├── auth.api.ts
│   ├── academy.api.ts
│   ├── simulation.api.ts
│   ├── community.api.ts
│   └── ai.api.ts
├── hooks/
├── types/
└── main.tsx
```

Use TanStack Query for server state.

## 5. Durable Data Model

PostgreSQL is the source of truth for durable state.

Recommended tables/domains:

```text
users
roles
refresh_tokens
subscriptions

courses
lessons
flashcards
quizzes
quiz_questions
quiz_attempts

simulation_sessions
simulation_events
assets
market_snapshots
orders
trades
positions
portfolios

posts
post_likes
comments

ai_conversations
ai_messages

audit_logs
```

## 6. Redis Responsibilities

Redis may be used for:

- Rate limits
- Short-lived sessions
- Cache
- Distributed locks
- Simulation transient state
- Leaderboard cache
- AI quota counters

Redis must not become the only source of truth for durable business data.

## 7. Simulation Architecture

### Core Principle

```text
Server = source of truth
Client = intent + presentation
```

The browser must not own:

- Price
- Balance
- Current phase
- Remaining authoritative time
- Trading eligibility
- User role
- Premium status
- Reward outcome

### Individual Simulation Model

Preferred starting model:

```text
User A → SimulationSession A
User B → SimulationSession B
User C → SimulationSession C
```

Suggested entity:

```text
SimulationSession
├── id
├── userId
├── mapId
├── status
├── phase
├── cycle
├── startedAt
├── phaseStartedAt
├── marketSeed
└── completedAt
```

Related entities:

```text
SimulationEvent
MarketSnapshot
Order
Trade
Position
Portfolio
Settlement
```

### Domain Separation

```text
Simulation Engine
├── Market Engine
├── Order Engine
├── Portfolio Engine
└── Settlement Engine
```

GET endpoints must not mutate market state.

The server calculates trading eligibility from authoritative state.

## 8. Authentication Architecture

Recommended:

```text
Access Token
5–15 minutes

Refresh Token
HttpOnly
Secure
SameSite
Rotated
Revocable
```

No fallback JWT secrets.

Startup must fail when required secrets are missing.

Authorization is enforced server-side.

## 9. Academy Architecture

Quiz fetch:

```text
GET quiz
   ↓
question + options
```

Submission:

```text
POST answer
   ↓
server validation
   ↓
result + explanation + reward
```

Correct answers stay server-side until submission.

Rewards must be idempotent.

## 10. Community Architecture

Post likes are relational:

```text
post_likes
---------
post_id
user_id
created_at
```

Constraint:

```sql
UNIQUE(post_id, user_id)
```

Never store global `likedByUser` state on a shared post.

## 11. Subscription Architecture

Premium access must use entitlement state.

Suggested:

```text
Subscription
├── id
├── userId
├── plan
├── status
├── provider
├── externalSubscriptionId
├── startedAt
└── expiresAt
```

## 12. AI Architecture

```text
User Query
   ↓
Authentication
   ↓
Rate Limit / Quota
   ↓
Intent Classification
   ↓
Context Resolver
   ├── user
   ├── portfolio
   ├── trades
   ├── simulation
   ├── course progress
   └── RAG
   ↓
Prompt Builder
   ↓
Gemini
   ↓
Structured Output Validation
   ↓
Safety / Guardrails
   ↓
Response
```

Aura Intelligence must distinguish:

```text
Simulation Coaching
≠
Real-world Investment Advice
```

## 13. Observability Architecture

Track:

```text
requestId
traceId
userId
action
latency
error category
AI model
AI token usage
estimated AI cost
prompt version
```

Recommended:

```text
OpenTelemetry
   ├── Logs
   ├── Metrics
   └── Traces
```

High-value actions must produce audit events.
