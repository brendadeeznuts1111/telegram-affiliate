/**
 * Level Command Handlers
 * Commands for agent level system and tree visualization
 */

import type { BotContext } from '@/types/context';
import { levelService } from '@/services/level.service';
import { commissionService } from '@/services/commission.service';
import { userRepository, depositRepository } from '@/core/bot-database';
import { config } from '@/core/config';
import { LEVELS } from '@/core/levels.config';
import { logger } from '@/utils/logger';
import { isAgent } from '@/types/user';

/**
 * /level - Show current level and progress
 */
export async function levelHandler(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const user = userRepository.getById(userId);
    
    if (!user || !isAgent(user)) {
      await ctx.reply('⛔ You need to be an agent to check your level.');
      return;
    }

    const agentLevel = levelService.getAgentLevel(userId);
    if (!agentLevel) {
      await ctx.reply('Could not retrieve level information.');
      return;
    }

    const currentThreshold = LEVELS.thresholds[agentLevel.level];
    const nextLevel = agentLevel.level + 1;
    const nextThreshold = LEVELS.thresholds[nextLevel];

    let progressText = '';
    if (nextLevel < LEVELS.thresholds.length) {
      const remaining = nextThreshold - agentLevel.netDeposited;
      const progress = ((agentLevel.netDeposited - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
      
      progressText = (
        `\n\n📈 *Progress to ${LEVELS.names[nextLevel]}:*\n` +
        `Current: ${config.commission.currency}${agentLevel.netDeposited.toFixed(2)}\n` +
        `Target: ${config.commission.currency}${nextThreshold.toFixed(2)}\n` +
        `Remaining: ${config.commission.currency}${remaining.toFixed(2)}\n` +
        `Progress: ${progress.toFixed(1)}%`
      );
    } else {
      progressText = '\n\n🏆 *You\'ve reached the highest level!*';
    }

    await ctx.reply(
      `🎖️ *Your Agent Level*\n\n` +
      `Level: ${agentLevel.name} (${agentLevel.level})\n` +
      `Commission Boost: +${agentLevel.boost}%\n\n` +
      `📊 *Statistics:*\n` +
      `Net Deposits: ${config.commission.currency}${agentLevel.netDeposited.toFixed(2)}\n` +
      `Total Customers: ${agentLevel.netCustomers}` +
      progressText,
      { parse_mode: 'Markdown' }
    );

    logger.info(`User ${userId} checked level: ${agentLevel.name}`);

  } catch (error) {
    logger.error('Level handler error:', error);
    await ctx.reply('Failed to retrieve level information.');
  }
}

/**
 * /tree - Show agent downline tree
 */
export async function treeHandler(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const user = userRepository.getById(userId);
    
    if (!user || !isAgent(user)) {
      await ctx.reply('⛔ You need to be an agent to view your tree.');
      return;
    }

    const tree = levelService.getAgentTree(userId, 5); // Max 5 levels deep
    const stats = levelService.getTreeStats(userId);

    if (tree.length === 1) { // Only self
      await ctx.reply(
        `🌳 *Your Agent Tree*\n\n` +
        `You don't have any downline agents yet.\n\n` +
        `Invite agents to join under you to build your network!`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    let treeText = '🌳 *Your Agent Tree*\n\n';
    
    tree.forEach((agent) => {
      const indent = '  '.repeat(agent.depth);
      const levelName = LEVELS.names[agent.level];
      const icon = agent.depth === 0 ? '👑' : '👤';
      
      treeText += (
        `${indent}${icon} ${agent.first_name}\n` +
        `${indent}   Level: ${levelName} | ` +
        `Deposits: ${config.commission.currency}${agent.net_deposited.toFixed(0)} | ` +
        `Customers: ${agent.net_customers}\n\n`
      );
    });

    treeText += (
      `📊 *Network Summary:*\n` +
      `Total Agents: ${stats.totalAgents}\n` +
      `Total Deposits: ${config.commission.currency}${stats.totalDeposits.toFixed(2)}\n` +
      `Total Customers: ${stats.totalCustomers}\n` +
      `Max Depth: ${stats.maxDepth}`
    );

    await ctx.reply(treeText, { parse_mode: 'Markdown' });

    logger.info(`User ${userId} viewed tree: ${stats.totalAgents} agents`);

  } catch (error) {
    logger.error('Tree handler error:', error);
    await ctx.reply('Failed to retrieve tree information.');
  }
}

/**
 * /stats - Enhanced statistics with level breakdown
 */
export async function enhancedStatsHandler(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const user = userRepository.getById(userId);
    
    if (!user || !isAgent(user)) {
      await ctx.reply('⛔ You need to be an agent to view statistics.');
      return;
    }

    const agentLevel = levelService.getAgentLevel(userId);
    const agentStats = userRepository.getAgentStats(userId);
    const eventBreakdown = commissionService.getEventBreakdown(userId);
    const depositCount = depositRepository.getCountByAgent(userId);

    let breakdownText = '';
    for (const [event, data] of Object.entries(eventBreakdown)) {
      breakdownText += `• ${event}: ${data.count} (${config.commission.currency}${data.total.toFixed(2)})\n`;
    }

    await ctx.reply(
      `📊 *Your Complete Statistics*\n\n` +
      `🎖️ *Level:* ${agentLevel?.name || 'Unknown'} (+${agentLevel?.boost || 0}% boost)\n\n` +
      `💰 *Earnings:*\n` +
      `Total Commission: ${config.commission.currency}${agentStats.commission.toFixed(2)}\n\n` +
      `👥 *Network:*\n` +
      `Total Customers: ${agentStats.customers}\n` +
      `Sub-Agents: ${agentStats.sub_agents}\n\n` +
      `💸 *Deposits:*\n` +
      `Total Deposits: ${config.commission.currency}${agentLevel?.netDeposited.toFixed(2) || '0.00'}\n` +
      `Deposit Count: ${depositCount}\n\n` +
      `📈 *Commission Breakdown:*\n` +
      (breakdownText || 'No commissions yet'),
      { parse_mode: 'Markdown' }
    );

    logger.info(`User ${userId} viewed enhanced stats`);

  } catch (error) {
    logger.error('Enhanced stats handler error:', error);
    await ctx.reply('Failed to retrieve statistics.');
  }
}

/**
 * /leaderboard - Show top agents by level
 */
export async function leaderboardHandler(ctx: BotContext) {
  try {
    const leaderboard = levelService.getLeaderboard(10);

    if (leaderboard.length === 0) {
      await ctx.reply('No agents found on the leaderboard yet.');
      return;
    }

    let leaderboardText = '🏆 *Top Agents Leaderboard*\n\n';

    leaderboard.forEach((agent, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      const levelName = LEVELS.names[agent.level];
      
      leaderboardText += (
        `${medal} ${agent.first_name}\n` +
        `   Level: ${levelName} | ` +
        `Deposits: ${config.commission.currency}${agent.net_deposited.toFixed(0)} | ` +
        `Customers: ${agent.net_customers}\n\n`
      );
    });

    await ctx.reply(leaderboardText, { parse_mode: 'Markdown' });

    logger.info('Leaderboard viewed');

  } catch (error) {
    logger.error('Leaderboard handler error:', error);
    await ctx.reply('Failed to retrieve leaderboard.');
  }
}

/**
 * /projections - Show commission projections for next level
 */
export async function projectionsHandler(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const user = userRepository.getById(userId);
    
    if (!user || !isAgent(user)) {
      await ctx.reply('⛔ You need to be an agent to view projections.');
      return;
    }

    const testAmount = 1000; // $1000 test deposit
    const projection = commissionService.getProjectedCommission(userId, testAmount);

    await ctx.reply(
      `💡 *Commission Projections*\n\n` +
      `For a ${config.commission.currency}${testAmount} deposit:\n\n` +
      `Current Commission: ${config.commission.currency}${projection.current.toFixed(2)}\n` +
      `At ${projection.nextLevelName}: ${config.commission.currency}${projection.nextLevel.toFixed(2)}\n` +
      `Extra Earnings: ${config.commission.currency}${projection.difference.toFixed(2)}\n\n` +
      `💪 Level up to earn more on every transaction!`,
      { parse_mode: 'Markdown' }
    );

  } catch (error) {
    logger.error('Projections handler error:', error);
    await ctx.reply('Failed to calculate projections.');
  }
}

