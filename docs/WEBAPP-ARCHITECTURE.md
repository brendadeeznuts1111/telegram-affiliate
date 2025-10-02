# 🏗️ Web Dashboard Architecture - Final Design

**Monorepo with Bun Workspaces** - One lockfile, shared code, blazing fast!

---

## 🎯 Tech Stack (Finalized)

### Monorepo Structure
```
✅ Bun Workspaces - Single lockfile, shared dependencies
✅ Shared packages - Types, schemas, utilities
✅ Consistent versioning across all packages
```

### Backend API
```
✅ Hono - Ultra-fast web framework (faster than Express)
✅ Bun native - No Node.js needed
✅ Zod - Runtime type validation & schema sharing
✅ JWT - Telegram-based authentication
```

### Frontend Dashboard
```
✅ Vue 3 + TypeScript - Composition API
✅ Vite - Lightning fast HMR
✅ Telegram WebApp SDK (TWA) - Native integration
✅ Zod - Shared schemas with backend
✅ Tailwind CSS + HeadlessUI - Beautiful components
```

### Shared Packages
```
✅ @affiliate/schemas - Zod schemas (shared validation)
✅ @affiliate/types - TypeScript types
✅ @affiliate/utils - Shared utilities
```

---

## 📁 Monorepo Structure (Bun Workspaces)

```
telegram-affiliate/                    # Root monorepo
├── package.json                       # Root package with workspaces
├── bun.lockb                          # 🔒 SINGLE LOCKFILE FOR ALL!
├── tsconfig.json                      # Shared TS config
│
├── apps/
│   ├── bot/                           # 🤖 Existing Telegram bot
│   │   ├── package.json
│   │   └── src/
│   │       └── ... (existing bot code)
│   │
│   ├── api/                           # 🚀 NEW: Bun + Hono API
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts               # API entry
│   │       ├── routes/                # API routes
│   │       │   ├── user.ts
│   │       │   ├── agent.ts
│   │       │   ├── commission.ts
│   │       │   └── admin.ts
│   │       ├── middleware/            # Auth, CORS, etc.
│   │       │   ├── auth.ts
│   │       │   ├── telegram.ts
│   │       │   └── ratelimit.ts
│   │       ├── controllers/           # Business logic
│   │       └── websocket/             # WebSocket handlers
│   │
│   └── dashboard/                     # 🎨 NEW: Vue 3 Dashboard
│       ├── package.json
│       ├── vite.config.ts
│       ├── index.html
│       └── src/
│           ├── main.ts                # Vue entry
│           ├── App.vue
│           ├── components/            # Reusable components
│           ├── views/                 # Page views
│           │   ├── Dashboard.vue
│           │   ├── AgentTree.vue
│           │   ├── Commissions.vue
│           │   └── Admin.vue
│           ├── stores/                # Pinia stores
│           ├── router/                # Vue Router
│           ├── api/                   # API client
│           └── composables/           # Vue composables
│
├── packages/
│   ├── schemas/                       # 📦 Shared Zod schemas
│   │   ├── package.json
│   │   └── src/
│   │       ├── user.ts
│   │       ├── agent.ts
│   │       ├── commission.ts
│   │       └── customer.ts
│   │
│   ├── types/                         # 📦 Shared TypeScript types
│   │   ├── package.json
│   │   └── src/
│   │       └── index.ts
│   │
│   └── utils/                         # 📦 Shared utilities
│       ├── package.json
│       └── src/
│           ├── validation.ts
│           ├── formatting.ts
│           └── crypto.ts
│
├── data/                              # SQLite database (shared)
│   └── affiliate_system.db
│
└── docs/                              # Documentation
    └── ...
```

---

## 🔧 Root Package.json (Workspace Config)

```json
{
  "name": "telegram-affiliate-monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "bun run --filter='*' dev",
    "dev:bot": "bun run --filter=bot dev",
    "dev:api": "bun run --filter=api dev",
    "dev:dashboard": "bun run --filter=dashboard dev",
    "build": "bun run --filter='*' build",
    "start:bot": "bun run --filter=bot start",
    "start:api": "bun run --filter=api start",
    "start:dashboard": "bun run --filter=dashboard preview"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.0.0"
  }
}
```

---

## 📦 Shared Schemas Package (Zod)

### `packages/schemas/package.json`
```json
{
  "name": "@affiliate/schemas",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "zod": "^3.22.4"
  }
}
```

