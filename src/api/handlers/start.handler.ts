/**
 * Start Command Handler
 * Handles /start command and referral deep links
 */

import { InlineKeyboard } from 'grammy';
import type { BotContext } from '@/types/context';
import { userRepository } from '@/core/bot-database';
import { logger } from '@/utils/logger';
import { isAgent } from '@/types/user';

export async function startHandler(ctx: BotContext) {
  const user = ctx.from;
  if (!user) return;

  try {
    // Check if user exists in database
    let dbUser = await userRepository.getById(user.id);

    // Create user if doesn't exist
    if (!dbUser) {
      dbUser = await userRepository.create({
        user_id: user.id,
        username: user.username || null,
        first_name: user.first_name,
        last_name: user.last_name || null,
      });
    }

    // Handle referral links (format: /start ref123456)
    const payload = ctx.match;
    if (payload && typeof payload === 'string' && payload.startsWith('ref')) {
      const referrerId = parseInt(payload.substring(3), 10);
      
      if (!isNaN(referrerId) && referrerId !== user.id) {
        const referrer = await userRepository.getById(referrerId);
        
        if (referrer && isAgent(referrer)) {
          await ctx.reply(
            `🎉 Welcome! You've been referred by ${referrer.first_name}!\n\n` +
            `They will be your dedicated agent and help you with all your needs.`
          );
          
          // Notify referrer
          await ctx.api.sendMessage(
            referrerId,
            `🔔 New user joined through your referral link!\n` +
            `User: ${user.first_name}` +
            (user.username ? ` (@${user.username})` : '')
          );
          
          logger.info(`User ${user.id} referred by agent ${referrerId}`);
        }
      }
    }

    // Show menu based on agent status
    if (isAgent(dbUser)) {
      // Agent menu - no "Become Agent" button
      const keyboard = new InlineKeyboard()
        .text('📊 My Dashboard', 'dashboard').row()
        .text('🔗 Get Affiliate Link', 'get_link')
        .text('📱 Get QR Code', 'get_qr').row()
        .text('➕ Add Customer', 'add_customer');

      const statusEmoji = dbUser.is_super_agent ? '⭐' : '🤝';
      const statusText = dbUser.is_super_agent ? 'Super Agent' : 'Agent';

      await ctx.reply(
        `Welcome back, ${user.first_name}! ${statusEmoji}\n\n` +
        `${statusEmoji} Status: *${statusText}*\n` +
        `👥 Customers: ${dbUser.total_customers || 0}\n` +
        `💰 Net Deposits: $${(dbUser.net_deposited || 0).toFixed(2)}\n\n` +
        `What would you like to do?`,
        { reply_markup: keyboard, parse_mode: 'Markdown' }
      );
    } else {
      // Non-agent menu - show "Become Agent" button
      const keyboard = new InlineKeyboard()
        .text('🤝 Become Agent', 'become_agent');

      await ctx.reply(
        `Welcome ${user.first_name}! 🎉\n\n` +
        `I'm your Affiliate Management Bot.\n\n` +
        `To start earning commissions and building your network, ` +
        `become an agent by clicking the button below:`,
        { reply_markup: keyboard }
      );
    }

    logger.info(`User ${user.id} started bot`);

  } catch (error) {
    logger.error('Start handler error:', error);
    await ctx.reply('Sorry, something went wrong. Please try again later.');
  }
}

