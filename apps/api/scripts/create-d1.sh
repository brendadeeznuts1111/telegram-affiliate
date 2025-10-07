#!/bin/bash
# Create D1 database for Cloudflare Workers

set -e

echo "📦 Creating D1 Database..."
echo ""

# Create D1 database
DATABASE_ID=$(bun x wrangler d1 create telegram-affiliate-db --json | grep -o '"database_id":"[^"]*' | cut -d'"' -f4)

if [ -z "$DATABASE_ID" ]; then
  echo "❌ Failed to create D1 database"
  exit 1
fi

echo "✅ D1 Database created successfully!"
echo ""
echo "Database ID: $DATABASE_ID"
echo ""
echo "📝 Update wrangler.toml with the following:"
echo ""
echo "[[d1_databases]]"
echo "binding = \"DB\""
echo "database_name = \"telegram-affiliate-db\""
echo "database_id = \"$DATABASE_ID\""
echo ""
echo "⏭️  Next steps:"
echo "1. Update database_id in wrangler.toml"
echo "2. Run: bun run db:execute to apply schema"
echo "3. Deploy with: bun run deploy"
