/**
 * Commission Handler
 * Bot commands for viewing and managing commissions
 */

import { InlineKeyboard } from 'grammy';
import type { BotContext } from '@/types/context';
import { userRepository, commissionRepository } from '@/core/bot-database';
import { logger } from '@/utils/logger';
import { isAgent } from '@/types/user';

/**
 * /commissions - View all commissions with filters
 */
export async function commissionsHandler(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    // Check if user is an agent
    const user = await userRepository.getById(userId);
    if (!user) {
      await ctx.reply('❌ User not found. Please use /start first.');
      return;
    }

    if (!isAgent(user)) {
      await ctx.reply(
        '❌ Only agents can view commissions.\n\n' +
        'Use the "Become Agent" button to get started!'
      );
      return;
    }

    // Get all commissions for this agent
    const commissions = await commissionRepository.getByAgent(userId);

    if (commissions.length === 0) {
      const keyboard = new InlineKeyboard()
        .text('💰 Record Deposit', 'record_deposit')
        .text('➕ Add Customer', 'add_customer');

      await ctx.reply(
        '💵 *No Commissions Yet*\n\n' +
        'Start earning by recording customer deposits!\n\n' +
        '1. Add customers with /addcustomer\n' +
        '2. Record deposits with /deposit\n' +
        '3. Earn commissions automatically!',
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
      return;
    }

    // Calculate statistics
    const stats = calculateCommissionStats(commissions);

    // Create filter buttons
    const keyboard = new InlineKeyboard()
      .text(`📊 All (${commissions.length})`, 'comm_filter_all')
      .text(`⏳ Pending (${stats.pendingCount})`, 'comm_filter_pending')
      .row()
      .text(`✅ Paid (${stats.paidCount})`, 'comm_filter_paid')
      .text(`📈 Export`, 'comm_export')
      .row()
      .text('🔄 Refresh', 'comm_refresh');

    // Format commission list
    const message = formatCommissionList(commissions, 'all', stats);

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

  } catch (error) {
    logger.error('Commissions handler error:', error);
    await ctx.reply('❌ Failed to load commissions. Please try again.');
  }
}

/**
 * /commissions pending - Show only pending commissions
 */
