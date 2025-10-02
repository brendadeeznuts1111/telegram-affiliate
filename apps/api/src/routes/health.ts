import { Hono } from 'hono';

const health = new Hono();

/**
 * Basic health check endpoint
 * Used by load balancers and monitoring systems
 */
health.get('/', async (c) => {
  // Get environment info
  const environment = c.env?.ENVIRONMENT || process.env.ENVIRONMENT || 'unknown';
  const startTime = process.uptime ? process.uptime() * 1000 : Date.now();
  
  // Check database if available
  let dbStatus = 'not_configured';
  if (c.env?.DB) {
    try {
      await c.env.DB.prepare('SELECT 1').run();
      dbStatus = 'healthy';
    } catch (error) {
      dbStatus = 'unhealthy';
      console.error('Database health check failed:', error);
    }
  }

  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment,
    services: {
      api: 'healthy',
      database: dbStatus,
    },
    uptime: Date.now() - startTime,
    version: '1.0.0',
  });
});

/**
 * Detailed health check with system metrics
 * Used for debugging and monitoring dashboards
 */
health.get('/detailed', async (c) => {
  const memUsage = process.memoryUsage ? process.memoryUsage() : null;
  
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: c.env?.ENVIRONMENT || process.env.ENVIRONMENT || 'unknown',
    runtime: {
      platform: process.platform || 'unknown',
      version: process.version || Bun.version || 'unknown',
      uptime: process.uptime ? process.uptime() : null,
    },
    memory: memUsage ? {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
    } : null,
  });
});

/**
 * Readiness probe
 * Returns 200 when service is ready to accept traffic
 */
health.get('/ready', async (c) => {
  // Check if critical dependencies are available
  if (c.env?.DB) {
    try {
      await c.env.DB.prepare('SELECT 1').run();
    } catch (error) {
      return c.json({ ready: false, reason: 'database_unavailable' }, 503);
    }
  }

  return c.json({ ready: true });
});

/**
 * Liveness probe
 * Returns 200 if service is alive (even if not ready)
 */
health.get('/live', (c) => {
  return c.json({ alive: true });
});

export default health;

