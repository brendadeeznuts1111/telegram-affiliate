#!/bin/bash

# Telegram Affiliate Bot - Cloudflare Deployment Script
# This script will guide you through deploying to Cloudflare Workers & Pages

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║       🚀 CLOUDFLARE DEPLOYMENT WIZARD 🚀                      ║"
echo "║                                                               ║"
echo "║  This script will deploy your Telegram Affiliate Bot         ║"
echo "║  to Cloudflare Workers and Pages.                            ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Read environment variables
if [ -f .env ]; then
    source .env
    echo -e "${GREEN}✅ Loaded environment variables from .env${NC}"
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Navigate to API directory
cd apps/api

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1 of 8: Authenticate with Cloudflare"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}This will open your browser to authenticate.${NC}"
echo -e "${YELLOW}If you're already logged in, this will be skipped.${NC}"
echo ""
read -p "Press ENTER to authenticate with Cloudflare..."

wrangler login

echo ""
echo -e "${GREEN}✅ Authentication complete!${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2 of 8: Database Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "You have two options:"
echo ""
echo "  A) Use existing database (affiliate-system)"
echo "     Database ID: e6cc2427-f81b-4849-bcba-acacb3aedc70"
echo ""
echo "  B) Create a new production database"
echo ""
read -p "Enter choice (A/B): " db_choice

if [ "$db_choice" = "A" ] || [ "$db_choice" = "a" ]; then
    DB_ID="e6cc2427-f81b-4849-bcba-acacb3aedc70"
    DB_NAME="affiliate-system"
    echo -e "${GREEN}✅ Using existing database: $DB_NAME${NC}"
    
    # Update wrangler.toml
    sed -i '' 's/database_id = "" # production database/database_id = "e6cc2427-f81b-4849-bcba-acacb3aedc70" # production database/' wrangler.toml
    echo -e "${GREEN}✅ Updated wrangler.toml with database ID${NC}"
else
    echo ""
    echo "Creating new production database..."
    wrangler d1 create affiliate-system-prod
    
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Copy the database_id from above and paste it below${NC}"
    read -p "Enter database_id: " DB_ID
    read -p "Enter database_name (default: affiliate-system-prod): " DB_NAME
    DB_NAME=${DB_NAME:-affiliate-system-prod}
    
    # Update wrangler.toml
    sed -i '' "s/database_id = \"\" # production database/database_id = \"$DB_ID\" # production database/" wrangler.toml
    sed -i '' "s/database_name = \"affiliate-system\"/database_name = \"$DB_NAME\"/" wrangler.toml
    echo -e "${GREEN}✅ Updated wrangler.toml with new database${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3 of 8: Run Database Migrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Running migrations on $DB_NAME..."

wrangler d1 execute $DB_NAME \
  --file=src/db/migrations/001_initial.sql \
  --env production

echo ""
echo -e "${GREEN}✅ Database migrations complete!${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4 of 8: Set Cloudflare Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Setting bot credentials from your .env file..."
echo ""

echo "$BOT_TOKEN" | wrangler secret put BOT_TOKEN --env production
echo "$ADMIN_IDS" | wrangler secret put ADMIN_IDS --env production

# Optional webhook secret
echo ""
read -p "Do you want to set a WEBHOOK_SECRET? (y/N): " set_webhook
if [ "$set_webhook" = "y" ] || [ "$set_webhook" = "Y" ]; then
    WEBHOOK_SECRET=$(openssl rand -hex 32)
    echo "$WEBHOOK_SECRET" | wrangler secret put WEBHOOK_SECRET --env production
    echo -e "${GREEN}✅ Generated and set WEBHOOK_SECRET: $WEBHOOK_SECRET${NC}"
    echo -e "${YELLOW}Save this secret for later webhook configuration!${NC}"
fi

echo ""
echo -e "${GREEN}✅ Secrets configured!${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5 of 8: Deploy API to Cloudflare Workers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Deploying API..."
echo ""

bun run deploy:prod

echo ""
echo -e "${GREEN}✅ API deployed successfully!${NC}"

# Get the deployed URL
API_URL=$(wrangler deployments list --env production 2>/dev/null | grep "https://" | head -1 | awk '{print $1}')
if [ -z "$API_URL" ]; then
    API_URL="https://telegram-affiliate-api.nolarose1968.workers.dev"
fi

echo ""
echo -e "${BLUE}🌐 API URL: $API_URL${NC}"
echo ""

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 6 of 8: Deploy Dashboard to Cloudflare Pages"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd ../dashboard

echo "Building dashboard..."
bun run build

echo ""
echo "Deploying to Cloudflare Pages..."
wrangler pages deploy dist --project-name telegram-affiliate-dashboard

echo ""
echo -e "${GREEN}✅ Dashboard deployed successfully!${NC}"

DASHBOARD_URL="https://9053c4e4.telegram-affiliate-dashboard.pages.dev"
echo -e "${BLUE}🌐 Dashboard URL: $DASHBOARD_URL${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 7 of 8: Verify Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Testing API health check..."
API_HEALTH=$(curl -s "$API_URL/health" || echo "error")

if [[ $API_HEALTH == *"ok"* ]]; then
    echo -e "${GREEN}✅ API is healthy!${NC}"
    echo "Response: $API_HEALTH"
else
    echo -e "${RED}❌ API health check failed${NC}"
    echo "Response: $API_HEALTH"
fi

echo ""
echo "Testing dashboard..."
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DASHBOARD_URL")

if [ "$DASHBOARD_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Dashboard is live!${NC}"
else
    echo -e "${RED}❌ Dashboard returned status: $DASHBOARD_STATUS${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 8 of 8: Bot Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "You have two options for running the bot:"
echo ""
echo "  A) Webhook mode (runs on Cloudflare Workers)"
echo "  B) Polling mode (runs locally)"
echo ""
read -p "Enter choice (A/B): " bot_choice

if [ "$bot_choice" = "A" ] || [ "$bot_choice" = "a" ]; then
    echo ""
    echo "Setting up webhook..."
    WEBHOOK_URL="$API_URL/telegram/webhook"
    
    WEBHOOK_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}")
    
    if [[ $WEBHOOK_RESPONSE == *"true"* ]]; then
        echo -e "${GREEN}✅ Webhook configured successfully!${NC}"
        echo "Webhook URL: $WEBHOOK_URL"
    else
        echo -e "${RED}❌ Webhook setup failed${NC}"
        echo "Response: $WEBHOOK_RESPONSE"
    fi
else
    echo ""
    echo -e "${YELLOW}Bot will run in polling mode (locally).${NC}"
    echo "To start the bot, run:"
    echo ""
    echo "  cd /Users/nolarose/projects/telegram-affiliate"
    echo "  bun run dev:bot"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║              🎉 DEPLOYMENT COMPLETE! 🎉                       ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 DEPLOYMENT SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "API URL:       ${BLUE}$API_URL${NC}"
echo -e "Dashboard URL: ${BLUE}$DASHBOARD_URL${NC}"
echo -e "Database:      ${GREEN}$DB_NAME${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 QUICK LINKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Cloudflare Dashboard:"
echo "   https://dash.cloudflare.com/"
echo ""
echo "📈 Worker Logs:"
echo "   wrangler tail --env production"
echo ""
echo "🔍 Pages Logs:"
echo "   wrangler pages deployment tail"
echo ""
echo "💚 Health Check:"
echo "   curl $API_URL/health"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "For more details, see: DEPLOYMENT.md"
echo ""
echo "Happy coding! 🚀"
echo ""
