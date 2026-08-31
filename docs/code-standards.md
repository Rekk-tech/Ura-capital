# Aura Capital — Code Standards

## 1. Engineering Priorities

Code must prioritize:

```text
Correctness
Security
Readability
Testability
Maintainability
Explicit behavior
```

Do not optimize prematurely.

## 2. TypeScript

Use strict TypeScript.

Avoid `any`.

Prefer:

```ts
unknown
```

combined with explicit validation.

All API contracts should have explicit types.

## 3. Layering

Use:

```text
Controller
   ↓
Service
   ↓
Repository
```

### Controller

Responsibilities:

- Parse request
- Validate request
- Call service
- Return response

Controllers must not contain significant business logic.

### Service

Responsibilities:

- Business rules
- Authorization decisions that depend on domain state
- Transactions
- Orchestration

### Repository

Responsibilities:

- Persistence
- Queries
- Database mapping

Business rules should not be coupled to raw SQL details.

## 4. Validation

All external inputs must be validated using Zod or an approved equivalent.

Validate:

```text
req.body
req.params
req.query
environment configuration
external API responses where necessary
AI structured outputs
```

Example:

```ts
const TradeSchema = z.object({
  ticker: z.string().min(1).max(10),
  type: z.enum(["buy", "sell"]),
  quantity: z.number().int().positive(),
  simulationSessionId: z.string().uuid(),
});
```

## 5. Configuration

Environment-specific values belong in configuration.

Examples:

```text
DATABASE_URL
REDIS_URL
JWT_SECRET
GEMINI_API_KEY
NODE_ENV
AI_DAILY_QUOTA
```

Validate required configuration at application startup.

Never add production fallback secrets.

## 6. Error Handling

Use a stable error envelope.

```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient balance to execute trade",
    "requestId": "..."
  }
}
```

Never expose:

- Stack traces
- Secret values
- Raw database errors
- Internal paths
- Sensitive provider responses

## 7. API Client

Frontend must use a centralized API client.

Responsibilities:

- Base URL
- Authentication
- JSON handling
- Timeouts
- 401 behavior
- Error normalization
- Request IDs

Do not duplicate raw fetch configuration throughout components.

## 8. Naming

Prefer explicit domain names:

```ts
simulationSessionId
availableBalance
currentPhase
quizAttemptId
```

Avoid unclear names such as:

```ts
data
obj
tmp
x
```

except tiny local scopes.

## 9. Functions

Functions should have one clear responsibility.

Avoid a single function that combines:

```text
validation
authorization
business logic
database mutation
logging
response formatting
```

## 10. Constants

Do not hard-code domain values repeatedly.

Move configurable/domain constants such as:

- Phase duration
- XP reward
- AI quota
- Request timeout
- Retry limit
- Password policy

into configuration or dedicated domain constants.

## 11. Security Standards

Never trust client-provided:

```text
role
premium status
balance
price
simulation phase
reward
trade eligibility
authoritative clock
```

Server verifies all business-sensitive state.

## 12. Database Standards

Use transactions for operations requiring atomicity.

Examples:

- Buy/sell trade
- Quiz reward granting
- Subscription state updates
- Settlement
- Admin role changes

Use database constraints where possible.

Examples:

```text
UNIQUE
FOREIGN KEY
CHECK
NOT NULL
```

Application validation is not a replacement for database integrity.

## 13. Testing Standards

Every business-critical change requires tests.

Minimum levels:

```text
Unit
Integration
E2E for critical user journeys
```

Never disable a failing test to make a change pass.

## 14. Logging

Use structured logs.

Do not rely on arbitrary `console.log()` in production code.

Do not log:

- Passwords
- Access tokens
- Refresh tokens
- API keys
- Sensitive user content unless explicitly required and protected

## 15. Comments

Comments should explain:

- Why
- Constraint
- Non-obvious behavior
- Trade-off

Do not comment obvious syntax.

## 16. Dependency Policy

Do not add a new dependency if:

- The standard library is sufficient
- An existing project dependency already solves it
- It significantly increases complexity without clear value

Major dependencies require architectural justification.

## 17. Definition of Done

A coding task is complete only when:

```text
implementation complete
tests added or updated
tests pass
lint passes
typecheck passes
build passes
acceptance criteria satisfied
documentation updated when applicable
no new critical security issue
```
