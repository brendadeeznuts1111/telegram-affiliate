/**
 * /start Command Handler (Worker Version)
 * Handles user registration and referral tracking with D1
 */

import { InlineKeyboard } from 'grammy';
import type { WorkerContext } from '../worker-bot';
import { UserRepositoryD1 } from '../repositories/user.repository.d1';

export async function startHandler(ctx: WorkerContext) {
  const user = ctx.from;
  if (!user) return;

  const userRepo = new UserRepositoryD1(ctx.env.DB);

  try {
    // Check if user exists
    let dbUser = await userRepo.getByTelegramId(user.id);

    // Extract referral code from start parameter
    const startPayload = ctx.match;
    let referrerId: number | undefined;

    if (startPayload && typeof startPayload === 'string') {
      const match = startPayload.match(/^ref(\d+)$/);
      if (match) {
        referrerId = parseInt(match[1], 10);
      }
    }

    // If new user, create account
    if (!dbUser) {
      dbUser = await userRepo.create({
        telegram_id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        parent_agent_id: referrerId,
      });

      console.log(`New user created: ${user.id}${referrerId ? ` (referred by ${referrerId})` : ''}`);

      // Make them an agent automatically
      await userRepo.makeAgent(user.id);

      // Send welcome message for new user
      await ctx.reply(
        `🎉 Welcome ${user.first_name}!\n\n` +
        `You've been registered as an affiliate agent.\n\n` +
        `✨ Start earning commissions by:\n` +
        `1. Sharing your referral link\n` +
        `2. Building your network\n` +
        `3. Tracking your earnings\n\n` +
        `Use /dashboard to get started!`
      );
    }

    // Check if user is an agent
    const isAgent = await userRepo.isAgent(user.id);

    if (isAgent) {
      // Agent menu with WebApp button
      const botUsername = ctx.env.TELEGRAM_BOT_USERNAME || 'your_bot';
      const pagesUrl = ctx.env.PUBLIC_URL?.replace('workers.dev', 'pages.dev') || 
                       'https://telegram-affiliate-dashboard.pages.dev';

      const keyboard = new InlineKeyboard()
        .webApp('📊 Open Dashboard', pagesUrl) // ← Mini App button!
        .row()
        .text('🔗 Get Link', 'get_link')
        .text('📱 Get QR', 'get_qr')
        .row()
        .text('💸 Withdraw', 'withdraw');

      const stats = await userRepo.getAgentStats(user.id);
      const affiliateLink = `https://t.me/${botUsername}?start=ref${user.id}`;

      const statusEmoji = dbUser.is_super_agent ? '👑' : '🤝';
      const statusText = dbUser.is_super_agent ? 'Super Agent' : 'Agent';

      await ctx.reply(
        `Welcome back, ${user.first_name}! ${statusEmoji}\n\n` +
        `${statusEmoji} Status: *${statusText}*\n` +
        `👥 Customers: ${stats.customers}\n` +
        `💰 Commission: $${stats.commission.toFixed(2)}\n` +
        `🤝 Sub-Agents: ${stats.sub_agents}\n\n` +
        `🔗 Your Link:\n\`${affiliateLink}\`\n\n` +
        `Click below to open your dashboard!`,
        {
          reply_markup: keyboard,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }
      );
    } else {
      // Non-agent menu
      const keyboard = new InlineKeyboard()
        .text('🤝 Become Agent', 'become_agent');

      await ctx.reply(
        `Welcome ${user.first_name}! 🎉\n\n` +
        `To start earning commissions, become an agent:`,
        { reply_markup: keyboard }
      );
    }

    console.log(`User ${user.id} started bot (agent: ${isAgent})`);
  } catch (error) {
    console.error('Start handler error:', error);
    await ctx.reply('❌ Something went wrong. Please try again later.');
  }
}

