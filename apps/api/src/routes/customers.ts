/**
 * Customer API Routes
 * CRUD operations for customer management
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { WorkerBindings } from '../app';

const customers = new Hono<{ Bindings: WorkerBindings }>();

// Validation schemas
const createCustomerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  telegram_id: z.number().optional(),
});

const updateCustomerSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

/**
 * GET /api/customers
 * List all customers for authenticated agent
 */
customers.get('/', async (c) => {
  try {
    // Get agent ID from auth (telegram user ID)
    const agentId = c.get('userId'); // From telegram auth middleware
    
    if (!agentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get customers for this agent
    const result = await c.env.DB
      .prepare(`
        SELECT 
          c.*,
          COUNT(DISTINCT d.deposit_id) as deposits_count,
          COALESCE(SUM(d.amount), 0) as total_deposits,
          COALESCE(SUM(comm.amount), 0) as your_earnings
        FROM customers c
        LEFT JOIN deposits d ON c.customer_id = d.customer_id
        LEFT JOIN commissions comm ON d.deposit_id = comm.deposit_id AND comm.agent_id = c.agent_id
        WHERE c.agent_id = (SELECT id FROM users WHERE telegram_id = ?)
        GROUP BY c.customer_id
        ORDER BY c.created_at DESC
      `)
      .bind(agentId)
      .all();

    return c.json({
      customers: result.results || [],
      total: result.results?.length || 0,
    });
  } catch (error: any) {
    console.error('Get customers error:', error);
    return c.json({ error: 'Failed to fetch customers', details: error.message }, 500);
  }
});

/**
 * GET /api/customers/:id
 * Get single customer details
 */
customers.get('/:id', async (c) => {
  try {
    const customerId = c.req.param('id');
    const agentId = c.get('userId');

    if (!agentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await c.env.DB
      .prepare(`
        SELECT 
          c.*,
          COUNT(DISTINCT d.deposit_id) as deposits_count,
          COALESCE(SUM(d.amount), 0) as total_deposits,
          COALESCE(SUM(comm.amount), 0) as your_earnings
        FROM customers c
        LEFT JOIN deposits d ON c.customer_id = d.customer_id
        LEFT JOIN commissions comm ON d.deposit_id = comm.deposit_id AND comm.agent_id = c.agent_id
        WHERE c.customer_id = ? AND c.agent_id = (SELECT id FROM users WHERE telegram_id = ?)
        GROUP BY c.customer_id
      `)
      .bind(customerId, agentId)
      .first();

    if (!result) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    return c.json({ customer: result });
  } catch (error: any) {
    console.error('Get customer error:', error);
    return c.json({ error: 'Failed to fetch customer', details: error.message }, 500);
  }
});

/**
 * POST /api/customers
 * Create new customer
 */
customers.post('/', async (c) => {
  try {
    const agentId = c.get('userId');

    if (!agentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const validated = createCustomerSchema.parse(body);

    // Get internal user ID
    const userResult = await c.env.DB
      .prepare('SELECT id FROM users WHERE telegram_id = ?')
      .bind(agentId)
      .first<{ id: string }>();

    if (!userResult) {
      return c.json({ error: 'Agent not found' }, 404);
    }

    // Check for duplicate email/phone
    const duplicate = await c.env.DB
      .prepare(`
        SELECT customer_id FROM customers 
        WHERE agent_id = ? AND (email = ? OR phone = ?)
      `)
      .bind(userResult.id, validated.email, validated.phone)
      .first();

    if (duplicate) {
      return c.json({ error: 'Customer with this email or phone already exists' }, 409);
    }

    // Create customer
    const customerId = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);

    await c.env.DB
      .prepare(`
        INSERT INTO customers (
          customer_id, agent_id, name, email, phone, 
          telegram_id, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
      `)
      .bind(
        customerId,
        userResult.id,
        validated.name,
        validated.email,
        validated.phone,
        validated.telegram_id || null,
        now,
        now
      )
      .run();

    // Fetch and return created customer
    const customer = await c.env.DB
      .prepare('SELECT * FROM customers WHERE customer_id = ?')
      .bind(customerId)
      .first();

    return c.json({ customer }, 201);
  } catch (error: any) {
    console.error('Create customer error:', error);
    
    if (error.name === 'ZodError') {
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    }
    
    return c.json({ error: 'Failed to create customer', details: error.message }, 500);
  }
});

/**
 * PATCH /api/customers/:id
 * Update customer
 */
customers.patch('/:id', async (c) => {
  try {
    const customerId = c.req.param('id');
    const agentId = c.get('userId');

    if (!agentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const validated = updateCustomerSchema.parse(body);

    // Verify ownership
    const customer = await c.env.DB
      .prepare(`
        SELECT c.* FROM customers c
        JOIN users u ON c.agent_id = u.id
        WHERE c.customer_id = ? AND u.telegram_id = ?
      `)
      .bind(customerId, agentId)
      .first();

    if (!customer) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (validated.name) {
      updates.push('name = ?');
      values.push(validated.name);
    }
    if (validated.email) {
      updates.push('email = ?');
      values.push(validated.email);
    }
    if (validated.phone) {
      updates.push('phone = ?');
      values.push(validated.phone);
    }
    if (validated.status) {
      updates.push('status = ?');
      values.push(validated.status);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = ?');
    values.push(Math.floor(Date.now() / 1000));
    values.push(customerId);

    await c.env.DB
      .prepare(`UPDATE customers SET ${updates.join(', ')} WHERE customer_id = ?`)
      .bind(...values)
      .run();

    // Fetch and return updated customer
    const updated = await c.env.DB
      .prepare('SELECT * FROM customers WHERE customer_id = ?')
      .bind(customerId)
      .first();

    return c.json({ customer: updated });
  } catch (error: any) {
    console.error('Update customer error:', error);
    
    if (error.name === 'ZodError') {
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    }
    
    return c.json({ error: 'Failed to update customer', details: error.message }, 500);
  }
});

/**
 * DELETE /api/customers/:id
 * Delete customer (soft delete)
 */
customers.delete('/:id', async (c) => {
  try {
    const customerId = c.req.param('id');
    const agentId = c.get('userId');

    if (!agentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify ownership
    const customer = await c.env.DB
      .prepare(`
        SELECT c.* FROM customers c
        JOIN users u ON c.agent_id = u.id
        WHERE c.customer_id = ? AND u.telegram_id = ?
      `)
      .bind(customerId, agentId)
      .first();

    if (!customer) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    // Soft delete (set status to inactive)
    await c.env.DB
      .prepare(`
        UPDATE customers 
        SET status = 'inactive', updated_at = ?
        WHERE customer_id = ?
      `)
      .bind(Math.floor(Date.now() / 1000), customerId)
      .run();

    return c.json({ message: 'Customer deleted successfully' });
  } catch (error: any) {
    console.error('Delete customer error:', error);
    return c.json({ error: 'Failed to delete customer', details: error.message }, 500);
  }
});

export default customers;