### `packages/schemas/src/user.ts`
```typescript
import { z } from 'zod';

export const UserSchema = z.object({
  user_id: z.number().int().positive(),
  username: z.string().nullable(),
  first_name: z.string().min(1),
  last_name: z.string().nullable(),
  is_agent: z.boolean(),
  is_super_agent: z.boolean(),
  parent_agent_id: z.number().int().positive().nullable(),
  created_at: z.number().int().positive(),
  total_commission: z.number().nonnegative(),
  total_customers: z.number().int().nonnegative(),
  level: z.number().int().min(0).max(3), // 0-3 for Agent, Silver, Gold, Platinum
  net_deposited: z.number().nonnegative(),
});

export const CreateUserSchema = UserSchema.pick({
  user_id: true,
  username: true,
  first_name: true,
  last_name: true,
});

export const UpdateUserSchema = UserSchema.partial().required({ user_id: true });

export const AgentStatsSchema = z.object({
  customers: z.number().int().nonnegative(),
  commission: z.number().nonnegative(),
  sub_agents: z.number().int().nonnegative(),
  net_deposited: z.number().nonnegative(),
  level: z.number().int().min(0).max(3),
});

// Infer TypeScript types from schemas
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type AgentStats = z.infer<typeof AgentStatsSchema>;
```

### `packages/schemas/src/commission.ts`
```typescript
import { z } from 'zod';

export const CommissionEventSchema = z.enum([
  'new_user',
  'first_deposit',
  'deposit',
  'withdrawal',
]);

export const CommissionSchema = z.object({
  commission_id: z.number().int().positive(),
  agent_id: z.number().int().positive(),
  customer_id: z.number().int().positive(),
  amount: z.number(),
  percentage: z.number(),
  status: z.enum(['pending', 'paid']),
  event_type: CommissionEventSchema,
  created_at: z.number().int().positive(),
  paid_at: z.number().int().positive().nullable(),
});

export const CreateCommissionSchema = CommissionSchema.omit({
  commission_id: true,
  created_at: true,
  paid_at: true,
});

export type Commission = z.infer<typeof CommissionSchema>;
export type CommissionEvent = z.infer<typeof CommissionEventSchema>;
export type CreateCommission = z.infer<typeof CreateCommissionSchema>;
```

### `packages/schemas/src/index.ts`
```typescript
export * from './user';
export * from './commission';
export * from './customer';
export * from './agent';
```

---

## 🚀 API Server (Hono + Bun)

### `apps/api/package.json`
```json
{
  "name": "api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts",
    "build": "bun build src/index.ts --outdir dist"
  },
  "dependencies": {
    "@affiliate/schemas": "workspace:*",
    "hono": "^4.0.0",
    "zod": "^3.22.4",
    "jose": "^5.2.0"
  },
  "devDependencies": {
    "@types/bun": "latest"
  }
}
```

### `apps/api/src/index.ts`
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// Import routes
import userRoutes from './routes/user';
import agentRoutes from './routes/agent';
import commissionRoutes from './routes/commission';
import adminRoutes from './routes/admin';

// Middleware
import { telegramAuth } from './middleware/telegram';
import { errorHandler } from './middleware/error';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.DASHBOARD_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use('*', prettyJSON());

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

// API routes (all protected with Telegram auth)
app.use('/api/*', telegramAuth);
app.route('/api/user', userRoutes);
app.route('/api/agent', agentRoutes);
app.route('/api/commission', commissionRoutes);
app.route('/api/admin', adminRoutes);

// Error handling
app.onError(errorHandler);

