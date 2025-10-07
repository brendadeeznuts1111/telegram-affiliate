#!/bin/bash
# Run D1 migrations

set -e

echo "🔄 Running D1 Migrations..."
echo ""

# Read the migration file
MIGRATION_FILE="../src/db/migrations/001_initial.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "📝 Applying migration: 001_initial.sql"
bun x wrangler d1 execute telegram-affiliate-db --remote --file="$MIGRATION_FILE"

echo ""
echo "✅ Migrations applied successfully!"
echo ""
echo "⏭️  Next: Test your API with D1"
