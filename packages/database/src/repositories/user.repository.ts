/**
 * User Repository
 * Consolidated data access layer for users/agents
 * Works with both SQLite and D1
 */

import { BaseRepository } from './base.repository';
import type { IDatabaseAdapter } from '../interface';
import { NotFoundError, DatabaseError } from '@affiliate/errors';

export interface User {
  user_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  is_agent: boolean;
  is_super_agent: boolean;
  parent_agent_id: number | null;
  created_at: number;
  total_commission: number;
  total_customers: number;
  level?: number;
  net_deposited?: number;
}

export interface CreateUserInput {
  user_id: number;
  username?: string | null;
  first_name: string;
  last_name?: string | null;
}

export interface AgentStats {
  customers: number;
  commission: number;
  sub_agents: number;
  net_deposited?: number;
  level?: number;
}

export class UserRepository extends BaseRepository {
  constructor(db: IDatabaseAdapter) {
    super(db);
  }

  /**
   * Get user by ID
   */
  async getById(userId: number): Promise<User | null> {
    return this.findById<User>('users', 'user_id', userId);
  }

  /**
   * Get user by ID or throw
   */
  async getByIdOrThrow(userId: number): Promise<User> {
    const user = await this.getById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    return user;
  }

  /**
   * Create new user
   */
  async create(input: CreateUserInput): Promise<User> {
    try {
      await this.db.run(
        `INSERT OR REPLACE INTO users (user_id, username, first_name, last_name)
         VALUES (?, ?, ?, ?)`,
        [input.user_id, input.username || null, input.first_name, input.last_name || null]
      );

      const user = await this.getById(input.user_id);
      if (!user) {
        throw new DatabaseError('Failed to create user');
      }

      return user;
    } catch (error) {
      throw new DatabaseError('Failed to create user', {
        input,
        error: String(error)
      });
    }
  }

  /**
   * Make user an agent
   */
  async makeAgent(userId: number, parentAgentId?: number): Promise<void> {
    await this.db.run(
      'UPDATE users SET is_agent = 1, parent_agent_id = ? WHERE user_id = ?',
      [parentAgentId || null, userId]
    );
  }

  /**
   * Make agent a super agent
   */
  async makeSuperAgent(userId: number): Promise<void> {
    await this.db.run(
      'UPDATE users SET is_super_agent = 1, is_agent = 1 WHERE user_id = ?',
      [userId]
    );
  }

  /**
   * Get agent statistics
   */
  async getAgentStats(userId: number): Promise<AgentStats> {
    // Get customer count
    const customerResult = await this.db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM customers WHERE referred_by = ?',
      [userId]
    );
    const customers = customerResult?.count || 0;

    // Get total commission (paid only)
    const commissionResult = await this.db.queryOne<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM commissions 
       WHERE agent_id = ? AND status = 'paid'`,
      [userId]
    );
    const commission = commissionResult?.total || 0;

    // Get sub-agents count
    const subAgentsResult = await this.db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE parent_agent_id = ?',
      [userId]
    );
    const sub_agents = subAgentsResult?.count || 0;

    // Get user for level and net_deposited
    const user = await this.getById(userId);

    return {
      customers,
      commission,
      sub_agents,
      level: user?.level,
      net_deposited: user?.net_deposited,
    };
  }

  /**
   * Get all agents
   */
  async getAllAgents(): Promise<User[]> {
    return this.db.query<User>(
      'SELECT * FROM users WHERE is_agent = 1 ORDER BY created_at DESC'
    );
  }

  /**
   * Get top agents by customer count
   */
  async getTopAgents(limit: number = 10): Promise<Array<User & { customer_count: number; commission_total: number }>> {
    return this.db.query<User & { customer_count: number; commission_total: number }>(
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
  async getSubAgents(parentId: number): Promise<User[]> {
    return this.db.query<User>(
      'SELECT * FROM users WHERE parent_agent_id = ? ORDER BY created_at DESC',
      [parentId]
    );
  }

  /**
   * Increment customer count for agent
   */
  async incrementCustomerCount(userId: number): Promise<void> {
    await this.db.run(
      'UPDATE users SET total_customers = total_customers + 1 WHERE user_id = ?',
      [userId]
    );
  }

  /**
   * Update total commission for agent
   */
  async updateTotalCommission(userId: number, amount: number): Promise<void> {
    await this.db.run(
      'UPDATE users SET total_commission = total_commission + ? WHERE user_id = ?',
      [amount, userId]
    );
  }

  /**
   * Get total user count
   */
  async getTotalCount(): Promise<number> {
    return this.count('users');
  }

  /**
   * Get total agent count
   */
  async getTotalAgentCount(): Promise<number> {
    return this.count('users', 'is_agent = 1');
  }

  /**
   * Check if user exists
   */
  async exists(userId: number): Promise<boolean> {
    return this.exists('users', 'user_id = ?', [userId]);
  }

  /**
   * Update user level
   */
  async updateLevel(userId: number, level: number): Promise<void> {
    await this.db.run(
      'UPDATE users SET level = ? WHERE user_id = ?',
      [level, userId]
    );
  }

  /**
   * Update net deposited amount
   */
  async updateNetDeposited(userId: number, amount: number): Promise<void> {
    await this.db.run(
      'UPDATE users SET net_deposited = net_deposited + ? WHERE user_id = ?',
      [amount, userId]
    );
  }

  /**
   * Get user by Telegram ID (alias for getById)
   */
  async getByTelegramId(telegramId: number): Promise<User | null> {
    return this.getById(telegramId);
  }
}

// Type guard to check if user is an agent
export function isAgent(user: User | null): user is User & { is_agent: true } {
  return user ? Boolean(user.is_agent) : false;
}

// Type guard to check if user is a super agent
export function isSuperAgent(user: User | null): user is User & { is_super_agent: true } {
  return user ? Boolean(user.is_super_agent) : false;
}
