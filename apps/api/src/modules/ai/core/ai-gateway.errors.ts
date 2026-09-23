import { AI_GATEWAY_ERROR_CODES, type AIGatewayErrorCode } from "@aura/shared";

/**
 * Sanitizes error messages by scrubbing potential secrets, URLs, credentials,
 * API keys, file paths, and host/port infrastructure.
 */
export function sanitizeAIGatewayMessage(message: string): string {
  if (!message || typeof message !== "string") {
    return "An internal AI Gateway error occurred";
  }

  let sanitized = message;

  // 1. Scrub Google API keys (AIza...)
  sanitized = sanitized.replace(/AIza[0-9A-Za-z-_]{20,50}/g, "[REDACTED_API_KEY]");

  // 2. Scrub Bearer / Basic tokens
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED_TOKEN]");
  sanitized = sanitized.replace(/Basic\s+[A-Za-z0-9+/=]+/gi, "Basic [REDACTED_TOKEN]");

  // 3. Scrub key/secret parameters in queries or strings
  sanitized = sanitized.replace(/(key|apiKey|secret|token|password)=[^&\s]+/gi, "$1=[REDACTED]");

  // 4. Scrub connection strings / URLs
  sanitized = sanitized.replace(
    /[a-zA-Z]+:\/\/(?:[^:@\s]+(?::[^@\s]*)?@)?(?:[a-zA-Z0-9.-]+|\[[0-9a-fA-F:]+\])(?::\d+)?(?:\/[^\s]*)?/g,
    "[REDACTED_URL]",
  );

  // 5. Scrub Windows and Unix absolute file paths
  sanitized = sanitized.replace(/[a-zA-Z]:\\[^:<>"|?\r\n]+/g, "[REDACTED_PATH]");
  sanitized = sanitized.replace(/(?:\/[a-zA-Z0-9_.-]+){3,}/g, "[REDACTED_PATH]");

  // 6. Scrub IPv4 addresses with optional ports
  sanitized = sanitized.replace(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g, "[REDACTED_HOST]");

  return sanitized.trim();
}

/**
 * Base AI Gateway Error with closed normalized taxonomy.
 * Guarantees that message is sanitized and code is strictly from the closed taxonomy.
 */
export class AIGatewayError extends Error {
  readonly code: AIGatewayErrorCode;
  readonly isAIGatewayError = true;

  constructor(message: string, code: AIGatewayErrorCode = AI_GATEWAY_ERROR_CODES.UNKNOWN) {
    const safeMessage = sanitizeAIGatewayMessage(message);
    super(safeMessage);
    this.name = "AIGatewayError";
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AIGatewayConfigurationError extends AIGatewayError {
  constructor(message: string = "AI Gateway configuration is invalid or disabled") {
    super(message, AI_GATEWAY_ERROR_CODES.CONFIGURATION_ERROR);
    this.name = "AIGatewayConfigurationError";
  }
}

export class AIGatewayAuthenticationError extends AIGatewayError {
  constructor(message: string = "AI provider authentication failed") {
    super(message, AI_GATEWAY_ERROR_CODES.AUTHENTICATION);
    this.name = "AIGatewayAuthenticationError";
  }
}

export class AIGatewayRateLimitError extends AIGatewayError {
  constructor(message: string = "AI provider rate limit exceeded") {
    super(message, AI_GATEWAY_ERROR_CODES.RATE_LIMITED);
    this.name = "AIGatewayRateLimitError";
  }
}

export class AIGatewayTimeoutError extends AIGatewayError {
  constructor(message: string = "AI provider request timed out") {
    super(message, AI_GATEWAY_ERROR_CODES.TIMEOUT);
    this.name = "AIGatewayTimeoutError";
  }
}

export class AIGatewayCancelledError extends AIGatewayError {
  constructor(message: string = "AI provider request was cancelled") {
    super(message, AI_GATEWAY_ERROR_CODES.CANCELLED);
    this.name = "AIGatewayCancelledError";
  }
}

export class AIGatewayUnavailableError extends AIGatewayError {
  constructor(message: string = "AI provider service is currently unavailable") {
    super(message, AI_GATEWAY_ERROR_CODES.UNAVAILABLE);
    this.name = "AIGatewayUnavailableError";
  }
}

export class AIGatewayRefusedError extends AIGatewayError {
  constructor(message: string = "AI provider refused to generate response") {
    super(message, AI_GATEWAY_ERROR_CODES.REFUSED);
    this.name = "AIGatewayRefusedError";
  }
}

export class AIGatewayMalformedResponseError extends AIGatewayError {
  constructor(message: string = "AI provider returned a malformed response") {
    super(message, AI_GATEWAY_ERROR_CODES.MALFORMED_RESPONSE);
    this.name = "AIGatewayMalformedResponseError";
  }
}
