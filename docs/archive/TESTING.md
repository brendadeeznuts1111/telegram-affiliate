# 🧪 Testing Guide

Comprehensive testing documentation for the Telegram Affiliate project.

## 📋 Table of Contents

- [Overview](#overview)
- [Unit Testing](#unit-testing)
- [E2E Testing](#e2e-testing)
- [Security Testing](#security-testing)
- [Performance Testing](#performance-testing)
- [CI/CD Integration](#cicd-integration)

## 🎯 Overview

This project uses a multi-layered testing strategy:

```
┌─────────────────┬──────────────────────────────────┐
│ Test Type       │ Tool & Coverage                  │
├─────────────────┼──────────────────────────────────┤
│ Unit Tests      │ Vitest (60% threshold)           │
│ E2E Tests       │ Playwright (4 browsers)          │
│ Visual Tests    │ Playwright screenshots           │
│ Performance     │ Lighthouse CI (budgets)          │
│ Security        │ Gitleaks + Bun audit             │
│ Type Safety     │ TypeScript strict mode           │
└─────────────────┴──────────────────────────────────┘
```

## 🧪 Unit Testing

### Quick Start

```bash
# Run all unit tests
bun run test

# Watch mode (hot reload)
bun run test:watch

# With coverage report
bun run test:coverage

# Interactive UI
bun run test:ui
```

### Writing Tests

Create test files next to your source code:

```typescript
// src/utils/__tests__/helper.test.ts
import { describe, it, expect } from 'vitest';
import { myHelper } from '../helper';

describe('myHelper', () => {
  it('should work correctly', () => {
    const result = myHelper('input');
    expect(result).toBe('expected output');
  });
});
```

### Configuration

- **Config**: `vitest.config.ts`
- **Setup**: `test/setup.ts`
- **Coverage**: `coverage/` directory (auto-generated)

### Coverage Thresholds

```typescript
coverage: {
  thresholds: {
    lines: 60,
    functions: 60,
    branches: 60,
    statements: 60,
  }
}
```

## 🎭 E2E Testing

### Quick Start

```bash
# Run all E2E tests
bun run test:e2e

# Interactive mode
bun run test:e2e:ui

# View last report
bun run test:e2e:report
```

### Prerequisites

E2E tests require both services running:

```bash
# Terminal 1: Start API
bun run dev:api

# Terminal 2: Start Dashboard
bun run dev:ui

# Terminal 3: Run E2E tests
bun run test:e2e
```

### Writing E2E Tests

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should display correctly', async ({ page }) => {
    await page.goto('/');
    
    const element = page.locator('[data-testid="my-element"]');
    await expect(element).toBeVisible();
  });
});
```

### Browser Coverage

Tests run on:
- ✅ Desktop Chrome (Chromium)
- ✅ Desktop Firefox
- ✅ Desktop Safari (WebKit)
- ✅ Mobile Chrome (Pixel 5)

### Screenshots & Videos

- Screenshots: Captured on failure
- Videos: Retained on failure
- Traces: Available on first retry

## 🔒 Security Testing

### Secret Scanning

```bash
# Manual scan
bunx gitleaks detect --config .gitleaks.toml

# Scan with verbose output
bunx gitleaks detect --verbose
```

### Dependency Audit

```bash
# Run security audit
bun audit

# Check for high/critical vulnerabilities
bun audit --audit-level=high
```

### What's Scanned

- ✅ Telegram bot tokens
- ✅ Cloudflare API tokens
- ✅ AWS keys
- ✅ Generic API keys
- ✅ All npm dependencies

## ⚡ Performance Testing

### Lighthouse CI

```bash
# Build dashboard first
bun run build:ui

# Run Lighthouse
bun run lighthouse
```

### Performance Budgets

```json
{
  "Performance": "≥ 75",
  "Accessibility": "≥ 90 (enforced)",
  "Best Practices": "≥ 90 (enforced)",
  "SEO": "≥ 80",
  "FCP": "≤ 2.5s",
  "LCP": "≤ 4.0s",
  "CLS": "≤ 0.15",
  "TBT": "≤ 500ms"
}
```

## 🔄 CI/CD Integration

### Quality Gates Workflow

On every PR and push to main:

```yaml
Quality Check (Matrix):
├── Type checking
├── Linting
├── Unit tests
└── Build verification

E2E Tests:
├── Dashboard tests
├── API integration tests
├── Mobile viewport tests
└── Screenshot on failure

Security Scan:
├── Gitleaks (secret detection)
├── Bun audit (dependencies)
└── Automated alerts

Status Check:
└── Overall gate pass/fail
```

### GitHub Actions

- **Trigger**: Every PR + push to main
- **Timeout**: 30 minutes max
- **Parallelization**: Matrix strategy
- **Artifacts**: Test reports, screenshots, videos
- **Comments**: Automatic PR comments with results

## 📊 Test Results

### Local

```bash
# View coverage
open coverage/index.html

# View E2E report
bun run test:e2e:report
```

### CI/CD

- **Coverage**: Uploaded to Codecov (if configured)
- **E2E Results**: Available as GitHub artifacts
- **Security**: Automatic PR comments

## 🎯 Best Practices

1. **Test Naming**: Use descriptive test names
   ```typescript
   it('should display error message when API fails')
   ```

2. **Data TestIDs**: Use for E2E selectors
   ```html
   <div data-testid="user-profile">
   ```

3. **Isolation**: Tests should be independent
   ```typescript
   afterEach(() => {
     cleanup();
   });
   ```

4. **Mock External Deps**: Don't test external services
   ```typescript
   vi.mock('./api-client')
   ```

5. **Coverage**: Aim for 60%+ minimum

## 🐛 Debugging

### Unit Tests

```bash
# Run specific test file
bun run test src/utils/__tests__/helper.test.ts

# Run with UI for debugging
bun run test:ui
```

### E2E Tests

```bash
# Run in headed mode
bunx playwright test --headed

# Run specific test
bunx playwright test e2e/dashboard.spec.ts

# Debug mode
bunx playwright test --debug
```

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Gitleaks](https://github.com/gitleaks/gitleaks)

## ❓ Troubleshooting

### "No tests found"

Make sure test files follow the pattern:
- `*.test.ts`
- `*.spec.ts`
- `__tests__/*.ts`

### E2E timeout errors

Increase timeout in `playwright.config.ts`:
```typescript
use: {
  timeout: 60 * 1000, // 60 seconds
}
```

### Coverage not generated

Install coverage provider:
```bash
bun add -d @vitest/coverage-v8
```

---

**Ready to test!** 🚀

Run `bun run test` to get started.

