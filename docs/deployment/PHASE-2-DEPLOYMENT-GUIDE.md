# 🚀 Phase 2: Deployment Guide

**Status:** Ready to Deploy  
**Dashboard Build:** ✅ Complete (242KB, optimized)  
**Worker Bot:** ✅ Ready  
**D1 Database:** ✅ Migrated

---

## 📦 **What's Ready:**

```
apps/dashboard/dist/          ← Dashboard (242KB, production build)
apps/api/src/bot/             ← Worker bot with D1 integration  
apps/api/src/routes/telegram.ts ← Webhook endpoint (WORKING!)
```

---

## 🎯 **Deployment Steps**

### **Step 1: Deploy Worker (API + Bot)** ⏱️ 2 min

```bash
cd /Users/nolarose/projects/telegram-affiliate/apps/api

# Deploy to production
bunx wrangler deploy

# Expected output:
# ✨ Total Upload: 250 KB / gzip: 60 KB
# ✨ Uploaded telegram-affiliate-api (X.XX sec)
# ✨ Deployment complete! Take a peek over at
#    https://telegram-affiliate-api.nolarose1968-806.workers.dev
```

**What this deploys:**
- Bot handlers (start, dashboard, qr, withdraw, super)
- D1 repository for users
- Telegram webhook endpoint
- Affiliate API routes
- Health checks

---

### **Step 2: Deploy Dashboard** ⏱️ 5 min

#### **Option A: Via Wrangler CLI (If Working)**

```bash
cd /Users/nolarose/projects/telegram-affiliate/apps/dashboard

# Deploy to Pages
bunx wrangler pages deploy dist --project-name=telegram-affiliate-dashboard

# Expected output:
# ✨ Success! Uploaded X files (Y seconds)
# ✨ Deployment complete! Take a peek over at
#    https://telegram-affiliate-dashboard.pages.dev
```

#### **Option B: Via Cloudflare Dashboard (GUI) - RECOMMENDED**

If Wrangler hangs, use the GUI:

1. **Go to:** https://dash.cloudflare.com/
2. **Click:** Workers & Pages
3. **Click:** Create Application
4. **Select:** Pages tab
5. **Click:** Upload assets
6. **Project name:** `telegram-affiliate-dashboard`
7. **Drag folder:** `apps/dashboard/dist`
8. **Click:** Deploy site

**Result:** `https://telegram-affiliate-dashboard.pages.dev`

#### **Option C: Via Direct Upload (If GUI Fails)**

```bash
cd /Users/nolarose/projects/telegram-affiliate/apps/dashboard

# Create zip file
zip -r dashboard.zip dist/*

# Then upload via Cloudflare Dashboard
```

---

### **Step 3: Update Dashboard URL in Bot** ⏱️ 2 min

Once you have the Pages URL, update the Worker environment variable:

```bash
cd /Users/nolarose/projects/telegram-affiliate/apps/api

# Set PUBLIC_URL to match Pages domain
bunx wrangler secret put PUBLIC_URL
# Enter: https://telegram-affiliate-dashboard.pages.dev

# Or update wrangler.toml [vars] section:
# PUBLIC_URL = "https://telegram-affiliate-dashboard.pages.dev"

# Redeploy
bunx wrangler deploy
```

---

### **Step 4: Set Telegram Webhook** ⏱️ 1 min

Point Telegram to your Worker:

```bash
curl "https://api.telegram.org/bot8039557687:AAGMloT2l10NsnRFJXzUtIcSX_kSPTzKY2E/setWebhook?url=https://telegram-affiliate-api.nolarose1968-806.workers.dev/telegram/webhook"
```

**Expected response:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

**Verify webhook:**
```bash
curl "https://api.telegram.org/bot8039557687:AAGMloT2l10NsnRFJXzUtIcSX_kSPTzKY2E/getWebhookInfo"
```

Should show:
```json
{
  "ok": true,
  "result": {
    "url": "https://telegram-affiliate-api.nolarose1968-806.workers.dev/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0  ← Should be 0!
  }
}
```

---

## 🧪 **Step 5: Test End-to-End** ⏱️ 5 min

### **Test 1: Bot Commands**

