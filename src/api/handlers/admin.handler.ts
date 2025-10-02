/**
 * Admin Command Handlers
 * Administrative commands for bot management
 */

import type { BotContext } from '@/types/context';
import { isAdmin, config } from '@/core/config';
import { userRepository } from '@/repositories/user.repository';
import { customerRepository } from '@/repositories/customer.repository';
import { commissionService } from '@/services/commission.service';
import { commissionRepository } from '@/repositories/commission.repository';
import { logger } from '@/utils/logger';
import { Validator } from '@/utils/validation';

/**
 * Middleware to check if user is admin
 */
export async function adminMiddleware(ctx: BotContext, next: () => Promise<void>) {
  const userId = ctx.from?.id;
  if (!userId || !isAdmin(userId)) {
    await ctx.reply('⛔ This command is only available to administrators.');
    return;
  }
  await next();
}

/**
 * /stats - Show system-wide statistics
 */
export async function statsHandler(ctx: BotContext) {
  try {
    const totalUsers = userRepository.getTotalCount();
    const totalAgents = userRepository.getTotalAgentCount();
    const totalCustomers = customerRepository.getTotalCount();
    const commissionStats = commissionRepository.getOverallStats();

    await ctx.reply(
      `📊 *System Statistics*\n\n` +
      `👥 Total Users: ${totalUsers}\n` +
      `🤝 Total Agents: ${totalAgents}\n` +
      `👨‍👩‍👧‍👦 Total Customers: ${totalCustomers}\n\n` +
      `💰 *Commissions:*\n` +
      `✅ Paid: ${config.commission.currency}${commissionStats.total_paid.toFixed(2)} (${commissionStats.count_paid})\n` +
      `⏳ Pending: ${config.commission.currency}${commissionStats.total_pending.toFixed(2)} (${commissionStats.count_pending})\n\n` +
      `📈 Conversion Rate: ${totalAgents > 0 ? ((totalCustomers / totalAgents).toFixed(2)) : '0'} customers/agent`,
      { parse_mode: 'Markdown' }
    );

    logger.info(`Admin ${ctx.from!.id} viewed stats`);

  } catch (error) {
    logger.error('Stats handler error:', error);
    await ctx.reply('Failed to fetch statistics.');
  }
}

/**
 * /topagents - Show top performing agents
 */
export async function topAgentsHandler(ctx: BotContext) {
  try {
    const topAgents = userRepository.getTopAgents(10);

    if (topAgents.length === 0) {
      await ctx.reply('No agents found.');
      return;
    }

    const lines = topAgents.map((agent, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      return (
        `${medal} ${agent.first_name}` +
        (agent.username ? ` (@${agent.username})` : '') +
        `\n   👥 ${agent.customer_count} customers | ` +
        `💰 ${config.commission.currency}${agent.commission_total.toFixed(2)}`
      );
    });

    await ctx.reply(
      `🏆 *Top Agents*\n\n` +
      lines.join('\n\n'),
      { parse_mode: 'Markdown' }
    );

    logger.info(`Admin ${ctx.from!.id} viewed top agents`);

  } catch (error) {
    logger.error('Top agents handler error:', error);
    await ctx.reply('Failed to fetch top agents.');
  }
}

/**
 * /makesuper <user_id> - Promote agent to super agent
 */
export async function makeSuperHandler(ctx: BotContext) {
  try {
    const args = ctx.match?.toString().trim().split(/\s+/) || [];
    const userId = parseInt(args[0], 10);

    if (!userId || isNaN(userId)) {
      await ctx.reply('Usage: /makesuper <user_id>');
      return;
    }

    const user = userRepository.getById(userId);
    if (!user) {
      await ctx.reply(`User ${userId} not found.`);
      return;
    }

    userRepository.makeSuperAgent(userId);

    await ctx.reply(
      `✅ ${user.first_name} has been promoted to Super Agent!\n\n` +
      `They can now earn ${config.commission.super}% on their sub-agents' customers.`
    );

    // Notify the promoted user
    await ctx.api.sendMessage(
      userId,
      `🎉 Congratulations! You've been promoted to Super Agent! ⭐\n\n` +
      `You now earn ${config.commission.super}% commission on all customers ` +
      `referred by your sub-agents.`
    );

    logger.info(`Admin ${ctx.from!.id} promoted user ${userId} to super agent`);

  } catch (error) {
    logger.error('Make super handler error:', error);
    await ctx.reply('Failed to promote user.');
  }
}

/**
 * /pay <agent_id> <count> - Mark commissions as paid
 */
export async function payHandler(ctx: BotContext) {
  try {
    const args = ctx.match?.toString().trim().split(/\s+/) || [];
    const agentId = parseInt(args[0], 10);
    const count = parseInt(args[1], 10);

    if (!agentId || !count || isNaN(agentId) || isNaN(count)) {
      await ctx.reply('Usage: /pay <agent_id> <count>');
      return;
    }

    const agent = userRepository.getById(agentId);
    if (!agent) {
      await ctx.reply(`Agent ${agentId} not found.`);
      return;
    }

    const updated = commissionRepository.markAsPaid(agentId, count);

    await ctx.reply(
      `✅ Marked ${updated} commission(s) as paid for ${agent.first_name}.`
    );

    // Notify the agent
    if (updated > 0) {
      await ctx.api.sendMessage(
        agentId,
        `💰 Payment processed!\n\n` +
        `${updated} commission payment(s) have been marked as paid.`
      );
    }

    logger.info(`Admin ${ctx.from!.id} marked ${updated} commissions as paid for agent ${agentId}`);

  } catch (error) {
    logger.error('Pay handler error:', error);
    await ctx.reply('Failed to process payment.');
  }
}

