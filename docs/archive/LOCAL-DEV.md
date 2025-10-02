# 🛠️ Local Development Guide

Complete guide for setting up and running the project locally.

---

## 🚀 Quick Start

### 1. Prerequisites

- **Bun** >= 1.0.0 ([install](https://bun.sh))
- **Git** (for cloning)
- **Telegram Bot Token** from [@BotFather](https://t.me/botfather)

### 2. Clone & Install

```bash
# Clone the repository
git clone <your-repo>
cd telegram-affiliate

# Install all dependencies (monorepo)
bun install
```

### 3. Environment Setup

```bash
# Root .env (for Telegram bot)
cp .env.example .env
# Edit .env and add your BOT_TOKEN

# API .env.local (optional, for local overrides)
cp apps/api/.env.local.example apps/api/.env.local

# Dashboard .env.local (optional, for local overrides)
cp apps/dashboard/.env.local.example apps/dashboard/.env.local
```

**Root `.env`:**
```bash
BOT_TOKEN=your_bot_token_from_botfather
ADMIN_IDS=8013171035
DATABASE_PATH=./data/affiliate_system.db
```

**API `.env.local`:**
```bash
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5175,http://localhost:3000
DEBUG=true
```

**Dashboard `.env.local`:**
```bash
VITE_API_URL=http://localhost:3001/api
VITE_DEBUG=true
VITE_MOCK_TELEGRAM=true
```

### 4. Initialize Database

```bash
bun run scripts/init-database.ts
```

### 5. Start Development Servers

**Option A: All at once (3 terminals)**
```bash
# Terminal 1: Bot
bun run dev:bot

# Terminal 2: API
bun run dev:api

# Terminal 3: Dashboard
bun run dev:ui
```

**Option B: Just what you need**
```bash
# Only the bot
bun run dev:bot

# Only the API + Dashboard
bun run dev:api & bun run dev:ui
```

---

## 📡 Services & Ports

| Service | URL | Description |
|---------|-----|-------------|
| **Bot** | - | Telegram bot (polls Telegram API) |
| **API** | http://localhost:3001 | Hono API server |
| **Dashboard** | http://localhost:5175 | Vue 3 dashboard |

**API Endpoints:**
- `GET /health` - Health check
- `GET /api/user/me` - Current user info
- `GET /api/user/stats` - User statistics
- `GET /api/agent/tree` - Agent tree data

---

## 🧪 Testing Locally

### Test Bot in Telegram

1. Start bot: `bun run dev:bot`
2. Open your bot in Telegram
3. Send `/start`
4. Click "Become Agent"
5. Test commands: `/stats`, `/level`, `/tree`

### Test API Directly

```bash
# Health check
curl http://localhost:3001/health

# Test user endpoint (will fail without auth)
curl http://localhost:3001/api/user/me
```

### Test Dashboard in Browser

1. Start API: `bun run dev:api`
2. Start dashboard: `bun run dev:ui`
3. Open http://localhost:5175
4. Dashboard will use mock data in dev mode

---

## 🔧 Development Commands

### General

```bash
# Install dependencies
bun install

# Clean all node_modules
bun run clean

# Run health check
bun run health:check
```

### Bot

```bash
# Start bot with hot reload
bun run dev:bot

# Run bot without hot reload
cd src && bun index.ts
```

### API

```bash
# Start API with hot reload
bun run dev:api

# Start with wrangler (simulates Cloudflare)
cd apps/api && wrangler dev --port 3001

# Check API logs
curl http://localhost:3001/health | bunx jq
```

### Dashboard

```bash
# Start dashboard with hot reload
bun run dev:ui

# Build for production
bun run build:ui

# Preview production build
bun run start:dashboard
```

### Database

```bash
# Initialize database
bun run scripts/init-database.ts

# Run migrations
bun run scripts/migrate-from-python.ts

# Query database directly
bun run src/cli.ts
```

---

## 🐛 Troubleshooting

### Bot not responding

```bash
# Check bot logs
tail -f bot.log

# Verify bot token
echo $BOT_TOKEN

# Test bot connection
curl https://api.telegram.org/bot$BOT_TOKEN/getMe
```

### API CORS errors

```bash
# Check CORS origins in apps/api/.env.local
CORS_ORIGINS=http://localhost:5175

# Restart API
pkill -f "bun.*apps/api"
bun run dev:api
```

### Dashboard not loading data

```bash
# Check API URL in apps/dashboard/.env.local
VITE_API_URL=http://localhost:3001/api

# Check API is running
curl http://localhost:3001/health

# Clear cache and restart
rm -rf apps/dashboard/dist
bun run dev:ui
```

### Port already in use

```bash
# Find process using port 3001
lsof -ti:3001

# Kill process
lsof -ti:3001 | xargs kill -9

# Or use different port
PORT=3002 bun run dev:api
```

### Database locked

```bash
# Stop all services
pkill -f "bun.*src/index.ts"

# Remove lock files
rm -f data/*.db-shm data/*.db-wal

# Restart
bun run dev:bot
```

---

## 📁 Project Structure

```
telegram-affiliate/
├── .env                    # Bot config (BOT_TOKEN, ADMIN_IDS)
├── apps/
│   ├── api/
│   │   ├── .env.local      # API local config
│   │   └── src/
│   │       └── index.ts    # API entry point
│   │
│   └── dashboard/
│       ├── .env.local      # Dashboard local config
│       └── src/
│           └── main.ts     # Dashboard entry point
│
├── src/
│   └── index.ts            # Bot entry point
│
└── data/
    └── affiliate_system.db # SQLite database
```

---

## 🔐 Environment Variables

### Bot (Root `.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `BOT_TOKEN` | ✅ | Telegram bot token | `123456:ABC-DEF...` |
| `ADMIN_IDS` | ✅ | Comma-separated admin user IDs | `8013171035` |
| `DATABASE_PATH` | ❌ | Database file path | `./data/affiliate_system.db` |
| `LOG_LEVEL` | ❌ | Logging level | `info` / `debug` |

### API (`apps/api/.env.local`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `ENVIRONMENT` | ❌ | Environment name | `development` |
| `CORS_ORIGINS` | ❌ | Allowed CORS origins | `http://localhost:5175` |
| `DEBUG` | ❌ | Enable debug logging | `true` |
| `PORT` | ❌ | API server port | `3001` |

### Dashboard (`apps/dashboard/.env.local`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | ❌ | API base URL | `http://localhost:3001/api` |
| `VITE_DEBUG` | ❌ | Enable debug mode | `true` |
| `VITE_MOCK_TELEGRAM` | ❌ | Mock Telegram WebApp | `true` |

---

## 🎯 Development Workflow

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Start services
bun run dev:bot
bun run dev:api
bun run dev:ui

# 3. Make changes (hot reload works!)

# 4. Test locally

# 5. Commit & push
git add .
git commit -m "feat: my feature"
git push origin feature/my-feature
```

### Database Changes

```bash
# 1. Update schema in scripts/init-database.ts

# 2. Backup existing database
cp data/affiliate_system.db data/affiliate_system.db.backup

# 3. Recreate database
rm data/affiliate_system.db
bun run scripts/init-database.ts

# 4. Test with bot
bun run dev:bot
```

### API Changes

```bash
# 1. Update code in apps/api/src/

# 2. API auto-reloads (with --watch flag)

# 3. Test endpoint
curl http://localhost:3001/api/your-endpoint

# 4. Update dashboard to consume new endpoint
```

---

## 📊 Monitoring

### View Logs

```bash
# Bot logs
tail -f bot.log

# API logs (console output)
# Check terminal where you ran `bun run dev:api`

# Dashboard logs
# Open browser console (F12)
```

### Health Checks

```bash
# API health
curl http://localhost:3001/health

# Database status
bun run health:check

# System stats
bun run src/cli.ts
```

---

## 🚀 Ready for Production?

See [CLOUDFLARE-SETUP.md](./CLOUDFLARE-SETUP.md) for deployment instructions.

---

**Questions?** Check the [main README](./README.md) or open an issue.