// Start server
const port = parseInt(process.env.API_PORT || '3000', 10);
console.log(`🚀 API server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
```

### `apps/api/src/routes/user.ts` (Example with Zod)
```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { UserSchema, UpdateUserSchema } from '@affiliate/schemas';
import { db } from '../../../src/core/database'; // Reuse existing DB!

const app = new Hono();

// GET /api/user/me
app.get('/me', (c) => {
  const userId = c.get('userId'); // From auth middleware
  
  const user = db.queryOne<any>(
    'SELECT * FROM users WHERE user_id = ?',
    [userId]
  );
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  // Validate with Zod
  const validated = UserSchema.parse(user);
  return c.json(validated);
});

// PUT /api/user/:id
app.put('/:id', zValidator('json', UpdateUserSchema), async (c) => {
  const userId = parseInt(c.req.param('id'), 10);
  const data = c.req.valid('json');
  
  // Authorization check
  const requesterId = c.get('userId');
  if (requesterId !== userId && !c.get('isAdmin')) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  
  // Update user...
  // (business logic)
  
  return c.json({ success: true });
});

export default app;
```

### `apps/api/src/middleware/telegram.ts`
```typescript
import type { Context, Next } from 'hono';
import { createHmac } from 'crypto';

export async function telegramAuth(c: Context, next: Next) {
  const initData = c.req.header('X-Telegram-Init-Data');
  
  if (!initData) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Verify Telegram WebApp data
  const isValid = verifyTelegramWebAppData(initData);
  
  if (!isValid) {
    return c.json({ error: 'Invalid Telegram data' }, 401);
  }
  
  // Parse user data from init data
  const params = new URLSearchParams(initData);
  const userJson = params.get('user');
  
  if (!userJson) {
    return c.json({ error: 'No user data' }, 401);
  }
  
  const user = JSON.parse(userJson);
  
  // Set user context
  c.set('userId', user.id);
  c.set('username', user.username);
  c.set('isAdmin', isAdmin(user.id)); // Check admin list
  
  await next();
}

function verifyTelegramWebAppData(initData: string): boolean {
  const BOT_TOKEN = process.env.BOT_TOKEN!;
  
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  
  // Sort params and create data-check-string
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  // Create secret key from bot token
  const secretKey = createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN)
    .digest();
  
  // Calculate hash
  const calculatedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  return calculatedHash === hash;
}

function isAdmin(userId: number): boolean {
  const adminIds = process.env.ADMIN_IDS?.split(',').map(Number) || [];
  return adminIds.includes(userId);
}
```

---

## 🎨 Dashboard (Vue 3 + TWA)

### `apps/dashboard/package.json`
```json
{
  "name": "dashboard",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@affiliate/schemas": "workspace:*",
    "@telegram-apps/sdk": "^1.0.0",
    "vue": "^3.4.0",
    "vue-router": "^4.2.5",
    "pinia": "^2.1.7",
    "zod": "^3.22.4",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.0.0",
    "vue-tsc": "^1.8.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.33"
  }
}
```

### `apps/dashboard/src/main.ts`
```typescript
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';
import './style.css';

// Initialize Telegram WebApp
import { init, retrieveLaunchParams } from '@telegram-apps/sdk';

const app = createApp(App);

// Setup Pinia
app.use(createPinia());
app.use(router);

// Initialize Telegram WebApp SDK
try {
  init();
  const launchParams = retrieveLaunchParams();
  console.log('Telegram WebApp initialized:', launchParams);
} catch (error) {
  console.error('Failed to initialize Telegram WebApp:', error);
}

app.mount('#app');
```

### `apps/dashboard/src/api/client.ts`
```typescript
import axios from 'axios';
import { retrieveLaunchParams } from '@telegram-apps/sdk';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Telegram init data to every request
api.interceptors.request.use((config) => {
  try {
    const { initDataRaw } = retrieveLaunchParams();
    if (initDataRaw) {
      config.headers['X-Telegram-Init-Data'] = initDataRaw;
    }
  } catch (error) {
    console.error('Failed to get Telegram init data:', error);
  }
  return config;
});

export default api;
```

### `apps/dashboard/src/views/Dashboard.vue`
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import type { User, AgentStats } from '@affiliate/schemas';

const userStore = useUserStore();
const stats = ref<AgentStats | null>(null);

onMounted(async () => {
  await userStore.fetchCurrentUser();
  stats.value = await userStore.fetchStats();
});
</script>

<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-6">
      Welcome, {{ userStore.user?.first_name }}! 👋
    </h1>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Stats Cards -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-500">Total Customers</div>
        <div class="text-3xl font-bold">{{ stats?.customers || 0 }}</div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-500">Total Commission</div>
        <div class="text-3xl font-bold">${{ stats?.commission.toFixed(2) || '0.00' }}</div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-500">Agent Level</div>
        <div class="text-3xl font-bold">{{ getLevelName(stats?.level || 0) }}</div>
      </div>
    </div>
  </div>
</template>
```

---

## ✨ Key Benefits

### 1. **Single Lockfile** 🔒
```bash
bun.lockb at root
└── All dependencies locked together
    └── Faster installs
    └── Consistent versions
```

### 2. **Shared Zod Schemas** 📦
```typescript
// Backend validates
const user = UserSchema.parse(data);

// Frontend validates (same schema!)
const user = UserSchema.parse(response);

// Types are automatically inferred
type User = z.infer<typeof UserSchema>;
```

### 3. **Type Safety End-to-End** 🛡️
```
Database → Zod Schema → TypeScript Type → API → Frontend
         (runtime)     (compile)
```

### 4. **Hono Performance** ⚡
```
Express:  ~15,000 req/sec
Hono:     ~400,000 req/sec (26x faster!)
```

### 5. **Telegram WebApp Native** 📱
```typescript
import { useWebApp } from '@telegram-apps/sdk';

const webApp = useWebApp();
webApp.ready(); // Tell Telegram we're ready
webApp.expand(); // Full screen
webApp.MainButton.setText('Submit').show();
```

---

## 🚀 Commands

```bash
# Install all dependencies (one command!)
bun install

# Dev mode (all apps in parallel)
bun dev

# Dev mode (individual apps)
bun dev:bot
bun dev:api
bun dev:dashboard

# Build everything
bun build

# Production
bun start:bot
bun start:api
bun start:dashboard
```

---

## 📊 Comparison

### Without Workspaces ❌
```
bot/package.json + bot/bun.lockb
api/package.json + api/bun.lockb
dashboard/package.json + dashboard/bun.lockb
= 3 lockfiles, duplicate deps, version conflicts
```

### With Workspaces ✅
```
package.json + bun.lockb (root)
└── apps/bot/package.json
└── apps/api/package.json
└── apps/dashboard/package.json
= 1 lockfile, shared deps, consistent versions
```

---

## 🎯 Next Steps

1. Create workspace structure
2. Set up shared schemas package
3. Create Hono API
4. Create Vue dashboard
5. Integrate Telegram WebApp

**Ready to start?** 🚀

