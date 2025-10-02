/**
 * User Repository (D1 Version)
 * Database operations for users using Cloudflare D1
 */

export interface User {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  parent_agent_id: number | null;
  is_super_agent: boolean;
  total_customers: number;
  net_deposited: number;
  created_at: string;
}

export interface CreateUserInput {
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  parent_agent_id?: number;
}

export class UserRepositoryD1 {
  constructor(private db: D1Database) {}

  /**
   * Get user by Telegram ID
   */
  async getByTelegramId(telegramId: number): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE telegram_id = ?')
      .bind(telegramId)
      .first<User>();
    
    return result || null;
  }

  /**
   * Get user by internal ID
   */
  async getById(id: number): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first<User>();
    
    return result || null;
  }

  /**
   * Create new user
   */
  async create(input: CreateUserInput): Promise<User> {
    const result = await this.db
      .prepare(`
        INSERT INTO users (telegram_id, username, first_name, last_name, parent_agent_id)
        VALUES (?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(
        input.telegram_id,
        input.username || null,
        input.first_name,
        input.last_name || null,
        input.parent_agent_id || null
      )
      .first<User>();

    if (!result) {
      throw new Error('Failed to create user');
    }

    return result;
  }

  /**
   * Update user
   */
  async update(telegramId: number, updates: Partial<User>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.username !== undefined) {
      fields.push('username = ?');
      values.push(updates.username);
    }
    if (updates.first_name !== undefined) {
      fields.push('first_name = ?');
      values.push(updates.first_name);
    }
    if (updates.last_name !== undefined) {
      fields.push('last_name = ?');
      values.push(updates.last_name);
    }
    if (updates.is_super_agent !== undefined) {
      fields.push('is_super_agent = ?');
      values.push(updates.is_super_agent ? 1 : 0);
    }

    if (fields.length === 0) return;

    values.push(telegramId);

    await this.db
      .prepare(`UPDATE users SET ${fields.join(', ')} WHERE telegram_id = ?`)
      .bind(...values)
      .run();
  }

  /**
   * Get agent stats
   */
  async getAgentStats(telegramId: number): Promise<{
    customers: number;
    commission: number;
    sub_agents: number;
  }> {
    // Get user ID first
    const user = await this.getByTelegramId(telegramId);
    if (!user) {
      return { customers: 0, commission: 0, sub_agents: 0 };
    }

    // Get customers count
    const customersResult = await this.db
      .prepare('SELECT COUNT(*) as count FROM customers WHERE agent_id = ?')
      .bind(user.id)
      .first<{ count: number }>();

    // Get total commission
    const commissionResult = await this.db
      .prepare('SELECT COALESCE(SUM(amount), 0) as total FROM commissions WHERE agent_id = ? AND is_paid = 1')
      .bind(user.id)
      .first<{ total: number }>();

    // Get sub-agents count
    const subAgentsResult = await this.db
      .prepare('SELECT COUNT(*) as count FROM users WHERE parent_agent_id = ?')
      .bind(user.id)
      .first<{ count: number }>();

    return {
      customers: customersResult?.count || 0,
      commission: commissionResult?.total || 0,
      sub_agents: subAgentsResult?.count || 0,
    };
  }

  /**
   * Check if user is an agent
   */
  async isAgent(telegramId: number): Promise<boolean> {
    const result = await this.db
      .prepare('SELECT COUNT(*) as count FROM agents a JOIN users u ON a.user_id = u.id WHERE u.telegram_id = ?')
      .bind(telegramId)
      .first<{ count: number }>();

    return (result?.count || 0) > 0;
  }

  /**
   * Make user an agent
   */
  async makeAgent(telegramId: number): Promise<void> {
    const user = await this.getByTelegramId(telegramId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if already an agent
    const isAgent = await this.isAgent(telegramId);
    if (isAgent) {
      return; // Already an agent
    }

    // Create agent record
    await this.db
      .prepare(`
        INSERT INTO agents (user_id, level, total_commission, total_customers, active_customers)
        VALUES (?, 'agent', 0, 0, 0)
      `)
      .bind(user.id)
      .run();
  }

  /**
   * Get all users (for admin)
   */
  async getAll(limit: number = 100): Promise<User[]> {
    const result = await this.db
      .prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ?')
      .bind(limit)
      .all<User>();

    return result.results || [];
  }
}

