/**
 * Deposit Handler
 * Bot commands for recording customer deposits
 */

import { InlineKeyboard } from 'grammy';
import { createConversation } from '@grammyjs/conversations';
import type { BotContext } from '@/types/context';
import { userRepository, customerRepository, depositRepository } from '@/core/bot-database';
import { logger } from '@/utils/logger';
import { isAgent } from '@/types/user';
import { CustomerService } from '@/services/customer.service';
import { EnhancedCommissionService } from '@/services/commission.service';

const commissionService = new EnhancedCommissionService();

/**
 * /deposit - Start conversation to record a deposit
 */
export async function depositHandler(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    // Check if user is an agent
    const user = await userRepository.getById(userId);
    if (!user) {
      await ctx.reply('❌ User not found. Please use /start first.');
      return;
    }

    if (!isAgent(user)) {
      await ctx.reply(
        '❌ Only agents can record deposits.\n\n' +
        'Use the "Become Agent" button to get started!'
      );
      return;
    }

    // Check if agent has customers
    const customers = await CustomerService.getByAgent(userId);
    if (customers.length === 0) {
      const keyboard = new InlineKeyboard()
        .text('➕ Add First Customer', 'add_customer');

      await ctx.reply(
        '📋 *No Customers Yet*\n\n' +
        'You need to add customers before recording deposits.\n\n' +
        'Use /addcustomer or click the button below:',
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
      return;
    }

    // Start the deposit conversation
    await ctx.conversation.enter('depositConversation');

  } catch (error) {
    logger.error('Deposit handler error:', error);
    await ctx.reply('❌ Something went wrong. Please try again later.');
  }
}

/**
 * Deposit recording conversation flow
 */
export async function depositConversation(conversation: any, ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    // Step 1: Show customer selection
    const customers = await CustomerService.getByAgent(userId);

    await ctx.reply(
      '💰 *Record Deposit*\n\n' +
      'Select a customer to record their deposit:\n\n' +
      '_Type /cancel at any time to stop_',
      { parse_mode: 'Markdown' }
    );

    // Create inline keyboard with customer buttons (max 3 per row)
    const keyboard = new InlineKeyboard();
    
    customers.slice(0, 15).forEach((customer, index) => {
      keyboard.text(
        `${customer.customer_name}`,
        `select_customer_${customer.customer_id}`
      );
      
      // New row after every 2 buttons
      if ((index + 1) % 2 === 0) {
        keyboard.row();
      }
    });

    if (customers.length > 15) {
      keyboard.row().text('📋 More customers...', 'more_customers');
    }

    await ctx.reply(
      '👤 *Select Customer:*\n\n' +
      (customers.length > 15 
        ? `Showing first 15 of ${customers.length} customers`
        : `${customers.length} customer${customers.length === 1 ? '' : 's'} available`
      ),
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );

    // Wait for customer selection
    const customerResponse = await conversation.wait();

    // Check for cancel
    if (customerResponse.message?.text === '/cancel') {
      await ctx.reply('❌ Deposit recording cancelled.');
      return;
    }

    // Handle button click
    if (!customerResponse.callbackQuery?.data?.startsWith('select_customer_')) {
      await ctx.reply('❌ Invalid selection. Deposit recording cancelled.\n\nUse /deposit to try again.');
      return;
    }

    await customerResponse.answerCallbackQuery();

    const customerId = parseInt(
      customerResponse.callbackQuery.data.replace('select_customer_', '')
    );

    // Verify customer exists and belongs to this agent
    const customer = await CustomerService.getById(customerId);
    if (!customer || customer.referred_by !== userId) {
      await ctx.reply('❌ Invalid customer. Deposit recording cancelled.');
      return;
    }

    // Show selected customer
    await ctx.reply(
      `✅ *Selected Customer:*\n\n` +
      `👤 ${customer.customer_name}\n` +
      `🆔 ID: ${customer.customer_id}`,
      { parse_mode: 'Markdown' }
    );

    // Step 2: Get deposit amount
    await ctx.reply(
      '💵 *Enter Deposit Amount*\n\n' +
      'Please enter the amount in USD:\n\n' +
      '_Examples: 100, 250.50, 1000_',
      { parse_mode: 'Markdown' }
    );

    const amountResponse = await conversation.wait();

    if (amountResponse.message?.text === '/cancel') {
      await ctx.reply('❌ Deposit recording cancelled.');
      return;
    }

    const amountText = amountResponse.message?.text?.trim();
    if (!amountText) {
      await ctx.reply('❌ No amount entered. Deposit recording cancelled.\n\nUse /deposit to try again.');
      return;
    }

    // Parse and validate amount
    const amount = parseFloat(amountText.replace(/[$,]/g, ''));
    
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply(
        '❌ Invalid amount. Please enter a positive number.\n\n' +
        'Use /deposit to try again.'
      );
      return;
    }

    if (amount > 1000000) {
      await ctx.reply(
        '❌ Amount too large (max $1,000,000).\n\n' +
        'Use /deposit to try again.'
      );
      return;
    }

    // Step 3: Confirm deposit
    const confirmMessage =
      '✅ *Confirm Deposit*\n\n' +
      `👤 Customer: ${customer.customer_name}\n` +
      `💰 Amount: $${amount.toFixed(2)}\n` +
      `💵 Currency: USD\n\n` +
      'Process this deposit?';

    const keyboard2 = new InlineKeyboard()
      .text('✅ Confirm', 'confirm_deposit')
      .text('❌ Cancel', 'cancel_deposit');

    await ctx.reply(confirmMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard2,
    });

    // Wait for confirmation
    const confirmResponse = await conversation.wait();

    if (confirmResponse.callbackQuery?.data === 'confirm_deposit') {
      await confirmResponse.answerCallbackQuery();

      // Record deposit and calculate commissions
      try {
        // Process the deposit event (this will create deposit and calculate commissions)
        await commissionService.processEvent('deposit', userId, customerId, amount);

        // Get the commission that was just created
        const commissions = await depositRepository.getByAgent(userId);
        const latestDeposit = commissions[commissions.length - 1];

        // Calculate what the agent earned (simplified - you might want to query the actual commission)
        const agentLevel = await userRepository.getById(userId);
        const baseRate = 15; // Default commission rate
        const commissionAmount = (amount * baseRate) / 100;

        // Success message
        const keyboard3 = new InlineKeyboard()
          .text('💰 Record Another', 'record_deposit')
          .text('📊 View Dashboard', 'dashboard')
          .row()
          .text('📋 View Commissions', 'view_commissions');

        await ctx.reply(
          '🎉 *Deposit Recorded Successfully!*\n\n' +
          `👤 Customer: ${customer.customer_name}\n` +
          `💰 Deposit Amount: $${amount.toFixed(2)}\n` +
          `💵 Your Commission: $${commissionAmount.toFixed(2)}\n` +
          `📊 Commission Rate: ${baseRate}%\n\n` +
          `✅ Deposit ID: ${latestDeposit?.deposit_id || 'N/A'}\n` +
          `📅 Date: ${new Date().toLocaleDateString()}\n\n` +
          `_Commission status: Pending_`,
          { parse_mode: 'Markdown', reply_markup: keyboard3 }
        );

        logger.info(
          `Deposit recorded: Agent ${userId}, Customer ${customerId}, Amount $${amount}`
        );

      } catch (error: any) {
        logger.error('Error processing deposit:', error);
        await ctx.reply(
          '❌ *Failed to Record Deposit*\n\n' +
          (error.message || 'An unexpected error occurred.') +
          '\n\nPlease try again with /deposit',
          { parse_mode: 'Markdown' }
        );
      }

    } else {
      await confirmResponse.answerCallbackQuery();
      await ctx.reply('❌ Deposit recording cancelled.\n\nUse /deposit to try again.');
    }

  } catch (error) {
    logger.error('Deposit conversation error:', error);
    await ctx.reply('❌ Something went wrong. Please try /deposit again.');
  }
}

