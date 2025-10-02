# ☁️ Cloudflare Deployment - Quick Setup

**Deploy your Telegram affiliate bot to Cloudflare in <5 minutes**

---

## 🚀 One-Time Setup (5 minutes)

### 1. Install Wrangler globally

```bash
bun install -g wrangler
# or use from the monorepo: bunx wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

This opens a browser to authenticate.

### 3. Create D1 Databases

```bash
# Production database
bunx wrangler d1 create affiliate-system

# Staging database
bunx wrangler d1 create affiliate-system-staging
```

**Copy the `database_id` from each output!**

### 4. Update wrangler.toml

Edit `apps/api/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "affiliate-system"
database_id = "YOUR_PROD_DB_ID_HERE"  # ← Paste production ID

# ...

[[env.staging.d1_databases]]
binding = "DB"
database_name = "affiliate-system-staging"
database_id = "YOUR_STAGING_DB_ID_HERE"  # ← Paste staging ID
```

### 5. Initialize Database Schema

```bash
cd apps/api

# Staging
bunx wrangler d1 execute affiliate-system-staging --file=schema.sql

# Production
bunx wrangler d1 execute affiliate-system --file=schema.sql
```

### 6. Set Secrets

```bash
# Staging secrets
bunx wrangler secret put BOT_TOKEN --env staging
# Paste: 8039557687:AAGMloT2l10NsnRFJXzUtIcSX_kSPTzKY2E

bunx wrangler secret put ADMIN_IDS --env staging
# Paste: 8013171035

# Production secrets
bunx wrangler secret put BOT_TOKEN --env production
# Paste: your_production_bot_token

bunx wrangler secret put ADMIN_IDS --env production
# Paste: 8013171035
```

### 7. Create Cloudflare Pages Project

```bash
# In Cloudflare Dashboard:
# Pages → Create a project → Upload assets
# Project name: telegram-affiliate-dashboard
```

Or let the first deployment create it automatically!

---

## 📦 Manual Deployment (from your machine)

### Deploy API (Workers)

```bash
# Deploy to staging
bun run deploy:api:staging

# Deploy to production
bun run deploy:api:prod
```

### Deploy Dashboard (Pages)

```bash
# Deploy to staging
bun run deploy:ui:staging

# Deploy to production
bun run deploy:ui:prod
```

### Deploy Everything

```bash
# Deploy both to staging
bun run deploy:staging

# Deploy both to production
bun run deploy:prod
```

---

## 🤖 Automated GitHub Deployments

### 1. Generate Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token** → **Custom Token**
3. Permissions:
   - `Account` → `Cloudflare Pages` → **Edit**
   - `Account` → `Cloudflare Workers Scripts` → **Edit**
   - `Account` → `D1` → **Edit**
4. Resources:
   - Include → `Specific account` → Your account
5. Click **Continue to summary** → **Create Token**
6. **Copy the token!** (you won't see it again)

### 2. Add GitHub Secret

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `CF_API_TOKEN`
4. Value: Paste the token from step 1
5. Click **Add secret**

### 3. That's it! 🎉

Now every push to `main` auto-deploys to production:

```bash
git add .
git commit -m "feat: new feature"
git push origin main
# → GitHub Actions deploys to Cloudflare automatically! ⚡
```

Every PR gets a staging preview:

```bash
git checkout -b feature/my-feature
git push origin feature/my-feature
# → GitHub Actions creates preview deployment! 🔍
```

---

## 🔧 Useful Commands

### Logs

```bash
# Watch API logs (real-time)
bunx wrangler tail telegram-affiliate-api --env production

# Watch staging logs
bunx wrangler tail telegram-affiliate-api-staging --env staging
```

### Database Management

```bash
# Query database
bunx wrangler d1 execute affiliate-system --command="SELECT COUNT(*) FROM users"

# Run SQL file
bunx wrangler d1 execute affiliate-system --file=migration.sql

# Export database (backup)
bunx wrangler d1 export affiliate-system --output=backup.sql

