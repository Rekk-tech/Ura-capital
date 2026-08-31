# Aura Capital — AI Agent Workflow Rules

## 1. Mission

AI Agents assist with a **greenfield rebuild** of Aura Capital.

The existing codebase is a reference, not the implementation foundation.

Agents must not assume the goal is to patch or migrate old code unless a task explicitly states otherwise.

## 2. Required Workflow

Every task follows:

```text
Understand Requirement
        ↓
Read Relevant Context
        ↓
Identify Dependencies
        ↓
Implement
        ↓
Write / Update Tests
        ↓
Run Validation
        ↓
Report Results
        ↓
QA Review
        ↓
Quality Gate
```

## 3. Read Before Coding

Before implementation, read the relevant project context:

```text
project-overview.md
architecture-context.md
code-standards.md
ui-context.md
progress-tracker.md
```

Not every task requires every file, but architectural tasks should review all relevant constraints.

## 4. Phase Discipline

Do not work ahead of the approved phase.

If the project is in Phase 1, do not add Phase 4 AI functionality unless required for Phase 1 acceptance criteria.

## 5. No Scope Creep

A task should implement its approved scope.

Do not silently:

- Change frameworks
- Introduce microservices
- Replace authentication
- Add unrelated features
- Redesign unrelated UI
- Change database strategy
- Add major dependencies

## 6. Server Trust Boundary

For business-sensitive behavior:

```text
Server = authority
Client = intent
```

Never trust browser-provided:

- Role
- Premium status
- Balance
- Price
- Simulation phase
- Reward
- Trade eligibility
- Authoritative time

## 7. Security Cannot Be Traded for Speed

Do not solve implementation difficulty by weakening:

- Authentication
- Authorization
- Validation
- Isolation
- Auditability
- Rate limiting
- Secret management

## 8. Do Not Hide Failures

Forbidden shortcuts:

```text
delete failing tests
disable lint
disable type checking
broad ts-ignore
catch and ignore errors
return fake success
mock a required production integration without documenting it
```

Fix the underlying issue.

## 9. No Fake Evidence

Never claim:

```text
tests pass
build passes
deployment succeeded
migration succeeded
API returned X
```

unless the command or environment actually verified it.

When execution is unavailable, report:

```text
NOT VERIFIED
```

## 10. Change Reporting Format

Each completed task must report:

```text
1. Task
2. Goal
3. Files changed
4. Architecture impact
5. Implementation summary
6. Tests added/updated
7. Commands executed
8. Validation results
9. Known limitations
10. Documentation updates
11. Ready for QA: YES/NO
```

## 11. Definition of Done

A task is not done because code exists.

Required:

```text
implementation complete
acceptance criteria satisfied
tests added
tests pass
lint pass
typecheck pass
build pass
docs updated if required
no critical security regression
```

If any mandatory condition is missing, status remains:

```text
IN_REVIEW
BLOCKED
or FAILED
```

not DONE.

## 12. Architecture Decision Rule

When an implementation requires a major architectural decision not documented in current context:

1. Identify the decision.
2. Explain alternatives and trade-offs.
3. Do not silently choose a radically different architecture.
4. Record the approved decision in architecture documentation.

## 13. Dependency Rule

Before adding a package, verify:

- Why it is required
- Whether current dependencies already cover the need
- Security/maintenance implications
- Whether it affects production architecture

## 14. Data Migration Rule

Because this is a greenfield rebuild, old `db.json` data is not automatically production data.

If migration is later required, treat migration as a separate approved workstream.

## 15. Testing Rule

Tests should verify behavior, not implementation details.

Critical areas:

- Authentication
- Authorization
- Trading
- Simulation state
- Quiz integrity
- Community likes
- Subscription entitlement
- AI quota
- AI provider failure handling

## 16. Documentation Rule

Update context when a task changes:

- Architecture
- Domain model
- API contract
- Security rule
- Development workflow
- Phase status

## 17. QA Authority

AI implementation does not automatically approve progression.

Final phase status is controlled by QA:

```text
PASS
CONDITIONAL PASS
FAIL
```

A FAIL blocks progression.
