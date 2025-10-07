/**
 * Deposit Repository
 * Consolidated data access layer for customer deposits
 * Works with both SQLite and D1
 */

import { BaseRepository } from './base.repository';
import type { IDatabaseAdapter } from '../interface';
import { NotFoundError, DatabaseError } from '@affiliate/errors';

export interface Deposit {
  deposit_id: number;
  agent_id: number;
  customer_id: number;
  amount: number;
  currency: string;
  created_at: number;
}

export class DepositRepository extends BaseRepository {
  constructor(db: IDatabaseAdapter) {
    super(db);
  }

  /**
   * Get deposit by ID
   */
  async getById(depositId: number): Promise<Deposit | null> {
    return this.findById<Deposit>('deposits', 'deposit_id', depositId);
  }

  /**
   * Get deposit by ID or throw
   */
  async getByIdOrThrow(depositId: number): Promise<Deposit> {
    const deposit = await this.getById(depositId);
    if (!deposit) {
      throw new NotFoundError('Deposit', depositId);
    }
    return deposit;
  }

  /**
   * Record a new deposit
   */
  async create(agentId: number, customerId: number, amount: number, currency: string = 'USD'): Promise<Deposit> {
    try {
      await this.db.run(
        `INSERT INTO deposits (agent_id, customer_id, amount, currency)
         VALUES (?, ?, ?, ?)`,
        [agentId, customerId, amount, currency]
      );

      const depositId = await this.db.getLastInsertId();
      const deposit = await this.getById(depositId);

      if (!deposit) {
        throw new DatabaseError('Failed to create deposit');
      }

      return deposit;
    } catch (error) {
      throw new DatabaseError('Failed to create deposit', {
        agentId,
        customerId,
        amount,
        currency,
        error: String(error)
      });
    }
  }

  /**
   * Get all deposits for an agent
   */
  async getByAgent(agentId: number): Promise<Deposit[]> {
    return this.db.query<Deposit>(
      'SELECT * FROM deposits WHERE agent_id = ? ORDER BY created_at DESC',
      [agentId]
    );
  }

  /**
   * Get all deposits for a customer
   */
  async getByCustomer(customerId: number): Promise<Deposit[]> {
    return this.db.query<Deposit>(
      'SELECT * FROM deposits WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId]
    );
  }

  /**
   * Get total deposits for an agent
   */
  async getTotalByAgent(agentId: number): Promise<number> {
    const result = await this.db.queryOne<{ total: number | null }>(
      'SELECT SUM(amount) as total FROM deposits WHERE agent_id = ?',
      [agentId]
    );
    return result?.total || 0;
  }

  /**
   * Get deposit count for an agent
   */
  async getCountByAgent(agentId: number): Promise<number> {
    return this.count('deposits', 'agent_id = ?', [agentId]);
  }

  /**
   * Check if customer has made first deposit
   */
  async hasFirstDeposit(customerId: number): Promise<boolean> {
    return this.exists('deposits', 'customer_id = ?', [customerId]);
  }

  /**
   * Get recent deposits (last N days)
   */
  async getRecent(days: number = 7): Promise<Deposit[]> {
    const timestamp = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    return this.db.query<Deposit>(
      'SELECT * FROM deposits WHERE created_at >= ? ORDER BY created_at DESC',
      [timestamp]
    );
  }

  /**
   * Get total deposits (all agents)
   */
  async getTotalAll(): Promise<number> {
    const result = await this.db.queryOne<{ total: number | null }>(
      'SELECT SUM(amount) as total FROM deposits'
    );
    return result?.total || 0;
  }

  /**
   * Get deposit count (all agents)
   */
  async getTotalCount(): Promise<number> {
    return this.count('deposits');
  }
}
