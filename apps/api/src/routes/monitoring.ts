import { Hono } from 'hono';
import { CostTracker } from '../monitoring/cost-tracker';

type Bindings = {
  MONTHLY_BUDGET?: string;
};

export const monitoring = new Hono<{ Bindings: Bindings }>();

/**
 * Get current cost estimate
 */
monitoring.get('/cost', async (c) => {
  const tracker = new CostTracker();
  
  const usage = await tracker.getCurrentUsage();
  const estimate = tracker.calculateCost(usage);
  const suggestions = await tracker.getOptimizationSuggestions(estimate);

  return c.json({
    usage,
    estimate,
    suggestions,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Check budget alert
 */
monitoring.get('/cost/alert', async (c) => {
  const tracker = new CostTracker();
  const budget = parseFloat(c.env.MONTHLY_BUDGET || '50');
  
  const isOverBudget = await tracker.checkBudgetAlert(budget);
  const usage = await tracker.getCurrentUsage();
  const estimate = tracker.calculateCost(usage);

  return c.json({
    alert: isOverBudget,
    budget,
    estimated_monthly: estimate.monthly,
    percentage: (estimate.monthly / budget) * 100,
  });
});

/**
 * System metrics
 */
monitoring.get('/metrics', async (c) => {
  // Collect system metrics
  const metrics = {
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: Date.now(),
  };

  return c.json(metrics);
});

export default monitoring;

