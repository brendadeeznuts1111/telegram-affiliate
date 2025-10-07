/**
 * Unified Callback Handler - Worker Version
 * Routes all inline keyboard button clicks
 */

import { InlineKeyboard, InputFile } from 'grammy';
import type { WorkerContext } from '../worker-bot';
import { customerCallbackHandler } from './customer.handler';
import { depositCallbackHandler } from './deposit.handler';
import { commissionCallbackHandler } from './commission.handler';
import { dashboardHandler } from './dashboard.handler';

export async function callbackHandler(ctx: WorkerContext) {
  const data = ctx.callbackQuery?.data;
  const userId = ctx.from?.id;

  if (!data || !userId) return;

  try {
    await ctx.answerCallbackQuery();

    // Route to specialized handlers
    // Customer-related callbacks
    if (
      data === 'add_customer' ||
      data === 'view_customers' ||
      data === 'refresh_customers' ||
      data === 'confirm_customer' ||
      data === 'cancel_customer' ||
      data.startsWith('deposit_')
    ) {
      const handled = await customerCallbackHandler(ctx);
      if (handled) return;
    }

    // Deposit-related callbacks
    if (
      data === 'record_deposit' ||
      data === 'refresh_deposits' ||
      data === 'confirm_deposit' ||
      data === 'cancel_deposit' ||
      data.startsWith('select_customer_')
    ) {
      const handled = await depositCallbackHandler(ctx);
      if (handled) return;
    }

    // Commission-related callbacks
    if (
      data === 'view_commissions' ||
      data.startsWith('comm_')
    ) {
      const handled = await commissionCallbackHandler(ctx);
      if (handled) return;
    }

    // Dashboard callbacks
    if (data === 'dashboard' || data === 'refresh_dashboard') {
      await dashboardHandler(ctx);
      return;
    }

    // Agent callbacks
    if (data === 'become_agent') {
      await handleBecomeAgent(ctx);
      return;
    }

    // Link callbacks
    if (data === 'get_link') {
      await handleGetLink(ctx);
      return;
    }

    // QR code callbacks
    if (data === 'get_qr') {
      await handleGetQR(ctx);
      return;
    }

    // Super panel callback
    if (data === 'super_panel') {
      await handleSuperPanel(ctx);
      return;
    }

    // Fallback
    await ctx.reply('❌ Unknown action. Please try again.');

  } catch (error) {
    console.error('Callback handler error:', error);
    await ctx.reply('❌ Something went wrong. Please try again later.');
  }
}

/**
 * Handle "Become Agent" button
 */
async function handleBecomeAgent(ctx: WorkerContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const user = await ctx.userRepository.getById(userId);

    if (user?.is_agent) {
      await ctx.reply('✅ You are already an agent!\n\nUse /dashboard to access your panel.');
      return;
    }

    // Update user to agent status
    if (user) {
      await ctx.userRepository.update(user.id, { is_agent: true });
    } else {
      // Create new user as agent
      await ctx.userRepository.create({
        telegram_id: userId,
        username: ctx.from.username || null,
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name || null,
        is_agent: true,
        is_super_agent: false,
        referred_by: null,
        is_blocked: false,
      });
    }

    const keyboard = new InlineKeyboard()
      .text('📊 Dashboard', 'dashboard')
      .text('➕ Add Customer', 'add_customer')
      .row()
      .text('🔗 Get Link', 'get_link')
      .text('📱 Get QR', 'get_qr');

    await ctx.reply(
      '🎉 *Welcome, Agent!*\n\n' +
      'You are now an affiliate agent!\n\n' +
      '🚀 *Next Steps:*\n' +
      '1. Get your affiliate link\n' +
      '2. Add your first customer\n' +
      '3. Record deposits to earn commissions\n\n' +
      '_Start building your network today!_',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );

  } catch (error) {
    console.error('Become agent error:', error);
    await ctx.reply('❌ Failed to activate agent status. Please try again.');
  }
}

/**
 * Handle "Get Link" button
 */
async function handleGetLink(ctx: WorkerContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const user = await ctx.userRepository.getById(userId);
    if (!user?.is_agent) {
      await ctx.reply('❌ Only agents have referral links.');
      return;
    }

    const botUsername = ctx.env.TELEGRAM_BOT_USERNAME || ctx.me.username;
    const affiliateLink = `https://t.me/${botUsername}?start=ref${userId}`;

    await ctx.reply(
      '🔗 *Your Affiliate Link*\n\n' +
      `\`${affiliateLink}\`\n\n` +
      '*Share this link to:*\n' +
      '• Recruit new agents\n' +
      '• Build your network\n' +
      '• Earn multi-level commissions\n\n' +
      '_Tap to copy, then share everywhere!_',
      { parse_mode: 'Markdown' }
    );

  } catch (error) {
    console.error('Get link error:', error);
    await ctx.reply('❌ Failed to generate link. Please try again.');
  }
}

/**
 * Handle "Get QR" button
 */
async function handleGetQR(ctx: WorkerContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const user = await ctx.userRepository.getById(userId);
    if (!user?.is_agent) {
      await ctx.reply('❌ Only agents have QR codes.');
      return;
    }

    const botUsername = ctx.env.TELEGRAM_BOT_USERNAME || ctx.me.username;
    const affiliateLink = `https://t.me/${botUsername}?start=ref${userId}`;

    // Generate QR code using external service
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(affiliateLink)}`;

    await ctx.replyWithPhoto(qrUrl, {
      caption:
        '📱 *Your Affiliate QR Code*\n\n' +
        'People can scan this to join your network!\n\n' +
        `🔗 Link: \`${affiliateLink}\``,
      parse_mode: 'Markdown',
    });

  } catch (error) {
    console.error('Get QR error:', error);
    await ctx.reply('❌ Failed to generate QR code. Please try again.');
  }
}

/**
 * Handle "Super Panel" button
 */
async function handleSuperPanel(ctx: WorkerContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const user = await ctx.userRepository.getById(userId);
    if (!user?.is_super_agent) {
      await ctx.reply('❌ Only super agents can access this panel.');
      return;
    }

    // Get super agent stats
    const stats = await ctx.userRepository.getAgentStats(userId);
    const allCommissions = await ctx.commissionRepository.getByAgent(userId);
    const totalEarnings = allCommissions.reduce((sum, c) => sum + c.amount, 0);

    const keyboard = new InlineKeyboard()
      .text('👥 View Network', 'view_network')
      .text('💰 All Commissions', 'view_commissions')
      .row()
      .text('📊 Dashboard', 'dashboard');

    await ctx.reply(
      '👑 *Super Agent Panel*\n\n' +
      `📊 *Network Overview:*\n` +
      `  • Total Agents: ${stats.sub_agents || 0}\n` +
      `  • Total Customers: ${stats.customers}\n` +
      `  • Total Earnings: $${totalEarnings.toFixed(2)}\n\n` +
      '_Manage your entire network from here_',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );

  } catch (error) {
    console.error('Super panel error:', error);
    await ctx.reply('❌ Failed to load super panel. Please try again.');
  }
}