export {
  createLoginRateLimiter,
  createRegisterRateLimiter,
  createRefreshRateLimiter,
} from "./rate-limit.middleware.js";

export { getRateLimitConfig, type RateLimitConfig } from "./rate-limit.config.js";
export { RateLimitStore, RedisUnavailableError } from "./rate-limit.store.js";
export {
  buildRateLimitKey,
  computeIdentityDigest,
  resolveSource,
  buildIdentitySourceKey,
  KEY_SCOPES,
  KEY_ENDPOINTS,
} from "./rate-limit.keys.js";
export {
  evaluateLoginPolicy,
  evaluateRegisterPolicy,
  evaluateRefreshPolicy,
  incrementLoginFailure,
  clearLoginFailureCounters,
  type PolicyResult,
} from "./rate-limit.policy.js";
