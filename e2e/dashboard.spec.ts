import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test('should load the dashboard page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the page title is correct
    await expect(page).toHaveTitle(/Telegram Affiliate/);
  });
  
  test('should display dashboard stats', async ({ page }) => {
    await page.goto('/');
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="dashboard-stats"]', { timeout: 10000 });
    
    // Check if stats are visible
    const stats = page.locator('[data-testid="dashboard-stats"]');
    await expect(stats).toBeVisible();
  });
  
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if mobile navigation is visible
    await expect(page.locator('nav')).toBeVisible();
  });
  
  test('should handle API health check', async ({ page }) => {
    // Navigate to API health endpoint
    const response = await page.request.get('http://localhost:3001/health');
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('ok');
  });
});

