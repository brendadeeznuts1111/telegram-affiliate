import { Hono } from 'hono';
import { AgentTreeNodeSchema } from '@affiliate/schemas';
import type { UserRepository } from '@affiliate/database';

const app = new Hono();

// GET /api/agent/tree
app.get('/tree', async (c) => {
  const userId = c.get('userId') as number;
  const userRepository = c.get('userRepository') as UserRepository;
  
  // Build tree recursively
  const tree = await buildAgentTree(userRepository, userId);
  
  return c.json(tree);
});

async function buildAgentTree(
  userRepository: UserRepository,
  userId: number,
  depth = 0,
  maxDepth = 5
): Promise<any> {
  if (depth >= maxDepth) return null;
  
  const user = await userRepository.getById(userId);
  
  if (!user) return null;
  
  // Get children
  const children = await userRepository.getSubAgents(userId);
  
  const childTrees = await Promise.all(
    children.map(child => buildAgentTree(userRepository, child.user_id, depth + 1, maxDepth))
  );
  
  return {
    user_id: user.user_id,
    first_name: user.first_name,
    username: user.username,
    level: user.level || 0,
    total_customers: user.total_customers || 0,
    total_commission: user.total_commission || 0,
    children: childTrees.filter(Boolean),
  };
}

// GET /api/agent/downline
app.get('/downline', async (c) => {
  const userId = c.get('userId') as number;
  const userRepository = c.get('userRepository') as UserRepository;
  
  // Get direct children only
  const downline = await userRepository.getSubAgents(userId);
  
  return c.json(downline);
});

export default app;

