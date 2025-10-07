/**
 * Commission API Routes
 * Endpoints for tracking earnings and commissions
 */

import { Hono } from 'hono';
import type { WorkerBindings } from '../app';

const commissions = new Hono<{ Bindings: WorkerBindings }>();

/**
 * GET /api/commissions
 * List all commissions for authenticated agent
 * Query params: status, level, limit, offset
 */
commissions.get('/', async (c) => {
  try {
    const agentId = c.get('userId');
    
    if (!agentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Query parameters
    const status = c.req.query('status'); // 'pending' | 'paid' | undefined
    const level = c.req.query('level'); // '1' | '2' | '3' | undefined
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    // Build query
    let query = `
      SELECT 
        comm.*,
        d.amount as deposit_amount,
        d.currency as deposit_currency,
        c.name as customer_name
      FROM commissions comm
      LEFT JOIN deposits d ON comm.deposit_id = d.deposit_id
      LEFT JOIN customers c ON d.customer_id = c.customer_id
      WHERE comm.agent_id = (SELECT id FROM users WHERE telegram_id = ?)
    `;

    const params: any[] = [agentId];

    if (status) {
      query += ' AND comm.status = ?';
      params.push(status);
    }

    if (level) {
      query += ' AND comm.level = ?';
      params.push(parseInt(level));
    }

    query += ' ORDER BY comm.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await c.env.DB
      .prepare(query)
      .bind(...params)
      .all();

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM commissions comm
      WHERE comm.agent_id = (SELECT id FROM users WHERE telegram_id = ?)
    `;
    const countParams: any[] = [agentId];

    if (status) {
      countQuery += ' AND comm.status = ?';
      countParams.push(status);
    }

    if (level) {
      countQuery += ' AND comm.level = ?';
      countParams.push(parseInt(level));
    }

    const countResult = await c.env.DB
      .prepare(countQuery)
      .bind(...countParams)
      .first<{ total: number }>();

    return c.json({
      commissions: result.results || [],
      total: countResult?.total || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Get commissions error:', error);
    return c.json({ error: 'Failed to fetch commissions', details: error.message }, 500);
  }
});

/**
 * GET /api/commissions/stats
 * Get commission statistics
 */
commissions.get('/stats', async (c) => {
  try {
    const agentId = c.get('userId');
    
    if (!agentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get overall stats
    const stats = await c.env.DB
      .prepare(`
        SELECT 
          COUNT(*) as total_count,
          COALESCE(SUM(amount), 0) as total_earned,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid_out,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count
        FROM commissions
        WHERE agent_id = (SELECT id FROM users WHERE telegram_id = ?)
      `)
      .bind(agentId)
      .first();

    // Get this month stats
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartTimestamp = Math.floor(monthStart.getTime() / 1000);

    const thisMonth = await c.env.DB
      .prepare(`
        SELECT COALESCE(SUM(amount), 0) as month_total
        FROM commissions
        WHERE agent_id = (SELECT id FROM users WHERE telegram_id = ?)
        AND created_at >= ?
      `)
      .bind(agentId, monthStartTimestamp)
      .first<{ month_total: number }>();

    // Get by level
    const byLevel = await c.env.DB
      .prepare(`
        SELECT 
          level,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as total
        FROM commissions
        WHERE agent_id = (SELECT id FROM users WHERE telegram_id = ?)
        GROUP BY level
        ORDER BY level
      `)
      .bind(agentId)
      .all();

    return c.json({
      stats: {
        ...stats,
        this_month: thisMonth?.month_total || 0,
      },
      by_level: byLevel.results || [],
    });
  } catch (error: any) {
    console.error('Get commission stats error:', error);
    return c.json({ error: 'Failed to fetch stats', details: error.message }, 500);
  }
});

/**
 * GET /api/commissions/:id
 * Get single commission details
 */
commissions.get('/:id', async (c) => {
  try {
    const commissionId = c.req.param('id');
    const agentId = c.get('userId');

    if (!agentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await c.env.DB
      .prepare(`
        SELECT 
          comm.*,
          d.amount as deposit_amount,
          d.currency as deposit_currency,
          d.payment_method,
          c.name as customer_name,
          c.email as customer_email
        FROM commissions comm
        LEFT JOIN deposits d ON comm.deposit_id = d.deposit_id
        LEFT JOIN customers c ON d.customer_id = c.customer_id
        WHERE comm.commission_id = ? 
        AND comm.agent_id = (SELECT id FROM users WHERE telegram_id = ?)
      `)
      .bind(commissionId, agentId)
      .first();

    if (!result) {
      return c.json({ error: 'Commission not found' }, 404);
    }

    return c.json({ commission: result });
  } catch (error: any) {
    console.error('Get commission error:', error);
    return c.json({ error: 'Failed to fetch commission', details: error.message }, 500);
  }
});

/**
 * GET /api/commissions/export
 * Export commissions as CSV
 */
commissions.get('/export', async (c) => {
  try {
    const agentId = c.get('userId');
    
    if (!agentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await c.env.DB
      .prepare(`
        SELECT 
          comm.commission_id,
          comm.amount,
          comm.rate,
          comm.level,
          comm.status,
          comm.currency,
          comm.created_at,
          comm.description,
          d.amount as deposit_amount,
          c.name as customer_name
        FROM commissions comm
        LEFT JOIN deposits d ON comm.deposit_id = d.deposit_id
        LEFT JOIN customers c ON d.customer_id = c.customer_id
        WHERE comm.agent_id = (SELECT id FROM users WHERE telegram_id = ?)
        ORDER BY comm.created_at DESC
      `)
      .bind(agentId)
      .all();

    // Convert to CSV
    const rows = result.results || [];
    if (rows.length === 0) {
      return c.text('No data to export', 404);
    }

    const headers = [
      'Commission ID',
      'Amount',
      'Rate',
      'Level',
      'Status',
      'Currency',
      'Date',
      'Description',
      'Deposit Amount',
      'Customer',
    ];

    let csv = headers.join(',') + '\n';
    
    rows.forEach((row: any) => {
      const values = [
        row.commission_id,
        row.amount,
        row.rate,
        row.level,
        row.status,
        row.currency,
        new Date(row.created_at * 1000).toISOString(),
        `"${(row.description || '').replace(/"/g, '""')}"`,
        row.deposit_amount || '',
        `"${(row.customer_name || '').replace(/"/g, '""')}"`,
      ];
      csv += values.join(',') + '\n';
    });

    return c.text(csv, 200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="commissions-${Date.now()}.csv"`,
    });
  } catch (error: any) {
    console.error('Export commissions error:', error);
    return c.json({ error: 'Failed to export commissions', details: error.message }, 500);
  }
});

export default commissions;
