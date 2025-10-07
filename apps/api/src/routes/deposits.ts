/**
 * Deposit API Routes
 * Endpoints for deposit tracking and history
 */

import { Hono } from 'hono';
import type { WorkerBindings } from '../app';

const deposits = new Hono<{ Bindings: WorkerBindings }>();

/**
 * GET /api/deposits
 * List all deposits for authenticated agent's customers
 */
deposits.get('/', async (c) => {
  try {
    const agentId = c.get('userId');
    
    if (!agentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const status = c.req.query('status');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    let query = `
      SELECT 
        d.*,
        c.name as customer_name,
        c.email as customer_email,
        COALESCE(SUM(comm.amount), 0) as your_commission
      FROM deposits d
      JOIN customers cust ON d.customer_id = cust.customer_id
      LEFT JOIN customers c ON d.customer_id = c.customer_id
      LEFT JOIN commissions comm ON d.deposit_id = comm.deposit_id 
        AND comm.agent_id = d.agent_id AND comm.level = 1
      WHERE d.agent_id = (SELECT id FROM users WHERE telegram_id = ?)
    `;

    const params: any[] = [agentId];

    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }

    query += ' GROUP BY d.deposit_id ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await c.env.DB
      .prepare(query)
      .bind(...params)
      .all();

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM deposits d
      WHERE d.agent_id = (SELECT id FROM users WHERE telegram_id = ?)
    `;
    const countParams: any[] = [agentId];

    if (status) {
      countQuery += ' AND d.status = ?';
      countParams.push(status);
    }

    const countResult = await c.env.DB
      .prepare(countQuery)
      .bind(...countParams)
      .first<{ total: number }>();

    return c.json({
      deposits: result.results || [],
      total: countResult?.total || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Get deposits error:', error);
    return c.json({ error: 'Failed to fetch deposits', details: error.message }, 500);
  }
});

/**
 * GET /api/deposits/stats
 * Get deposit statistics
 */
deposits.get('/stats', async (c) => {
  try {
    const agentId = c.get('userId');
    
    if (!agentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const stats = await c.env.DB
      .prepare(`
        SELECT 
          COUNT(*) as total_count,
          COALESCE(SUM(amount), 0) as total_volume,
          COALESCE(AVG(amount), 0) as average_deposit
        FROM deposits
        WHERE agent_id = (SELECT id FROM users WHERE telegram_id = ?)
      `)
      .bind(agentId)
      .first();

    // Get your earnings from these deposits
    const earnings = await c.env.DB
      .prepare(`
        SELECT COALESCE(SUM(amount), 0) as total_earnings
        FROM commissions
        WHERE agent_id = (SELECT id FROM users WHERE telegram_id = ?)
        AND level = 1
      `)
      .bind(agentId)
      .first<{ total_earnings: number }>();

    return c.json({
      stats: {
        ...stats,
        your_earnings: earnings?.total_earnings || 0,
      },
    });
  } catch (error: any) {
    console.error('Get deposit stats error:', error);
    return c.json({ error: 'Failed to fetch stats', details: error.message }, 500);
  }
});

/**
 * GET /api/deposits/:id
 * Get single deposit details
 */
deposits.get('/:id', async (c) => {
  try {
    const depositId = c.req.param('id');
    const agentId = c.get('userId');

    if (!agentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await c.env.DB
      .prepare(`
        SELECT 
          d.*,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone
        FROM deposits d
        LEFT JOIN customers c ON d.customer_id = c.customer_id
        WHERE d.deposit_id = ? 
        AND d.agent_id = (SELECT id FROM users WHERE telegram_id = ?)
      `)
      .bind(depositId, agentId)
      .first();

    if (!result) {
      return c.json({ error: 'Deposit not found' }, 404);
    }

    // Get associated commissions
    const commissions = await c.env.DB
      .prepare(`
        SELECT * FROM commissions
        WHERE deposit_id = ?
        ORDER BY level
      `)
      .bind(depositId)
      .all();

    return c.json({
      deposit: result,
      commissions: commissions.results || [],
    });
  } catch (error: any) {
    console.error('Get deposit error:', error);
    return c.json({ error: 'Failed to fetch deposit', details: error.message }, 500);
  }
});

export default deposits;
