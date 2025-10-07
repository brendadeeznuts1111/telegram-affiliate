/**
 * Customer Handler - Worker Version
 * Simplified state machine for customer management
 */

import { InlineKeyboard } from 'grammy';
import type { WorkerContext } from '../worker-bot';
import { CustomerService } from '../services/customer.service';

interface CustomerState {
  step: 'name' | 'email' | 'phone' | 'confirm';
  name?: string;
  email?: string;
  phone?: string;
}

/**
 * /addcustomer - Start customer creation flow
 */
export async function addCustomerHandler(ctx: WorkerContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    // Check if user is an agent
    const user = await ctx.userRepository.getById(userId);
    if (!user?.is_agent) {
      await ctx.reply(
        '❌ Only agents can add customers.\n\n' +
        'Use the "Become Agent" button to get started!'
      );
      return;
    }

    // Initialize conversation state in KV
    const state: CustomerState = { step: 'name' };
    await ctx.env.AFFILIATE_KV.put(
      `customer_flow:${userId}`,
      JSON.stringify(state),
      { expirationTtl: 600 } // 10 minutes
    );

    await ctx.reply(
      '👤 *Add New Customer*\n\n' +
      'Let\'s add a new customer to your network!\n\n' +
      '📝 Please enter the customer\'s *full name*:\n\n' +
      '_Type /cancel to stop_',
      { parse_mode: 'Markdown' }
    );

  } catch (error) {
    console.error('Add customer handler error:', error);
    await ctx.reply('❌ Something went wrong. Please try again later.');
  }
}

/**
 * /customers - List all customers
 */
export async function listCustomersHandler(ctx: WorkerContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const user = await ctx.userRepository.getById(userId);
    if (!user?.is_agent) {
      await ctx.reply('❌ Only agents can view customers.');
      return;
    }

    const customerService = new CustomerService(ctx.customerRepository);
    const customers = await customerService.getByAgent(userId);

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

    const message = CustomerService.formatCustomerList(customers);
    
    const keyboard = new InlineKeyboard()
      .text('➕ Add Customer', 'add_customer')
      .text('🔄 Refresh', 'refresh_customers');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

  } catch (error) {
    console.error('List customers error:', error);
    await ctx.reply('❌ Failed to load customers. Please try again.');
  }
}

/**
 * Handle customer flow messages
 */
export async function handleCustomerFlow(ctx: WorkerContext) {
  const userId = ctx.from?.id;
  const text = ctx.message?.text;
  
  if (!userId || !text) return false;

  // Get current state from KV
  const stateData = await ctx.env.AFFILIATE_KV.get(`customer_flow:${userId}`);
  if (!stateData) return false; // Not in customer flow

  const state: CustomerState = JSON.parse(stateData);
  const customerService = new CustomerService(ctx.customerRepository);

  try {
    // Check for cancel
    if (text === '/cancel') {
      await ctx.env.AFFILIATE_KV.delete(`customer_flow:${userId}`);
      await ctx.reply('❌ Customer creation cancelled.');
      return true;
    }

    switch (state.step) {
      case 'name':
        if (text.trim().length < 2) {
          await ctx.reply('❌ Name must be at least 2 characters. Please try again:');
          return true;
        }
        
        state.name = text.trim();
        state.step = 'email';
        
        await ctx.env.AFFILIATE_KV.put(
          `customer_flow:${userId}`,
          JSON.stringify(state),
          { expirationTtl: 600 }
        );
        
        await ctx.reply('📧 Please enter the customer\'s *email address*:', {
          parse_mode: 'Markdown',
        });
        break;

      case 'email':
        if (!CustomerService.validateEmail(text.trim())) {
          await ctx.reply(
            '❌ Invalid email format.\n\n' +
            'Please use a valid email like: user@example.com'
          );
          return true;
        }
        
        state.email = text.trim();
        state.step = 'phone';
        
        await ctx.env.AFFILIATE_KV.put(
          `customer_flow:${userId}`,
          JSON.stringify(state),
          { expirationTtl: 600 }
        );
        
        await ctx.reply(
          '📱 Please enter the customer\'s *phone number*:\n\n' +
          '_Include country code if international (e.g., +1234567890)_',
          { parse_mode: 'Markdown' }
        );
        break;

      case 'phone':
        if (!CustomerService.validatePhone(text.trim())) {
          await ctx.reply(
            '❌ Invalid phone number format.\n\n' +
            'Please use a valid phone number (10-15 digits)'
          );
          return true;
        }
        
        state.phone = text.trim();
        state.step = 'confirm';
        
        await ctx.env.AFFILIATE_KV.put(
          `customer_flow:${userId}`,
          JSON.stringify(state),
          { expirationTtl: 600 }
        );
        
        const confirmationMessage =
          '✅ *Confirm Customer Details*\n\n' +
          `👤 Name: ${state.name}\n` +
          `📧 Email: ${state.email}\n` +
          `📱 Phone: ${state.phone}\n\n` +
          'Is this correct?';

        const keyboard = new InlineKeyboard()
          .text('✅ Confirm', 'confirm_customer')
          .text('❌ Cancel', 'cancel_customer');

        await ctx.reply(confirmationMessage, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
        break;
    }

    return true;

  } catch (error) {
    console.error('Customer flow error:', error);
    await ctx.env.AFFILIATE_KV.delete(`customer_flow:${userId}`);
    await ctx.reply('❌ Something went wrong. Please use /addcustomer to try again.');
    return true;
  }
}

/**
 * Handle customer callbacks
 */
export async function customerCallbackHandler(ctx: WorkerContext) {
  const data = ctx.callbackQuery?.data;
  const userId = ctx.from?.id;
  
  if (!data || !userId) return false;

  await ctx.answerCallbackQuery();

  try {
    switch (data) {
      case 'add_customer':
        await addCustomerHandler(ctx);
        return true;

      case 'view_customers':
      case 'refresh_customers':
        await listCustomersHandler(ctx);
        return true;

      case 'confirm_customer':
        // Get state from KV
        const stateData = await ctx.env.AFFILIATE_KV.get(`customer_flow:${userId}`);
        if (!stateData) {
          await ctx.reply('❌ Session expired. Please use /addcustomer to try again.');
          return true;
        }

        const state: CustomerState = JSON.parse(stateData);
        
        if (!state.name || !state.email || !state.phone) {
          await ctx.reply('❌ Missing customer data. Please use /addcustomer to try again.');
          await ctx.env.AFFILIATE_KV.delete(`customer_flow:${userId}`);
          return true;
        }

        // Create customer
        const customerService = new CustomerService(ctx.customerRepository);
        
        try {
          const customer = await customerService.createCustomer({
            agentId: userId,
            name: state.name,
            email: state.email,
            phone: state.phone,
          });

          // Clear state
          await ctx.env.AFFILIATE_KV.delete(`customer_flow:${userId}`);

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

        } catch (error: any) {
          await ctx.env.AFFILIATE_KV.delete(`customer_flow:${userId}`);
          
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
        
        return true;

      case 'cancel_customer':
        await ctx.env.AFFILIATE_KV.delete(`customer_flow:${userId}`);
        await ctx.reply('❌ Customer creation cancelled.');
        return true;

      default:
        if (data.startsWith('deposit_')) {
          await ctx.reply(
            '💰 Use /deposit to record a deposit\n\n' +
            'You can select the customer from the list!'
          );
          return true;
        }
        return false;
    }

  } catch (error) {
    console.error('Customer callback error:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
    return true;
  }
}
