import { describe, it, expect, beforeEach } from "vitest";
import { AIRateLimiter } from "../../../src/modules/ai/http/ai-rate-limiter.js";

describe("AIRateLimiter Unit Tests", () => {
  let limiter: AIRateLimiter;

  beforeEach(() => {
    limiter = new AIRateLimiter({
      windowMs: 1000,
      subscriberLimit: 3,
      adminLimit: 5,
    });
  });

  it("permits requests within quota and updates remaining count", () => {
    const res1 = limiter.checkLimit("user-1", "LEARNER");
    expect(res1.allowed).toBe(true);
    expect(res1.limit).toBe(3);
    expect(res1.remaining).toBe(2);

    const res2 = limiter.checkLimit("user-1", "LEARNER");
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = limiter.checkLimit("user-1", "LEARNER");
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("blocks requests exceeding subscriber quota with positive retryAfterSeconds", () => {
    limiter.checkLimit("user-1", "LEARNER");
    limiter.checkLimit("user-1", "LEARNER");
    limiter.checkLimit("user-1", "LEARNER");

    const res4 = limiter.checkLimit("user-1", "LEARNER");
    expect(res4.allowed).toBe(false);
    expect(res4.remaining).toBe(0);
    expect(res4.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("allows higher admin limits", () => {
    // 5 requests allowed for admin
    for (let i = 0; i < 5; i++) {
      const res = limiter.checkLimit("admin-1", "ADMIN");
      expect(res.allowed).toBe(true);
    }

    const res6 = limiter.checkLimit("admin-1", "ADMIN");
    expect(res6.allowed).toBe(false);
  });

  it("isolates quotas across distinct users", () => {
    limiter.checkLimit("user-1", "LEARNER");
    limiter.checkLimit("user-1", "LEARNER");
    limiter.checkLimit("user-1", "LEARNER");

    expect(limiter.checkLimit("user-1", "LEARNER").allowed).toBe(false);
    expect(limiter.checkLimit("user-2", "LEARNER").allowed).toBe(true);
  });

  it("resets quota when reset is invoked", () => {
    limiter.checkLimit("user-1", "LEARNER");
    limiter.checkLimit("user-1", "LEARNER");
    limiter.checkLimit("user-1", "LEARNER");
    expect(limiter.checkLimit("user-1", "LEARNER").allowed).toBe(false);

    limiter.reset("user-1");
    expect(limiter.checkLimit("user-1", "LEARNER").allowed).toBe(true);
  });
});
