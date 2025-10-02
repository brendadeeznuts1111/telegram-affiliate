/**
 * Admin Menu Handler
 * Provides a convenient menu for admin commands
 */

import { InlineKeyboard } from 'grammy';
import type { BotContext } from '@/types/context';
import { isAdmin } from '@/core/config';
import { logger } from '@/utils/logger';

/**
 * /admin - Show admin menu
 */
export async function adminMenuHandler(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId || !isAdmin(userId)) {
    await ctx.reply('⛔ This command is only available to administrators.');
    return;
  }

  try {
    const keyboard = new InlineKeyboard()
      .text('📊 System Stats', 'admin_stats').row()
      .text('🏆 Top Agents', 'admin_top').row()
      .text('💰 Process Payments', 'admin_pay').row()
      .text('📢 Broadcast', 'admin_broadcast').row()
      .text('⚙️ Settings', 'admin_settings');

    await ctx.reply(
      `👑 *Admin Control Panel*\n\n` +
      `Welcome ${ctx.from.first_name}!\n\n` +
      `Choose an option below or use commands:\n\n` +
      `📊 \`/adminstats\` - System overview\n` +
      `🏆 \`/topagents\` - View leaderboard\n` +
      `⭐ \`/makesuper <id>\` - Promote agent\n` +
      `💰 \`/pay <id> <count>\` - Mark paid\n` +
      `📢 \`/broadcast <msg>\` - Announce\n` +
      `⚙️ \`/setcommission <d> <s>\` - Update rates`,
      { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      }
    );

    logger.info(`Admin ${userId} opened admin menu`);

  } catch (error) {
    logger.error('Admin menu handler error:', error);
    await ctx.reply('Failed to open admin menu.');
  }
}

/**
 * Handle admin menu button clicks
 */
export async function adminMenuCallbackHandler(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId || !isAdmin(userId)) {
    await ctx.answerCallbackQuery('⛔ Admin only');
    return;
  }

  await ctx.answerCallbackQuery();

  const data = ctx.callbackQuery?.data;

  switch (data) {
    case 'admin_stats':
      await ctx.reply(
        'Use: `/adminstats`\n\n' +
        'Shows complete system statistics including users, agents, customers, and commissions.',
        { parse_mode: 'Markdown' }
      );
      break;

    case 'admin_top':
      await ctx.reply(
        'Use: `/topagents`\n\n' +
        'Displays top 10 performing agents by customer count and earnings.',
        { parse_mode: 'Markdown' }
      );
      break;

    case 'admin_pay':
      await ctx.reply(
        'Use: `/pay <user_id> <count>`\n\n' +
        'Example: `/pay 8013171035 5`\n\n' +
        'Marks the specified number of pending commissions as paid for the agent.',
        { parse_mode: 'Markdown' }
      );
      break;

    case 'admin_broadcast':
      await ctx.reply(
        'Use: `/broadcast <your message>`\n\n' +
        'Example: `/broadcast Welcome to the new system!`\n\n' +
        'Sends your message to all agents in the system.',
        { parse_mode: 'Markdown' }
      );
      break;

    case 'admin_settings':
      await ctx.reply(
        'Use: `/setcommission <direct%> <super%>`\n\n' +
        'Example: `/setcommission 15 7`\n\n' +
        'Updates commission rates (requires bot restart to apply).\n\n' +
        'Current rates can be edited in:\n' +
        '`src/core/levels.config.ts`',
        { parse_mode: 'Markdown' }
      );
      break;

    default:
      await ctx.reply('Unknown action');
  }
}