export async function pendingCommissionsHandler(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const user = await userRepository.getById(userId);
    if (!user || !isAgent(user)) {
      await ctx.reply('❌ Only agents can view commissions.');
      return;
    }

    const commissions = await commissionRepository.getByAgent(userId);
    const pending = commissions.filter(c => c.status === 'pending');

    if (pending.length === 0) {
      await ctx.reply(
        '✅ *No Pending Commissions*\n\n' +
        'All your commissions have been paid!\n\n' +
        'Use /commissions to view your complete history.',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const stats = calculateCommissionStats(commissions);
    const message = formatCommissionList(pending, 'pending', stats);

    const keyboard = new InlineKeyboard()
      .text('📊 View All', 'comm_filter_all')
      .text('✅ Paid Only', 'comm_filter_paid')
      .row()
      .text('🔄 Refresh', 'comm_refresh');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

  } catch (error) {
    logger.error('Pending commissions handler error:', error);
    await ctx.reply('❌ Failed to load pending commissions.');
  }
}

/**
 * /commissions paid - Show only paid commissions
 */
export async function paidCommissionsHandler(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const user = await userRepository.getById(userId);
    if (!user || !isAgent(user)) {
      await ctx.reply('❌ Only agents can view commissions.');
      return;
    }

    const commissions = await commissionRepository.getByAgent(userId);
    const paid = commissions.filter(c => c.status === 'paid');

    if (paid.length === 0) {
      await ctx.reply(
        '⏳ *No Paid Commissions Yet*\n\n' +
        'Your commissions are pending payment.\n\n' +
        'Use /commissions to view your pending earnings.',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const stats = calculateCommissionStats(commissions);
    const message = formatCommissionList(paid, 'paid', stats);

    const keyboard = new InlineKeyboard()
      .text('📊 View All', 'comm_filter_all')
      .text('⏳ Pending Only', 'comm_filter_pending')
      .row()
      .text('🔄 Refresh', 'comm_refresh');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

  } catch (error) {
    logger.error('Paid commissions handler error:', error);
    await ctx.reply('❌ Failed to load paid commissions.');
  }
}

/**
 * Calculate commission statistics
 */
function calculateCommissionStats(commissions: any[]) {
  const stats = {
    total: 0,
    pending: 0,
    paid: 0,
    pendingCount: 0,
    paidCount: 0,
    avgCommission: 0,
    highestCommission: 0,
    lowestCommission: Infinity,
  };

  commissions.forEach(comm => {
    stats.total += comm.amount;
    
    if (comm.status === 'pending') {
      stats.pending += comm.amount;
      stats.pendingCount++;
    } else if (comm.status === 'paid') {
      stats.paid += comm.amount;
      stats.paidCount++;
    }

    if (comm.amount > stats.highestCommission) {
      stats.highestCommission = comm.amount;
    }
    if (comm.amount < stats.lowestCommission) {
      stats.lowestCommission = comm.amount;
    }
  });

  stats.avgCommission = commissions.length > 0 ? stats.total / commissions.length : 0;
  
  if (stats.lowestCommission === Infinity) {
    stats.lowestCommission = 0;
  }

  return stats;
}

/**
 * Format commission list for display
 */
function formatCommissionList(
  commissions: any[],
  filter: 'all' | 'pending' | 'paid',
  stats: ReturnType<typeof calculateCommissionStats>
): string {
  let message = '';

  // Header based on filter
  if (filter === 'all') {
    message = `💵 *Your Commissions*\n\n`;
  } else if (filter === 'pending') {
    message = `⏳ *Pending Commissions*\n\n`;
  } else {
    message = `✅ *Paid Commissions*\n\n`;
  }

  // Statistics summary
  message +=
    `📊 *Summary*\n` +
    `💰 Total Earnings: $${stats.total.toFixed(2)}\n` +
    `⏳ Pending: $${stats.pending.toFixed(2)} (${stats.pendingCount})\n` +
    `✅ Paid: $${stats.paid.toFixed(2)} (${stats.paidCount})\n` +
    `📈 Average: $${stats.avgCommission.toFixed(2)}\n` +
    `\n`;

  // Commission list (show last 10)
  const displayCommissions = commissions.slice(-10).reverse();
  
  message += `📋 *Recent Commissions*\n\n`;

  displayCommissions.forEach((comm, index) => {
    const statusEmoji = comm.status === 'paid' ? '✅' : '⏳';
    const dateStr = new Date(comm.created_at * 1000).toLocaleDateString();
    const eventType = comm.event_type || 'deposit';
    
    message +=
      `${statusEmoji} $${comm.amount.toFixed(2)}\n` +
      `   🆔 Commission ID: ${comm.commission_id}\n` +
      `   👤 Customer ID: ${comm.customer_id}\n` +
      `   📊 Rate: ${comm.percentage}%\n` +
      `   🏷️ Type: ${eventType}\n` +
      `   📅 ${dateStr}\n\n`;
  });

  if (commissions.length > 10) {
    message += `_Showing last 10 of ${commissions.length} commissions_\n`;
  }

  return message;
}

/**
 * Export commissions to text format
 */
function exportCommissions(commissions: any[], stats: ReturnType<typeof calculateCommissionStats>): string {
  let export_text = '💵 COMMISSION REPORT\n';
  export_text += '═══════════════════════════\n\n';
  
  // Summary
  export_text += 'SUMMARY\n';
  export_text += '───────────────────────────\n';
  export_text += `Total Commissions: ${commissions.length}\n`;
  export_text += `Total Earnings: $${stats.total.toFixed(2)}\n`;
  export_text += `Pending: $${stats.pending.toFixed(2)} (${stats.pendingCount})\n`;
  export_text += `Paid: $${stats.paid.toFixed(2)} (${stats.paidCount})\n`;
  export_text += `Average: $${stats.avgCommission.toFixed(2)}\n`;
  export_text += `Highest: $${stats.highestCommission.toFixed(2)}\n`;
  export_text += `Lowest: $${stats.lowestCommission.toFixed(2)}\n`;
  export_text += '\n';

  // Detailed list
  export_text += 'DETAILED LIST\n';
  export_text += '───────────────────────────\n\n';

  commissions.forEach((comm, index) => {
    const status = comm.status === 'paid' ? 'PAID' : 'PENDING';
    const dateStr = new Date(comm.created_at * 1000).toLocaleDateString();
    
    export_text += `${index + 1}. Commission #${comm.commission_id}\n`;
    export_text += `   Amount: $${comm.amount.toFixed(2)}\n`;
    export_text += `   Status: ${status}\n`;
    export_text += `   Rate: ${comm.percentage}%\n`;
    export_text += `   Customer ID: ${comm.customer_id}\n`;
    export_text += `   Date: ${dateStr}\n`;
    export_text += `   Type: ${comm.event_type || 'deposit'}\n\n`;
  });

  export_text += '═══════════════════════════\n';
  export_text += `Generated: ${new Date().toLocaleString()}\n`;

  return export_text;
}

/**
 * Handle commission-related callback queries
 */
export async function commissionCallbackHandler(ctx: BotContext) {
  const data = ctx.callbackQuery?.data;
  const userId = ctx.from?.id;
  
  if (!data || !userId) return;

  try {
    await ctx.answerCallbackQuery();

    const user = await userRepository.getById(userId);
    if (!user || !isAgent(user)) return;

    const commissions = await commissionRepository.getByAgent(userId);
    const stats = calculateCommissionStats(commissions);

    switch (data) {
      case 'comm_filter_all': {
        const message = formatCommissionList(commissions, 'all', stats);
        const keyboard = new InlineKeyboard()
          .text(`📊 All (${commissions.length})`, 'comm_filter_all')
          .text(`⏳ Pending (${stats.pendingCount})`, 'comm_filter_pending')
          .row()
          .text(`✅ Paid (${stats.paidCount})`, 'comm_filter_paid')
          .text(`📈 Export`, 'comm_export')
          .row()
          .text('🔄 Refresh', 'comm_refresh');

        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
        break;
      }

      case 'comm_filter_pending': {
        const pending = commissions.filter(c => c.status === 'pending');
        const message = formatCommissionList(pending, 'pending', stats);
        const keyboard = new InlineKeyboard()
          .text('📊 View All', 'comm_filter_all')
          .text('✅ Paid Only', 'comm_filter_paid')
          .row()
          .text('🔄 Refresh', 'comm_refresh');

        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
        break;
      }

      case 'comm_filter_paid': {
        const paid = commissions.filter(c => c.status === 'paid');
        const message = formatCommissionList(paid, 'paid', stats);
        const keyboard = new InlineKeyboard()
          .text('📊 View All', 'comm_filter_all')
          .text('⏳ Pending Only', 'comm_filter_pending')
          .row()
          .text('🔄 Refresh', 'comm_refresh');

        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
        break;
      }

      case 'comm_export': {
        const exportText = exportCommissions(commissions, stats);
        
        // Send as a separate message (in a real app, you'd create a file)
        await ctx.reply(
          '📄 *Commission Export*\n\n' +
          '```\n' +
          exportText +
          '\n```\n\n' +
          '_Copy the text above to save your commission report_',
          { parse_mode: 'Markdown' }
        );
        break;
      }

      case 'comm_refresh': {
        // Refresh the current view
        await ctx.answerCallbackQuery('🔄 Refreshing...');
        await commissionsHandler(ctx);
        break;
      }

      default:
        await ctx.reply('Unknown action');
    }

  } catch (error) {
    logger.error('Commission callback handler error:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}
