/**
 * Commission Repository - Data access layer for commissions
 */

import { db } from '@/core/database';
import type { Commission, CommissionStats } from '@/types/commission';
import { logger } from '@/utils/logger';

export class CommissionRepository {
  /**
   * Get commission by ID
   */
  getById(commissionId: number): Commission | null {
    return db.queryOne<Commission>(
      'SELECT * FROM commissions WHERE commission_id = ?',
      [commissionId]
    );
  }

  /**
   * Create new commission record
   */
  create(agentId: number, customerId: number, amount: number, percentage: number): Commission {
    db.run(
      `INSERT INTO commissions (agent_id, customer_id, amount, percentage, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [agentId, customerId, amount, percentage]
    );

    const commissionId = db.getLastInsertId();
    const commission = this.getById(commissionId);
    
    if (!commission) {
      throw new Error('Failed to create commission');
    }

    logger.info(`Commission created: ${commissionId} for agent ${agentId}, amount: ${amount}`);
    return commission;
  }

  /**
   * Get all commissions for an agent
   */
  getByAgent(agentId: number): Commission[] {
    return db.query<Commission>(
      'SELECT * FROM commissions WHERE agent_id = ? ORDER BY created_at DESC',
      [agentId]
    );
  }

  /**
   * Get pending commissions for an agent
   */
  getPendingByAgent(agentId: number): Commission[] {
    return db.query<Commission>(
      "SELECT * FROM commissions WHERE agent_id = ? AND status = 'pending' ORDER BY created_at DESC",
      [agentId]
    );
  }

  /**
   * Get paid commissions for an agent
   */
  getPaidByAgent(agentId: number): Commission[] {
    return db.query<Commission>(
      "SELECT * FROM commissions WHERE agent_id = ? AND status = 'paid' ORDER BY created_at DESC",
      [agentId]
    );
  }

  /**
   * Mark commissions as paid
   */
  markAsPaid(agentId: number, count: number): number {
    const stmt = db.prepare(
      `UPDATE commissions 
       SET status = 'paid' 
       WHERE commission_id IN (
         SELECT commission_id 
         FROM commissions 
         WHERE agent_id = ? AND status = 'pending' 
         ORDER BY created_at ASC 
         LIMIT ?
       )`
    );

    const result = stmt.run([agentId, count]);
    const updated = result.changes || 0;

    logger.info(`Marked ${updated} commissions as paid for agent ${agentId}`);
    return updated;
  }

  /**
   * Update commission status
   */
  updateStatus(commissionId: number, status: 'pending' | 'paid' | 'cancelled'): void {
    db.run(
      'UPDATE commissions SET status = ? WHERE commission_id = ?',
      [status, commissionId]
    );

    logger.info(`Commission ${commissionId} status updated to ${status}`);
  }

  /**
   * Get commission statistics for an agent
   */
  getStatsByAgent(agentId: number): CommissionStats {
    const result = db.queryOne<CommissionStats>(
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
  getOverallStats(): CommissionStats {
    const result = db.queryOne<CommissionStats>(
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
  getTotalPaid(): number {
    const result = db.queryOne<{ total: number | null }>(
      "SELECT SUM(amount) as total FROM commissions WHERE status = 'paid'"
    );
    return result?.total || 0;
  }

  /**
   * Get total pending commission amount
   */
  getTotalPending(): number {
    const result = db.queryOne<{ total: number | null }>(
      "SELECT SUM(amount) as total FROM commissions WHERE status = 'pending'"
    );
    return result?.total || 0;
  }

  /**
   * Delete commission (admin only - use sparingly)
   */
  delete(commissionId: number): void {
    db.run('DELETE FROM commissions WHERE commission_id = ?', [commissionId]);
    logger.warn(`Commission ${commissionId} deleted`);
  }

  /**
   * Get commissions for a customer
   */
  getByCustomer(customerId: number): Commission[] {
    return db.query<Commission>(
      'SELECT * FROM commissions WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId]
    );
  }
}

// Export singleton instance
export const commissionRepository = new CommissionRepository();

