# Codebase Cleanup Configuration
# Last cleanup: October 2, 2025

## Removed Items
- archive/ - Old Python bot (legacy)
- .bot.pid - Temporary PID file
- 5 duplicate documentation files
- Old test QR generation files

## Archived Documentation
Moved to docs/archive/:
- BOT-SETUP.md
- CLOUDFLARE-SETUP.md  
- LOCAL-DEV.md
- TESTING.md
- LEVEL-4.md
- LEVEL-5-AFFILIATE-EMPIRE.md

## Kept at Root (Essential)
- FINAL-STATUS.md - Master reference ⭐
- README.md - Project overview
- STATUS-REPORT.md - Detailed status
- FIXES-COMPLETED.md - Fix history

## Regular Cleanup Commands

### NPM Scripts (Recommended)
```bash
# Full maintenance cleanup (runs all below)
bun run clean:maintenance

# Individual commands:
bun run clean:cache        # Clear Bun cache
bun run clean:build        # Remove build artifacts  
bun run clean:db-temp      # Remove SQLite temp files
bun run clean:processes    # Stop dev processes
bun run clean:all          # Nuclear option (removes node_modules too)
```

### Manual Commands (if needed)
```bash
# Remove node_modules bloat
bun pm cache clean

# Remove build artifacts
rm -rf apps/*/dist apps/*/.wrangler

# Remove SQLite WAL files (if database idle)
rm -f data/*.db-shm data/*.db-wal

# Stop all dev processes
pkill -f "bun.*dev"
pkill -f "wrangler"
```

## Files to Monitor
- data/*.db-shm, data/*.db-wal (SQLite temp files, safe to remove when idle)
- *.log files
- *.pid files
- node_modules/ (335MB - largest directory)

