# 🤖 Telegram Bot Setup Guide

Complete guide for setting up your Telegram bot with webhook integration.

## 📋 Table of Contents

- [Create Bot with BotFather](#create-bot-with-botfather)
- [Local Development (Polling)](#local-development-polling)
- [Production Setup (Webhook)](#production-setup-webhook)
- [Webhook Management](#webhook-management)
- [Troubleshooting](#troubleshooting)

## 🚀 Create Bot with BotFather

### Step 1: Create Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the prompts:
   - Choose a name for your bot (e.g., "My Affiliate Bot")
   - Choose a username (must end in 'bot', e.g., "myaffiliatebot")
4. Save the bot token (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Configure Bot

```bash
# Talk to @BotFather
/setdescription @your_bot
> Enter description for your affiliate system

/setabouttext @your_bot
> Short description

/setcommands @your_bot
> Paste the following:
start - Start the bot
dashboard - View your dashboard
level - Check your agent level
stats - View your statistics
tree - View your agent tree
leaderboard - View top agents
help - Get help
```

### Step 3: Set Menu Button (Optional)

To add a "Open Dashboard" button to your bot:

```bash
# Talk to @BotFather
/setmenubutton @your_bot
> Choose "Configure menu button"
> Text: "Open Dashboard"
> URL: https://your-dashboard.pages.dev
```

## 💻 Local Development (Polling)

For local development, use **long polling** (default mode):

### Setup

```bash
# 1. Add bot token to .env
echo "BOT_TOKEN=your_bot_token_here" >> .env
echo "ADMIN_IDS=your_telegram_user_id" >> .env

# 2. Run the bot
bun run dev:bot
```

### How It Works

- Bot uses `bot.start()` which polls Telegram servers every few seconds
- Perfect for development
- No public URL needed
- Works behind firewalls

## 🌐 Production Setup (Webhook)

For production on Cloudflare Workers, use **webhooks**:

### Step 1: Deploy API

```bash
# Deploy to Cloudflare Workers
bun run deploy:api:prod
```

### Step 2: Set Webhook

#### Option A: Using the API Endpoint (Recommended)

```bash
# Set webhook via your API
curl -X POST "https://your-api.workers.dev/telegram/set-webhook?url=https://your-api.workers.dev/telegram/webhook"
```

#### Option B: Direct Telegram API

```bash
# Replace <BOT_TOKEN> and <WORKER_URL>
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<WORKER_URL>/telegram/webhook"
```

#### Option C: In Browser

```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<WORKER_URL>/telegram/webhook
```

### Step 3: Verify Webhook

```bash
# Check webhook status
curl "https://your-api.workers.dev/telegram/webhook-info"

# Or via Telegram API directly
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

Expected response:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-api.workers.dev/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40
  }
}
```

## 🔧 Webhook Management

### Check Webhook Status

```bash
# Via your API
curl https://your-api.workers.dev/telegram/webhook-info

# Response will show:
# - Current webhook URL
# - Pending updates count
# - Last error (if any)
```

### Update Webhook URL

```bash
# Set new webhook
curl -X POST "https://your-api.workers.dev/telegram/set-webhook?url=https://new-url.workers.dev/telegram/webhook"
```

### Delete Webhook (Switch to Polling)

```bash
# Via your API
curl -X POST https://your-api.workers.dev/telegram/delete-webhook

# Or via Telegram API
curl "https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook"
```

After deleting webhook, you can run the bot locally with polling:
```bash
bun run dev:bot
```

## 🔍 Webhook Endpoints

Your API provides these webhook management endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/telegram/webhook` | GET | Health check |
| `/telegram/webhook` | POST | Receive Telegram updates |
| `/telegram/set-webhook` | POST | Set webhook URL |
| `/telegram/webhook-info` | GET | Get webhook status |
| `/telegram/delete-webhook` | POST | Remove webhook |

## 🎯 Development vs Production

### Development Mode (Polling)

```bash
# .env
BOT_TOKEN=your_token
ADMIN_IDS=your_id

# Run
bun run dev:bot
```

**Pros:**
- ✅ Easy to debug
- ✅ Works locally
- ✅ No public URL needed
- ✅ Hot reload

**Cons:**
- ❌ Polls every few seconds (more requests)
- ❌ Slightly higher latency
- ❌ Can't run on serverless platforms

### Production Mode (Webhook)

```bash
# Cloudflare Worker with webhook
bun run deploy:api:prod
```

**Pros:**
- ✅ Real-time updates (Telegram pushes to you)
- ✅ Lower latency
- ✅ Works on serverless (Cloudflare Workers)
- ✅ More efficient (fewer requests)

**Cons:**
- ❌ Requires public HTTPS URL
- ❌ Harder to debug
- ❌ Need to redeploy to test changes

## 🐛 Troubleshooting

### Webhook Not Receiving Updates

1. **Check webhook status:**
   ```bash
   curl https://your-api.workers.dev/telegram/webhook-info
   ```

2. **Look for errors:**
   ```bash
   # Check Cloudflare logs
   bun run logs:api:prod
   ```

3. **Verify URL is HTTPS:**
   - Telegram only accepts HTTPS webhooks
   - Cloudflare Workers URLs are HTTPS by default

4. **Test webhook manually:**
   ```bash
   curl https://your-api.workers.dev/telegram/webhook
   # Should return: {"status":"ok","message":"Telegram webhook endpoint is running"}
   ```

### Bot Not Responding

1. **Verify bot token:**
   ```bash
   # Check if token works
   curl "https://api.telegram.org/bot<TOKEN>/getMe"
   ```

2. **Check admin IDs:**
   ```bash
   # Verify your Telegram ID
   # Send a message to @userinfobot to get your ID
   ```

3. **Check webhook vs polling:**
   - Can't use both simultaneously
   - Delete webhook to use polling
   - Set webhook to use Workers

### Webhook Certificate Errors

If you see certificate errors:

```bash
# Delete and recreate webhook
curl -X POST https://your-api.workers.dev/telegram/delete-webhook
sleep 2
curl -X POST "https://your-api.workers.dev/telegram/set-webhook?url=https://your-api.workers.dev/telegram/webhook"
```

### High Pending Update Count

```bash
# Get webhook info
curl https://your-api.workers.dev/telegram/webhook-info

# If pending_update_count is high:
# 1. Fix any errors in your webhook handler
# 2. Redeploy
# 3. Updates will process automatically
```

## 📚 Additional Resources

- [Telegram Bot API Docs](https://core.telegram.org/bots/api)
- [Webhook Guide](https://core.telegram.org/bots/webhooks)
- [Grammy Framework](https://grammy.dev/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)

## 🎉 Quick Setup Checklist

- [ ] Create bot with @BotFather
- [ ] Get bot token
- [ ] Add token to `.env` (local) or Cloudflare secrets (production)
- [ ] Configure bot commands with @BotFather
- [ ] Set menu button (optional)
- [ ] For **development**: Run `bun run dev:bot`
- [ ] For **production**: 
  - [ ] Deploy API: `bun run deploy:api:prod`
  - [ ] Set webhook: `curl -X POST "https://your-api.workers.dev/telegram/set-webhook?url=https://your-api.workers.dev/telegram/webhook"`
  - [ ] Verify: `curl https://your-api.workers.dev/telegram/webhook-info`
- [ ] Test bot by sending `/start` in Telegram

---

**Need help?** Check the troubleshooting section or review the Cloudflare logs with `bun run logs:api:prod`.

