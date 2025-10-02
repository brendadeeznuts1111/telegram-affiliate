#!/bin/bash

# ============================================
# Secret Setup Script
# ============================================
# This script helps you set up all required secrets
# for GitHub Actions and Cloudflare Workers

set -e

BOT_TOKEN="8039557687:AAGMloT2l10NsnRFJXzUtIcSX_kSPTzKY2E"
BOT_USERNAME="Firesupportcs_bot"
ADMIN_IDS="8013171035"
CLOUDFLARE_ACCOUNT_ID="80693377f3abb78e00820aa69a415ce4"

echo "🔐 Secret Setup Script"
echo "======================"
echo ""

# ============================================
# 1. GitHub Secrets
# ============================================
echo "1️⃣  Setting up GitHub Secrets..."
echo ""
echo "Run these commands to set GitHub secrets:"
echo ""
echo "gh secret set BOT_TOKEN --body \"$BOT_TOKEN\""
echo "gh secret set TELEGRAM_BOT_TOKEN --body \"$BOT_TOKEN\""
echo "gh secret set TELEGRAM_BOT_USERNAME --body \"$BOT_USERNAME\""
echo "gh secret set ADMIN_IDS --body \"$ADMIN_IDS\""
echo "gh secret set CLOUDFLARE_ACCOUNT_ID --body \"$CLOUDFLARE_ACCOUNT_ID\""
echo ""
echo "⚠️  You also need to set these manually:"
echo "gh secret set CLOUDFLARE_API_TOKEN --body \"YOUR_TOKEN_HERE\""
echo "gh secret set WEBHOOK_SECRET --body \"$(openssl rand -hex 32)\""
echo "gh secret set WITHDRAWAL_PRIVATE_KEY --body \"YOUR_KEY_HERE\""
echo ""

# ============================================
# 2. Cloudflare Worker Secrets
# ============================================
echo "2️⃣  Setting up Cloudflare Worker Secrets..."
echo ""
echo "Run these commands to set Cloudflare secrets:"
echo ""
echo "cd apps/api"
echo "echo \"$BOT_TOKEN\" | bunx wrangler secret put BOT_TOKEN"
echo "echo \"$BOT_TOKEN\" | bunx wrangler secret put TELEGRAM_BOT_TOKEN"
echo "echo \"$ADMIN_IDS\" | bunx wrangler secret put ADMIN_IDS"
echo "echo \"$(openssl rand -hex 32)\" | bunx wrangler secret put WEBHOOK_SECRET"
echo ""

# ============================================
# 3. Set Webhook
# ============================================
echo "3️⃣  Setting up Telegram Webhook..."
echo ""
echo "After deploying your worker, run:"
echo ""
echo "WORKER_URL=\"https://telegram-affiliate-api.workers.dev\""
echo "curl \"https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=\${WORKER_URL}/telegram\""
echo ""

# ============================================
# 4. Quick Setup (Interactive)
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "🚀 Do you want to set up GitHub secrets now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo ""
    echo "Setting GitHub secrets..."
    gh secret set BOT_TOKEN --body "$BOT_TOKEN"
    gh secret set TELEGRAM_BOT_TOKEN --body "$BOT_TOKEN"
    gh secret set TELEGRAM_BOT_USERNAME --body "$BOT_USERNAME"
    gh secret set ADMIN_IDS --body "$ADMIN_IDS"
    gh secret set CLOUDFLARE_ACCOUNT_ID --body "$CLOUDFLARE_ACCOUNT_ID"
    
    WEBHOOK_SECRET=$(openssl rand -hex 32)
    gh secret set WEBHOOK_SECRET --body "$WEBHOOK_SECRET"
    
    echo "✅ GitHub secrets set!"
    echo ""
    echo "⚠️  Still need to set manually:"
    echo "   - CLOUDFLARE_API_TOKEN (get from Cloudflare dashboard)"
    echo "   - WITHDRAWAL_PRIVATE_KEY (for blockchain withdrawals)"
    echo ""
fi

echo ""
read -p "🔐 Do you want to set up Cloudflare secrets now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo ""
    echo "Setting Cloudflare secrets..."
    cd apps/api
    
    echo "$BOT_TOKEN" | bunx wrangler secret put BOT_TOKEN
    echo "$ADMIN_IDS" | bunx wrangler secret put ADMIN_IDS
    echo "$(openssl rand -hex 32)" | bunx wrangler secret put WEBHOOK_SECRET
    
    echo "✅ Cloudflare secrets set!"
    echo ""
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Secret setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Get your Cloudflare API token from:"
echo "      https://dash.cloudflare.com/profile/api-tokens"
echo "   2. Deploy your worker: bun run deploy:prod"
echo "   3. Set webhook: See commands above"
echo "   4. Test bot: Send /start to @$BOT_USERNAME"
echo ""

