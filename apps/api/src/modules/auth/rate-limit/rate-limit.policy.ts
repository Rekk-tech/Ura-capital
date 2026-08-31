import type { LoginPolicy, RegisterPolicy, RefreshPolicy } from "./rate-limit.config.js";
import type { IRateLimitStore } from "./rate-limit.store.js";
import {
  buildRateLimitKey,
  buildIdentitySourceKey,
  KEY_ENDPOINTS,
  KEY_SCOPES,
} from "./rate-limit.keys.js";

/**
 * Result of a rate-limit policy evaluation.
 */
export interface PolicyResult {
  allowed: boolean;
  retryAfterSec?: number;
}

/**
 * Evaluate login rate-limit policy.
 *
 * Checks in order:
 * 1. Identity+source cooldown (deny immediately with TTL)
 * 2. Source ceiling cooldown
 * 3. Identity+source failure counter
 * 4. Source ceiling counter
 *
 * Progressive protection: escalates cooldown on repeated threshold hits.
 */
export async function evaluateLoginPolicy(
  source: string,
  identityDigest: string | null,
  store: IRateLimitStore,
  policy: LoginPolicy,
): Promise<PolicyResult> {
  const idSrcId = identityDigest ? buildIdentitySourceKey(source, identityDigest) : null;

  // Check identity+source cooldown first
  if (idSrcId) {
    const cdKey = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.COOLDOWN, idSrcId);
    const ttl = await store.getCooldownTTL(cdKey);
    if (ttl > 0) {
      return { allowed: false, retryAfterSec: ttl };
    }
  }

  // Check source ceiling cooldown
  const srcCdKey = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.COOLDOWN, source);
  const srcCdTtl = await store.getCooldownTTL(srcCdKey);
  if (srcCdTtl > 0) {
    return { allowed: false, retryAfterSec: srcCdTtl };
  }

  // Check identity+source failure counter
  if (idSrcId) {
    const counterKey = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.IDENTITY_SOURCE, idSrcId);
    const count = await store.getCount(counterKey);

    if (count >= policy.identitySource.maxAttempts) {
      // Determine cooldown duration (check for escalation)
      const escKey = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.ESCALATION, idSrcId);
      const escCount = await store.increment(escKey, policy.escalationWindowSec);
      const cooldownSec = escCount > 1 ? policy.escalatedCooldownSec : policy.identitySource.cooldownSec;

      const cdKey = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.COOLDOWN, idSrcId);
      await store.setCooldown(cdKey, cooldownSec);

      return { allowed: false, retryAfterSec: cooldownSec };
    }
  }

  // Check source ceiling counter (increment and evaluate all login attempts)
  const srcCounterKey = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.SOURCE, source);
  const srcCount = await store.increment(srcCounterKey, policy.sourceCeiling.windowSec);

  if (srcCount > policy.sourceCeiling.maxAttempts) {
    await store.setCooldown(srcCdKey, policy.sourceCeiling.cooldownSec);
    return { allowed: false, retryAfterSec: policy.sourceCeiling.cooldownSec };
  }

  return { allowed: true };
}

/**
 * Increment login failure counters.
 * Called AFTER the request is allowed through but results in auth failure (401 UNAUTHORIZED).
 */
export async function incrementLoginFailure(
  source: string,
  identityDigest: string | null,
  store: IRateLimitStore,
  policy: LoginPolicy,
): Promise<void> {
  // Increment identity+source failure counter if we have an identity digest
  if (identityDigest) {
    const idSrcId = buildIdentitySourceKey(source, identityDigest);
    const counterKey = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.IDENTITY_SOURCE, idSrcId);
    await store.increment(counterKey, policy.identitySource.windowSec);
  }
}

/**
 * Clear identity+source failure counters on successful login.
 * Only clears the failure counter, not the source ceiling.
 */
export async function clearLoginFailureCounters(
  source: string,
  identityDigest: string,
  store: IRateLimitStore,
): Promise<void> {
  const idSrcId = buildIdentitySourceKey(source, identityDigest);
  const counterKey = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.IDENTITY_SOURCE, idSrcId);
  const cdKey = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.COOLDOWN, idSrcId);
  const escKey = buildRateLimitKey(KEY_ENDPOINTS.LOGIN, KEY_SCOPES.ESCALATION, idSrcId);

  await store.delete(counterKey);
  await store.delete(cdKey);
  await store.delete(escKey);
}

