# 🤖 Telegram Bot - Complete Worker Deployment Guide

## ✅ Phase 1 Features Implemented

Your bot now has **ALL Phase 1 features** ready for Cloudflare Workers deployment:

### Core Features
- ✅ **Customer Management** (`/addcustomer`, `/customers`)
  - Multi-step conversation flow
  - Email & phone validation
  - Duplicate detection
  - Customer list with pagination

- ✅ **Deposit Recording** (`/deposit`, `/deposits`)
  - Customer selection from buttons
  - Amount input with validation
  - Auto-commission calculation (multi-level)
  - Deposit history

- ✅ **Commission Tracking** (`/commissions`, `/pending`, `/paid`)
  - View all commissions
  - Filter by status (pending/paid)
  - Commission statistics
  - Export reports

- ✅ **Enhanced Dashboard** (`/dashboard`)
  - Recent activity feed
  - Comprehensive earnings summary (total, paid, pending)
  - Quick action buttons
  - Multi-level stats

### Architecture
- **State Management**: KV-based conversation flows (no `@grammyjs/conversations` dependency)
- **Database**: D1 database with unified abstraction layer
- **Services**: Customer, Commission business logic
- **Repositories**: Data access layer (User, Customer, Deposit, Commission)

## 🚀 Deployment Steps

### 1. Verify Secrets

Your bot already has secrets configured. Verify them:

```bash
cd apps/api
wrangler secret list
```

Expected secrets:
- ✅ `BOT_TOKEN` - Your Telegram bot token
- ✅ `ADMIN_IDS` - Comma-separated admin user IDs
- ✅ `WEBHOOK_SECRET` - Secret for webhook validation

### 2. Deploy to Cloudflare Workers

```bash
cd apps/api
wrangler deploy --env production
```

This will deploy:
- **API Worker**: `telegram-affiliate-api.workers.dev`
- **Bot Webhook Handler**: `/telegram/webhook`

### 3. Set Webhook URL

After deployment, set the Telegram webhook:

```bash
# Replace <BOT_TOKEN> with your actual token
# Replace <WORKER_URL> with your deployed worker URL

curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://telegram-affiliate-api.workers.dev/telegram/webhook",
    "allowed_updates": ["message", "callback_query"],
    "drop_pending_updates": true
  }'
```

**Expected response:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

### 4. Verify Webhook

Check webhook status:

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

Should show:
```json
{
  "ok": true,
  "result": {
    "url": "https://telegram-affiliate-api.workers.dev/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

### 5. Test the Bot

Open Telegram and test these commands:

1. **Basic Setup:**
   ```
   /start
   ```
   - Should show welcome message
   - Click "Become Agent" button

2. **Dashboard:**
   ```
   /dashboard
   ```
   - Should show enhanced dashboard with stats
   - Test all buttons (Add Customer, Record Deposit, etc.)

3. **Add Customer:**
   ```
   /addcustomer
   ```
   - Enter name, email, phone
   - Confirm customer creation

4. **Record Deposit:**
   ```
   /deposit
   ```
   - Select customer from list
   - Enter amount
   - Confirm deposit (should auto-calculate commissions)

5. **View Commissions:**
   ```
   /commissions
   ```
   - Should show all commissions with stats
   - Try filter buttons (Pending, Paid)

## 📊 What's Different from Local Bot?

| Feature | Local Bot (`src/`) | Worker Bot (`apps/api/src/bot/`) |
|---------|-------------------|-----------------------------------|
| **Conversation Flow** | `@grammyjs/conversations` plugin | KV-based state machine |
| **Database** | `bun:sqlite` (local files) | D1 database (Cloudflare) |
| **Session Storage** | In-memory | KV namespace |
| **Deployment** | Polling mode (VPS/local) | Webhook mode (Workers) |
| **Features** | ✅ All Phase 1 features | ✅ All Phase 1 features |

Both implementations have **identical functionality** for users!

## 🔍 Monitoring & Debugging

### View Logs

```bash
cd apps/api
wrangler tail
```

This shows real-time logs from your Worker.

### Test API Health

```bash
curl https://telegram-affiliate-api.workers.dev/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-07T...",
  "environment": "production"
}
```

### Check Database

```bash
# View tables
wrangler d1 execute affiliate-system --command "SELECT name FROM sqlite_master WHERE type='table'"

# Check users
wrangler d1 execute affiliate-system --command "SELECT * FROM users LIMIT 5"

# Check commissions
wrangler d1 execute affiliate-system --command "SELECT * FROM commissions LIMIT 5"
```

## ⚡ Performance

Cloudflare Workers provide:
- **<50ms** global latency (edge computing)
- **Unlimited** scale (auto-scaling)
- **99.99%** uptime SLA
- **Zero** cold starts

Perfect for high-volume Telegram bots!

## 🐛 Troubleshooting

### Issue: "Webhook not working"

**Solution:**
1. Check webhook URL is correct:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```
2. Verify worker is deployed:
   ```bash
   curl https://telegram-affiliate-api.workers.dev/health
   ```
3. Check logs:
   ```bash
   wrangler tail
   ```

### Issue: "Database errors"

**Solution:**
1. Check D1 binding in `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_id = "e6cc2427-f81b-4849-bcba-acacb3aedc70"
   ```
2. Run migrations:
   ```bash
   wrangler d1 execute affiliate-system --file=src/db/migrations/001_initial.sql
   ```

### Issue: "KV errors"

**Solution:**
1. Check KV binding in `wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "AFFILIATE_KV"
   id = "c2b03d2d2c5a48869f818923388306d2"
   ```
2. Test KV:
   ```bash
   wrangler kv:key put --binding=AFFILIATE_KV "test" "value"
   wrangler kv:key get --binding=AFFILIATE_KV "test"
   ```

### Issue: "Secrets missing"

**Solution:**
```bash
# List secrets
wrangler secret list

# Add missing secret
wrangler secret put BOT_TOKEN
# (paste token when prompted)
```

## 🎯 Next Steps

### Option A: Test Worker Bot Now
1. Deploy with `wrangler deploy`
2. Set webhook
3. Test all features in Telegram

### Option B: Continue Building (Phases 2-4)
1. **Phase 2**: Dashboard Frontend (D3 tree, charts, UI)
2. **Phase 3**: REST API endpoints
3. **Phase 4**: Real-time features & polish

### Option C: Run Both!
- **Local bot** for development/testing (polling mode)
- **Worker bot** for production (webhook mode)

Both share the same features, just different infrastructure!

## 📚 Additional Resources

- [Grammy Documentation](https://grammy.dev/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

## ✅ Deployment Checklist

Before going live:

- [ ] All secrets set (`BOT_TOKEN`, `ADMIN_IDS`, `WEBHOOK_SECRET`)
- [ ] D1 database created and migrations applied
- [ ] KV namespace created and bound
- [ ] `wrangler.toml` configured correctly
- [ ] Worker deployed to production
- [ ] Webhook URL set via Telegram API
- [ ] Webhook verified with `getWebhookInfo`
- [ ] Bot tested with all commands
- [ ] Monitoring/logging set up (`wrangler tail`)
- [ ] Dashboard deployed (Cloudflare Pages)

---

**Ready to deploy?** Run:

```bash
cd apps/api && wrangler deploy --env production
```

Then set your webhook and test! 🚀
