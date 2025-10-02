FROM oven/bun:1-alpine AS base

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    ca-certificates

# Copy package files
COPY package.json bun.lockb ./
COPY apps/api/package.json ./apps/api/
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/schemas/package.json ./packages/schemas/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build applications
RUN bun run build

# Production image
FROM oven/bun:1-alpine AS production

WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps ./apps
COPY --from=base /app/packages ./packages
COPY --from=base /app/package.json ./
COPY --from=base /app/src ./src
COPY --from=base /app/data ./data

# Expose ports
EXPOSE 3001 5175

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start bot by default
CMD ["bun", "run", "dev:bot"]

