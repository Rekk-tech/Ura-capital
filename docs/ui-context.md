# Aura Capital — UI Context

## 1. UI Goal

The new Aura Capital UI should preserve the strongest product ideas from the existing MVP while rebuilding the frontend architecture cleanly.

Visual character:

- Modern
- Premium
- Financial
- Educational
- Calm
- Data-oriented

## 2. Main Product Areas

The UI should support:

```text
Authentication
Dashboard
Academy
Courses
Flashcards
Quiz
Simulation
Portfolio
Community
Profile
Admin
Aura Intelligence
```

## 3. UX Principle

The product teaches financial thinking.

Gamification should reinforce:

- Learning
- Risk awareness
- Decision making
- Reflection

It should not encourage reckless behavior or resemble gambling mechanics.

## 4. Simulation Clarity

All simulated information must be clearly labeled.

The user must understand:

```text
This is simulation data.
```

Do not visually imply that simulated prices or events are real-time market data.

Trading screens must clearly expose:

- Current simulation
- Phase
- Market status
- Available cash
- Holdings
- Price
- Order action
- Order outcome
- Risk context

## 5. AI Assistant UX

Aura Intelligence should communicate what context it is using.

Examples:

```text
Based on your current simulation portfolio...
Based on your latest simulated trades...
Based on Lesson 3: Diversification...
```

The assistant should distinguish educational/simulation analysis from real-world investment advice.

## 6. Required Async States

Every async feature must define:

```text
loading
success
empty
error
retry
disabled
```

Do not design only the happy path.

## 7. Forms

Forms must provide:

- Clear labels
- Validation feedback
- Disabled submission during processing
- Actionable error messages
- Safe retry behavior

Validation messages should explain how to resolve the problem.

## 8. Accessibility

Minimum requirements:

- Semantic HTML
- Keyboard navigation
- Visible focus indicators
- Accessible form labels
- Appropriate ARIA usage
- Sufficient text/background contrast
- Descriptive button names

Do not communicate only through color.

Example:

```text
+3.2% ▲ Gain
-2.1% ▼ Loss
```

rather than only green/red color.

## 9. Responsive Design

Core flows must be usable on:

```text
Desktop
Tablet
Mobile
```

Priority responsive flows:

- Authentication
- Dashboard
- Academy
- Simulation
- Portfolio
- Aura Intelligence

## 10. Frontend State

Separate:

```text
Server State
Client UI State
Form State
```

Use TanStack Query or equivalent for server state.

Avoid storing server truth in deeply distributed component state.

## 11. Component Design

Prefer reusable components for:

```text
Button
Input
Card
Modal
Table
Tabs
Badge
Metric
EmptyState
ErrorState
LoadingState
```

Feature-specific business components should stay inside feature folders.

## 12. Admin UI

Admin controls must never substitute backend authorization.

The frontend may hide unauthorized actions for UX, but the backend must independently enforce permissions.

## 13. Design Preservation Rule

The existing UI is a reference, not a strict implementation contract.

During rebuild:

- Preserve valuable interaction patterns
- Preserve recognizable product identity
- Remove architecture-driven UX limitations
- Improve error/loading/accessibility behavior
- Avoid copying problematic component structure
