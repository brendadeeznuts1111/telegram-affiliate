#!/usr/bin/env bash

#
# Interactive Webhook Setup Script
# This script helps you configure your Telegram bot webhook
#

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔗 Telegram Bot Webhook Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

WEBHOOK_URL="https://telegram-affiliate-api.nolarose1968-806.workers.dev/telegram/webhook"

echo -e "${YELLOW}Step 1: Get your BOT_TOKEN${NC}"
echo ""
echo "Your bot token is stored in Cloudflare secrets."
echo "You can find it in one of these places:"
echo ""
echo "  1. Cloudflare Dashboard:"
echo "     https://dash.cloudflare.com → Workers & Pages → telegram-affiliate-api → Settings → Variables"
echo ""
echo "  2. Your @BotFather conversation on Telegram"
echo ""
echo "  3. Your local .env file (if you have one)"
echo ""
echo -e "${GREEN}Please paste your BOT_TOKEN (it should look like 123456:ABC-DEF1234...):${NC}"
read -r BOT_TOKEN

if [ -z "$BOT_TOKEN" ]; then
    echo -e "${RED}❌ No token provided. Exiting.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Setting webhook...${NC}"
echo ""

# Set webhook
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${WEBHOOK_URL}\",
    \"allowed_updates\": [\"message\", \"callback_query\"],
    \"drop_pending_updates\": true
  }")

# Check if successful
if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo -e "${GREEN}✅ Webhook set successfully!${NC}"
    echo ""
    echo -e "${BLUE}Webhook URL: ${WEBHOOK_URL}${NC}"
else
    echo -e "${RED}❌ Failed to set webhook:${NC}"
    echo "$RESPONSE"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 3: Verifying webhook...${NC}"
echo ""

# Verify webhook
VERIFY_RESPONSE=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")

if echo "$VERIFY_RESPONSE" | grep -q "\"url\":\"${WEBHOOK_URL}\""; then
    echo -e "${GREEN}✅ Webhook verified and active!${NC}"
    echo ""
    
    # Parse and display webhook info
    PENDING_COUNT=$(echo "$VERIFY_RESPONSE" | grep -o '"pending_update_count":[0-9]*' | cut -d':' -f2)
    LAST_ERROR_DATE=$(echo "$VERIFY_RESPONSE" | grep -o '"last_error_date":[0-9]*' | cut -d':' -f2)
    
    echo "Webhook Status:"
    echo "  URL: ${WEBHOOK_URL}"
    echo "  Pending Updates: ${PENDING_COUNT:-0}"
    
    if [ -n "$LAST_ERROR_DATE" ] && [ "$LAST_ERROR_DATE" != "0" ]; then
        echo -e "  ${YELLOW}⚠️  Last Error: $(date -r $LAST_ERROR_DATE 2>/dev/null || echo 'N/A')${NC}"
    fi
else
    echo -e "${RED}❌ Webhook verification failed:${NC}"
    echo "$VERIFY_RESPONSE"
    exit 1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Open Telegram and search for: ${GREEN}@Firesupportcs_bot${NC}"
echo ""
echo "2. Try these commands:"
echo "   ${BLUE}/start${NC}        - Start the bot & become an agent"
echo "   ${BLUE}/dashboard${NC}    - View your affiliate dashboard"
echo "   ${BLUE}/addcustomer${NC}  - Add your first customer"
echo "   ${BLUE}/deposit${NC}      - Record a deposit & earn commissions"
echo ""
echo -e "${GREEN}Your bot is now live and ready to use!${NC}"
echo ""
