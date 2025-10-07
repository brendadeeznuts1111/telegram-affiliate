# @affiliate/schemas

Zod validation schemas for the Telegram Affiliate Bot system. Provides type-safe validation for all data structures.

## Features

- ✅ **Comprehensive Schemas** - All entities validated with Zod
- ✅ **Type Inference** - Automatic TypeScript types from schemas
- ✅ **Validation** - Runtime validation with detailed error messages
- ✅ **Transformation** - Data transformation and coercion
- ✅ **Reusable** - Shared across bot, API, and dashboard
- ✅ **Safe Parsing** - `safeParse()` for error handling

## Installation

This is a workspace package, installed automatically with the monorepo.

```bash
bun install
```

## Available Schemas

### User Schemas

```typescript
import { userSchema, createUserSchema, agentStatsSchema } from '@affiliate/schemas';

// User entity
const user: User = {
  user_id: 123456789,
  username: 'john_doe',
  first_name: 'John',
  last_name: 'Doe',
  is_agent: 1,
  is_super_agent: 0,
  parent_agent_id: null,
  created_at: 1704067200,
};

// Validate
const result = userSchema.safeParse(user);
if (!result.success) {
  console.error(result.error);
}

// Create user input
const input = createUserSchema.parse({
  user_id: 123456789,
  username: 'john_doe',
  first_name: 'John',
  last_name: 'Doe',
});
```

### Customer Schemas

```typescript
import { customerSchema, createCustomerSchema } from '@affiliate/schemas';

// Customer entity
const customer: Customer = {
  customer_id: 1,
  customer_name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1234567890',
  agent_id: 123,
  status: 'active',
  created_at: 1704067200,
};

// Create customer input
const input = createCustomerSchema.parse({
  customer_name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1234567890',
  agent_id: 123,
});
```

### Commission Schemas

```typescript
import { commissionSchema, commissionEventSchema } from '@affiliate/schemas';

// Commission entity
const commission: Commission = {
  commission_id: 1,
  agent_id: 123,
  customer_id: 456,
  amount: 50.00,
  percentage: 0.05,
  status: 'pending',
  created_at: 1704067200,
  paid_at: null,
};

// Commission event
const event: CommissionEvent = {
  event_type: 'deposit',
  agent_id: 123,
  customer_id: 456,
  amount: 1000.00,
  currency: 'USD',
  timestamp: Date.now(),
};
```

### Deposit Schemas

```typescript
import { depositSchema, createDepositSchema } from '@affiliate/schemas';

// Deposit entity
const deposit: Deposit = {
  deposit_id: 1,
  agent_id: 123,
  customer_id: 456,
  amount: 1000.00,
  currency: 'USD',
  created_at: 1704067200,
};

// Create deposit input
const input = createDepositSchema.parse({
  agent_id: 123,
  customer_id: 456,
  amount: 1000,
  currency: 'USD',
});
```

### Agent Schemas

```typescript
import { agentSchema, agentLevelSchema } from '@affiliate/schemas';

// Agent with level
const agent: Agent = {
  user_id: 123,
  username: 'john_doe',
  first_name: 'John',
  level: 'gold',
  total_deposits: 50000,
  customer_count: 25,
  sub_agent_count: 5,
};

// Agent level
const level: AgentLevel = {
  level: 'gold',
  min_deposits: 50000,
  min_customers: 20,
  commission_rate: 0.06,
};
```

### Webhook Schemas

```typescript
import {
  telegramUpdateSchema,
  telegramMessageSchema,
  paymentWebhookSchema,
} from '@affiliate/schemas';

// Telegram update
const update = telegramUpdateSchema.parse({
  update_id: 123456,
  message: {
    message_id: 1,
    from: {
      id: 123,
      is_bot: false,
      first_name: 'John',
      username: 'john_doe',
    },
    chat: {
      id: 123,
      type: 'private',
      first_name: 'John',
    },
    date: 1704067200,
    text: '/start',
  },
});

// Payment webhook
const payment = paymentWebhookSchema.parse({
  event: 'payment.success',
  transaction_id: 'tx_123',
  amount: 100.00,
  currency: 'USD',
  customer_id: 'cust_456',
  timestamp: Date.now(),
  signature: 'hmac_signature',
});
```

### API Request Schemas

```typescript
import { withdrawalRequestSchema } from '@affiliate/schemas';

// Withdrawal request
const withdrawal = withdrawalRequestSchema.parse({
  userId: '123',
  amount: 50,
  address: 'EQxyz...',
  chain: 'ton',
});
```

### Helper Schemas

```typescript
import { numericStringSchema, paginationSchema } from '@affiliate/schemas/helpers';

// Numeric string (from URL params)
const userId = numericStringSchema.parse('123'); // Returns 123 as number

// Pagination
const pagination = paginationSchema.parse({
  page: '1',
  limit: '20',
});
// Returns: { page: 1, limit: 20 }
```

## Usage Patterns

### API Endpoint Validation

