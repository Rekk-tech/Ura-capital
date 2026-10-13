# Requirements Quality Checklist: FEAT-084 AI Entitlement & Guardrails

**Purpose**: Requirements Quality Review artifact validating completeness, clarity, consistency, and coverage.  
**Created**: 2026-10-13  
**Note**: `[x]` means the reviewer determined the requirements-quality criterion is satisfied.

## Requirement Completeness
- [ ] CHK001 - Are specific error codes and HTTP statuses explicitly defined for both unauthenticated and free tier callers? [Completeness, Spec §2.1]
- [ ] CHK002 - Are exact rate limit thresholds specified for subscribers vs administrators? [Completeness, Spec §2.2]
- [ ] CHK003 - Are both domain-relevance and content-safety dimensions documented for guardrail evaluation? [Completeness, Spec §2.3]

## Requirement Clarity
- [ ] CHK004 - Is the sliding window duration and request count quantified with explicit numbers? [Clarity, Spec §2.2]
- [ ] CHK005 - Are off-topic categories (e.g. non-financial, recipes, politics) explicitly disambiguated from valid financial topics? [Clarity, Spec §2.3]
- [ ] CHK006 - Is the fallback mechanism when external LLM evaluation is unavailable clearly defined? [Clarity, Spec §4]

## Requirement Consistency
- [ ] CHK007 - Do the AI entitlement requirements align with existing subscription plan definitions (FREE vs PREMIUM)? [Consistency, Spec §1]
- [ ] CHK008 - Does the guardrail refusal format match standard AI response envelopes? [Consistency, Spec §3]

## Scenario & Edge Case Coverage
- [ ] CHK009 - Are requirements specified for expired or cancelled subscriptions attempting AI queries? [Coverage, Edge Case]
- [ ] CHK010 - Are prompt injection and system prompt extraction attacks covered in adversarial testing? [Coverage, Spec §2.3]
- [ ] CHK011 - Are mobile viewport requirements defined for the membership gating UI card? [Coverage, Spec §2.4]

## Measurability & Acceptance Criteria
- [ ] CHK012 - Can the Tier 1 deterministic check latency (< 2ms) be objectively verified in unit tests? [Measurability, Spec §4]
- [ ] CHK013 - Are the HTTP response headers for rate limiting (Retry-After, X-RateLimit) testable? [Acceptance Criteria, Spec §2.2]
