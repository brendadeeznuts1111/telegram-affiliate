/**
 * Affiliate Command Handlers
 * Enhanced commands for affiliate empire management
 */

import { InlineKeyboard } from 'grammy';
import type { BotContext } from '@/types/context';
import { userRepository } from '@/repositories/user.repository';
import { commissionRepository } from '@/repositories/commission.repository';
import { logger } from '@/utils/logger';
import { isAgent } from '@/types/user';
import { config } from '@/core/config';

/**
 * /dashboard - Enhanced affiliate dashboard
 */
export async function dashboardHandler(ctx: BotContext) {
  const user = ctx.from;
  if (!user) return;

  try {
    const dbUser = userRepository.getById(user.id);
    if (!dbUser || !isAgent(dbUser)) {
      await ctx.reply('❌ You need to be an agent to access the dashboard.');
      return;
    }

    const stats = userRepository.getAgentStats(user.id);
    const botUsername = ctx.me.username;
    const affiliateLink = `https://t.me/${botUsername}?start=ref${user.id}`;
    
    // Get pending vs paid commissions
    const pendingCommissions = commissionRepository.getPendingByAgent(user.id);
    const pendingAmount = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);
    
    const statusEmoji = dbUser.is_super_agent ? '👑' : '🤝';
    const statusText = dbUser.is_super_agent ? 'Super Agent' : 'Agent';

    const keyboard = new InlineKeyboard()
      .text('🔗 Get Link', 'get_link')
      .text('📱 Get QR', 'get_qr').row()
      .text('💸 Withdraw', 'withdraw')
      .text('🔄 Refresh', 'refresh_dashboard');

    if (dbUser.is_super_agent) {
      keyboard.row().text('👑 Super Panel', 'super_panel');
    }

    await ctx.reply(
      `${statusEmoji} *Your Affiliate Dashboard*\n\n` +
      `📊 *Status:* ${statusText}\n` +
      `👥 *Customers:* ${stats.customers}\n` +
      `🤝 *Sub-Agents:* ${stats.sub_agents}\n\n` +
      `💰 *Earnings:*\n` +
      `  • Paid: ${config.commission.currency}${stats.commission.toFixed(2)}\n` +
      `  • Pending: ${config.commission.currency}${pendingAmount.toFixed(2)}\n\n` +
      `🔗 *Your Link:*\n\`${affiliateLink}\`\n\n` +
      `_Share to earn commissions!_`,
      { 
        reply_markup: keyboard, 
        parse_mode: 'Markdown',
        disable_web_page_preview: true 
      }
    );

    logger.info(`Dashboard accessed by agent ${user.id}`);
  } catch (error) {
    logger.error('Dashboard handler error:', error);
    await ctx.reply('❌ Failed to load dashboard. Please try again.');
  }
}

/**
 * /withdraw - Withdrawal command
 */
export async function withdrawHandler(ctx: BotContext) {
  const user = ctx.from;
  if (!user) return;

  try {
    const dbUser = userRepository.getById(user.id);
    if (!dbUser || !isAgent(dbUser)) {
      await ctx.reply('❌ You need to be an agent to withdraw earnings.');
      return;
    }

    const stats = userRepository.getAgentStats(user.id);
    const minWithdrawal = parseFloat(Bun.env.MIN_WITHDRAWAL || '10');

    if (stats.commission < minWithdrawal) {
      await ctx.reply(
        `❌ Minimum withdrawal amount is ${config.commission.currency}${minWithdrawal}.\n\n` +
        `Your current balance: ${config.commission.currency}${stats.commission.toFixed(2)}`
      );
      return;
    }

    const keyboard = new InlineKeyboard()
      .text('💎 TON (USDT)', 'withdraw_ton')
      .text('🟢 TRON (USDT)', 'withdraw_tron').row()
      .text('🏦 Bank Transfer', 'withdraw_bank')
      .text('❌ Cancel', 'cancel_withdraw');

    await ctx.reply(
      `💸 *Withdrawal Request*\n\n` +
      `Available Balance: ${config.commission.currency}${stats.commission.toFixed(2)}\n` +
      `Minimum Withdrawal: ${config.commission.currency}${minWithdrawal}\n\n` +
      `Select withdrawal method:`,
      { reply_markup: keyboard, parse_mode: 'Markdown' }
    );

    logger.info(`Withdrawal initiated by agent ${user.id}`);
  } catch (error) {
    logger.error('Withdraw handler error:', error);
    await ctx.reply('❌ Failed to process withdrawal. Please try again.');
  }
}