```typescript
import { Hono } from 'hono';
import { createUserSchema } from '@affiliate/schemas';
import { ValidationError } from '@affiliate/errors';

const app = new Hono();

app.post('/users', async (c) => {
  const body = await c.req.json();
  
  // Validate with Zod
  const result = createUserSchema.safeParse(body);
  
  if (!result.success) {
    throw new ValidationError('Invalid user data', result.error);
  }
  
  // Type-safe data
  const userData = result.data;
  
  // Create user...
});
```

### Service Layer Validation

```typescript
import { depositSchema } from '@affiliate/schemas';

class CommissionService {
  calculateCommission(deposit: unknown) {
    // Validate deposit
    const validDeposit = depositSchema.parse(deposit);
    
    // Type-safe calculations
    const commission = validDeposit.amount * 0.05;
    
    return commission;
  }
}
```

### Frontend Validation

```typescript
import { withdrawalRequestSchema } from '@affiliate/schemas';

function submitWithdrawal(formData: any) {
  // Validate before API call
  const result = withdrawalRequestSchema.safeParse(formData);
  
  if (!result.success) {
    // Show validation errors
    showErrors(result.error.errors);
    return;
  }
  
  // Make API call with validated data
  await api.post('/withdraw', result.data);
}
```

## Schema Definitions

### User Schema

```typescript
export const userSchema = z.object({
  user_id: z.number().int().positive(),
  username: z.string().nullable(),
  first_name: z.string().min(1),
  last_name: z.string().nullable(),
  is_agent: z.number().int().min(0).max(1),
  is_super_agent: z.number().int().min(0).max(1),
  parent_agent_id: z.number().int().nullable(),
  created_at: z.number().int().positive(),
});

export type User = z.infer<typeof userSchema>;
```

### Create User Schema

```typescript
export const createUserSchema = userSchema.pick({
  user_id: true,
  username: true,
  first_name: true,
  last_name: true,
});

export type CreateUser = z.infer<typeof createUserSchema>;
```

## Error Handling

### Safe Parsing

```typescript
import { userSchema } from '@affiliate/schemas';

const result = userSchema.safeParse(data);

if (!result.success) {
  console.error('Validation failed:');
  result.error.errors.forEach((err) => {
    console.error(`  - ${err.path.join('.')}: ${err.message}`);
  });
} else {
  console.log('Valid data:', result.data);
}
```

### Throwing on Invalid Data

```typescript
import { userSchema } from '@affiliate/schemas';

try {
  const user = userSchema.parse(data);
  // Use user...
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Validation errors:', error.errors);
  }
}
```

## Custom Validation

### Custom Refinements

```typescript
const withdrawalSchema = z.object({
  amount: z.number().min(10),
  address: z.string(),
  chain: z.enum(['ton', 'tron']),
}).refine((data) => {
  // Custom validation: TON addresses must start with EQ or UQ
  if (data.chain === 'ton') {
    return data.address.startsWith('EQ') || data.address.startsWith('UQ');
  }
  return true;
}, {
  message: 'Invalid TON address format',
  path: ['address'],
});
```

### Transform Data

```typescript
const dateSchema = z.string().transform((str) => new Date(str));

const result = dateSchema.parse('2024-01-01');
// result is a Date object
```

## Benefits

### Before (Manual Validation)

```typescript
// Manual validation - error-prone
function createUser(data: any) {
  if (!data.user_id || typeof data.user_id !== 'number') {
    throw new Error('Invalid user_id');
  }
  if (!data.first_name || typeof data.first_name !== 'string') {
    throw new Error('Invalid first_name');
  }
  // ... many more checks
  
  return db.insert('users', data);
}
```

### After (Zod Schemas)

```typescript
// Zod validation - type-safe and concise
function createUser(data: unknown) {
  const validData = createUserSchema.parse(data);
  // validData is fully typed and validated
  
  return db.insert('users', validData);
}
```

## TypeScript Integration

Zod schemas automatically infer TypeScript types:

```typescript
import { userSchema } from '@affiliate/schemas';

// Infer type from schema
type User = z.infer<typeof userSchema>;

// Use type
function processUser(user: User) {
  // user is fully typed!
  console.log(user.first_name); // ✅ OK
  console.log(user.email);      // ❌ Error: Property 'email' does not exist
}
```

## Testing

```typescript
import { describe, test, expect } from 'bun:test';
import { userSchema } from '@affiliate/schemas';

describe('userSchema', () => {
  test('validates correct user', () => {
    const user = {
      user_id: 123,
      username: 'test',
      first_name: 'Test',
      last_name: 'User',
      is_agent: 1,
      is_super_agent: 0,
      parent_agent_id: null,
      created_at: Date.now(),
    };
    
    const result = userSchema.safeParse(user);
    expect(result.success).toBe(true);
  });
  
  test('rejects invalid user', () => {
    const invalid = {
      user_id: 'not a number', // ❌ Wrong type
      first_name: '',           // ❌ Empty string
    };
    
    const result = userSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

## Related Packages

- `@affiliate/config` - Configuration management
- `@affiliate/database` - Database abstraction
- `@affiliate/errors` - Custom error classes

## Resources

- [Zod Documentation](https://zod.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## License

MIT
