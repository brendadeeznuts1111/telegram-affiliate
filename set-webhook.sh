#!/usr/bin/env bash

#
# Set Telegram Webhook for Cloudflare Workers Bot
# This script configures your Telegram bot to receive updates via webhook
#

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📡 Telegram Webhook Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Worker URL
WORKER_URL="https://telegram-affiliate-api.nolarose1968-806.workers.dev"
WEBHOOK_URL="${WORKER_URL}/telegram/webhook"

# Get BOT_TOKEN from Wrangler secrets
echo -e "${YELLOW}Getting BOT_TOKEN from Cloudflare secrets...${NC}"
cd apps/api

# Note: We can't programmatically get secrets, so we'll provide instructions
echo -e "${YELLOW}⚠️  You need to manually run these commands:${NC}"
echo ""
echo -e "${GREEN}# Get your BOT_TOKEN${NC}"
echo "wrangler secret list"
echo ""
echo -e "${GREEN}# Then set webhook with your token:${NC}"
echo "curl -X POST \"https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"url\": \"${WEBHOOK_URL}\","
echo "    \"allowed_updates\": [\"message\", \"callback_query\"],"
echo "    \"drop_pending_updates\": true"
echo "  }'"
echo ""
echo -e "${GREEN}# Verify webhook status:${NC}"
echo "curl \"https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo\""
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Webhook URL: ${WEBHOOK_URL}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}After setting webhook, test your bot in Telegram!${NC}"
echo ""
