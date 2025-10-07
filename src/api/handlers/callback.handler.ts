/**
 * Callback Query Handler
 * Handles button clicks from inline keyboards
 */

import { InlineKeyboard } from 'grammy';
import type { BotContext } from '@/types/context';
import { userRepository } from '@/core/bot-database';
import { isAgent } from '@/types/user';
import { logger } from '@/utils/logger';
import { QRGenerator } from '@/utils/qr-generator';
import { config } from '@/core/config';
import { InputFile } from 'grammy';

export async function callbackHandler(ctx: BotContext) {
  await ctx.answerCallbackQuery();

  const userId = ctx.from?.id;
  if (!userId) return;

  const data = ctx.callbackQuery?.data;
  if (!data) return;

  try {
    const user = userRepository.getById(userId);

    switch (data) {
      case 'become_agent':
        await handleBecomeAgent(ctx, user);
        break;

      case 'dashboard':
      case 'refresh_dashboard':
        await handleDashboard(ctx, user);
        break;

      case 'get_link':
        await handleGetLink(ctx, user);
        break;

      case 'get_qr':
        await handleGetQR(ctx, user);
        break;

      case 'add_customer':
        // Now handled by customer.handler
        await ctx.conversation.enter('addCustomerConversation');
        break;

      case 'view_customers':
        // Redirect to customers list
        const { listCustomersHandler } = await import('./customer.handler');
        await listCustomersHandler(ctx);
        break;

      default:
        await ctx.reply('Unknown action');
    }

  } catch (error) {
    logger.error('Callback handler error:', error);
    await ctx.reply('Sorry, something went wrong. Please try again later.');
  }
}

async function handleBecomeAgent(ctx: BotContext, user: any) {
  if (user && isAgent(user)) {
    await ctx.reply("You're already an agent! 🎉");
    return;
  }

  const userId = ctx.from!.id;
  userRepository.makeAgent(userId);

  await ctx.reply(
    `🎉 Congratulations! You're now an agent!\n\n` +
    `You can now:\n` +
    `• Generate affiliate links\n` +
    `• Add customers\n` +
    `• Earn commissions\n` +
    `• Build your network\n\n` +
    `Use the menu below to get started!`
  );

  logger.info(`User ${userId} became an agent`);
}

async function handleDashboard(ctx: BotContext, user: any) {
  // Use the enhanced dashboard handler
  const { dashboardHandler } = await import('./affiliate.handler');
  await dashboardHandler(ctx);
}

async function handleGetLink(ctx: BotContext, user: any) {
  const userId = ctx.from!.id;
  
  // Re-fetch user to get latest status
  const currentUser = userRepository.getById(userId);
  
  if (!currentUser || !isAgent(currentUser)) {
    await ctx.reply("You need to be an agent to get affiliate links.");
    return;
  }
  const botUsername = ctx.me.username;
  const affiliateLink = `https://t.me/${botUsername}?start=ref${userId}`;

  await ctx.reply(
    `🔗 *Your Affiliate Link:*\n\n` +
    `\`${affiliateLink}\`\n\n` +
    `Share this link to bring customers and earn commissions!\n\n` +
    `💡 Tip: You can also generate a QR code for easier sharing!`,
    { parse_mode: 'Markdown' }
  );
}

async function handleGetQR(ctx: BotContext, user: any) {
  const userId = ctx.from!.id;
  
  // Re-fetch user to get latest status
  const currentUser = userRepository.getById(userId);
  
  if (!currentUser || !isAgent(currentUser)) {
    await ctx.reply("You need to be an agent to get QR codes.");
    return;
  }
  const botUsername = ctx.me.username;
  const affiliateLink = `https://t.me/${botUsername}?start=ref${userId}`;

  await ctx.reply('⏳ Generating QR code...');

  try {
    const qrBuffer = await QRGenerator.generateBuffer(affiliateLink);
    
    await ctx.replyWithPhoto(
      new InputFile(qrBuffer, 'qr-code.png'),
      {
        caption: '📱 Scan this QR code to access your affiliate link!',
      }
    );

  } catch (error) {
    logger.error('QR generation error:', error);
    await ctx.reply('Failed to generate QR code. Please try again.');
  }
}

async function handleAddCustomer(ctx: BotContext, user: any) {
  const userId = ctx.from!.id;
  
  // Re-fetch user to get latest status
  const currentUser = userRepository.getById(userId);
  
  if (!currentUser || !isAgent(currentUser)) {
    await ctx.reply("You need to be an agent to add customers.");
    return;
  }

  ctx.session.expecting_customer = true;

  await ctx.reply(
    `➕ *Add New Customer*\n\n` +
    `Please provide customer details in this format:\n\n` +
    `Name: John Doe\n` +
    `Phone: +1234567890\n` +
    `Email: john@example.com\n\n` +
    `Send me the details in your next message.`,
    { parse_mode: 'Markdown' }
  );
}

