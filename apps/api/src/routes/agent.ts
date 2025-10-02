import { Hono } from 'hono';
import { AgentTreeNodeSchema } from '@affiliate/schemas';
import { db } from '../utils/db';

const app = new Hono();

// GET /api/agent/tree
app.get('/tree', (c) => {
  const userId = c.get('userId');
  
  // Build tree recursively
  const tree = buildAgentTree(userId);
  
  return c.json(tree);
});

function buildAgentTree(userId: number, depth = 0, maxDepth = 5): any {
  if (depth >= maxDepth) return null;
  
  const user = db.query(`
    SELECT 
      user_id,
      first_name,
      username,
      level,
      total_customers,
      total_commission
    FROM users
    WHERE user_id = ?
  `).get(userId);
  
  if (!user) return null;
  
  // Get children
  const children = db.query(`
    SELECT user_id FROM users WHERE parent_agent_id = ?
  `).all(userId) as Array<{ user_id: number }>;
  
  return {
    ...user,
    children: children
      .map(child => buildAgentTree(child.user_id, depth + 1, maxDepth))
      .filter(Boolean),
  };
}

// GET /api/agent/downline
app.get('/downline', (c) => {
  const userId = c.get('userId');
  
  // Get direct children only
  const downline = db.query(`
    SELECT 
      user_id,
      first_name,
      username,
      level,
      total_customers,
      total_commission,
      created_at
    FROM users
    WHERE parent_agent_id = ?
    ORDER BY total_commission DESC
  `).all(userId);
  
  return c.json(downline);
});

export default app;

