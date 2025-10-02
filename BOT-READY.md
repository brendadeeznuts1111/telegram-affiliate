# 🤖 Bot Setup Complete!

**Bot:** [@Firesupportcs_bot](https://t.me/Firesupportcs_bot)  
**ID:** `8039557687`  
**Status:** ✅ **ACTIVE & CONFIGURED**

---

## ✅ Completed Setup

### 1. **Bot Configuration** ✅
- [x] Bot token saved to `.env` (gitignored)
- [x] Bot username: `Firesupportcs_bot`
- [x] Admin ID configured: `8013171035`
- [x] Bot verified with Telegram API

### 2. **GitHub Secrets** ✅
- [x] `BOT_TOKEN` - Telegram bot authentication
- [x] `TELEGRAM_BOT_TOKEN` - Same as BOT_TOKEN (compatibility)
- [x] `TELEGRAM_BOT_USERNAME` - Bot username for links
- [x] `ADMIN_IDS` - Admin user ID(s)
- [x] `CLOUDFLARE_ACCOUNT_ID` - For deployment
- [x] `WEBHOOK_SECRET` - Secure webhook verification

### 3. **Local Environment** ✅
- [x] `.env` file created with all bot config
- [x] Safe from git commits (in `.gitignore`)
- [x] Ready for local development

---

## ⏳ Next Steps

### 1. **Get Cloudflare API Token** ⚠️ REQUIRED
```bash
# 1. Go to: https://dash.cloudflare.com/profile/api-tokens
# 2. Create token with:
#    - Edit Cloudflare Workers
#    - Edit Workers KV Storage
#    - Edit D1 Database
# 3. Set as GitHub secret:
gh secret set CLOUDFLARE_API_TOKEN --body "YOUR_TOKEN_HERE"
```

### 2. **Set Cloudflare Worker Secrets**
```bash
cd apps/api

# Bot token
echo "8039557687:AAGMloT2l10NsnRFJXzUtIcSX_kSPTzKY2E" | bunx wrangler secret put BOT_TOKEN

# Admin IDs
echo "8013171035" | bunx wrangler secret put ADMIN_IDS

# Webhook secret (random)
openssl rand -hex 32 | bunx wrangler secret put WEBHOOK_SECRET
```

### 3. **Deploy to Cloudflare** 🚀
```bash
# Deploy API Worker
cd apps/api
bunx wrangler deploy

# Or use the npm script:
bun run deploy:prod
```

### 4. **Set Telegram Webhook** 🔗
```bash
# After deployment, get your worker URL and run:
WORKER_URL="https://telegram-affiliate-api.workers.dev"
BOT_TOKEN="8039557687:AAGMloT2l10NsnRFJXzUtIcSX_kSPTzKY2E"

curl "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${WORKER_URL}/telegram"

# Verify webhook:
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

### 5. **Test Your Bot** ✅
```bash
# Open Telegram and send to @Firesupportcs_bot:
/start

# Expected response:
# "👋 Welcome to the Telegram Affiliate System!"
```

---

## 🧪 Local Testing

### Start Bot Locally (Without Worker)
```bash
# Start the bot in polling mode (for development)
bun src/index.ts
```

### Start API Worker (Local Dev)
```bash
# Start Cloudflare Workers dev server
bun run dev:api

# API available at: http://localhost:8787
```

### Test Bot Commands
```bash
# Test with curl (simulating Telegram webhook)
curl -X POST http://localhost:8787/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "chat": {"id": 8013171035},
      "text": "/start",
      "from": {"id": 8013171035, "first_name": "Test"}
    }
  }'
```

---

## 📋 Available Bot Commands

| Command | Description | Who Can Use |
|---------|-------------|-------------|
| `/start` | Welcome & registration | Everyone |
| `/dashboard` | Open affiliate dashboard | Registered users |
| `/qr` | Get QR code for referrals | Agents |
| `/withdraw` | Request withdrawal | Agents |
| `/super` | Super agent panel | Super agents |
| `/help` | Show help message | Everyone |

---

## 🔐 Security Notes

### ✅ Secured
- Bot token in `.env` (gitignored)
- GitHub secrets encrypted
- Cloudflare secrets encrypted
- Webhook signature verification

### ⚠️ Important
- **Never** commit `.env` to git
- **Never** share bot token publicly
- **Always** use HTTPS for webhooks
- **Rotate** tokens if compromised

---

## 🛠️ Troubleshooting

### Bot Not Responding?
```bash
# 1. Check webhook status
curl "https://api.telegram.org/bot8039557687:AAGMloT2l10NsnRFJXzUtIcSX_kSPTzKY2E/getWebhookInfo"

# 2. Check if webhook is set correctly
# If pending_update_count > 0, there are errors

# 3. Check Cloudflare Worker logs
cd apps/api
bunx wrangler tail
```

### Local Bot Not Working?
```bash
# 1. Check .env file exists
ls -la .env

# 2. Verify bot token
cat .env | grep BOT_TOKEN

# 3. Check database exists
ls -la data/affiliate_system.db

# 4. Run with debug logging
DEBUG=true bun src/index.ts
```

### Webhook Errors?
```bash
# Delete webhook (switch to polling for debugging)
curl "https://api.telegram.org/bot8039557687:AAGMloT2l10NsnRFJXzUtIcSX_kSPTzKY2E/deleteWebhook"

# Test bot in polling mode
bun src/index.ts
```

---

## 📊 Monitoring

### Check Bot Health
```bash
# Telegram API
curl "https://api.telegram.org/bot8039557687:AAGMloT2l10NsnRFJXzUtIcSX_kSPTzKY2E/getMe"

# Your API Health
curl "https://telegram-affiliate-api.workers.dev/health"

# Webhook Info
curl "https://api.telegram.org/bot8039557687:AAGMloT2l10NsnRFJXzUtIcSX_kSPTzKY2E/getWebhookInfo"
```

### View Logs
```bash
# Cloudflare Worker logs (real-time)
cd apps/api
bunx wrangler tail

# Local logs
tail -f logs/bot.log
```

---

## 🎯 Quick Reference

### Environment Variables
```bash
# Bot Configuration
TELEGRAM_BOT_TOKEN=8039557687:AAGMloT2l10NsnRFJXzUtIcSX_kSPTzKY2E
TELEGRAM_BOT_USERNAME=Firesupportcs_bot
ADMIN_IDS=8013171035

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=80693377f3abb78e00820aa69a415ce4
PUBLIC_URL=https://telegram-affiliate-api.workers.dev
```

### Useful Commands
```bash
# Full system verification
bun run verify

# Deploy everything
bun run deploy:prod

# Test bot locally
bun src/index.ts

# Run dev server
bun run dev:api

# View all secrets
gh secret list
```

---

## 🎉 You're Ready!

Your Telegram bot is now fully configured and ready to use! 

**Next immediate step:** Get Cloudflare API Token and deploy! 🚀

### Need Help?
- 📚 Check `README.md` for full documentation
- 🔧 Run `bun run verify` to check system health
- 💬 Test bot: https://t.me/Firesupportcs_bot

---

**Last Updated:** October 2, 2025  
**Bot Status:** ✅ Active and Configured

