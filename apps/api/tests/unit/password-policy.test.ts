import { describe, it, expect } from "vitest";
import {
  validatePasswordPolicy,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from "../../src/modules/auth/password-policy.js";

describe("Password Policy (Unit)", () => {
  it("rejects missing or non-string password", () => {
    // @ts-expect-error - testing invalid runtime input
    expect(validatePasswordPolicy(undefined).isValid).toBe(false);
    // @ts-expect-error - testing invalid runtime input
    expect(validatePasswordPolicy(null).isValid).toBe(false);
    // @ts-expect-error - testing invalid runtime input
    expect(validatePasswordPolicy(123456789012).isValid).toBe(false);
  });

  it("rejects passwords shorter than 12 characters", () => {
    const shortPassword = "short12345";
    expect(shortPassword.length).toBeLessThan(PASSWORD_MIN_LENGTH);

    const result = validatePasswordPolicy(shortPassword);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("at least 12 characters long");
  });

  it("rejects passwords longer than 128 characters", () => {
    const longPassword = "a".repeat(PASSWORD_MAX_LENGTH + 1);
    const result = validatePasswordPolicy(longPassword);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("must not exceed 128 characters");
  });

  it("rejects passwords matching the explicit common/demo password denylist", () => {
    const deniedCases = [
      "password1234",
      "password12345",
      "123456789012",
      "1234567890123",
      "qwerty123456",
      "aura123456789",
      "admin12345678",
      "letmein123456",
      "welcome123456",
    ];

    for (const denied of deniedCases) {
      const result = validatePasswordPolicy(denied);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("too common");
    }
  });

  it("rejects denied passwords regardless of casing", () => {
    expect(validatePasswordPolicy("PASSWORD1234").isValid).toBe(false);
    expect(validatePasswordPolicy("Aura123456789").isValid).toBe(false);
    expect(validatePasswordPolicy("Welcome123456").isValid).toBe(false);
  });

  it("accepts valid passwords meeting the policy requirements", () => {
    const validCases = [
      "correct horse battery staple",
      "AuraCapitalSec#2026",
      "SuperSecret!Password99",
      "learning-finance-is-fun-2026",
    ];

    for (const valid of validCases) {
      const result = validatePasswordPolicy(valid);
      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
    }
  });
});
