import { getEnv } from "../../../infrastructure/config/env.js";
import type { EnvConfig } from "@aura/shared";

/**
 * Endpoint-specific rate limit policy configuration.
 * All thresholds match the Human-approved FEAT-010A spec.
 */
export interface EndpointPolicy {
  /** Maximum attempts per window */
  maxAttempts: number;
  /** Window duration in seconds */
  windowSec: number;
  /** Cooldown duration in seconds when threshold is exceeded */
  cooldownSec: number;
}

export interface LoginPolicy {
  /** Per identity+source failure counter */
  identitySource: EndpointPolicy;
  /** Per source broad ceiling (all attempts) */
  sourceCeiling: EndpointPolicy;
  /** Escalated cooldown in seconds for repeated abuse within escalation window */
  escalatedCooldownSec: number;
  /** Escalation window in seconds (repeated threshold hit within this window triggers escalation) */
  escalationWindowSec: number;
}

export interface RegisterPolicy {
  /** Per source counter */
  source: EndpointPolicy;
  /** Per identity+source counter */
  identitySource: EndpointPolicy;
}

export interface RefreshPolicy {
  /** Per source counter (all refresh attempts) */
  source: EndpointPolicy;
  /** Per source malformed/missing cookie counter */
  malformedSource: EndpointPolicy;
}

export interface RateLimitConfig {
  enabled: boolean;
  trustProxy: boolean;
  keySecret: string;
  login: LoginPolicy;
  register: RegisterPolicy;
  refresh: RefreshPolicy;
}

/**
 * Returns the rate-limit configuration using approved FEAT-010A spec baselines.
 * All numeric values come directly from the approved limit policy table.
 */
export function getRateLimitConfig(env: EnvConfig = getEnv()): RateLimitConfig {
  return {
    enabled: env.AUTH_RATE_LIMIT_ENABLED,
    trustProxy: env.AUTH_RATE_LIMIT_TRUST_PROXY,
    keySecret: env.AUTH_RATE_LIMIT_KEY_SECRET ?? "",
    login: {
      identitySource: {
        maxAttempts: 5,
        windowSec: 600, // 10 minutes
        cooldownSec: 900, // 15 minutes
      },
      sourceCeiling: {
        maxAttempts: 30,
        windowSec: 600, // 10 minutes
        cooldownSec: 900, // 15 minutes
      },
      escalatedCooldownSec: 1800, // 30 minutes
      escalationWindowSec: 3600, // 1 hour
    },
    register: {
      source: {
        maxAttempts: 5,
        windowSec: 900, // 15 minutes
        cooldownSec: 1800, // 30 minutes
      },
      identitySource: {
        maxAttempts: 3,
        windowSec: 3600, // 1 hour
        cooldownSec: 1800, // 30 minutes
      },
    },
    refresh: {
      source: {
        maxAttempts: 20,
        windowSec: 600, // 10 minutes
        cooldownSec: 900, // 15 minutes
      },
      malformedSource: {
        maxAttempts: 5,
        windowSec: 600, // 10 minutes
        cooldownSec: 900, // 15 minutes
      },
    },
  };
}
