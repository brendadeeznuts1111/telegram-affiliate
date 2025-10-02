/**
 * /dashboard Command Handler (Worker Version)
 * Opens Telegram Mini App dashboard with D1
 */

import { InlineKeyboard } from 'grammy';
import type { WorkerContext } from '../worker-bot';
import { UserRepositoryD1 } from '../repositories/user.repository.d1';

export async function dashboardHandler(ctx: WorkerContext) {
  const user = ctx.from;
  if (!user) return;

  const userRepo = new UserRepositoryD1(ctx.env.DB);

  try {
    // Check if user is an agent
    const isAgent = await userRepo.isAgent(user.id);

    if (!isAgent) {
      await ctx.reply('❌ You need to be an agent to access the dashboard.');
      return;
    }

    // Get user and stats
    const dbUser = await userRepo.getByTelegramId(user.id);
    const stats = await userRepo.getAgentStats(user.id);

    if (!dbUser) {
      await ctx.reply('❌ User not found. Please /start first.');
      return;
    }

    // Construct Pages URL for Mini App
    const pagesUrl = ctx.env.PUBLIC_URL?.replace('workers.dev', 'pages.dev') || 
                     'https://telegram-affiliate-dashboard.pages.dev';

    // Create WebApp button
    const keyboard = new InlineKeyboard()
      .webApp('📊 Open Dashboard', pagesUrl); // ← Opens Vue Mini App!

    const statusEmoji = dbUser.is_super_agent ? '👑' : '🤝';
    const statusText = dbUser.is_super_agent ? 'Super Agent' : 'Agent';
    const botUsername = ctx.env.TELEGRAM_BOT_USERNAME || 'your_bot';
    const affiliateLink = `https://t.me/${botUsername}?start=ref${user.id}`;

    // Get pending commissions
    const pendingResult = await ctx.env.DB
      .prepare('SELECT COALESCE(SUM(amount), 0) as total FROM commissions WHERE agent_id = (SELECT id FROM users WHERE telegram_id = ?) AND is_paid = 0')
      .bind(user.id)
      .first<{ total: number }>();

    const pendingAmount = pendingResult?.total || 0;

    await ctx.reply(
      `${statusEmoji} *Your Affiliate Dashboard*\n\n` +
      `📊 *Status:* ${statusText}\n` +
      `👥 *Customers:* ${stats.customers}\n` +
      `🤝 *Sub-Agents:* ${stats.sub_agents}\n\n` +
      `💰 *Earnings:*\n` +
      `  • Paid: $${stats.commission.toFixed(2)}\n` +
      `  • Pending: $${pendingAmount.toFixed(2)}\n\n` +
      `🔗 *Your Link:*\n\`${affiliateLink}\`\n\n` +
      `_Click below to open your interactive dashboard!_`,
      {
        reply_markup: keyboard,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }
    );

    console.log(`Dashboard accessed by agent ${user.id}`);
  } catch (error) {
    console.error('Dashboard handler error:', error);
    await ctx.reply('❌ Failed to load dashboard. Please try again.');
  }
}

