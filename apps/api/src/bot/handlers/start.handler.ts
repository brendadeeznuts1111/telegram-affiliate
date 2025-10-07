/**
 * /start Command Handler (Worker Version)
 * Handles user registration and referral tracking with unified database abstraction
 */

import { InlineKeyboard } from 'grammy';
import type { WorkerContext } from '../worker-bot';

export async function startHandler(ctx: WorkerContext) {
  const user = ctx.from;
  if (!user) return;

  const userRepository = ctx.userRepository;

  try {
    // Check if user exists
    let dbUser = await userRepository.getById(user.id);

    // Extract referral code from start parameter
    const startPayload = ctx.match;
    let parentAgentId: number | undefined;

    if (startPayload && typeof startPayload === 'string') {
      const match = startPayload.match(/^ref(\d+)$/);
      if (match) {
        parentAgentId = parseInt(match[1], 10);
      }
    }

    // If new user, create account
    if (!dbUser) {
      dbUser = await userRepository.create({
        user_id: user.id,
        username: user.username || null,
        first_name: user.first_name,
        last_name: user.last_name || null,
      });

      console.log(`New user created: ${user.id}${parentAgentId ? ` (referred by ${parentAgentId})` : ''}`);

      // Make them an agent automatically
      await userRepository.makeAgent(user.id, parentAgentId);

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

    // Get agent status
    const isAgent = dbUser.is_agent === 1;

    if (isAgent) {
      // Agent menu with WebApp button
      const botUsername = ctx.env.TELEGRAM_BOT_USERNAME || 'your_bot';
      const pagesUrl = ctx.env.PUBLIC_URL?.replace('workers.dev', 'pages.dev') || 
                       'https://telegram-affiliate-dashboard.pages.dev';

      const keyboard = new InlineKeyboard()
        .webApp('📊 Open Dashboard', pagesUrl)
        .row()
        .text('🔗 Get Link', 'get_link')
        .text('📱 Get QR', 'get_qr')
        .row()
        .text('💸 Withdraw', 'withdraw');

      const stats = await userRepository.getAgentStats(user.id);
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