# List databases
bunx wrangler d1 list
```

### Secrets Management

```bash
# List secrets
bunx wrangler secret list --env production

# Update secret
bunx wrangler secret put BOT_TOKEN --env production

# Delete secret
bunx wrangler secret delete WEBHOOK_SECRET --env production
```

### Pages Commands

```bash
# List deployments
bunx wrangler pages deployment list --project-name=telegram-affiliate-dashboard

# View deployment
bunx wrangler pages deployment tail --project-name=telegram-affiliate-dashboard
```

---

## 🌍 Your Live URLs

After first deployment:

**API (Workers)**
- Production: `https://telegram-affiliate-api.YOUR_SUBDOMAIN.workers.dev`
- Staging: `https://telegram-affiliate-api-staging.YOUR_SUBDOMAIN.workers.dev`

**Dashboard (Pages)**
- Production: `https://telegram-affiliate-dashboard.pages.dev`
- Staging: `https://staging.telegram-affiliate-dashboard.pages.dev`

---

## 🎯 Configure Telegram Bot

### Set Menu Button

Talk to [@BotFather](https://t.me/botfather):

```
/mybots
→ Select your bot
→ Bot Settings
→ Menu Button
→ Configure Menu Button
```

**Menu Button URL**: `https://telegram-affiliate-dashboard.pages.dev`

Or via API:

```bash
curl -X POST "https://api.telegram.org/bot8039557687:AAGMloT2l10NsnRFJXzUtIcSX_kSPTzKY2E/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{
    "menu_button": {
      "type": "web_app",
      "text": "📊 Dashboard",
      "web_app": {
        "url": "https://telegram-affiliate-dashboard.pages.dev"
      }
    }
  }'
```

---

## 📊 Daily Workflow

```bash
# 1. Work on feature
git checkout -b feature/my-feature
code .

# 2. Test locally
bun run dev:api      # Terminal 1
bun run dev:ui       # Terminal 2
bun run dev:bot      # Terminal 3

# 3. Push (automatic staging deploy)
git add .
git commit -m "feat: my feature"
git push origin feature/my-feature

# 4. Create PR → GitHub Actions deploys to staging
# → Preview URL posted in PR comments

# 5. Merge PR → GitHub Actions deploys to production
# → Live in ~40 seconds! ⚡
```

---

## 💰 Pricing (Free Tier)

✅ **Workers**: 100,000 requests/day  
✅ **D1**: 5GB storage, 5M reads/day, 100k writes/day  
✅ **Pages**: Unlimited requests, 500 builds/month  
✅ **SSL**: Free automatic HTTPS  
✅ **CDN**: Global edge network  

**Total cost**: $0/month for most projects! 🎉

---

## 🐛 Troubleshooting

### API not working

```bash
# Check deployment status
bunx wrangler deployments list

# View logs
bunx wrangler tail telegram-affiliate-api --env production
```

### Dashboard not loading

```bash
# Check if build succeeded
cd apps/dashboard
bun run build

# Test preview locally
bun run preview
```

### CORS errors

Update allowed origins in `apps/api/src/index-worker.ts`:

```typescript
origin: ['https://telegram-affiliate-dashboard.pages.dev']
```

Then redeploy:

```bash
bun run deploy:api:prod
```

---

## ✅ Deployment Checklist

- [ ] Wrangler installed: `bun install -g wrangler`
- [ ] Logged in: `wrangler login`
- [ ] Created D1 databases (staging + production)
- [ ] Updated `database_id` in `wrangler.toml`
- [ ] Ran `schema.sql` on both databases
- [ ] Set secrets (BOT_TOKEN, ADMIN_IDS)
- [ ] Generated Cloudflare API token
- [ ] Added `CF_API_TOKEN` to GitHub secrets
- [ ] Deployed API: `bun run deploy:api:prod`
- [ ] Deployed dashboard: `bun run deploy:ui:prod`
- [ ] Configured Telegram bot menu button
- [ ] Tested in Telegram

---

**Result**: Every push lands on Cloudflare's edge in ~40s, fully typed, fully serverless, zero cold starts! 🚀

