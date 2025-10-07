/**
 * Agent Tree API Routes
 * Endpoints for network visualization
 */

import { Hono } from 'hono';
import type { WorkerBindings } from '../app';

const tree = new Hono<{ Bindings: WorkerBindings }>();

interface TreeNode {
  id: string;
  name: string;
  level: number;
  customers: number;
  earnings: number;
  active: boolean;
  children?: TreeNode[];
}

/**
 * GET /api/tree
 * Get agent network tree structure
 */
tree.get('/', async (c) => {
  try {
    const agentId = c.get('userId');
    
    if (!agentId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get root user
    const rootUser = await c.env.DB
      .prepare(`
        SELECT 
          u.id,
          u.telegram_id,
          u.username,
          u.first_name,
          u.last_name,
          u.is_agent,
          u.is_super_agent,
          COUNT(DISTINCT c.customer_id) as customers,
          COALESCE(SUM(comm.amount), 0) as earnings
        FROM users u
        LEFT JOIN customers c ON u.id = c.agent_id
        LEFT JOIN commissions comm ON u.id = comm.agent_id AND comm.level = 1
        WHERE u.telegram_id = ?
        GROUP BY u.id
      `)
      .bind(agentId)
      .first<any>();

    if (!rootUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Build tree recursively
    const buildTree = async (userId: string, currentLevel: number): Promise<TreeNode> => {
      const user = await c.env.DB
        .prepare(`
          SELECT 
            u.id,
            u.telegram_id,
            u.username,
            u.first_name,
            u.last_name,
            u.is_agent,
            COUNT(DISTINCT c.customer_id) as customers,
            COALESCE(SUM(comm.amount), 0) as earnings
          FROM users u
          LEFT JOIN customers c ON u.id = c.agent_id
          LEFT JOIN commissions comm ON u.id = comm.agent_id AND comm.level = 1
          WHERE u.id = ?
          GROUP BY u.id
        `)
        .bind(userId)
        .first<any>();

      if (!user) {
        throw new Error('User not found');
      }

      const node: TreeNode = {
        id: user.id,
        name: user.first_name + (user.last_name ? ` ${user.last_name}` : ''),
        level: currentLevel,
        customers: user.customers || 0,
        earnings: user.earnings || 0,
        active: user.is_agent,
      };

      // Get sub-agents (users referred by this user)
      if (currentLevel < 3) { // Limit depth to 3 levels
        const subAgents = await c.env.DB
          .prepare('SELECT id FROM users WHERE referred_by = ? AND is_agent = 1')
          .bind(userId)
          .all();

        if (subAgents.results && subAgents.results.length > 0) {
          node.children = [];
          for (const subAgent of subAgents.results as any[]) {
            const childNode = await buildTree(subAgent.id, currentLevel + 1);
            node.children.push(childNode);
          }
        }
      }

      return node;
    };

    const tree = await buildTree(rootUser.id, 0);

    // Calculate network stats
    const calculateStats = (node: TreeNode): any => {
      let totalNodes = 1;
      let maxDepth = node.level;
      let totalEarnings = node.earnings;

      if (node.children) {
        for (const child of node.children) {
          const childStats = calculateStats(child);
          totalNodes += childStats.totalNodes;
          maxDepth = Math.max(maxDepth, childStats.maxDepth);
          totalEarnings += childStats.totalEarnings;
        }
      }

      return { totalNodes, maxDepth, totalEarnings };
    };

    const stats = calculateStats(tree);

    return c.json({
      tree,
      stats: {
        total_nodes: stats.totalNodes,
        max_depth: stats.maxDepth + 1,
        network_earnings: stats.totalEarnings,
        direct_agents: tree.children?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('Get tree error:', error);
    return c.json({ error: 'Failed to fetch tree', details: error.message }, 500);
  }
});

export default tree;
