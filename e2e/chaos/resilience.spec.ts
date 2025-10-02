import { test, expect } from '@playwright/test';
import { ChaosMonkey } from './chaos-monkey';

test.describe('Chaos Engineering - Resilience Tests', () => {
  let monkey: ChaosMonkey;

  test.beforeEach(() => {
    monkey = new ChaosMonkey();
  });

  test.afterEach(() => {
    monkey.reset();
  });

  test('should handle intermittent API failures gracefully', async ({ page }) => {
    // Inject 30% failure rate
    await monkey.injectFault('random_500', 0.3);

    await page.goto('/');
    
    // Should still load with retry logic
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
  });

  test('should show offline state during network issues', async ({ page }) => {
    await page.goto('/');
    
    // Simulate going offline
    await page.context().setOffline(true);
    
    // Should show offline indicator
    const offlineIndicator = page.locator('[data-testid="network-status"]');
    await expect(offlineIndicator).toContainText(/offline|disconnected/i, { timeout: 5000 });
    
    // Go back online
    await page.context().setOffline(false);
    
    // Should recover
    await expect(offlineIndicator).toContainText(/online|connected/i, { timeout: 5000 });
  });

  test('should handle slow API responses', async ({ page }) => {
    // Add 3s latency
    await monkey.injectLatency(3000, 1.0);

    await page.goto('/');
    
    // Should show loading state
    const loading = page.locator('[data-testid="loading"]');
    await expect(loading).toBeVisible({ timeout: 1000 });
    
    // Eventually loads
    await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible({ timeout: 10000 });
  });

  test('should retry failed requests', async ({ page }) => {
    let requestCount = 0;
    
    await page.route('**/api/**', (route) => {
      requestCount++;
      
      // Fail first 2 requests
      if (requestCount < 3) {
        route.fulfill({
          status: 500,
          body: 'Server Error'
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/');
    
    // Should eventually succeed after retries
    await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible({ timeout: 15000 });
    
    // Should have retried
    expect(requestCount).toBeGreaterThanOrEqual(3);
  });

  test('should handle rate limiting gracefully', async ({ page }) => {
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 429,
        headers: {
          'Retry-After': '5'
        },
        body: 'Rate limit exceeded'
      });
    });

    await page.goto('/');
    
    // Should show rate limit message
    const message = page.locator('[data-testid="error-message"]');
    await expect(message).toContainText(/rate limit|too many requests/i, { timeout: 5000 });
  });

  test('should maintain functionality with degraded services', async ({ page }) => {
    // Simulate some endpoints failing
    await page.route('**/api/agent/tree', (route) => {
      route.fulfill({ status: 503, body: 'Service Unavailable' });
    });

    await page.goto('/');
    
    // Main dashboard should still work
    await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible();
    
    // But agent tree might show error
    await page.click('[data-testid="nav-tree"]');
    await expect(page.locator('[data-testid="service-error"]')).toBeVisible();
  });
});

test.describe('Chaos Engineering - Load Tests', () => {
  test('should handle rapid navigation', async ({ page }) => {
    await page.goto('/');

    // Rapidly navigate between pages
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="nav-dashboard"]');
      await page.click('[data-testid="nav-commissions"]');
      await page.click('[data-testid="nav-tree"]');
    }

    // Should not crash
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should handle concurrent actions', async ({ page }) => {
    await page.goto('/');

    // Trigger multiple actions simultaneously
    await Promise.all([
      page.click('[data-testid="refresh-stats"]'),
      page.click('[data-testid="refresh-commissions"]'),
      page.click('[data-testid="refresh-tree"]'),
    ]);

    // Should complete all without errors
    await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible();
  });
});

