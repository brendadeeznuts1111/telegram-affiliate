/**
 * Deposit Repository
 * Data access layer for customer deposits
 */

import { db } from '@/core/database';
import type { Deposit } from '@/types/level';
import { logger } from '@/utils/logger';

export class DepositRepository {
  /**
   * Record a new deposit
   */
  create(agentId: number, customerId: number, amount: number, currency: string = 'USD'): Deposit {
    db.run(
      `INSERT INTO deposits (agent_id, customer_id, amount, currency)
       VALUES (?, ?, ?, ?)`,
      [agentId, customerId, amount, currency]
    );

    const depositId = db.getLastInsertId();
    const deposit = this.getById(depositId);

    if (!deposit) {
      throw new Error('Failed to create deposit');
    }

    logger.info(`Deposit recorded: ${depositId} - Agent ${agentId}, Amount: ${currency}${amount}`);
    return deposit;
  }

  /**
   * Get deposit by ID
   */
  getById(depositId: number): Deposit | null {
    return db.queryOne<Deposit>(
      'SELECT * FROM deposits WHERE deposit_id = ?',
      [depositId]
    );
  }

  /**
   * Get all deposits for an agent
   */
  getByAgent(agentId: number): Deposit[] {
    return db.query<Deposit>(
      'SELECT * FROM deposits WHERE agent_id = ? ORDER BY created_at DESC',
      [agentId]
    );
  }

  /**
   * Get all deposits for a customer
   */
  getByCustomer(customerId: number): Deposit[] {
    return db.query<Deposit>(
      'SELECT * FROM deposits WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId]
    );
  }

  /**
   * Get total deposits for an agent
   */
  getTotalByAgent(agentId: number): number {
    const result = db.queryOne<{ total: number | null }>(
      'SELECT SUM(amount) as total FROM deposits WHERE agent_id = ?',
      [agentId]
    );
    return result?.total || 0;
  }

  /**
   * Get deposit count for an agent
   */
  getCountByAgent(agentId: number): number {
    const result = db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM deposits WHERE agent_id = ?',
      [agentId]
    );
    return result?.count || 0;
  }

  /**
   * Check if customer has made first deposit
   */
  hasFirstDeposit(customerId: number): boolean {
    const result = db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM deposits WHERE customer_id = ?',
      [customerId]
    );
    return (result?.count || 0) > 0;
  }

  /**
   * Get recent deposits (last N days)
   */
  getRecent(days: number = 7): Deposit[] {
    const timestamp = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    return db.query<Deposit>(
      'SELECT * FROM deposits WHERE created_at >= ? ORDER BY created_at DESC',
      [timestamp]
    );
  }
}

// Export singleton
export const depositRepository = new DepositRepository();

