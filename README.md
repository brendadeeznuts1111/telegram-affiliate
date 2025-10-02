# 🤖 Telegram Affiliate Bot

Enterprise-grade Telegram affiliate marketing platform with multi-level commission tracking, real-time analytics, and comprehensive admin tools.

[![Bun](https://img.shields.io/badge/Bun-1.0+-000000?logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)](https://workers.cloudflare.com/)
[![Vue 3](https://img.shields.io/badge/Vue-3.0-4FC08D?logo=vue.js)](https://vuejs.org/)

## ✨ Features

### 🎯 Core Features
- **Multi-Level Agent System** - Agent, Silver, Gold, Platinum tiers
- **Event-Driven Commissions** - new_user, deposit, first_deposit, withdrawal events
- **Agent Tree Tracking** - Hierarchical relationship management with closure tables
- **Net Deposit Tracking** - Accurate deposit/withdrawal calculations
- **Net Customer Tracking** - Customer validation with deposit thresholds
- **QR Code Generation** - Easy affiliate link sharing

### 🔐 Admin Features
- **System Statistics** - Real-time metrics and analytics
- **Top Agents Leaderboard** - Performance tracking
- **Agent Promotion** - Upgrade agents to super-agent status
- **Commission Management** - Mark commissions as paid
- **Broadcast Messaging** - Announce to all agents
- **Dynamic Commission Rates** - Configurable per event type

### 💻 Tech Stack
- **Runtime**: Bun (native APIs, zero dependencies where possible)
- **Bot Framework**: Grammy (Telegram Bot API)
- **Database**: SQLite (local) / Cloudflare D1 (production)
- **API**: Hono (ultra-fast web framework)
- **Dashboard**: Vue 3 + Vite + Tailwind CSS
- **Deployment**: Cloudflare Workers + Pages
- **Testing**: Vitest + Playwright
- **CI/CD**: GitHub Actions + TurboRepo

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) 1.0+
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- Your Telegram User ID (from [@userinfobot](https://t.me/userinfobot))

### Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd telegram-affiliate

# Install dependencies
bun install

# Create .env file
cat > .env << EOF
BOT_TOKEN=your_bot_token_here
ADMIN_IDS=your_telegram_user_id
EOF

# Run the bot (polling mode)
bun run dev:bot

# Run the API server
bun run dev:api

# Run the dashboard
bun run dev:ui
```

### Production Deployment

```bash
# Deploy API to Cloudflare Workers
bun run deploy:api:prod

# Deploy Dashboard to Cloudflare Pages
bun run deploy:ui:prod

# Or deploy both
bun run deploy:prod
```

See **[CLOUDFLARE-SETUP.md](./CLOUDFLARE-SETUP.md)** for detailed deployment instructions.

## 📁 Project Structure

```
telegram-affiliate/
├── src/                      # Telegram Bot (GramJS)
│   ├── api/handlers/         # Bot command handlers
│   ├── core/                 # Core bot logic & config
│   ├── repositories/         # Database access layer
│   ├── services/             # Business logic
│   └── types/                # TypeScript types
│
├── apps/
│   ├── api/                  # Hono API Server
│   │   ├── src/
│   │   │   ├── routes/       # API endpoints
│   │   │   ├── middleware/   # Auth & observability
│   │   │   ├── utils/        # Error handling, DB
│   │   │   └── db/migrations/# Database migrations
│   │   └── wrangler.toml     # Cloudflare config
│   │
│   └── dashboard/            # Vue 3 Dashboard
│       ├── src/
│       │   ├── views/        # Dashboard pages
│       │   ├── stores/       # Pinia state management
│       │   ├── api/          # API client
│       │   └── router/       # Vue Router
│       └── vite.config.ts    # Vite config
│
├── packages/
│   └── schemas/              # Shared Zod schemas
│
├── scripts/                  # Utility scripts
├── e2e/                      # Playwright E2E tests
├── test/                     # Vitest unit tests
└── docs/                     # Additional documentation
```

## 🧪 Testing

```bash
# Run all tests
bun run test

# Run with coverage
bun run test:coverage

# Run E2E tests
bun run test:e2e

# Interactive E2E mode
bun run test:e2e:ui

# Performance testing
bun run lighthouse
```

See **[TESTING.md](./TESTING.md)** for comprehensive testing guide.

## 📚 Documentation

- **[LEVEL-5-AFFILIATE-EMPIRE.md](./LEVEL-5-AFFILIATE-EMPIRE.md)** - 🚀 Complete affiliate system guide
- **[BOT-SETUP.md](./BOT-SETUP.md)** - Telegram bot configuration & webhook setup
- **[CLOUDFLARE-SETUP.md](./CLOUDFLARE-SETUP.md)** - Cloudflare deployment guide
- **[LOCAL-DEV.md](./LOCAL-DEV.md)** - Local development setup
- **[TESTING.md](./TESTING.md)** - Testing strategies & tools
- **[docs/LEVELS-FEATURE-GUIDE.md](./docs/LEVELS-FEATURE-GUIDE.md)** - Multi-level system reference
- **[docs/WEBAPP-ARCHITECTURE.md](./docs/WEBAPP-ARCHITECTURE.md)** - Technical architecture

## 🎯 Available Commands

### Development
```bash
bun run launch:affiliate # 🚀 Launch entire affiliate empire (bot + api + dashboard)
bun run dev              # Start all services
bun run dev:bot          # Bot only (polling)
bun run dev:api          # API server only
bun run dev:ui           # Dashboard only
```

### Testing
```bash
bun run test             # Unit tests
bun run test:e2e         # E2E tests
bun run test:coverage    # With coverage
bun run lighthouse       # Performance
```

### Quality
```bash
bun run type-check       # TypeScript validation
bun run lint             # Code style check
bun run format           # Auto-fix formatting
```

### Build & Deploy
```bash
bun run build            # Build all apps
bun run deploy:staging   # Deploy to staging
bun run deploy:prod      # Deploy to production
```

### Docker
```bash
bun run docker:dev       # Start dev stack
bun run docker:stop      # Stop all containers
bun run docker:logs      # View logs
```

### Database
```bash
bun run db:create        # Create D1 database
bun run db:execute       # Run migrations
```

## 🏗️ Architecture

### Monorepo Structure
- **Bun Workspaces** - Single lockfile, shared dependencies
- **TurboRepo** - Smart caching and parallel execution
- **Changesets** - Version management

### Bot Architecture
- **Event-Driven** - Commission events trigger calculations
- **Repository Pattern** - Clean data access layer
- **Service Layer** - Business logic separation
- **Type-Safe** - End-to-end TypeScript typing

### API Architecture
- **Hono Framework** - Ultra-fast, lightweight
- **Cloudflare Workers** - Global edge deployment
- **D1 Database** - Serverless SQL
- **Health Checks** - Comprehensive monitoring

### Dashboard Architecture
- **Vue 3 Composition API** - Modern reactive framework
- **Pinia State Management** - Type-safe stores
- **Telegram WebApp SDK** - Native integration
- **Tailwind CSS** - Utility-first styling

## 🔒 Security

- **Secret Scanning** - Gitleaks for sensitive data detection
- **Dependency Auditing** - Automated vulnerability scanning
- **Type Safety** - Strict TypeScript compilation
- **Input Validation** - Zod schemas throughout
- **Environment Isolation** - Separate staging/production

## 📊 Performance

- **Bundle Analysis** - Vite visualizer
- **Code Splitting** - Optimized chunks
- **Tree Shaking** - Minimal bundle size
- **Performance Budgets** - Lighthouse CI enforcement
- **Edge Deployment** - <100ms global latency

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Grammy](https://grammy.dev/) - Telegram Bot framework
- [Hono](https://hono.dev/) - Web framework
- [Cloudflare](https://workers.cloudflare.com/) - Edge computing platform
- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework
- [Bun](https://bun.sh/) - All-in-one JavaScript runtime

---

**Built with ❤️ using Bun**
