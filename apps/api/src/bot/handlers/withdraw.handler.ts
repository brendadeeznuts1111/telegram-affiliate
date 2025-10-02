/**
 * /withdraw Command Handler (Worker Version)
 * Initiates withdrawal process
 */

import { InlineKeyboard } from 'grammy';
import type { WorkerContext } from '../worker-bot';
import { UserRepositoryD1 } from '../repositories/user.repository.d1';

export async function withdrawHandler(ctx: WorkerContext) {
  const user = ctx.from;
  if (!user) return;

  const userRepo = new UserRepositoryD1(ctx.env.DB);

  try {
    // Check if user is an agent
    const isAgent = await userRepo.isAgent(user.id);

    if (!isAgent) {
      await ctx.reply('❌ You need to be an agent to request withdrawals.');
      return;
    }

    // Get available balance
    const stats = await userRepo.getAgentStats(user.id);

    const pagesUrl = ctx.env.PUBLIC_URL?.replace('workers.dev', 'pages.dev') || 
                     'https://telegram-affiliate-dashboard.pages.dev';

    const keyboard = new InlineKeyboard()
      .webApp('💸 Request Withdrawal', pagesUrl);

    await ctx.reply(
      `💰 *Withdrawal Information*\n\n` +
      `Available Balance: $${stats.commission.toFixed(2)}\n\n` +
      `To request a withdrawal:\n` +
      `1. Click the button below\n` +
      `2. Enter your wallet address (TON or TRON)\n` +
      `3. Confirm the amount\n\n` +
      `Minimum: $10.00\n` +
      `Processing time: 24-48 hours`,
      {
        reply_markup: keyboard,
        parse_mode: 'Markdown',
      }
    );

    console.log(`Withdrawal requested by user ${user.id}`);
  } catch (error) {
    console.error('Withdraw handler error:', error);
    await ctx.reply('❌ Failed to process withdrawal request. Please try again.');
  }
}

