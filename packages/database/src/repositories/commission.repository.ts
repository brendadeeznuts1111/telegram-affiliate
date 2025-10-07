/**
 * Commission Repository
 * Consolidated data access layer for commissions
 * Works with both SQLite and D1
 */

import { BaseRepository } from './base.repository';
import type { IDatabaseAdapter } from '../interface';
import { NotFoundError, DatabaseError } from '@affiliate/errors';

export interface Commission {
  commission_id: number;
  agent_id: number;
  customer_id: number;
  amount: number;
  percentage: number;
  created_at: number;
  status: 'pending' | 'paid' | 'cancelled';
  event_type?: string;
  paid_at?: number | null;
}

export interface CommissionStats {
  total_pending: number;
  total_paid: number;
  count_pending: number;
  count_paid: number;
}

export class CommissionRepository extends BaseRepository {
  constructor(db: IDatabaseAdapter) {
    super(db);
  }

  /**
   * Get commission by ID
   */
  async getById(commissionId: number): Promise<Commission | null> {
    return this.findById<Commission>('commissions', 'commission_id', commissionId);
  }

  /**
   * Get commission by ID or throw
   */
  async getByIdOrThrow(commissionId: number): Promise<Commission> {
    const commission = await this.getById(commissionId);
    if (!commission) {
      throw new NotFoundError('Commission', commissionId);
    }
    return commission;
  }

  /**
   * Create new commission record
   */
  async create(agentId: number, customerId: number, amount: number, percentage: number): Promise<Commission> {
    try {
      await this.db.run(
        `INSERT INTO commissions (agent_id, customer_id, amount, percentage, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [agentId, customerId, amount, percentage]
      );

      const commissionId = await this.db.getLastInsertId();
      const commission = await this.getById(commissionId);
      
      if (!commission) {
        throw new DatabaseError('Failed to create commission');
      }

      return commission;
    } catch (error) {
      throw new DatabaseError('Failed to create commission', {
        agentId,
        customerId,
        amount,
        percentage,
        error: String(error)
      });
    }
  }

  /**
   * Get all commissions for an agent
   */
  async getByAgent(agentId: number): Promise<Commission[]> {
    return this.db.query<Commission>(
      'SELECT * FROM commissions WHERE agent_id = ? ORDER BY created_at DESC',
      [agentId]
    );
  }

  /**
   * Get pending commissions for an agent
   */
  async getPendingByAgent(agentId: number): Promise<Commission[]> {
    return this.db.query<Commission>(
      "SELECT * FROM commissions WHERE agent_id = ? AND status = 'pending' ORDER BY created_at DESC",
      [agentId]
    );
  }

  /**
   * Get paid commissions for an agent
   */
  async getPaidByAgent(agentId: number): Promise<Commission[]> {
    return this.db.query<Commission>(
      "SELECT * FROM commissions WHERE agent_id = ? AND status = 'paid' ORDER BY created_at DESC",
      [agentId]
    );
  }

  /**
   * Mark commissions as paid
   */
  async markAsPaid(agentId: number, count: number): Promise<number> {
    try {
      // Get commission IDs to mark as paid
      const commissions = await this.db.query<{ commission_id: number }>(
        `SELECT commission_id FROM commissions 
         WHERE agent_id = ? AND status = 'pending' 
         ORDER BY created_at ASC 
         LIMIT ?`,
        [agentId, count]
      );

      if (commissions.length === 0) {
        return 0;
      }

      const ids = commissions.map(c => c.commission_id);
      const placeholders = ids.map(() => '?').join(',');

      await this.db.run(
        `UPDATE commissions SET status = 'paid', paid_at = ? WHERE commission_id IN (${placeholders})`,
        [Math.floor(Date.now() / 1000), ...ids]
      );

      return commissions.length;
    } catch (error) {
      throw new DatabaseError('Failed to mark commissions as paid', {
        agentId,
        count,
        error: String(error)
      });
    }
  }

  /**
   * Update commission status
   */
  async updateStatus(commissionId: number, status: 'pending' | 'paid' | 'cancelled'): Promise<void> {
    const updates: Record<string, unknown> = { status };
    
    if (status === 'paid') {
      updates.paid_at = Math.floor(Date.now() / 1000);
    }
    
    await this.update('commissions', 'commission_id', commissionId, updates);
  }

  /**
   * Get commission statistics for an agent
   */
  async getStatsByAgent(agentId: number): Promise<CommissionStats> {
    const result = await this.db.queryOne<CommissionStats>(
      `SELECT 
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_paid,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as count_pending,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as count_paid
       FROM commissions
       WHERE agent_id = ?`,
      [agentId]
    );

    return result || { total_pending: 0, total_paid: 0, count_pending: 0, count_paid: 0 };
  }

  /**
   * Get overall commission statistics
   */
  async getOverallStats(): Promise<CommissionStats> {
    const result = await this.db.queryOne<CommissionStats>(
      `SELECT 
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_paid,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as count_pending,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as count_paid
       FROM commissions`
    );

    return result || { total_pending: 0, total_paid: 0, count_pending: 0, count_paid: 0 };
  }

  /**
   * Get total commission amount (paid only)
   */
  async getTotalPaid(): Promise<number> {
    const result = await this.db.queryOne<{ total: number | null }>(
      "SELECT SUM(amount) as total FROM commissions WHERE status = 'paid'"
    );
    return result?.total || 0;
  }

  /**
   * Get total pending commission amount
   */
  async getTotalPending(): Promise<number> {
    const result = await this.db.queryOne<{ total: number | null }>(
      "SELECT SUM(amount) as total FROM commissions WHERE status = 'pending'"
    );
    return result?.total || 0;
  }

  /**
   * Get total commission by agent (all statuses)
   */
  async getTotalByAgent(agentId: number): Promise<number> {
    const result = await this.db.queryOne<{ total: number | null }>(
      'SELECT SUM(amount) as total FROM commissions WHERE agent_id = ?',
      [agentId]
    );
    return result?.total || 0;
  }

  /**
   * Delete commission (admin only - use sparingly)
   */
  async deleteById(commissionId: number): Promise<void> {
    await this.delete('commissions', 'commission_id', commissionId);
  }

  /**
   * Get commissions for a customer
   */
  async getByCustomer(customerId: number): Promise<Commission[]> {
    return this.db.query<Commission>(
      'SELECT * FROM commissions WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId]
    );
  }

  /**
   * Get all commissions (admin)
   */
  async getAll(limit?: number): Promise<Commission[]> {
    return this.findAll<Commission>('commissions', 'created_at DESC', limit);
  }
}
