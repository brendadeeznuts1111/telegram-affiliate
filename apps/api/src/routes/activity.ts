/**
 * Activity Feed API Routes
 * Endpoints for recent activity and events
 */

import { Hono } from 'hono';
import type { WorkerBindings } from '../app';

const activity = new Hono<{ Bindings: WorkerBindings }>();

/**
 * GET /api/activity
 * Get recent activity for authenticated agent
 */
activity.get('/', async (c) => {
  try {
    const agentId = c.get('userId');
    
    if (!agentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const limit = parseInt(c.req.query('limit') || '20');

    // Get various types of activities
    const activities: any[] = [];

    // Recent commissions
    const commissions = await c.env.DB
      .prepare(`
        SELECT 
          'commission' as type,
          comm.commission_id as id,
          'Commission Earned' as title,
          comm.description,
          comm.amount,
          comm.created_at as timestamp
        FROM commissions comm
        WHERE comm.agent_id = (SELECT id FROM users WHERE telegram_id = ?)
        ORDER BY comm.created_at DESC
        LIMIT 5
      `)
      .bind(agentId)
      .all();

    activities.push(...(commissions.results || []));

    // Recent deposits
    const deposits = await c.env.DB
      .prepare(`
        SELECT 
          'deposit' as type,
          d.deposit_id as id,
          'Deposit Recorded' as title,
          '$' || d.amount || ' deposit from ' || c.name as description,
          d.amount,
          d.created_at as timestamp
        FROM deposits d
        LEFT JOIN customers c ON d.customer_id = c.customer_id
        WHERE d.agent_id = (SELECT id FROM users WHERE telegram_id = ?)
        ORDER BY d.created_at DESC
        LIMIT 5
      `)
      .bind(agentId)
      .all();

    activities.push(...(deposits.results || []));

    // Recent customers
    const customers = await c.env.DB
      .prepare(`
        SELECT 
          'customer' as type,
          c.customer_id as id,
          'New Customer Added' as title,
          c.name || ' joined your network' as description,
          NULL as amount,
          c.created_at as timestamp
        FROM customers c
        WHERE c.agent_id = (SELECT id FROM users WHERE telegram_id = ?)
        ORDER BY c.created_at DESC
        LIMIT 5
      `)
      .bind(agentId)
      .all();

    activities.push(...(customers.results || []));

    // Recent sub-agents
    const subAgents = await c.env.DB
      .prepare(`
        SELECT 
          'agent' as type,
          u.id as id,
          'New Sub-Agent' as title,
          u.first_name || ' joined as your sub-agent' as description,
          NULL as amount,
          u.created_at as timestamp
        FROM users u
        WHERE u.referred_by = (SELECT id FROM users WHERE telegram_id = ?)
        AND u.is_agent = 1
        ORDER BY u.created_at DESC
        LIMIT 5
      `)
      .bind(agentId)
      .all();

    activities.push(...(subAgents.results || []));

    // Sort all activities by timestamp
    activities.sort((a, b) => b.timestamp - a.timestamp);

    // Limit to requested amount
    const limitedActivities = activities.slice(0, limit);

    return c.json({
      activities: limitedActivities,
      total: limitedActivities.length,
    });
  } catch (error: any) {
    console.error('Get activity error:', error);
    return c.json({ error: 'Failed to fetch activity', details: error.message }, 500);
  }
});

/**
 * GET /api/activity/chart
 * Get earnings data for chart visualization
 */
activity.get('/chart', async (c) => {
  try {
    const agentId = c.get('userId');
    
    if (!agentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const days = parseInt(c.req.query('days') || '30');

    // Get daily earnings for the past N days
    const result = await c.env.DB
      .prepare(`
        SELECT 
          DATE(created_at, 'unixepoch') as date,
          COALESCE(SUM(amount), 0) as amount
        FROM commissions
        WHERE agent_id = (SELECT id FROM users WHERE telegram_id = ?)
        AND created_at >= ?
        GROUP BY date
        ORDER BY date ASC
      `)
      .bind(agentId, Math.floor(Date.now() / 1000) - (days * 86400))
      .all();

    return c.json({
      data: result.results || [],
      days,
    });
  } catch (error: any) {
    console.error('Get chart data error:', error);
    return c.json({ error: 'Failed to fetch chart data', details: error.message }, 500);
  }
});

export default activity;