/**
 * /broadcast <message> - Send message to all agents
 */
export async function broadcastHandler(ctx: BotContext) {
  try {
    const message = ctx.match?.toString().trim();

    if (!message) {
      await ctx.reply('Usage: /broadcast <message>');
      return;
    }

    const agents = userRepository.getAllAgents();
    
    if (agents.length === 0) {
      await ctx.reply('No agents to broadcast to.');
      return;
    }

    await ctx.reply(`📢 Broadcasting to ${agents.length} agents...`);

    let sent = 0;
    let failed = 0;

    for (const agent of agents) {
      try {
        await ctx.api.sendMessage(
          agent.user_id,
          `📢 *Announcement*\n\n${message}`,
          { parse_mode: 'Markdown' }
        );
        sent++;
      } catch (error) {
        logger.error(`Failed to send broadcast to ${agent.user_id}:`, error);
        failed++;
      }
    }

    await ctx.reply(
      `✅ Broadcast complete!\n\n` +
      `✅ Sent: ${sent}\n` +
      `❌ Failed: ${failed}`
    );

    logger.info(`Admin ${ctx.from!.id} broadcast message to ${sent} agents`);

  } catch (error) {
    logger.error('Broadcast handler error:', error);
    await ctx.reply('Failed to send broadcast.');
  }
}

/**
 * /setcommission <direct> <super> - Update commission rates (updates .env)
 */
export async function setCommissionHandler(ctx: BotContext) {
  try {
    const args = ctx.match?.toString().trim().split(/\s+/) || [];
    const direct = parseFloat(args[0]);
    const super_ = parseFloat(args[1]);

    if (isNaN(direct) || isNaN(super_) || !Validator.isValidPercentage(direct) || !Validator.isValidPercentage(super_)) {
      await ctx.reply(
        'Usage: /setcommission <direct%> <super%>\n\n' +
        'Example: /setcommission 15 7\n\n' +
        'Both values must be between 0 and 100.'
      );
      return;
    }

    // Note: Changing config at runtime requires restart
    // In production, you'd update .env file and restart the bot
    await ctx.reply(
      `⚠️ *Commission Rate Update Request*\n\n` +
      `New rates:\n` +
      `• Direct Agent: ${direct}%\n` +
      `• Super Agent: ${super_}%\n\n` +
      `⚠️ To apply these changes:\n` +
      `1. Update COMMISSION_DIRECT=${direct} in .env\n` +
      `2. Update COMMISSION_SUPER=${super_} in .env\n` +
      `3. Restart the bot\n\n` +
      `Current rates:\n` +
      `• Direct: ${config.commission.direct}%\n` +
      `• Super: ${config.commission.super}%`,
      { parse_mode: 'Markdown' }
    );

    logger.info(`Admin ${ctx.from!.id} requested commission change: direct=${direct}%, super=${super_}%`);

  } catch (error) {
    logger.error('Set commission handler error:', error);
    await ctx.reply('Failed to process commission update.');
  }
}

/**
 * /customerpaid <amount> - Agent command to record customer payment
 */
export async function customerPaidHandler(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const user = userRepository.getById(userId);
    if (!user?.is_agent) {
      await ctx.reply('⛔ This command is only available to agents.');
      return;
    }

    const args = ctx.match?.toString().trim().split(/\s+/) || [];
    const amount = parseFloat(args[0]);

    if (isNaN(amount) || !Validator.isValidAmount(amount)) {
      await ctx.reply(
        'Usage: /customerpaid <amount>\n\n' +
        'Example: /customerpaid 100\n\n' +
        'This will record a commission for a customer payment.'
      );
      return;
    }

    // Get agent's most recent customer
    const customers = customerRepository.getByAgent(userId);
    if (customers.length === 0) {
      await ctx.reply(
        '⚠️ You have no customers yet.\n\n' +
        'Add a customer first using the "Add Customer" button.'
      );
      return;
    }

    const latestCustomer = customers[0];

    // Record commission using commission service (deposit event)
    await commissionService.recordDeposit(userId, latestCustomer.customer_id, amount);

    // Calculate commission for display (10% base + level boost)
    const projection = commissionService.getProjectedCommission(userId, amount);
    const commissionAmount = projection.current;

    await ctx.reply(
      `💰 *Commission Recorded!*\n\n` +
      `Customer: ${latestCustomer.customer_name}\n` +
      `Payment: ${config.commission.currency}${amount.toFixed(2)}\n\n` +
      `Your Commission: ${config.commission.currency}${commissionAmount.toFixed(2)}\n` +
      `Status: Pending\n\n` +
      `💡 Your commission will be paid once approved by admin.`,
      { parse_mode: 'Markdown' }
    );

    logger.info(`Agent ${userId} recorded payment of ${amount} for customer ${latestCustomer.customer_id}`);

  } catch (error) {
    logger.error('Customer paid handler error:', error);
    await ctx.reply('Failed to record payment.');
  }
}