/**
 * Evaluate registration rate-limit policy.
 *
 * Checks:
 * 1. Source cooldown
 * 2. Identity+source cooldown
 * 3. Source counter
 * 4. Identity+source counter
 */
export async function evaluateRegisterPolicy(
  source: string,
  identityDigest: string | null,
  store: IRateLimitStore,
  policy: RegisterPolicy,
): Promise<PolicyResult> {
  // Check source cooldown
  const srcCdKey = buildRateLimitKey(KEY_ENDPOINTS.REGISTER, KEY_SCOPES.COOLDOWN, source);
  const srcCdTtl = await store.getCooldownTTL(srcCdKey);
  if (srcCdTtl > 0) {
    return { allowed: false, retryAfterSec: srcCdTtl };
  }

  // Check identity+source cooldown
  if (identityDigest) {
    const idSrcId = buildIdentitySourceKey(source, identityDigest);
    const cdKey = buildRateLimitKey(KEY_ENDPOINTS.REGISTER, KEY_SCOPES.COOLDOWN, idSrcId);
    const ttl = await store.getCooldownTTL(cdKey);
    if (ttl > 0) {
      return { allowed: false, retryAfterSec: ttl };
    }
  }

  // Check source counter
  const srcKey = buildRateLimitKey(KEY_ENDPOINTS.REGISTER, KEY_SCOPES.SOURCE, source);
  const srcCount = await store.increment(srcKey, policy.source.windowSec);

  if (srcCount > policy.source.maxAttempts) {
    await store.setCooldown(srcCdKey, policy.source.cooldownSec);
    return { allowed: false, retryAfterSec: policy.source.cooldownSec };
  }

  // Check identity+source counter
  if (identityDigest) {
    const idSrcId = buildIdentitySourceKey(source, identityDigest);
    const idSrcKey = buildRateLimitKey(KEY_ENDPOINTS.REGISTER, KEY_SCOPES.IDENTITY_SOURCE, idSrcId);
    const idSrcCount = await store.increment(idSrcKey, policy.identitySource.windowSec);

    if (idSrcCount > policy.identitySource.maxAttempts) {
      const cdKey = buildRateLimitKey(KEY_ENDPOINTS.REGISTER, KEY_SCOPES.COOLDOWN, idSrcId);
      await store.setCooldown(cdKey, policy.identitySource.cooldownSec);
      return { allowed: false, retryAfterSec: policy.identitySource.cooldownSec };
    }
  }

  return { allowed: true };
}

/**
 * Evaluate refresh rate-limit policy.
 *
 * Checks:
 * 1. Source cooldown
 * 2. Malformed/missing cookie counter (if no cookie present)
 * 3. Source counter (all refresh attempts)
 *
 * Does NOT use raw token in any key. Cookie presence is used as a bucket indicator only.
 */
export async function evaluateRefreshPolicy(
  source: string,
  hasCookie: boolean,
  store: IRateLimitStore,
  policy: RefreshPolicy,
): Promise<PolicyResult> {
  // Check source cooldown
  const srcCdKey = buildRateLimitKey(KEY_ENDPOINTS.REFRESH, KEY_SCOPES.COOLDOWN, source);
  const srcCdTtl = await store.getCooldownTTL(srcCdKey);
  if (srcCdTtl > 0) {
    return { allowed: false, retryAfterSec: srcCdTtl };
  }

  // If no cookie, check malformed/missing counter
  if (!hasCookie) {
    const malKey = buildRateLimitKey(KEY_ENDPOINTS.REFRESH, KEY_SCOPES.MALFORMED, source);
    const malCount = await store.increment(malKey, policy.malformedSource.windowSec);

    if (malCount > policy.malformedSource.maxAttempts) {
      await store.setCooldown(srcCdKey, policy.malformedSource.cooldownSec);
      return { allowed: false, retryAfterSec: policy.malformedSource.cooldownSec };
    }
  }

  // Check source counter (all attempts)
  const srcKey = buildRateLimitKey(KEY_ENDPOINTS.REFRESH, KEY_SCOPES.SOURCE, source);
  const srcCount = await store.increment(srcKey, policy.source.windowSec);

  if (srcCount > policy.source.maxAttempts) {
    await store.setCooldown(srcCdKey, policy.source.cooldownSec);
    return { allowed: false, retryAfterSec: policy.source.cooldownSec };
  }

  return { allowed: true };
}
