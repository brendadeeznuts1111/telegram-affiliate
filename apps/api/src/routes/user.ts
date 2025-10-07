import { Hono } from 'hono';
import { UserSchema, AgentStatsSchema } from '@affiliate/schemas';
import type { UserRepository } from '@affiliate/database';

const app = new Hono();

// GET /api/user/me
app.get('/me', async (c) => {
  const userId = c.get('userId') as number;
  const userRepository = c.get('userRepository') as UserRepository;
  
  const user = await userRepository.getById(userId);
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  // Validate with Zod
  const validated = UserSchema.parse(user);
  
  return c.json(validated);
});

// GET /api/user/stats
app.get('/stats', async (c) => {
  const userId = c.get('userId') as number;
  const userRepository = c.get('userRepository') as UserRepository;
  
  const stats = await userRepository.getAgentStats(userId);
  
  const validated = AgentStatsSchema.parse(stats);
  return c.json(validated);
});

export default app;

