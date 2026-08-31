export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export const DENIED_PASSWORDS = new Set([
  "password",
  "password1234",
  "password12345",
  "123456789012",
  "1234567890123",
  "qwerty123456",
  "aura123456789",
  "admin12345678",
  "letmein123456",
  "welcome123456",
  "iloveyou12345",
  "changeme12345",
]);

export interface PasswordPolicyValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validates a password against the approved Phase 2 security policy:
 * - Length: 12 to 128 characters
 * - Rejection of explicit common/demo passwords
 * Note: Never log or return the rejected password string.
 */
export function validatePasswordPolicy(password: string): PasswordPolicyValidationResult {
  if (!password || typeof password !== "string") {
    return {
      isValid: false,
      reason: "Password is required",
    };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      isValid: false,
      reason: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
    };
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      isValid: false,
      reason: `Password must not exceed ${PASSWORD_MAX_LENGTH} characters`,
    };
  }

  if (DENIED_PASSWORDS.has(password.toLowerCase())) {
    return {
      isValid: false,
      reason: "Password is too common and not allowed",
    };
  }

  return { isValid: true };
}
