# @affiliate/errors

Custom error classes for the Telegram Affiliate Bot system. Provides structured, consistent error handling across all services.

## Features

- ✅ **Custom Error Classes** - Domain-specific errors with proper types
- ✅ **Error Codes** - Machine-readable error codes
- ✅ **Structured Details** - Additional context for debugging
- ✅ **HTTP Status Codes** - Automatic HTTP status code mapping
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Stack Traces** - Proper error stack preservation

## Installation

This is a workspace package, installed automatically with the monorepo.

```bash
bun install
```

## Available Error Classes

### ValidationError

For input validation failures.

```typescript
import { ValidationError } from '@affiliate/errors';

throw new ValidationError('Invalid email format', {
  field: 'email',
  value: 'invalid-email',
  constraint: 'email',
});
```

**HTTP Status:** 400 Bad Request

### AuthenticationError

For authentication failures.

```typescript
import { AuthenticationError } from '@affiliate/errors';

throw new AuthenticationError('Invalid API key');
```

**HTTP Status:** 401 Unauthorized

### AuthorizationError

For authorization/permission failures.

```typescript
import { AuthorizationError } from '@affiliate/errors';

throw new AuthorizationError('Admin access required', {
  required: 'admin',
  actual: 'user',
});
```

**HTTP Status:** 403 Forbidden

### NotFoundError

For resource not found errors.

```typescript
import { NotFoundError } from '@affiliate/errors';

throw new NotFoundError('User not found', {
  resource: 'User',
  id: userId,
});
```

**HTTP Status:** 404 Not Found

### ConflictError

For resource conflicts (e.g., duplicate entries).

```typescript
import { ConflictError } from '@affiliate/errors';

throw new ConflictError('User already exists', {
  field: 'email',
  value: 'user@example.com',
});
```

**HTTP Status:** 409 Conflict

### RateLimitError

For rate limiting violations.

```typescript
import { RateLimitError } from '@affiliate/errors';

throw new RateLimitError('Too many requests', {
  limit: 100,
  window: '1 minute',
  retryAfter: 60,
});
```

**HTTP Status:** 429 Too Many Requests

### DatabaseError

For database operation failures.

```typescript
import { DatabaseError } from '@affiliate/errors';

throw new DatabaseError('Failed to insert user', {
  operation: 'INSERT',
  table: 'users',
  cause: originalError,
});
```

**HTTP Status:** 500 Internal Server Error

### ExternalServiceError

For external service/API failures.

```typescript
import { ExternalServiceError } from '@affiliate/errors';

throw new ExternalServiceError('Payment gateway unavailable', {
  service: 'stripe',
  endpoint: '/v1/charges',
  statusCode: 503,
});
```

**HTTP Status:** 502 Bad Gateway

### ConfigurationError

For configuration/environment issues.

```typescript
import { ConfigurationError } from '@affiliate/errors';

throw new ConfigurationError('Missing required environment variable', {
  variable: 'BOT_TOKEN',
  required: true,
});
```

**HTTP Status:** 500 Internal Server Error

## Usage Examples

### Basic Usage

```typescript
import { ValidationError, NotFoundError } from '@affiliate/errors';

function getUser(id: number) {
  if (!id || id <= 0) {
    throw new ValidationError('Invalid user ID', { id });
  }

  const user = db.query('SELECT * FROM users WHERE id = ?', [id]);
  
  if (!user) {
    throw new NotFoundError('User not found', { id });
  }

  return user;
}
```

### With Error Handler (Hono)

```typescript
import { Hono } from 'hono';
import { ValidationError, NotFoundError } from '@affiliate/errors';

const app = new Hono();

app.onError((err, c) => {
  if (err instanceof ValidationError) {
    return c.json({
      error: err.message,
      code: err.code,
      details: err.details,
    }, 400);
  }

  if (err instanceof NotFoundError) {
    return c.json({
      error: err.message,
      code: err.code,
      details: err.details,
    }, 404);
  }

  // Generic error
  return c.json({
    error: 'Internal server error',
  }, 500);
});
```

### With Try-Catch

```typescript
import { DatabaseError } from '@affiliate/errors';

try {
  await db.execute('INSERT INTO users ...', params);
} catch (error) {
  throw new DatabaseError('Failed to create user', {
    operation: 'INSERT',
    table: 'users',
    originalError: error,
  });
}
```

## Error Properties

All custom errors extend the base `AppError` class:

```typescript
class AppError extends Error {
  name: string;        // Error class name
  message: string;     // Human-readable message
  code: string;        // Machine-readable code
  statusCode: number;  // HTTP status code
  details?: any;       // Additional context
  stack?: string;      // Stack trace
}
```

### Error Codes

| Error Class | Code | Status Code |
|---|---|---|
| ValidationError | `VALIDATION_ERROR` | 400 |
| AuthenticationError | `AUTHENTICATION_ERROR` | 401 |
| AuthorizationError | `AUTHORIZATION_ERROR` | 403 |
| NotFoundError | `NOT_FOUND` | 404 |
| ConflictError | `CONFLICT_ERROR` | 409 |
| RateLimitError | `RATE_LIMIT_ERROR` | 429 |
| DatabaseError | `DATABASE_ERROR` | 500 |
| ExternalServiceError | `EXTERNAL_SERVICE_ERROR` | 502 |
| ConfigurationError | `CONFIGURATION_ERROR` | 500 |

## Type Safety

```typescript
import type { AppError } from '@affiliate/errors';

function handleError(error: AppError) {
  console.log(error.code);        // Type-safe
  console.log(error.statusCode);  // Type-safe
  console.log(error.details);     // Type-safe (any)
}
```

## Error Handler Middleware

Example error handling middleware for Hono:

```typescript
import { Context } from 'hono';
import { AppError } from '@affiliate/errors';

export function errorHandler(err: Error, c: Context) {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return c.json({
      error: err.message,
      code: err.code,
      details: err.details,
    }, err.statusCode);
  }

  // Unknown error
  return c.json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  }, 500);
}
```

## Benefits

### Before (Generic Errors)

```typescript
// Unclear what went wrong
throw new Error('Something failed');

// No status code information
// No structured details
// Hard to handle in API
```

### After (Custom Errors)

```typescript
// Clear, specific error
throw new ValidationError('Invalid email format', {
  field: 'email',
  value: input.email,
});

// Automatic HTTP status codes
// Structured details for debugging
// Easy to handle in API
```

## Best Practices

### 1. Always Include Context

```typescript
// ❌ BAD: Generic error
throw new NotFoundError('Not found');

// ✅ GOOD: Specific with context
throw new NotFoundError('User not found', {
  userId: 123,
  operation: 'getUserById',
});
```

### 2. Use Appropriate Error Types

```typescript
// ❌ BAD: Wrong error type
throw new ValidationError('User not found');

// ✅ GOOD: Correct error type
throw new NotFoundError('User not found');
```

### 3. Preserve Original Errors

```typescript
// ✅ GOOD: Include original error
try {
  await externalApi.call();
} catch (error) {
  throw new ExternalServiceError('API call failed', {
    service: 'external-api',
    originalError: error,
  });
}
```

### 4. Don't Leak Sensitive Information

```typescript
// ❌ BAD: Exposes internals
throw new DatabaseError('Connection failed: password=secret123');

// ✅ GOOD: Safe message
throw new DatabaseError('Database connection failed', {
  host: 'db.example.com',
  // Don't include passwords!
});
```

## Related Packages

- `@affiliate/config` - Configuration management
- `@affiliate/database` - Database abstraction
- `@affiliate/schemas` - Zod validation schemas

## License

MIT
