/**
 * Dashboard Handler for Worker Bot - Enhanced Version
 */

import { InlineKeyboard } from 'grammy';
import type { WorkerContext } from '../worker-bot';

export async function dashboardHandler(ctx: WorkerContext) {
  const user = ctx.from;
  if (!user) return;

  try {
    const dbUser = await ctx.userRepository.getById(user.id);
    if (!dbUser?.is_agent) {
      await ctx.reply('❌ You need to be an agent to access the dashboard.');
      return;
    }

    const stats = await ctx.userRepository.getAgentStats(user.id);
    const botUsername = ctx.env.TELEGRAM_BOT_USERNAME || ctx.me.username;
    const affiliateLink = `https://t.me/${botUsername}?start=ref${user.id}`;

    // Get commission data
    const allCommissions = await ctx.commissionRepository.getByAgent(user.id);
    const pendingCommissions = allCommissions.filter(c => c.status === 'pending');
    const paidCommissions = allCommissions.filter(c => c.status === 'paid');
    const pendingAmount = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);
    const paidAmount = paidCommissions.reduce((sum, c) => sum + c.amount, 0);

    const statusEmoji = dbUser.is_super_agent ? '👑' : '🤝';
    const statusText = dbUser.is_super_agent ? 'Super Agent' : 'Agent';

    // Get recent activities (last 3 commissions)
    const recentCommissions = allCommissions.slice(-3).reverse();
    let activitiesText = '';

    if (recentCommissions.length > 0) {
      activitiesText = '\n📋 *Recent Activity:*\n';
      recentCommissions.forEach(comm => {
        const statusIcon = comm.status === 'paid' ? '✅' : '⏳';
        const date = new Date(comm.created_at * 1000).toLocaleDateString();
        activitiesText += `${statusIcon} $${comm.amount.toFixed(2)} - ${date}\n`;
      });
    }

    // Create comprehensive keyboard with all key actions
    const keyboard = new InlineKeyboard()
      .text('💰 Record Deposit', 'record_deposit')
      .text('➕ Add Customer', 'add_customer')
      .row()
      .text('💵 View Commissions', 'view_commissions')
      .text('📋 View Customers', 'view_customers')
      .row()
      .text('🔗 Get Link', 'get_link')
      .text('📱 Get QR', 'get_qr')
      .row();

    if (dbUser.is_super_agent) {
      keyboard.text('👑 Super Panel', 'super_panel');
    }

    keyboard.text('🔄 Refresh', 'refresh_dashboard');

    await ctx.reply(
      `${statusEmoji} *Your Affiliate Dashboard*\n\n` +
      `📊 *Status:* ${statusText}\n` +
      `👥 *Customers:* ${stats.customers}\n` +
      `🤝 *Sub-Agents:* ${stats.sub_agents || 0}\n\n` +
      `💰 *Earnings Summary:*\n` +
      `  • Total: $${(paidAmount + pendingAmount).toFixed(2)}\n` +
      `  • Paid: $${paidAmount.toFixed(2)}\n` +
      `  • Pending: $${pendingAmount.toFixed(2)}\n` +
      `  • Commissions: ${allCommissions.length} (${paidCommissions.length} paid)\n` +
      activitiesText +
      `\n🔗 *Your Affiliate Link:*\n\`${affiliateLink}\`\n\n` +
      `_Share your link to grow your network!_`,
      {
        reply_markup: keyboard,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      }
    );

    console.log(`Dashboard accessed by agent ${user.id}`);
  } catch (error) {
    console.error('Dashboard handler error:', error);
    await ctx.reply('❌ Failed to load dashboard. Please try again.');
  }
}