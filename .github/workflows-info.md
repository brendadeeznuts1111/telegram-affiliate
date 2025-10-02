# 🚀 GitHub Workflows Guide

## 📋 Available Workflows

### 1. **🚀 Bun CI Pipeline** (`bun-ci.yml`)
**Trigger**: Push/PR to `main` or `develop`

**Jobs**:
- 📦 Install Dependencies (with caching)
- 🔍 Lint & Format Check
- 📘 TypeScript Type Check
- 🧪 Unit Tests
- 🏗️ Build (matrix: api, dashboard)
- 🎭 E2E Tests (Playwright)
- 🔒 Security Scan
- ✅ Success Summary

**Optimizations**:
- Bun dependency caching
- Playwright browser caching
- Matrix builds for workspaces
- Parallel job execution

### 2. **🐳 Docker Build & Push** (`docker.yml`)
**Trigger**: Push to `main`/`develop`, tags, or manual

**Features**:
- Multi-layer Docker caching
- GHCR (GitHub Container Registry) push
- Semantic versioning tags
- BuildKit inline cache

### 3. **☁️ Cloudflare Deploy** (`cloudflare-deploy.yml`)
**Trigger**: Push to `main` or manual

**Deploys**:
- API → Cloudflare Workers
- Dashboard → Cloudflare Pages
- Post-deployment health checks

### 4. **🔒 CodeQL Security Scan** (`codeql.yml`)
**Trigger**: Push, PR, weekly schedule (Mondays)

**Scans**:
- JavaScript/TypeScript analysis
- Security vulnerability detection
- Automated security alerts

### 5. **🎉 Release** (`release.yml`)
**Trigger**: Version tags (`v*.*.*`)

**Actions**:
- Build all workspaces
- Generate changelog
- Create GitHub Release
- Upload artifacts

## 🎯 Best Practices Implemented

### ✅ Caching Strategy
```yaml
# Bun dependencies
~/.bun/install/cache
node_modules
apps/*/node_modules

# Playwright browsers
~/.cache/ms-playwright

# Docker layers
/tmp/.buildx-cache
```

### ✅ Performance Optimizations
- **Concurrency control**: Cancel outdated workflow runs
- **Matrix builds**: Parallel workspace building
- **Dependency caching**: Bun lockfile-based
- **Docker BuildKit**: Multi-stage builds with cache

### ✅ Security
- CodeQL weekly scans
- Dependabot automated updates
- Secret management via GitHub Secrets
- Permission minimization per job

## 🔧 Required Secrets

Add these to GitHub Settings → Secrets:

```bash
CLOUDFLARE_API_TOKEN      # Cloudflare API token
CLOUDFLARE_ACCOUNT_ID     # Cloudflare account ID
CLOUDFLARE_ZONE_ID        # Cloudflare zone ID (optional)
TELEGRAM_BOT_TOKEN        # For E2E tests
```

## 📊 Workflow Status Badges

Add to README:

```markdown
[![Bun CI](https://github.com/brendadeeznuts1111/telegram-affiliate/workflows/Bun%20CI%20Pipeline/badge.svg)](https://github.com/brendadeeznuts1111/telegram-affiliate/actions)
[![Docker](https://github.com/brendadeeznuts1111/telegram-affiliate/workflows/Docker%20Build%20%26%20Push/badge.svg)](https://github.com/brendadeeznuts1111/telegram-affiliate/actions)
[![CodeQL](https://github.com/brendadeeznuts1111/telegram-affiliate/workflows/CodeQL%20Security%20Scan/badge.svg)](https://github.com/brendadeeznuts1111/telegram-affiliate/actions)
```

## 🚀 Quick Commands

```bash
# Trigger manual deployment
gh workflow run cloudflare-deploy.yml -f environment=staging

# View workflow runs
gh run list

# Watch latest workflow
gh run watch

# View logs
gh run view --log
```
