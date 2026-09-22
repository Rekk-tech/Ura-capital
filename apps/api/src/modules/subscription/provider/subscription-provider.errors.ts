import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

import { AppError } from "../../../shared/errors/error-envelope.js";

export class SubscriptionProviderConfigurationError extends AppError {
  constructor() {
    super(
      "Subscription provider configuration is invalid",
      ERROR_CODES.INVALID_CONFIGURATION,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
    this.name = "SubscriptionProviderConfigurationError";
  }
}

export class SubscriptionProviderUnavailableError extends AppError {
  constructor() {
    super(
      "Subscription provider is temporarily unavailable",
      ERROR_CODES.SERVICE_UNAVAILABLE,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
    this.name = "SubscriptionProviderUnavailableError";
  }
}

export class SubscriptionProviderVerificationError extends AppError {
  constructor() {
    super(
      "Provider verification failed",
      ERROR_CODES.UNAUTHENTICATED,
      HTTP_STATUS.UNAUTHORIZED,
    );
    this.name = "SubscriptionProviderVerificationError";
  }
}

export class SubscriptionProviderResponseError extends AppError {
  constructor() {
    super(
      "Subscription provider returned an invalid response",
      ERROR_CODES.SERVICE_UNAVAILABLE,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
    this.name = "SubscriptionProviderResponseError";
  }
}

export function mapSubscriptionProviderFailure(error: unknown): AppError {
  if (
    error instanceof SubscriptionProviderConfigurationError ||
    error instanceof SubscriptionProviderUnavailableError ||
    error instanceof SubscriptionProviderVerificationError ||
    error instanceof SubscriptionProviderResponseError
  ) {
    return error;
  }

  return new SubscriptionProviderUnavailableError();
}
