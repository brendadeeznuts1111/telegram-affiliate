/**
 * Custom Error Classes
 * Standardized error handling for the entire application
 */

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON() {
    return {
      error: this.message,
      code: this.code,
      ...(this.details && { details: this.details }),
    };
  }

  /**
   * Check if error is operational (expected) vs programming error
   */
  isOperational(): boolean {
    return true;
  }
}

/**
 * Validation error (400)
 * Used when input validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error (404)
 * Used when a resource is not found
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', resourceId?: string | number) {
    const message = resourceId
      ? `${resource} with ID ${resourceId} not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Unauthorized error (401)
 * Used when authentication is required but not provided
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden error (403)
 * Used when user doesn't have permission for the action
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden', action?: string) {
    const fullMessage = action
      ? `${message}: ${action}`
      : message;
    super(fullMessage, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Conflict error (409)
 * Used when there's a conflict with the current state
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: unknown) {
    super(message, 'CONFLICT', 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * Database error (500)
 * Used when database operations fail
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: unknown) {
    super(message, 'DATABASE_ERROR', 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * External service error (502)
 * Used when external API/service fails
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = 'External service error',
    details?: unknown
  ) {
    super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, details);
    this.name = 'ExternalServiceError';
  }
}

/**
 * Rate limit error (429)
 * Used when rate limit is exceeded
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}

/**
 * Bad request error (400)
 * Used for general bad requests
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: unknown) {
    super(message, 'BAD_REQUEST', 400, details);
    this.name = 'BadRequestError';
  }
}

/**
 * Internal server error (500)
 * Used for unexpected errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(message, 'INTERNAL_ERROR', 500, details);
    this.name = 'InternalServerError';
  }

  /**
   * Internal errors are not operational (they're programming errors)
   */
  isOperational(): boolean {
    return false;
  }
}

/**
 * Telegram error
 * Used when Telegram API fails
 */
export class TelegramError extends AppError {
  constructor(message: string, details?: unknown) {
    super(`Telegram API error: ${message}`, 'TELEGRAM_ERROR', 502, details);
    this.name = 'TelegramError';
  }
}

/**
 * Payment error
 * Used when payment operations fail
 */
export class PaymentError extends AppError {
  constructor(message: string, details?: unknown) {
    super(`Payment error: ${message}`, 'PAYMENT_ERROR', 402, details);
    this.name = 'PaymentError';
  }
}

/**
 * Check if an error is an instance of AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Check if an error is operational (expected)
 */
export function isOperationalError(error: unknown): boolean {
  return isAppError(error) && error.isOperational();
}

/**
 * Convert any error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalServerError(error.message, {
      originalError: error.name,
      stack: error.stack,
    });
  }

  return new InternalServerError('Unknown error occurred', {
    error: String(error),
  });
}

/**
 * Error handler utility for logging
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const appError = toAppError(error);
  
  const logData = {
    name: appError.name,
    message: appError.message,
    code: appError.code,
    statusCode: appError.statusCode,
    operational: appError.isOperational(),
    ...context,
    ...(appError.details && { details: appError.details }),
  };

  // Log operational errors as warnings, programming errors as errors
  if (appError.isOperational()) {
    console.warn('[Operational Error]', logData);
  } else {
    console.error('[Programming Error]', logData);
    console.error('Stack trace:', appError.stack);
  }
}

/**
 * Format error for Telegram message
 */
export function formatErrorForTelegram(error: unknown): string {
  const appError = toAppError(error);
  
  // Hide internal error details from users
  if (!appError.isOperational()) {
    return '❌ *An unexpected error occurred*\n\nPlease try again later or contact support.';
  }

  return `❌ *Error*\n\n${appError.message}`;
}

/**
 * Format error for API response
 */
export function formatErrorForAPI(error: unknown): {
  error: string;
  code: string;
  statusCode: number;
  details?: unknown;
} {
  const appError = toAppError(error);
  
  return {
    error: appError.message,
    code: appError.code,
    statusCode: appError.statusCode,
    ...(appError.details && appError.isOperational() && { details: appError.details }),
  };
}
