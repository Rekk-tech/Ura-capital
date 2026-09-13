# Specification: FEAT-028 Academy Authorization & Ownership Hardening

**Status**: PLANNED / BLOCKED BY FEAT-027 IMPLEMENTATION GATE  
**Implementation Status**: NOT_STARTED  

## Endpoint Authorization Matrix

| Endpoint Surface | Classification |
| --- | --- |
| `GET /api/academy/courses` and alias | PUBLIC |
| `GET /api/academy/courses/:slug` and alias | PUBLIC |
| Lesson detail | AUTHENTICATED |
| Flashcards | AUTHENTICATED |
| Quiz definition | AUTHENTICATED |
| Start/current/read attempt | OWNER-SCOPED |
| Draft answer mutation | OWNER-SCOPED |
| Submit attempt | OWNER-SCOPED |
| Graded result | OWNER-SCOPED |
| Course progress read | OWNER-SCOPED |
| Informational lesson completion | OWNER-SCOPED |
| XP/reward read if FEAT-027 exposes it | OWNER-SCOPED |
| Admin/support learner visibility | OUT OF SCOPE / DEFERRED |

## Security Semantics

All learner-private resources must be authorized through PostgreSQL relationships and authenticated user context. JWT roles, client roles, request body user ids, query user ids, and path user ids are not authority.

Ownership violations must avoid resource existence disclosure. For attempt/result resources, preserve existing canonical generic not-found semantics. Do not invent route-specific existence errors such as `COURSE_NOT_FOUND`, `LESSON_NOT_FOUND`, or raw DB diagnostics.

## Testing Focus

FEAT-028 is mostly adversarial validation and hardening. It must build negative tests for all Academy owned resources and ensure DTO secrecy regressions do not reappear.

## Admin/Support Boundary

Human has deferred ADMIN / SUPPORT learner visibility. FEAT-028 must add zero new admin/support Academy routes, zero admin content-authoring surface, and zero support read API.
