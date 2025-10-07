/**
 * Customer Handler
 * Bot commands for customer management using Grammy conversations
 */

import { InlineKeyboard } from 'grammy';
import { createConversation } from '@grammyjs/conversations';
import type { BotContext } from '@/types/context';
import { userRepository } from '@/core/bot-database';
import { logger } from '@/utils/logger';
import { isAgent } from '@/types/user';
import { CustomerService } from '@/services/customer.service';

/**
 * /addcustomer - Start conversation to add a new customer
 */
export async function addCustomerHandler(ctx: BotContext) {
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
        '❌ Only agents can add customers.\n\n' +
        'Use the "Become Agent" button to get started!'
      );
      return;
    }

    // Start the conversation
    await ctx.conversation.enter('addCustomerConversation');

  } catch (error) {
    logger.error('Add customer handler error:', error);
    await ctx.reply('❌ Something went wrong. Please try again later.');
  }
}

/**
 * Add customer conversation flow
 */
export async function addCustomerConversation(conversation: any, ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    await ctx.reply(
      '👤 *Add New Customer*\n\n' +
      'Let\'s add a new customer to your network!\n\n' +
      '_Type /cancel at any time to stop_',
      { parse_mode: 'Markdown' }
    );

    // Step 1: Get customer name
    await ctx.reply('📝 Please enter the customer\'s *full name*:', {
      parse_mode: 'Markdown',
    });

    const nameResponse = await conversation.wait();
    
    // Check for cancel
    if (nameResponse.message?.text === '/cancel') {
      await ctx.reply('❌ Customer creation cancelled.');
      return;
    }

    const customerName = nameResponse.message?.text?.trim();
    if (!customerName || customerName.length < 2) {
      await ctx.reply('❌ Invalid name. Customer creation cancelled.\n\nUse /addcustomer to try again.');
      return;
    }

    // Step 2: Get customer email
    await ctx.reply('📧 Please enter the customer\'s *email address*:', {
      parse_mode: 'Markdown',
    });

    const emailResponse = await conversation.wait();

    if (emailResponse.message?.text === '/cancel') {
      await ctx.reply('❌ Customer creation cancelled.');
      return;
    }

    const customerEmail = emailResponse.message?.text?.trim();
    if (!customerEmail || !CustomerService.validateEmail(customerEmail)) {
      await ctx.reply(
        '❌ Invalid email format.\n\n' +
        'Please use a valid email like: user@example.com\n\n' +
        'Use /addcustomer to try again.'
      );
      return;
    }

    // Step 3: Get customer phone
    await ctx.reply(
      '📱 Please enter the customer\'s *phone number*:\n\n' +
      '_Include country code if international (e.g., +1234567890)_',
      { parse_mode: 'Markdown' }
    );

    const phoneResponse = await conversation.wait();

    if (phoneResponse.message?.text === '/cancel') {
      await ctx.reply('❌ Customer creation cancelled.');
      return;
    }

    const customerPhone = phoneResponse.message?.text?.trim();
    if (!customerPhone || !CustomerService.validatePhone(customerPhone)) {
      await ctx.reply(
        '❌ Invalid phone number format.\n\n' +
        'Please use a valid phone number (10-15 digits)\n\n' +
        'Use /addcustomer to try again.'
      );
      return;
    }

    // Step 4: Confirm and create
    const confirmationMessage =
      '✅ *Confirm Customer Details*\n\n' +
      `👤 Name: ${customerName}\n` +
      `📧 Email: ${customerEmail}\n` +
      `📱 Phone: ${customerPhone}\n\n` +
      'Is this correct?';

    const keyboard = new InlineKeyboard()
      .text('✅ Confirm', 'confirm_customer')
      .text('❌ Cancel', 'cancel_customer');

    await ctx.reply(confirmationMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

    // Wait for confirmation
    const confirmResponse = await conversation.wait();

    if (confirmResponse.callbackQuery?.data === 'confirm_customer') {
      await confirmResponse.answerCallbackQuery();

      // Create customer
      try {
        const customer = await CustomerService.createCustomer({
          agentId: userId,
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        });

        // Success message
        const keyboard = new InlineKeyboard()
          .text('➕ Add Another', 'add_customer')
          .text('📋 View Customers', 'view_customers')
          .row()
          .text('💰 Record Deposit', `deposit_${customer.customer_id}`);

        await ctx.reply(
          '🎉 *Customer Added Successfully!*\n\n' +
          CustomerService.formatCustomer(customer) +
          '\n\n' +
          'What would you like to do next?',
          { parse_mode: 'Markdown', reply_markup: keyboard }
        );

        logger.info(`Customer ${customer.customer_id} added by agent ${userId}`);

      } catch (error: any) {
        // Handle duplicate or other errors
        if (error.message?.includes('already exists')) {
          await ctx.reply(
            '⚠️ *Customer Already Exists*\n\n' +
            error.message +
            '\n\n' +
            'Use /customers to view your existing customers.',
            { parse_mode: 'Markdown' }
          );
        } else {
          throw error;
        }
      }

    } else {
      await confirmResponse.answerCallbackQuery();
      await ctx.reply('❌ Customer creation cancelled.\n\nUse /addcustomer to try again.');
    }

  } catch (error) {
    logger.error('Add customer conversation error:', error);
    await ctx.reply('❌ Something went wrong. Please try /addcustomer again.');
  }
}

/**
 * /customers - List all customers for the agent
 */
export async function listCustomersHandler(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    // Check if user is an agent
    const user = await userRepository.getById(userId);
    if (!user || !isAgent(user)) {
      await ctx.reply('❌ Only agents can view customers.');
      return;
    }

    // Get customers
    const customers = await CustomerService.getByAgent(userId);

    if (customers.length === 0) {
      const keyboard = new InlineKeyboard()
        .text('➕ Add First Customer', 'add_customer');

      await ctx.reply(
        '📋 *No Customers Yet*\n\n' +
        'Start building your network by adding your first customer!',
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
      return;
    }

    // Format and send customer list
    const message = CustomerService.formatCustomerList(customers);
    
    const keyboard = new InlineKeyboard()
      .text('➕ Add Customer', 'add_customer')
      .text('🔄 Refresh', 'refresh_customers');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

  } catch (error) {
    logger.error('List customers handler error:', error);
    await ctx.reply('❌ Failed to load customers. Please try again.');
  }
}

/**
 * Handle customer-related callback queries
 */
export async function customerCallbackHandler(ctx: BotContext) {
  const data = ctx.callbackQuery?.data;
  const userId = ctx.from?.id;
  
  if (!data || !userId) return;

  try {
    await ctx.answerCallbackQuery();

    switch (data) {
      case 'add_customer':
        await ctx.conversation.enter('addCustomerConversation');
        break;

      case 'view_customers':
        await listCustomersHandler(ctx);
        break;

      case 'refresh_customers':
        await listCustomersHandler(ctx);
        break;

      case 'cancel_customer':
        await ctx.reply('❌ Customer creation cancelled.');
        break;

      default:
        if (data.startsWith('deposit_')) {
          // Redirect to deposit flow
          await ctx.reply(
            '💰 Use /deposit to record a deposit\n\n' +
            'You can select the customer from the list!'
          );
        }
    }

  } catch (error) {
    logger.error('Customer callback handler error:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}