/**
 * /deposits - List all deposits for the agent
 */
export async function listDepositsHandler(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    // Check if user is an agent
    const user = await userRepository.getById(userId);
    if (!user || !isAgent(user)) {
      await ctx.reply('❌ Only agents can view deposits.');
      return;
    }

    // Get deposits
    const deposits = await depositRepository.getByAgent(userId);

    if (deposits.length === 0) {
      const keyboard = new InlineKeyboard()
        .text('💰 Record First Deposit', 'record_deposit');

      await ctx.reply(
        '📋 *No Deposits Yet*\n\n' +
        'Start earning commissions by recording customer deposits!',
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
      return;
    }

    // Format deposit list
    let message = `💰 *Your Deposits (${deposits.length})*\n\n`;
    let totalAmount = 0;

    deposits.slice(0, 10).forEach((deposit, index) => {
      totalAmount += deposit.amount;
      message +=
        `${index + 1}. $${deposit.amount.toFixed(2)}\n` +
        `   🆔 Deposit ID: ${deposit.deposit_id}\n` +
        `   👤 Customer ID: ${deposit.customer_id}\n` +
        `   📅 ${new Date(deposit.created_at * 1000).toLocaleDateString()}\n\n`;
    });

    if (deposits.length > 10) {
      message += `\n_... and ${deposits.length - 10} more_\n\n`;
    }

    message += `💵 *Total: $${totalAmount.toFixed(2)}*`;

    const keyboard = new InlineKeyboard()
      .text('💰 Record Deposit', 'record_deposit')
      .text('🔄 Refresh', 'refresh_deposits');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

  } catch (error) {
    logger.error('List deposits handler error:', error);
    await ctx.reply('❌ Failed to load deposits. Please try again.');
  }
}

/**
 * Handle deposit-related callback queries
 */
export async function depositCallbackHandler(ctx: BotContext) {
  const data = ctx.callbackQuery?.data;
  const userId = ctx.from?.id;
  
  if (!data || !userId) return;

  try {
    await ctx.answerCallbackQuery();

    switch (data) {
      case 'record_deposit':
        await ctx.conversation.enter('depositConversation');
        break;

      case 'view_commissions':
        // Redirect to commissions handler (imported dynamically to avoid circular deps)
        const { commissionsHandler } = await import('./commission.handler');
        await commissionsHandler(ctx);
        break;

      case 'refresh_deposits':
        await listDepositsHandler(ctx);
        break;

      case 'cancel_deposit':
        await ctx.reply('❌ Deposit recording cancelled.');
        break;

      default:
        // Handle customer selection (handled in conversation)
        if (data.startsWith('select_customer_')) {
          // This is handled within the conversation flow
          return;
        }
    }

  } catch (error) {
    logger.error('Deposit callback handler error:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}
