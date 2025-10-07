# Production Deployment Guide

This guide walks you through deploying the Telegram Affiliate Bot to production on Cloudflare.

## 🚀 Quick Start

```bash
# 1. Deploy API to Cloudflare Workers
cd apps/api
bun run deploy:prod

# 2. Deploy Dashboard to Cloudflare Pages  
cd apps/dashboard
bun run build
bun run deploy:prod

# 3. Configure webhook (optional)
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=https://your-api.workers.dev/telegram/webhook"
```

## 📋 Prerequisites

### Required Accounts
- ✅ Cloudflare account
- ✅ GitHub account (for CI/CD)
- ✅ Telegram Bot Token (from @BotFather)

### Required Tools
- ✅ Bun 1.0+
- ✅ Wrangler CLI (`bun add -g wrangler`)
- ✅ Git

### Environment Setup
- ✅ Cloudflare API Token
- ✅ Cloudflare Account ID
- ✅ D1 Database created
- ✅ KV Namespace created (optional)

## 1️⃣ Deploy API to Cloudflare Workers

### Step 1: Authenticate with Wrangler

```bash
wrangler login
```

This opens a browser to authenticate with Cloudflare.

### Step 2: Create D1 Database

```bash
cd apps/api

# Create production database
wrangler d1 create affiliate-db-prod

# Note the database_id from output
```

### Step 3: Update wrangler.toml

Edit `apps/api/wrangler.toml`:

```toml
[env.production]
name = "telegram-affiliate-api-prod"

[[env.production.d1_databases]]
binding = "DB"
database_name = "affiliate-db-prod"
database_id = "YOUR_DATABASE_ID_HERE"  # From Step 2
```

### Step 4: Run Database Migrations

```bash
# Execute migrations on production D1
wrangler d1 execute affiliate-db-prod --file=src/db/migrations/001_initial.sql --env production
```

### Step 5: Set Secrets

```bash
# Set bot token
echo "YOUR_BOT_TOKEN" | wrangler secret put BOT_TOKEN --env production

# Set admin IDs
echo "123456789,987654321" | wrangler secret put ADMIN_IDS --env production

# Set webhook secret (optional)
echo "your_webhook_secret" | wrangler secret put WEBHOOK_SECRET --env production
```

### Step 6: Deploy

```bash
bun run deploy:prod
```

### Step 7: Verify Deployment

```bash
# Test health endpoint
curl https://telegram-affiliate-api-prod.YOUR_SUBDOMAIN.workers.dev/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

## 2️⃣ Deploy Dashboard to Cloudflare Pages

### Step 1: Build Dashboard

```bash
cd apps/dashboard
bun install
bun run build
```

This creates a `dist/` directory with the production build.

### Step 2: Deploy to Pages

#### Option A: Using Wrangler

```bash
wrangler pages deploy dist --project-name telegram-affiliate-dashboard
```

#### Option B: Using GitHub Actions (Recommended)

The repository includes `.github/workflows/deploy-dashboard.yml` for automatic deployments:

1. Push to `main` branch
2. GitHub Actions automatically builds and deploys
3. Dashboard is live at: `https://telegram-affiliate-dashboard.pages.dev`

### Step 3: Configure Environment Variables

In Cloudflare Pages dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add:
   - `VITE_API_URL`: Your Workers API URL
   - `VITE_BOT_USERNAME`: Your bot's username

### Step 4: Verify Deployment

Visit your Pages URL:
```
https://telegram-affiliate-dashboard.pages.dev
```

## 3️⃣ Configure Telegram Webhook (Optional)

### Why Use Webhooks?

- ✅ Instant updates (no polling delay)
- ✅ Lower resource usage
- ✅ Better for production
- ✅ Works great with Cloudflare Workers

### Set Webhook URL

```bash
export BOT_TOKEN="your_bot_token"
export WEBHOOK_URL="https://your-api.workers.dev/telegram/webhook"

curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"${WEBHOOK_URL}\",\"secret_token\":\"your_webhook_secret\"}"
```

### Verify Webhook

```bash
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

Expected response:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-api.workers.dev/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

### Fallback: Use Polling Mode

If webhooks don't work, run the bot locally in polling mode:

```bash
cd /path/to/telegram-affiliate
bun run dev:bot
```

## 4️⃣ Set Up Monitoring

### Cloudflare Analytics

View metrics in Cloudflare dashboard:

1. **Workers Analytics**
   - Request count
   - Success rate
   - CPU time
   - Errors

2. **Pages Analytics**
   - Page views
   - Unique visitors
   - Geographic distribution

### Health Check Monitoring

Set up external monitoring (e.g., UptimeRobot, Pingdom):

- **Endpoint**: `https://your-api.workers.dev/health`
- **Interval**: Every 5 minutes
- **Expected**: HTTP 200, `{"status":"ok"}`

### Error Tracking

Add error tracking service:

```typescript
// apps/api/src/app.ts
app.onError((err, c) => {
  // Send to Sentry, LogRocket, etc.
  console.error('Error:', err);
  
  return c.json({
    error: err.message,
  }, 500);
});
```

### Database Monitoring

```bash
# Check D1 database status
wrangler d1 info affiliate-db-prod --env production

# Query database size
wrangler d1 execute affiliate-db-prod --command "SELECT COUNT(*) as users FROM users" --env production
```

