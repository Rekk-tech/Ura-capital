import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { AppError } from "../../shared/errors/error-envelope.js";

export class SubscriptionEventIdempotencyConflictError extends AppError {
  constructor(message = "Provider event payload conflicts with previously committed event") {
    super(message, ERROR_CODES.IDEMPOTENCY_CONFLICT, HTTP_STATUS.CONFLICT);
    this.name = "SubscriptionEventIdempotencyConflictError";
  }
}

export class SubscriptionEventPayloadTooLargeError extends AppError {
  constructor(message = "Webhook payload exceeds allowed size limit") {
    super(message, ERROR_CODES.VALIDATION_ERROR, 413);
    this.name = "SubscriptionEventPayloadTooLargeError";
  }
}

export class SubscriptionInvalidTransitionError extends AppError {
  constructor(message = "Subscription transition is invalid or not allowed") {
    super(message, ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    this.name = "SubscriptionInvalidTransitionError";
  }
}

export class SubscriptionEventUnknownProviderError extends AppError {
  constructor(providerKey: string) {
    super(
      `Unknown or unsupported subscription provider: ${providerKey}`,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
    this.name = "SubscriptionEventUnknownProviderError";
  }
}
