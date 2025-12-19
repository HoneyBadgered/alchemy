/**
 * API Error Utilities
 * Standardized error classes and response formatting
 */

/**
 * Base API Error class
 * Provides consistent error structure across all API responses
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    const response: { error: string; message: string; statusCode: number; details?: unknown } = {
      error: this.code || 'API_ERROR',
      message: this.message,
      statusCode: this.statusCode,
    };
    if (this.details) {
      response.details = this.details;
    }
    return response;
  }
}

/**
 * 400 Bad Request
 * Client sent invalid data
 */
export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request', details?: unknown) {
    super(400, message, 'BAD_REQUEST', details);
  }
}

/**
 * 401 Unauthorized
 * Authentication required or failed
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

/**
 * 403 Forbidden
 * User lacks permission
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

/**
 * 404 Not Found
 * Resource doesn't exist
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
  }
}

/**
 * 409 Conflict
 * Resource already exists or state conflict
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict') {
    super(409, message, 'CONFLICT');
  }
}

/**
 * 422 Unprocessable Entity
 * Validation error
 */
export class ValidationError extends ApiError {
  constructor(message: string = 'Validation error', details?: unknown) {
    super(422, message, 'VALIDATION_ERROR', details);
  }
}

/**
 * 429 Too Many Requests
 * Rate limit exceeded
 */
export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests') {
    super(429, message, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * 500 Internal Server Error
 * Unexpected server error
 */
export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error') {
    super(500, message, 'INTERNAL_SERVER_ERROR');
  }
}

/**
 * 503 Service Unavailable
 * Temporary service outage
 */
export class ServiceUnavailableError extends ApiError {
  constructor(message: string = 'Service unavailable') {
    super(503, message, 'SERVICE_UNAVAILABLE');
  }
}

/**
 * Domain-specific error classes
 */

export class OrderValidationError extends BadRequestError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.code = 'ORDER_VALIDATION_ERROR';
  }
}

export class InsufficientStockError extends BadRequestError {
  constructor(message: string = 'Insufficient stock', details?: unknown) {
    super(message, details);
    this.code = 'INSUFFICIENT_STOCK';
  }
}

export class PaymentError extends BadRequestError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.code = 'PAYMENT_ERROR';
  }
}

export class CartError extends BadRequestError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.code = 'CART_ERROR';
  }
}

/**
 * Helper function to handle Zod validation errors
 */
export function handleZodError(error: any): ValidationError {
  return new ValidationError('Validation error', {
    errors: error.errors,
  });
}

/**
 * Helper function to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Helper function to convert unknown errors to ApiError
 */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // Check for known error patterns
    const message = error.message.toLowerCase();
    
    if (message.includes('not found')) {
      return new NotFoundError(error.message);
    }
    
    if (message.includes('already exists') || message.includes('duplicate')) {
      return new ConflictError(error.message);
    }
    
    if (message.includes('unauthorized') || message.includes('invalid token')) {
      return new UnauthorizedError(error.message);
    }
    
    if (message.includes('forbidden') || message.includes('permission')) {
      return new ForbiddenError(error.message);
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return new ValidationError(error.message);
    }
    
    // Default to internal server error
    return new InternalServerError(error.message);
  }

  // Unknown error type
  return new InternalServerError('An unexpected error occurred');
}