## 5️⃣ Custom Domain (Optional)

### Add Custom Domain to Workers

1. Go to **Workers & Pages** → Your Worker
2. Click **Triggers** tab
3. Click **Add Custom Domain**
4. Enter: `api.yourdomain.com`
5. Follow DNS setup instructions

### Add Custom Domain to Pages

1. Go to **Pages** → Your Project
2. Click **Custom Domains**
3. Click **Set up a custom domain**
4. Enter: `app.yourdomain.com`
5. Follow DNS setup instructions

## 6️⃣ CI/CD Pipeline

The repository includes GitHub Actions workflows:

### `.github/workflows/test.yml`
- Runs on every push/PR
- Executes tests
- Checks coverage
- Lints code

### `.github/workflows/deploy-api.yml` (Create this)

```yaml
name: Deploy API

on:
  push:
    branches: [main]
    paths:
      - 'apps/api/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: cd apps/api && wrangler deploy --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Required GitHub Secrets

Add these in **Settings** → **Secrets and variables** → **Actions**:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `BOT_TOKEN` (if needed for tests)

## 📊 Performance Optimization

### Workers Optimization

```toml
# apps/api/wrangler.toml
[env.production]
limits = { cpu_ms = 10 }  # Max 10ms CPU time per request
compatibility_date = "2024-01-01"
```

### Caching Strategy

```typescript
// Add caching to frequently accessed data
app.get('/api/agent/:id/stats', async (c) => {
  const cached = await c.env.KV.get(`stats:${id}`);
  if (cached) return c.json(JSON.parse(cached));
  
  const stats = await getAgentStats(id);
  await c.env.KV.put(`stats:${id}`, JSON.stringify(stats), {
    expirationTtl: 300 // 5 minutes
  });
  
  return c.json(stats);
});
```

### D1 Query Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_users_agent ON users(is_agent);
CREATE INDEX idx_users_parent ON users(parent_agent_id);
CREATE INDEX idx_commissions_agent ON commissions(agent_id);
CREATE INDEX idx_commissions_status ON commissions(status);
```

## 🔒 Security Checklist

- [ ] All secrets stored in Wrangler secrets
- [ ] CORS configured correctly
- [ ] Webhook secret token set
- [ ] Admin IDs validated
- [ ] Rate limiting configured
- [ ] Input validation with Zod schemas
- [ ] SQL injection prevention (parameterized queries)
- [ ] HTTPS only (automatic with Cloudflare)

## 🐛 Troubleshooting

### Workers Deployment Fails

```bash
# Check Wrangler version
wrangler --version

# Re-authenticate
wrangler logout
wrangler login

# Check wrangler.toml syntax
wrangler deploy --dry-run
```

### Database Connection Errors

```bash
# Verify D1 binding
wrangler d1 list

# Check database exists
wrangler d1 info affiliate-db-prod

# Test query
wrangler d1 execute affiliate-db-prod --command "SELECT 1"
```

### Webhook Not Receiving Updates

1. **Check webhook URL**:
   ```bash
   curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
   ```

2. **Verify bot token**:
   ```bash
   curl "https://api.telegram.org/bot${BOT_TOKEN}/getMe"
   ```

3. **Check Worker logs**:
   ```bash
   wrangler tail --env production
   ```

4. **Test webhook manually**:
   ```bash
   curl -X POST https://your-api.workers.dev/telegram/webhook \
     -H "Content-Type: application/json" \
     -d '{"update_id":1,"message":{"message_id":1,"from":{"id":123,"is_bot":false,"first_name":"Test"},"chat":{"id":123,"type":"private"},"date":1234567890,"text":"/start"}}'
   ```

### Dashboard Not Loading

1. **Check build output**:
   ```bash
   cd apps/dashboard
   bun run build
   # Look for errors
   ```

2. **Verify API URL**:
   - Check `VITE_API_URL` in Pages settings
   - Should be: `https://your-api.workers.dev`

3. **Check browser console**:
   - Open DevTools → Console
   - Look for CORS or network errors

## 📈 Scaling

### When to Scale

- **Workers**: Auto-scales, no action needed
- **Pages**: Auto-scales, no action needed
- **D1**: Contact Cloudflare for larger databases

### Cost Optimization

- **Workers**: Free tier = 100,000 requests/day
- **Pages**: Free tier = Unlimited requests
- **D1**: Free tier = 5 GB storage, 5 million reads/day

### Performance Targets

- API response time: < 100ms
- Dashboard load time: < 2s
- Bot response time: < 500ms
- Database query time: < 10ms

## 🎯 Post-Deployment Checklist

- [ ] API deployed and accessible
- [ ] Dashboard deployed and accessible
- [ ] Webhook configured (or polling running)
- [ ] Database migrations executed
- [ ] Secrets configured
- [ ] Health checks passing
- [ ] Monitoring set up
- [ ] Custom domains configured (optional)
- [ ] CI/CD pipeline working
- [ ] Documentation updated

## 📚 Related Documentation

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Architecture Guide](./docs/architecture/NEW-ARCHITECTURE.md)

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/brendadeeznuts1111/telegram-affiliate/issues)
- **Documentation**: [docs/](./docs/)
- **Cloudflare Community**: [community.cloudflare.com](https://community.cloudflare.com/)

---

**Last Updated**: January 2025  
**Status**: ✅ Production Ready
