/**
 * Commission Handler - Worker Version
 * View and manage commissions
 */

import { InlineKeyboard } from 'grammy';
import type { WorkerContext } from '../worker-bot';
import { CommissionService } from '../services/commission.service';

/**
 * /commissions - View all commissions
 */
export async function commissionsHandler(ctx: WorkerContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const user = await ctx.userRepository.getById(userId);
    if (!user?.is_agent) {
      await ctx.reply('❌ Only agents can view commissions.');
      return;
    }

    const commissionService = new CommissionService(
      ctx.commissionRepository,
      ctx.userRepository,
      ctx.depositRepository
    );

    const commissions = await commissionService.getByAgent(userId);
    const stats = await commissionService.getStatistics(userId);

    if (commissions.length === 0) {
      const keyboard = new InlineKeyboard()
        .text('💰 Record Deposit', 'record_deposit');

      await ctx.reply(
        '💵 *No Commissions Yet*\n\n' +
        'Start earning by recording your first deposit!',
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
      return;
    }

    const statsMessage =
      `📊 *Commission Statistics*\n\n` +
      `💰 Total Earned: $${stats.total.toFixed(2)}\n` +
      `✅ Paid: $${stats.paid.toFixed(2)} (${stats.paidCount} commissions)\n` +
      `⏳ Pending: $${stats.pending.toFixed(2)} (${stats.pendingCount} commissions)\n\n`;

    const commissionList = CommissionService.formatCommissionList(commissions);

    const keyboard = new InlineKeyboard()
      .text('⏳ Pending', 'comm_pending')
      .text('✅ Paid', 'comm_paid')
      .row()
      .text('📊 Export Report', 'comm_export')
      .text('🔄 Refresh', 'comm_refresh');

    await ctx.reply(
      statsMessage + commissionList,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );

  } catch (error) {
    console.error('Commissions handler error:', error);
    await ctx.reply('❌ Failed to load commissions. Please try again.');
  }
}

/**
 * /pending - View pending commissions
 */
export async function pendingCommissionsHandler(ctx: WorkerContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const user = await ctx.userRepository.getById(userId);
    if (!user?.is_agent) {
      await ctx.reply('❌ Only agents can view commissions.');
      return;
    }

    const commissionService = new CommissionService(
      ctx.commissionRepository,
      ctx.userRepository,
      ctx.depositRepository
    );

    const pendingCommissions = await commissionService.getByAgent(userId, 'pending');

    if (pendingCommissions.length === 0) {
      await ctx.reply(
        '⏳ *No Pending Commissions*\n\n' +
        '_All commissions have been paid!_',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const total = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);
    const message =
      `⏳ *Pending Commissions*\n\n` +
      `Total Pending: $${total.toFixed(2)}\n\n` +
      CommissionService.formatCommissionList(pendingCommissions, 'pending');

    const keyboard = new InlineKeyboard()
      .text('💵 All Commissions', 'view_commissions')
      .text('🔄 Refresh', 'comm_refresh_pending');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

  } catch (error) {
    console.error('Pending commissions error:', error);
    await ctx.reply('❌ Failed to load pending commissions. Please try again.');
  }
}

/**
 * /paid - View paid commissions
 */
export async function paidCommissionsHandler(ctx: WorkerContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const user = await ctx.userRepository.getById(userId);
    if (!user?.is_agent) {
      await ctx.reply('❌ Only agents can view commissions.');
      return;
    }

    const commissionService = new CommissionService(
      ctx.commissionRepository,
      ctx.userRepository,
      ctx.depositRepository
    );

    const paidCommissions = await commissionService.getByAgent(userId, 'paid');

    if (paidCommissions.length === 0) {
      await ctx.reply(
        '✅ *No Paid Commissions*\n\n' +
        '_Commissions will appear here once approved and paid_',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const total = paidCommissions.reduce((sum, c) => sum + c.amount, 0);
    const message =
      `✅ *Paid Commissions*\n\n` +
      `Total Paid: $${total.toFixed(2)}\n\n` +
      CommissionService.formatCommissionList(paidCommissions, 'paid');

    const keyboard = new InlineKeyboard()
      .text('💵 All Commissions', 'view_commissions')
      .text('🔄 Refresh', 'comm_refresh_paid');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

  } catch (error) {
    console.error('Paid commissions error:', error);
    await ctx.reply('❌ Failed to load paid commissions. Please try again.');
  }
}

/**
 * Handle commission callbacks
 */
export async function commissionCallbackHandler(ctx: WorkerContext) {
  const data = ctx.callbackQuery?.data;
  const userId = ctx.from?.id;
  
  if (!data || !userId) return false;

  await ctx.answerCallbackQuery();

  try {
    switch (data) {
      case 'view_commissions':
      case 'comm_refresh':
        await commissionsHandler(ctx);
        return true;

      case 'comm_pending':
      case 'comm_refresh_pending':
        await pendingCommissionsHandler(ctx);
        return true;

      case 'comm_paid':
      case 'comm_refresh_paid':
        await paidCommissionsHandler(ctx);
        return true;

      case 'comm_export':
        const commissionService = new CommissionService(
          ctx.commissionRepository,
          ctx.userRepository,
          ctx.depositRepository
        );

        const commissions = await commissionService.getByAgent(userId);
        const report = CommissionService.generateReport(commissions);

        await ctx.reply(
          '📊 *Commission Report*\n\n' +
          '```\n' +
          report +
          '\n```',
          { parse_mode: 'Markdown' }
        );

        return true;

      default:
        return false;
    }

  } catch (error) {
    console.error('Commission callback error:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
    return true;
  }
}
