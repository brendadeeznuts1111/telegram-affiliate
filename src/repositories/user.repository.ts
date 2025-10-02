/**
 * User Repository - Data access layer for users/agents
 */

import { db } from '@/core/database';
import type { User, CreateUserInput, AgentStats } from '@/types/user';
import { logger } from '@/utils/logger';

export class UserRepository {
  /**
   * Get user by ID
   */
  getById(userId: number): User | null {
    return db.queryOne<User>(
      'SELECT * FROM users WHERE user_id = ?',
      [userId]
    );
  }

  /**
   * Create new user
   */
  create(input: CreateUserInput): User {
    db.run(
      `INSERT OR REPLACE INTO users (user_id, username, first_name, last_name)
       VALUES (?, ?, ?, ?)`,
      [input.user_id, input.username, input.first_name, input.last_name]
    );

    const user = this.getById(input.user_id);
    if (!user) {
      throw new Error('Failed to create user');
    }

    logger.info(`User created: ${input.user_id} (${input.first_name})`);
    return user;
  }

  /**
   * Make user an agent
   */
  makeAgent(userId: number, parentAgentId?: number): void {
    db.run(
      'UPDATE users SET is_agent = 1, parent_agent_id = ? WHERE user_id = ?',
      [parentAgentId || null, userId]
    );
    
    logger.info(`User ${userId} promoted to agent`);
  }

  /**
   * Make agent a super agent
   */
  makeSuperAgent(userId: number): void {
    db.run(
      'UPDATE users SET is_super_agent = 1, is_agent = 1 WHERE user_id = ?',
      [userId]
    );
    
    logger.info(`User ${userId} promoted to super agent`);
  }

  /**
   * Get agent statistics
   */
  getAgentStats(userId: number): AgentStats {
    // Get customer count
    const customerResult = db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM customers WHERE referred_by = ?',
      [userId]
    );
    const customers = customerResult?.count || 0;

    // Get total commission (paid only)
    const commissionResult = db.queryOne<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM commissions 
       WHERE agent_id = ? AND status = 'paid'`,
      [userId]
    );
    const commission = commissionResult?.total || 0;

    // Get sub-agents count
    const subAgentsResult = db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE parent_agent_id = ?',
      [userId]
    );
    const sub_agents = subAgentsResult?.count || 0;

    return {
      customers,
      commission,
      sub_agents,
    };
  }

  /**
   * Get all agents
   */
  getAllAgents(): User[] {
    return db.query<User>(
      'SELECT * FROM users WHERE is_agent = 1 ORDER BY created_at DESC'
    );
  }

  /**
   * Get top agents by customer count
   */
  getTopAgents(limit: number = 10): Array<User & { customer_count: number; commission_total: number }> {
    return db.query<User & { customer_count: number; commission_total: number }>(
      `SELECT 
        u.*,
        COUNT(DISTINCT c.customer_id) as customer_count,
        COALESCE(SUM(com.amount), 0) as commission_total
       FROM users u
       LEFT JOIN customers c ON u.user_id = c.referred_by
       LEFT JOIN commissions com ON u.user_id = com.agent_id AND com.status = 'paid'
       WHERE u.is_agent = 1
       GROUP BY u.user_id
       ORDER BY customer_count DESC, commission_total DESC
       LIMIT ?`,
      [limit]
    );
  }

  /**
   * Get sub-agents for a parent agent
   */
  getSubAgents(parentId: number): User[] {
    return db.query<User>(
      'SELECT * FROM users WHERE parent_agent_id = ? ORDER BY created_at DESC',
      [parentId]
    );
  }

  /**
   * Increment customer count for agent
   */
  incrementCustomerCount(userId: number): void {
    db.run(
      'UPDATE users SET total_customers = total_customers + 1 WHERE user_id = ?',
      [userId]
    );
  }

  /**
   * Update total commission for agent
   */
  updateTotalCommission(userId: number, amount: number): void {
    db.run(
      'UPDATE users SET total_commission = total_commission + ? WHERE user_id = ?',
      [amount, userId]
    );
  }

  /**
   * Get total user count
   */
  getTotalCount(): number {
    const result = db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM users'
    );
    return result?.count || 0;
  }

  /**
   * Get total agent count
   */
  getTotalAgentCount(): number {
    const result = db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE is_agent = 1'
    );
    return result?.count || 0;
  }

  /**
   * Check if user exists
   */
  exists(userId: number): boolean {
    const result = db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE user_id = ?',
      [userId]
    );
    return (result?.count || 0) > 0;
  }
}

// Export singleton instance
export const userRepository = new UserRepository();

