/**
 * Commission Service
 * Event-driven commissions with level-based boosts
 * Consolidated service for all commission operations
 */

import { db } from '@/core/database';
import { config } from '@/core/config';
import { LEVELS, EVENT_COMMISSIONS, type CommissionEvent } from '@/core/levels.config';
import { commissionRepository } from '@/repositories/commission.repository';
import { depositRepository } from '@/repositories/deposit.repository';
import { levelService } from './level.service';
import { userRepository } from '@/repositories/user.repository';
import { logger } from '@/utils/logger';

export class EnhancedCommissionService {
  /**
   * Process commission for an event
   */
  async processEvent(
    event: CommissionEvent,
    agentId: number,
    customerId: number,
    amount: number
  ): Promise<void> {
    logger.info(`Processing ${event} event: Agent ${agentId}, Customer ${customerId}, Amount: ${amount}`);

    const eventPlan = EVENT_COMMISSIONS[event];
    if (!eventPlan) {
      logger.warn(`Unknown event type: ${event}`);
      return;
    }

    // Get agent level for boost calculation
    const agentLevel = levelService.getAgentLevel(agentId);
    const levelBoost = agentLevel?.boost || 0;

    // Calculate commission
    let commissionAmount = eventPlan.fixed;
    if (eventPlan.percent > 0) {
      const totalPercent = eventPlan.percent + levelBoost;
      commissionAmount += (amount * totalPercent) / 100;
    }

    // Use transaction for atomicity
    db.transaction(() => {
      // 1. Record commission for direct agent
      commissionRepository.create(
        agentId,
        customerId,
        commissionAmount,
        eventPlan.percent + levelBoost
      );

      // Update commission event type
      db.run(
        `UPDATE commissions 
         SET event_type = ? 
         WHERE commission_id = last_insert_rowid()`,
        [event]
      );

      // 2. Update agent stats based on event
      if (event === 'deposit' || event === 'first_deposit') {
        levelService.updateNetDeposits(agentId, amount);
        
        // Record deposit
        depositRepository.create(agentId, customerId, amount);
      }

      if (event === 'new_user') {
        levelService.updateNetCustomers(agentId, 1);
      }

      // 3. Bubble commission to parent (super-agent)
      const agent = userRepository.getById(agentId);
      if (agent?.parent_agent_id) {
        const parentLevel = levelService.getAgentLevel(agent.parent_agent_id);
        const parentBoost = parentLevel?.boost || 0;
        
        // Parent gets 50% of child's commission + their own boost
        const parentCommission = (commissionAmount * 0.5) + (amount * parentBoost / 100);

        commissionRepository.create(
          agent.parent_agent_id,
          customerId,
          parentCommission,
          parentBoost
        );

        // Update parent commission event type
        db.run(
          `UPDATE commissions 
           SET event_type = ? 
           WHERE commission_id = last_insert_rowid()`,
          [`${event}_super`]
        );

        logger.info(`Parent commission: Agent ${agent.parent_agent_id}, Amount: ${parentCommission}`);
      }
    });

    logger.info(`Event processed: ${event}, Commission: ${config.commission.currency}${commissionAmount.toFixed(2)}`);
  }

  /**
   * Record customer deposit (shorthand)
   */
  async recordDeposit(agentId: number, customerId: number, amount: number): Promise<void> {
    // Check if this is first deposit
    const isFirstDeposit = !depositRepository.hasFirstDeposit(customerId);
    const event: CommissionEvent = isFirstDeposit ? 'first_deposit' : 'deposit';

    await this.processEvent(event, agentId, customerId, amount);
  }

  /**
   * Record new user registration
   */
  async recordNewUser(agentId: number, customerId: number): Promise<void> {
    await this.processEvent('new_user', agentId, customerId, 0);
  }

  /**
   * Get commission breakdown by event type
   */
  getEventBreakdown(agentId: number): Record<string, { count: number; total: number }> {
    const results = db.query<{ event_type: string; count: number; total: number }>(
      `SELECT 
        event_type,
        COUNT(*) as count,
        SUM(amount) as total
       FROM commissions
       WHERE agent_id = ?
       GROUP BY event_type`,
      [agentId]
    );

    const breakdown: Record<string, { count: number; total: number }> = {};
    for (const row of results) {
      breakdown[row.event_type] = {
        count: row.count,
        total: row.total,
      };
    }

    return breakdown;
  }

  /**
   * Calculate projected commission for next level
   */
  getProjectedCommission(agentId: number, amount: number): {
    current: number;
    nextLevel: number;
    difference: number;
    nextLevelName: string;
  } {
    const agentLevel = levelService.getAgentLevel(agentId);
    if (!agentLevel) {
      return { current: 0, nextLevel: 0, difference: 0, nextLevelName: 'Unknown' };
    }

    const currentBoost = agentLevel.boost;
    const nextLevelIndex = Math.min(agentLevel.level + 1, LEVELS.boosts.length - 1);
    const nextBoost = LEVELS.boosts[nextLevelIndex];

    const currentCommission = (amount * (10 + currentBoost)) / 100; // 10% base
    const nextCommission = (amount * (10 + nextBoost)) / 100;

    return {
      current: currentCommission,
      nextLevel: nextCommission,
      difference: nextCommission - currentCommission,
      nextLevelName: LEVELS.names[nextLevelIndex],
    };
  }
}

// Export singleton
export const commissionService = new EnhancedCommissionService();

