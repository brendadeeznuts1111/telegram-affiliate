/**
 * Callback Query Handler (Worker Version)
 * Handles inline keyboard button clicks with D1
 */

import { InlineKeyboard } from 'grammy';
import type { WorkerContext } from '../worker-bot';
import { UserRepositoryD1 } from '../repositories/user.repository.d1';

export async function callbackHandler(ctx: WorkerContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const data = ctx.callbackQuery?.data;
  if (!data) return;

  const userRepo = new UserRepositoryD1(ctx.env.DB);

  try {
    switch (data) {
      case 'become_agent':
        await handleBecomeAgent(ctx, userRepo);
        break;

      case 'get_link':
        await handleGetLink(ctx);
        break;

      case 'get_qr':
        await handleGetQR(ctx);
        break;

      case 'withdraw':
        await handleWithdraw(ctx);
        break;

      default:
        await ctx.reply('Unknown action');
    }
  } catch (error) {
    console.error('Callback handler error:', error);
    await ctx.reply('Sorry, something went wrong. Please try again later.');
  }
}

async function handleBecomeAgent(ctx: WorkerContext, userRepo: UserRepositoryD1) {
  const userId = ctx.from!.id;

  try {
    // Check if already an agent
    const isAgent = await userRepo.isAgent(userId);

    if (isAgent) {
      await ctx.reply('You are already an agent! 🤝');
      return;
    }

    // Make them an agent
    await userRepo.makeAgent(userId);

    await ctx.reply(
      '🎉 Congratulations! You are now an agent!\n\n' +
      '✨ You can now:\n' +
      '• Share your referral link\n' +
      '• Earn commissions\n' +
      '• Build your network\n\n' +
      'Use /dashboard to get started!'
    );

    console.log(`User ${userId} became an agent`);
  } catch (error) {
    console.error('Become agent error:', error);
    await ctx.reply('❌ Failed to make you an agent. Please try again.');
  }
}

async function handleGetLink(ctx: WorkerContext) {
  const userId = ctx.from!.id;
  const botUsername = ctx.env.TELEGRAM_BOT_USERNAME || 'your_bot';
  const affiliateLink = `https://t.me/${botUsername}?start=ref${userId}`;

  await ctx.reply(
    `🔗 *Your Affiliate Link:*\n\n` +
    `\`${affiliateLink}\`\n\n` +
    `Share this link to earn commissions!`,
    { parse_mode: 'Markdown' }
  );
}

async function handleGetQR(ctx: WorkerContext) {
  const userId = ctx.from!.id;
  const workerUrl = ctx.env.PUBLIC_URL || 'https://telegram-affiliate-api.workers.dev';
  const qrUrl = `${workerUrl}/api/affiliate/qr/${userId}`;

  await ctx.reply(
    `📱 *Your QR Code:*\n\n` +
    `${qrUrl}\n\n` +
    `Share this QR code for quick referrals!`,
    { parse_mode: 'Markdown' }
  );
}

async function handleWithdraw(ctx: WorkerContext) {
  await ctx.reply(
    `💸 *Withdrawal Process:*\n\n` +
    `To request a withdrawal:\n` +
    `1. Open your dashboard (/dashboard)\n` +
    `2. Click on the withdrawal section\n` +
    `3. Enter your wallet address\n` +
    `4. Confirm the amount\n\n` +
    `Or use the command: /withdraw`,
    { parse_mode: 'Markdown' }
  );
}

