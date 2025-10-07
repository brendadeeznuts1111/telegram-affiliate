/**
 * Commission Service - Worker Version
 * Business logic for commission calculations and management
 */

import type { CommissionRepository, UserRepository, DepositRepository } from '@affiliate/database/index.workers';
import type { Commission, Deposit } from '@affiliate/database/index.workers';

export interface CommissionCalculation {
  agentId: number;
  level: number;
  rate: number;
  amount: number;
  description: string;
}

export class CommissionService {
  constructor(
    private commissionRepository: CommissionRepository,
    private userRepository: UserRepository,
    private depositRepository: DepositRepository
  ) {}

  /**
   * Calculate commissions for a deposit
   * Supports multi-level commission structure
   */
  async calculateCommissions(
    depositId: string,
    customerId: string,
    amount: number,
    baseAgentId: number
  ): Promise<CommissionCalculation[]> {
    const calculations: CommissionCalculation[] = [];

    // Get the agent who owns the customer
    const baseAgent = await this.userRepository.getById(baseAgentId);
    if (!baseAgent) {
      throw new Error('Base agent not found');
    }

    // Level 1: Direct agent commission (5%)
    calculations.push({
      agentId: baseAgentId,
      level: 1,
      rate: 0.05,
      amount: amount * 0.05,
      description: `Level 1 commission from deposit #${depositId}`,
    });

    // Level 2: Referrer commission (2%) if agent has a referrer
    if (baseAgent.referred_by) {
      const referrer = await this.userRepository.getById(baseAgent.referred_by);
      if (referrer && referrer.is_agent) {
        calculations.push({
          agentId: baseAgent.referred_by,
          level: 2,
          rate: 0.02,
          amount: amount * 0.02,
          description: `Level 2 commission from agent #${baseAgentId}'s deposit #${depositId}`,
        });

        // Level 3: Super agent commission (1%) if referrer has a referrer
        if (referrer.referred_by) {
          const superAgent = await this.userRepository.getById(referrer.referred_by);
          if (superAgent && superAgent.is_super_agent) {
            calculations.push({
              agentId: referrer.referred_by,
              level: 3,
              rate: 0.01,
              amount: amount * 0.01,
              description: `Level 3 commission from agent #${baseAgentId}'s deposit #${depositId}`,
            });
          }
        }
      }
    }

    return calculations;
  }

  /**
   * Create commission records from calculations
   */
  async createCommissionsFromCalculations(
    calculations: CommissionCalculation[],
    depositId: string
  ): Promise<Commission[]> {
    const commissions: Commission[] = [];

    for (const calc of calculations) {
      const commission = await this.commissionRepository.create({
        agent_id: calc.agentId,
        customer_id: null, // Not directly linked to customer
        deposit_id: depositId,
        amount: calc.amount,
        rate: calc.rate,
        level: calc.level,
        status: 'pending',
        currency: 'USD',
        description: calc.description,
      });

      commissions.push(commission);
    }

    return commissions;
  }

  /**
   * Get commissions by agent with optional status filter
   */
  async getByAgent(agentId: number, status?: 'pending' | 'paid'): Promise<Commission[]> {
    const allCommissions = await this.commissionRepository.getByAgent(agentId);
    
    if (!status) {
      return allCommissions;
    }

    return allCommissions.filter(c => c.status === status);
  }

  /**
   * Calculate commission statistics
   */
  async getStatistics(agentId: number): Promise<{
    total: number;
    paid: number;
    pending: number;
    count: number;
    paidCount: number;
    pendingCount: number;
  }> {
    const commissions = await this.getByAgent(agentId);
    
    const pending = commissions.filter(c => c.status === 'pending');
    const paid = commissions.filter(c => c.status === 'paid');

    return {
      total: commissions.reduce((sum, c) => sum + c.amount, 0),
      paid: paid.reduce((sum, c) => sum + c.amount, 0),
      pending: pending.reduce((sum, c) => sum + c.amount, 0),
      count: commissions.length,
      paidCount: paid.length,
      pendingCount: pending.length,
    };
  }

  /**
   * Format single commission for display
   */
  static formatCommission(commission: Commission): string {
    const statusIcon = commission.status === 'paid' ? '✅' : '⏳';
    const date = new Date(commission.created_at * 1000).toLocaleDateString();
    
    return (
      `${statusIcon} *$${commission.amount.toFixed(2)}* (Level ${commission.level})\n` +
      `   📅 ${date}\n` +
      `   📊 Status: ${commission.status}\n` +
      `   📝 ${commission.description || 'Commission'}`
    );
  }

  /**
   * Format commission list for display
   */
  static formatCommissionList(commissions: Commission[], status?: string): string {
    const title = status ? `*${status.charAt(0).toUpperCase() + status.slice(1)} Commissions*` : '*All Commissions*';
    let message = `💰 ${title} (${commissions.length})\n\n`;

    if (commissions.length === 0) {
      message += '_No commissions yet_';
      return message;
    }

    // Sort by date (newest first)
    const sorted = [...commissions].sort((a, b) => b.created_at - a.created_at);

    sorted.slice(0, 10).forEach((commission, index) => {
      message += `${index + 1}. ${this.formatCommission(commission)}\n\n`;
    });

    if (commissions.length > 10) {
      message += `_... and ${commissions.length - 10} more_`;
    }

    return message;
  }

  /**
   * Generate commission report for export
   */
  static generateReport(commissions: Commission[]): string {
    let report = 'COMMISSION REPORT\n';
    report += '='.repeat(50) + '\n\n';

    const total = commissions.reduce((sum, c) => sum + c.amount, 0);
    const paid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
    const pending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);

    report += `Total Commissions: $${total.toFixed(2)}\n`;
    report += `Paid: $${paid.toFixed(2)}\n`;
    report += `Pending: $${pending.toFixed(2)}\n\n`;
    report += '='.repeat(50) + '\n\n';

    commissions.forEach((commission, index) => {
      const date = new Date(commission.created_at * 1000).toLocaleString();
      report += `${index + 1}. $${commission.amount.toFixed(2)} - ${commission.status}\n`;
      report += `   Level: ${commission.level} | Date: ${date}\n`;
      report += `   ${commission.description || 'Commission'}\n\n`;
    });

    return report;
  }
}
