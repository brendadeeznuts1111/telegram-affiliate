/**
 * /super Command Handler (Worker Version)
 * Opens super agent panel
 */

import { InlineKeyboard } from 'grammy';
import type { WorkerContext } from '../worker-bot';
import { UserRepositoryD1 } from '../repositories/user.repository.d1';

export async function superHandler(ctx: WorkerContext) {
  const user = ctx.from;
  if (!user) return;

  const userRepo = new UserRepositoryD1(ctx.env.DB);

  try {
    // Check if user is a super agent
    const dbUser = await userRepo.getByTelegramId(user.id);

    if (!dbUser || !dbUser.is_super_agent) {
      await ctx.reply(
        '❌ This command is only available to Super Agents.\n\n' +
        'Contact an admin to upgrade your account.'
      );
      return;
    }

    const stats = await userRepo.getAgentStats(user.id);

    const pagesUrl = ctx.env.PUBLIC_URL?.replace('workers.dev', 'pages.dev') || 
                     'https://telegram-affiliate-dashboard.pages.dev';

    const keyboard = new InlineKeyboard()
      .webApp('👑 Open Super Panel', pagesUrl);

    await ctx.reply(
      `👑 *Super Agent Panel*\n\n` +
      `Your Network:\n` +
      `👥 Direct Customers: ${stats.customers}\n` +
      `🤝 Sub-Agents: ${stats.sub_agents}\n` +
      `💰 Total Earnings: $${stats.commission.toFixed(2)}\n\n` +
      `As a Super Agent, you can:\n` +
      `• View your entire network\n` +
      `• Track override commissions\n` +
      `• Broadcast messages to your team\n` +
      `• Access advanced analytics\n\n` +
      `Click below to access your super panel:`,
      {
        reply_markup: keyboard,
        parse_mode: 'Markdown',
      }
    );

    console.log(`Super panel accessed by user ${user.id}`);
  } catch (error) {
    console.error('Super handler error:', error);
    await ctx.reply('❌ Failed to load super panel. Please try again.');
  }
}

