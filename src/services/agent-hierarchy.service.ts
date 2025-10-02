/**
 * Agent Hierarchy Service
 * Manages agent relationships, overrides, and network structure
 */

import { userRepository } from '@/repositories/user.repository';
import { commissionRepository } from '@/repositories/commission.repository';
import { logger } from '@/utils/logger';
import type { User } from '@/types/user';

export interface AgentWithStats extends User {
  earnings: number;
  customers: number;
  sub_agents: number;
}

export interface OverrideCalculation {
  agentId: number;
  baseAmount: number;
  overridePercent: number;
  overrideAmount: number;
}

export class AgentHierarchyService {
  /**
   * Register a new agent with optional parent
   */
  async registerAgent(userId: number, parentAgentId?: number): Promise<void> {
    try {
      userRepository.makeAgent(userId, parentAgentId);
      
      if (parentAgentId) {
        logger.info(`Agent ${userId} registered under parent ${parentAgentId}`);
      } else {
        logger.info(`Agent ${userId} registered as independent agent`);
      }
    } catch (error) {
      logger.error(`Failed to register agent ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Promote agent to super agent
   */
  async promoteSuperAgent(userId: number): Promise<void> {
    try {
      userRepository.makeSuperAgent(userId);
      logger.info(`Agent ${userId} promoted to super agent`);
    } catch (error) {
      logger.error(`Failed to promote ${userId} to super agent:`, error);
      throw error;
    }
  }

  /**
   * Check if user is a super agent
   */
  isSuperAgent(userId: number): boolean {
    const user = userRepository.getById(userId);
    return user?.is_super_agent === 1;
  }

  /**
   * Get all sub-agents for a parent (direct children only)
   */
  getSubAgents(parentId: number): User[] {
    return userRepository.getSubAgents(parentId);
  }

  /**
   * Get sub-agents with their stats
   */
  getSubAgentsWithStats(parentId: number): AgentWithStats[] {
    const subAgents = this.getSubAgents(parentId);
    
    return subAgents.map(agent => {
      const stats = userRepository.getAgentStats(agent.user_id);
      return {
        ...agent,
        earnings: stats.commission,
        customers: stats.customers,
        sub_agents: stats.sub_agents,
      };
    });
  }

  /**
   * Get entire downline tree (recursive)
   */
  getDownlineTree(parentId: number, maxDepth: number = 5, currentDepth: number = 0): any {
    if (currentDepth >= maxDepth) return null;

    const agent = userRepository.getById(parentId);
    if (!agent) return null;

    const stats = userRepository.getAgentStats(parentId);
    const children = this.getSubAgents(parentId);

    return {
      user_id: agent.user_id,
      first_name: agent.first_name,
      username: agent.username,
      is_super_agent: agent.is_super_agent,
      stats: {
        customers: stats.customers,
        commission: stats.commission,
        sub_agents: stats.sub_agents,
      },
      children: children
        .map(child => this.getDownlineTree(child.user_id, maxDepth, currentDepth + 1))
        .filter(Boolean),
    };
  }

  /**
   * Calculate override earnings for super agent
   * Override = X% of each sub-agent's earnings
   */
  calculateOverride(superAgentId: number, amount: number, overrideRate: number = 0.5): number {
    const isSuperAgent = this.isSuperAgent(superAgentId);
    if (!isSuperAgent) return 0;

    // Default 50% override on sub-agent earnings
    return amount * overrideRate;
  }

  /**
   * Calculate total override for super agent based on all sub-agents
   */
  getTotalOverrideEarnings(superAgentId: number): OverrideCalculation[] {
    if (!this.isSuperAgent(superAgentId)) {
      return [];
    }

    const subAgents = this.getSubAgentsWithStats(superAgentId);
    
    return subAgents.map(agent => ({
      agentId: agent.user_id,
      baseAmount: agent.earnings,
      overridePercent: 50, // 50% override
      overrideAmount: this.calculateOverride(superAgentId, agent.earnings),
    }));
  }

  /**
   * Get total network size (all downline agents, recursively)
   */
  getNetworkSize(parentId: number): number {
    const subAgents = this.getSubAgents(parentId);
    let total = subAgents.length;

    for (const agent of subAgents) {
      total += this.getNetworkSize(agent.user_id);
    }

    return total;
  }

  /**
   * Get total network earnings (all downline combined)
   */
  getNetworkEarnings(parentId: number): number {
    const stats = userRepository.getAgentStats(parentId);
    let total = stats.commission;

    const subAgents = this.getSubAgents(parentId);
    for (const agent of subAgents) {
      total += this.getNetworkEarnings(agent.user_id);
    }

    return total;
  }

  /**
   * Get agent lineage (path from agent to root)
   */
  getLineage(agentId: number): User[] {
    const lineage: User[] = [];
    let currentId: number | null = agentId;

    while (currentId) {
      const user = userRepository.getById(currentId);
      if (!user) break;

      lineage.push(user);
      currentId = user.parent_agent_id || null;
    }

    return lineage;
  }

  /**
   * Check if agent A is in the downline of agent B
   */
  isInDownline(agentId: number, potentialParentId: number): boolean {
    const lineage = this.getLineage(agentId);
    return lineage.some(user => user.user_id === potentialParentId);
  }

  /**
   * Get top performing agents in network
   */
  getTopPerformers(parentId: number, limit: number = 10): AgentWithStats[] {
    const allSubAgents = this.getSubAgentsWithStats(parentId);
    
    // Recursively get all downline agents
    const getAllDownline = (agents: User[]): User[] => {
      let result = [...agents];
      for (const agent of agents) {
        const subAgents = this.getSubAgents(agent.user_id);
        result = result.concat(getAllDownline(subAgents));
      }
      return result;
    };

    const allDownline = getAllDownline(allSubAgents);
    const downlineWithStats = allDownline.map(agent => {
      const stats = userRepository.getAgentStats(agent.user_id);
      return {
        ...agent,
        earnings: stats.commission,
        customers: stats.customers,
        sub_agents: stats.sub_agents,
      };
    });

    // Sort by earnings and return top performers
    return downlineWithStats
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, limit);
  }

  /**
   * Broadcast message to all downline (helper - actual sending done by bot)
   */
  getBroadcastList(superAgentId: number): number[] {
    if (!this.isSuperAgent(superAgentId)) {
      return [];
    }

    const subAgents = this.getSubAgents(superAgentId);
    return subAgents.map(agent => agent.user_id);
  }
}

// Export singleton instance
export const agentHierarchyService = new AgentHierarchyService();

