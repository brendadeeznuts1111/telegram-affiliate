/**
 * Level Service
 * Manages agent levels, progression, and tree hierarchy
 */

import { db } from '@/core/database';
import { LEVELS } from '@/core/levels.config';
import { logger } from '@/utils/logger';
import type { AgentLevel, AgentWithTree } from '@/types/level';

export class LevelService {
  /**
   * Recalculate and update agent level based on net deposits
   */
  recalcLevel(agentId: number): number {
    const user = db.queryOne<{ net_deposited: number; level: number }>(
      'SELECT net_deposited, level FROM users WHERE user_id = ?',
      [agentId]
    );

    if (!user) return 0;

    const deposited = user.net_deposited || 0;
    let newLevel = 0;

    // Find highest level achieved
    for (let i = LEVELS.thresholds.length - 1; i >= 0; i--) {
      if (deposited >= LEVELS.thresholds[i]) {
        newLevel = i;
        break;
      }
    }

    // Overage protection: never drop level
    if (LEVELS.overage && newLevel < user.level) {
      newLevel = user.level;
    }

    // Update level if changed
    if (newLevel !== user.level) {
      db.run('UPDATE users SET level = ? WHERE user_id = ?', [newLevel, agentId]);
      logger.info(`Agent ${agentId} leveled up to ${LEVELS.names[newLevel]} (Level ${newLevel})`);
    }

    return newLevel;
  }

  /**
   * Get agent level info
   */
  getAgentLevel(agentId: number): AgentLevel | null {
    const user = db.queryOne<{ level: number; net_deposited: number; net_customers: number }>(
      'SELECT level, net_deposited, net_customers FROM users WHERE user_id = ?',
      [agentId]
    );

    if (!user) return null;

    return {
      level: user.level,
      name: LEVELS.names[user.level] || 'Unknown',
      netDeposited: user.net_deposited,
      netCustomers: user.net_customers,
      boost: LEVELS.boosts[user.level] || 0,
    };
  }

  /**
   * Attach new agent to tree
   */
  attachToTree(newAgentId: number, parentId?: number): void {
    db.transaction(() => {
      // Insert self-loop (depth 0)
      db.run(
        'INSERT OR IGNORE INTO agent_tree (ancestor_id, descendant_id, depth) VALUES (?, ?, 0)',
        [newAgentId, newAgentId]
      );

      // If has parent, copy all ancestors
      if (parentId) {
        db.run(
          `INSERT OR IGNORE INTO agent_tree (ancestor_id, descendant_id, depth)
           SELECT ancestor_id, ?, depth + 1 
           FROM agent_tree 
           WHERE descendant_id = ?`,
          [newAgentId, parentId]
        );
      }
    });

    logger.info(`Agent ${newAgentId} attached to tree${parentId ? ` under ${parentId}` : ''}`);
  }

  /**
   * Get agent's downline tree
   */
  getAgentTree(agentId: number, maxDepth: number = 10): AgentWithTree[] {
    return db.query<AgentWithTree>(
      `SELECT 
        u.user_id,
        u.first_name,
        u.level,
        u.net_deposited,
        u.net_customers,
        t.depth
       FROM agent_tree t
       JOIN users u ON u.user_id = t.descendant_id
       WHERE t.ancestor_id = ? 
         AND t.depth <= ?
         AND u.is_agent = 1
       ORDER BY t.depth, u.user_id`,
      [agentId, maxDepth]
    );
  }

  /**
   * Get direct children (depth = 1)
   */
  getDirectDownline(agentId: number): AgentWithTree[] {
    return db.query<AgentWithTree>(
      `SELECT 
        u.user_id,
        u.first_name,
        u.level,
        u.net_deposited,
        u.net_customers,
        t.depth
       FROM agent_tree t
       JOIN users u ON u.user_id = t.descendant_id
       WHERE t.ancestor_id = ? 
         AND t.depth = 1
         AND u.is_agent = 1
       ORDER BY u.user_id`,
      [agentId]
    );
  }

  /**
   * Get tree statistics
   */
  getTreeStats(agentId: number): {
    totalAgents: number;
    totalDeposits: number;
    totalCustomers: number;
    maxDepth: number;
  } {
    const stats = db.queryOne<{
      total_agents: number;
      total_deposits: number;
      total_customers: number;
      max_depth: number;
    }>(
      `SELECT 
        COUNT(DISTINCT t.descendant_id) as total_agents,
        COALESCE(SUM(u.net_deposited), 0) as total_deposits,
        COALESCE(SUM(u.net_customers), 0) as total_customers,
        COALESCE(MAX(t.depth), 0) as max_depth
       FROM agent_tree t
       JOIN users u ON u.user_id = t.descendant_id
       WHERE t.ancestor_id = ?
         AND t.depth > 0`,
      [agentId]
    );

    return {
      totalAgents: stats?.total_agents || 0,
      totalDeposits: stats?.total_deposits || 0,
      totalCustomers: stats?.total_customers || 0,
      maxDepth: stats?.max_depth || 0,
    };
  }

  /**
   * Update net deposits for agent
   */
  updateNetDeposits(agentId: number, amount: number): void {
    db.run(
      'UPDATE users SET net_deposited = net_deposited + ? WHERE user_id = ?',
      [amount, agentId]
    );

    // Recalculate level
    this.recalcLevel(agentId);
  }

  /**
   * Update net customers for agent
   */
  updateNetCustomers(agentId: number, increment: number = 1): void {
    db.run(
      'UPDATE users SET net_customers = net_customers + ? WHERE user_id = ?',
      [increment, agentId]
    );
  }

  /**
   * Get leaderboard by level
   */
  getLeaderboard(limit: number = 10): AgentWithTree[] {
    return db.query<AgentWithTree>(
      `SELECT 
        user_id,
        first_name,
        level,
        net_deposited,
        net_customers,
        0 as depth
       FROM users
       WHERE is_agent = 1
       ORDER BY level DESC, net_deposited DESC
       LIMIT ?`,
      [limit]
    );
  }
}

// Export singleton
export const levelService = new LevelService();