/**
 * /super - Super agent panel
 */
export async function superHandler(ctx: BotContext) {
  const user = ctx.from;
  if (!user) return;

  try {
    const dbUser = userRepository.getById(user.id);
    
    if (!dbUser || !dbUser.is_super_agent) {
      await ctx.reply('❌ This command is only available to Super Agents.');
      return;
    }

    const subAgents = userRepository.getSubAgents(user.id);
    const stats = userRepository.getAgentStats(user.id);
    
    // Calculate total override (super agent earns from sub-agents)
    let totalOverride = 0;
    const subAgentsList = subAgents.map((agent, idx) => {
      const agentStats = userRepository.getAgentStats(agent.user_id);
      const override = agentStats.commission * 0.5; // 50% override
      totalOverride += override;
      
      return `${idx + 1}. ${agent.first_name}: ${agentStats.customers} customers, ${config.commission.currency}${override.toFixed(2)} override`;
    });

    const keyboard = new InlineKeyboard()
      .text('📢 Broadcast Message', 'broadcast_message')
      .text('➕ Add Sub-Agent', 'add_sub_agent').row()
      .text('📊 Detailed Stats', 'super_detailed_stats')
      .text('🔄 Refresh', 'refresh_super');

    await ctx.reply(
      `👑 *Super Agent Panel*\n\n` +
      `🤝 *Sub-Agents:* ${subAgents.length}\n` +
      `💰 *Total Override:* ${config.commission.currency}${totalOverride.toFixed(2)}\n` +
      `👥 *Total Customers:* ${stats.customers}\n` +
      `💵 *Direct Earnings:* ${config.commission.currency}${stats.commission.toFixed(2)}\n\n` +
      `📋 *Your Agents:*\n${subAgentsList.length > 0 ? subAgentsList.join('\n') : '_No sub-agents yet_'}\n\n` +
      `_Grow your empire by recruiting more agents!_`,
      { reply_markup: keyboard, parse_mode: 'Markdown' }
    );

    logger.info(`Super panel accessed by ${user.id}`);
  } catch (error) {
    logger.error('Super handler error:', error);
    await ctx.reply('❌ Failed to load super agent panel. Please try again.');
  }
}

/**
 * /qr - Quick QR code generation
 */
export async function qrHandler(ctx: BotContext) {
  const user = ctx.from;
  if (!user) return;

  try {
    const dbUser = userRepository.getById(user.id);
    if (!dbUser || !isAgent(dbUser)) {
      await ctx.reply('❌ You need to be an agent to generate QR codes.');
      return;
    }

    const botUsername = ctx.me.username;
    const affiliateLink = `https://t.me/${botUsername}?start=ref${user.id}`;
    
    // Use existing QR generator
    const { QRGenerator } = await import('@/utils/qr-generator');
    const { InputFile } = await import('grammy');
    
    await ctx.reply('⏳ Generating QR code...');

    const qrBuffer = await QRGenerator.generateBuffer(affiliateLink);
    
    await ctx.replyWithPhoto(
      new InputFile(qrBuffer, `qr-${user.id}.png`),
      {
        caption: 
          `📱 *Your Affiliate QR Code*\n\n` +
          `Share this with potential customers!\n` +
          `Link: \`${affiliateLink}\``,
        parse_mode: 'Markdown'
      }
    );

    logger.info(`QR code generated for agent ${user.id}`);
  } catch (error) {
    logger.error('QR handler error:', error);
    await ctx.reply('❌ Failed to generate QR code. Please try again.');
  }
}

