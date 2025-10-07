# @affiliate/config

Centralized configuration management for the Telegram Affiliate Bot system.

## Features

- ✅ **Centralized Configuration** - Single source of truth for all app settings
- ✅ **Zod Validation** - Type-safe environment variable parsing
- ✅ **Environment Detection** - Automatic development/staging/production detection
- ✅ **Default Values** - Sensible defaults for all optional settings
- ✅ **Type Safety** - Full TypeScript support with exported types

## Installation

This is a workspace package, installed automatically with the monorepo.

```bash
bun install
```

## Usage

### Basic Usage

```typescript
import { getConfig } from '@affiliate/config';

// Get validated configuration from environment
const config = getConfig(process.env);

// Access configuration values
console.log(config.bot.token);
console.log(config.database.path);
console.log(config.api.port);
```

### Configuration Structure

```typescript
{
  env: 'development' | 'staging' | 'production',
  
  database: {
    path: string,              // SQLite database path (local)
    journal_mode: 'WAL' | ..., // SQLite journal mode
    foreign_keys: boolean,     // Enable foreign keys
  },
  
  bot: {
    token: string,             // Telegram bot token (required)
    adminIds: number[],        // Admin user IDs
    username?: string,         // Bot username
  },
  
  commission: {
    directRate: number,        // Direct referral commission (0-1)
    superAgentRate: number,    // Super agent commission (0-1)
    currency: string,          // Currency code (e.g., 'USD')
  },
  
  api: {
    port: number,              // API server port
    host: string,              // API server host
    corsOrigins: string[],     // Allowed CORS origins
  },
  
  cloudflare: {
    databaseId?: string,       // D1 database ID
    kvNamespaceId?: string,    // KV namespace ID
  },
}
```

## Environment Variables

### Required

- `BOT_TOKEN` - Telegram bot token from @BotFather

### Optional

#### Database
- `DB_PATH` - SQLite database path (default: `./data/affiliate_system.db`)
- `DATABASE_PATH` - Alias for `DB_PATH` (backward compatibility)

#### Bot
- `ADMIN_IDS` - Comma-separated list of admin Telegram user IDs
- `BOT_USERNAME` - Bot username (without @)

#### Commission
- `COMMISSION_DIRECT` - Direct referral commission rate (default: `0.05`)
- `COMMISSION_SUPER` - Super agent commission rate (default: `0.02`)
- `COMMISSION_CURRENCY` - Currency code (default: `USD`)

#### API
- `API_PORT` - API server port (default: `3001`)
- `API_HOST` - API server host (default: `localhost`)
- `CORS_ORIGINS` - Comma-separated allowed origins (default: `http://localhost:5173`)

#### Cloudflare
- `CLOUDFLARE_DATABASE_ID` - D1 database ID for Workers
- `CLOUDFLARE_KV_NAMESPACE_ID` - KV namespace ID for Workers

#### General
- `ENVIRONMENT` - Environment name (default: `development`)

## Example .env File

```bash
# Required
BOT_TOKEN=your_bot_token_here

# Optional - Bot
ADMIN_IDS=123456789,987654321
BOT_USERNAME=your_bot_username

# Optional - Database
DB_PATH=./data/affiliate_system.db

# Optional - Commission
COMMISSION_DIRECT=0.05
COMMISSION_SUPER=0.02
COMMISSION_CURRENCY=USD

# Optional - API
API_PORT=3001
API_HOST=localhost
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Optional - Cloudflare (for Workers deployment)
CLOUDFLARE_DATABASE_ID=your_d1_database_id
CLOUDFLARE_KV_NAMESPACE_ID=your_kv_namespace_id

# Optional - Environment
ENVIRONMENT=development
```

## Error Handling

The `getConfig` function validates all environment variables and throws descriptive errors if:

- Required variables are missing
- Variables have invalid formats
- Values are out of acceptable ranges

Example error messages:

```
Error: BOT_TOKEN environment variable is required
Error: ADMIN_IDS must be comma-separated numbers
Error: COMMISSION_DIRECT must be between 0 and 1
```

## TypeScript Types

```typescript
import type { AppConfig, Environment, DatabaseConfig, BotConfig } from '@affiliate/config';

// Environment enum
type Environment = 'development' | 'staging' | 'production';

// Full configuration object
interface AppConfig {
  env: Environment;
  database: DatabaseConfig;
  bot: BotConfig;
  commission: CommissionConfig;
  api: ApiConfig;
  cloudflare: CloudflareConfig;
}
```

## Benefits

### Before (Scattered Configuration)

```typescript
// Different files, inconsistent parsing
const botToken = Bun.env.TELEGRAM_BOT_TOKEN;
const apiPort = parseInt(process.env.PORT || '3001');
const adminIds = process.env.ADMIN_IDS?.split(',').map(Number);
```

### After (Centralized)

```typescript
import { getConfig } from '@affiliate/config';

const config = getConfig(process.env);
// All values validated, typed, and ready to use
```

## Development

```bash
# Build the package
cd packages/config
bun run build

# Type check
bun run type-check
```

## Related Packages

- `@affiliate/database` - Database abstraction layer
- `@affiliate/schemas` - Zod validation schemas
- `@affiliate/errors` - Custom error classes

## License

MIT