```
Open: https://t.me/Firesupportcs_bot
Send: /start

Expected:
✅ Bot responds with welcome message
✅ User created in D1 database
✅ Shows WebApp button "📊 Open Dashboard"
```

### **Test 2: Dashboard Opens**

```
Click: "📊 Open Dashboard" button

Expected:
✅ Telegram Mini App opens
✅ Shows Vue dashboard
✅ Dashboard calls Worker API
✅ Displays user stats
```

### **Test 3: Database Check**

```bash
cd /Users/nolarose/projects/telegram-affiliate/apps/api

# Check users table
bunx wrangler d1 execute affiliate-system --remote \
  --command="SELECT telegram_id, username, first_name, is_super_agent FROM users"

# Should show your test user!
```

### **Test 4: All Bot Commands**

```
/start       ✅ Registration
/dashboard   ✅ Opens Mini App
/qr          ✅ QR code link
/withdraw    ✅ Withdrawal form
/super       ✅ Super agent panel (if super agent)
```

---

## 🎯 **Success Checklist**

- [ ] Worker deployed successfully
- [ ] Dashboard deployed to Pages
- [ ] PUBLIC_URL environment variable set
- [ ] Webhook updated to Worker URL
- [ ] Webhook info shows 0 pending updates
- [ ] /start creates user in D1
- [ ] Dashboard button opens Mini App
- [ ] Dashboard displays stats correctly
- [ ] All commands work

---

## 🐛 **Troubleshooting**

### **Issue: Wrangler Pages Deploy Hangs**

**Solution:** Use GUI (Option B above)

### **Issue: Bot Doesn't Respond**

**Check:**
```bash
# 1. Webhook status
curl "https://api.telegram.org/bot.../getWebhookInfo"

# 2. Worker logs
cd apps/api && bunx wrangler tail telegram-affiliate-api

# 3. D1 connection
bunx wrangler d1 execute affiliate-system --remote --command="SELECT 1"
```

### **Issue: Dashboard Shows Error**

**Check:**
1. Browser console for errors
2. API URL in dashboard (should be Worker URL)
3. CORS settings in Worker
4. Mini App is opened from Telegram (not browser directly)

### **Issue: Pending Updates > 0**

```bash
# Delete webhook
curl "https://api.telegram.org/bot.../deleteWebhook"

# Wait 10 seconds

# Set webhook again
curl "https://api.telegram.org/bot.../setWebhook?url=..."
```

---

## 📊 **Architecture After Deployment**

```
User
  ↓
Telegram App
  ↓
Bot Command (/start, /dashboard)
  ↓
Telegram API
  ↓
Webhook → Cloudflare Workers (Bot Handlers)
  ↓
D1 Database (Users, Agents, Commissions)
  ↓
Response with WebApp Button
  ↓
User clicks button
  ↓
Telegram Mini App opens → Cloudflare Pages (Vue Dashboard)
  ↓
Dashboard calls → Cloudflare Workers API
  ↓
API queries → D1 Database
  ↓
Returns data → Dashboard renders
  ↓
User sees stats!
```

---

## 🎉 **What You've Built**

✅ **Serverless Telegram Bot**
- Runs on Cloudflare Workers
- Global edge deployment
- Instant webhook responses
- Auto-scaling

✅ **Telegram Mini App**
- Vue 3 dashboard
- Opens natively in Telegram
- Professional UX
- Real-time data

✅ **Single Database (D1)**
- Serverless SQLite
- Global replication
- Sub-millisecond queries
- Automatic backups

✅ **Production Architecture**
- No servers to manage
- $0-5/month cost
- 99.9%+ uptime
- < 100ms latency globally

---

## 🚀 **Quick Commands Reference**

```bash
# Deploy Worker
cd apps/api && bunx wrangler deploy

# Deploy Dashboard (GUI)
open https://dash.cloudflare.com/

# Set Webhook
curl "https://api.telegram.org/bot.../setWebhook?url=..."

# Check Webhook
curl "https://api.telegram.org/bot.../getWebhookInfo"

# View Logs
cd apps/api && bunx wrangler tail telegram-affiliate-api

# Query Database
cd apps/api && bunx wrangler d1 execute affiliate-system --remote --command="SELECT * FROM users"

# Test Bot
open https://t.me/Firesupportcs_bot
```

---

**Ready to deploy? Start with Step 1!** 🚀

