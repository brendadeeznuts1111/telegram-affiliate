import { Hono } from 'hono';
import { UserSchema, AgentStatsSchema } from '@affiliate/schemas';
import { db } from '../utils/db';

const app = new Hono();

// GET /api/user/me
app.get('/me', (c) => {
  const userId = c.get('userId');
  
  const user = db.query('SELECT * FROM users WHERE user_id = ?').get(userId);
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  // Convert SQLite booleans (0/1) to JS booleans
  const userWithBools = {
    ...user,
    is_agent: Boolean(user.is_agent),
    is_super_agent: Boolean(user.is_super_agent),
  };
  
  // Validate with Zod
  const validated = UserSchema.parse(userWithBools);
  
  return c.json(validated);
});

// GET /api/user/stats
app.get('/stats', (c) => {
  const userId = c.get('userId');
  
  const stats = db.query(`
    SELECT 
      COUNT(DISTINCT c.customer_id) as customers,
      COALESCE(SUM(com.amount), 0) as commission,
      (SELECT COUNT(*) FROM users WHERE parent_agent_id = ?) as sub_agents,
      COALESCE(u.net_deposited, 0) as net_deposited,
      COALESCE(u.level, 0) as level
    FROM users u
    LEFT JOIN customers c ON c.referred_by = u.user_id
    LEFT JOIN commissions com ON com.agent_id = u.user_id
    WHERE u.user_id = ?
    GROUP BY u.user_id
  `).get(userId, userId);
  
  if (!stats) {
    return c.json({
      customers: 0,
      commission: 0,
      sub_agents: 0,
      net_deposited: 0,
      level: 0,
    });
  }
  
  const validated = AgentStatsSchema.parse(stats);
  return c.json(validated);
});

export default app;

