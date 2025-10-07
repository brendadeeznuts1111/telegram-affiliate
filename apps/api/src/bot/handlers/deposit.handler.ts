/**
 * Deposit Handler - Worker Version
 * Simplified state machine for deposit recording
 */

import { InlineKeyboard } from 'grammy';
import type { WorkerContext } from '../worker-bot';
import { CommissionService } from '../services/commission.service';
import { CustomerService } from '../services/customer.service';

interface DepositState {
  step: 'select_customer' | 'amount' | 'confirm';
  customerId?: string;
  customerName?: string;
  amount?: number;
}

/**
 * /deposit - Start deposit recording flow
 */
export async function depositHandler(ctx: WorkerContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    // Check if user is an agent
    const user = await ctx.userRepository.getById(userId);
    if (!user?.is_agent) {
      await ctx.reply(
        '❌ Only agents can record deposits.\n\n' +
        'Use the "Become Agent" button to get started!'
      );
      return;
    }

    // Get agent's customers
    const customerService = new CustomerService(ctx.customerRepository);
    const customers = await customerService.getByAgent(userId);

    if (customers.length === 0) {
      const keyboard = new InlineKeyboard()
        .text('➕ Add Customer', 'add_customer');

      await ctx.reply(
        '❌ *No Customers Found*\n\n' +
        'You need to add customers before recording deposits.',
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
      return;
    }

    // Show customer selection keyboard
    const keyboard = new InlineKeyboard();
    
    customers.slice(0, 10).forEach(customer => {
      keyboard
        .text(customer.name, `select_customer_${customer.customer_id}`)
        .row();
    });
    
    keyboard.text('❌ Cancel', 'cancel_deposit');

    await ctx.reply(
      '💰 *Record Deposit*\n\n' +
      'Select the customer who made the deposit:',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );

  } catch (error) {
    console.error('Deposit handler error:', error);
    await ctx.reply('❌ Something went wrong. Please try again later.');
  }
}

/**
 * /deposits - List all deposits
 */
export async function listDepositsHandler(ctx: WorkerContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const user = await ctx.userRepository.getById(userId);
    if (!user?.is_agent) {
      await ctx.reply('❌ Only agents can view deposits.');
      return;
    }

    // Get deposits for this agent's customers
    const customerService = new CustomerService(ctx.customerRepository);
    const customers = await customerService.getByAgent(userId);
    const customerIds = customers.map(c => c.customer_id);

    // Get all deposits for these customers
    let allDeposits: any[] = [];
    for (const customerId of customerIds) {
      const deposits = await ctx.depositRepository.getByCustomer(customerId);
      allDeposits = allDeposits.concat(
        deposits.map(d => ({
          ...d,
          customerName: customers.find(c => c.customer_id === d.customer_id)?.name || 'Unknown'
        }))
      );
    }

    if (allDeposits.length === 0) {
      const keyboard = new InlineKeyboard()
        .text('💰 Record Deposit', 'record_deposit');

      await ctx.reply(
        '📋 *No Deposits Yet*\n\n' +
        'Start tracking your earnings by recording your first deposit!',
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
      return;
    }

    // Sort by date (newest first)
    allDeposits.sort((a, b) => b.created_at - a.created_at);

    // Format deposits
    let message = `💰 *Your Deposits* (${allDeposits.length})\n\n`;
    
    allDeposits.slice(0, 10).forEach((deposit, index) => {
      const date = new Date(deposit.created_at * 1000).toLocaleDateString();
      message += 
        `${index + 1}. *$${deposit.amount.toFixed(2)}*\n` +
        `   👤 ${deposit.customerName}\n` +
        `   📅 ${date}\n` +
        `   📊 Status: ${deposit.status}\n\n`;
    });

    if (allDeposits.length > 10) {
      message += `_... and ${allDeposits.length - 10} more_`;
    }

    const keyboard = new InlineKeyboard()
      .text('💰 Record Deposit', 'record_deposit')
      .text('🔄 Refresh', 'refresh_deposits')
      .row()
      .text('💵 View Commissions', 'view_commissions');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

  } catch (error) {
    console.error('List deposits error:', error);
    await ctx.reply('❌ Failed to load deposits. Please try again.');
  }
}

/**
 * Handle deposit flow messages
 */
export async function handleDepositFlow(ctx: WorkerContext) {
  const userId = ctx.from?.id;
  const text = ctx.message?.text;
  
  if (!userId || !text) return false;

  // Get current state from KV
  const stateData = await ctx.env.AFFILIATE_KV.get(`deposit_flow:${userId}`);
  if (!stateData) return false; // Not in deposit flow

  const state: DepositState = JSON.parse(stateData);

  try {
    // Check for cancel
    if (text === '/cancel') {
      await ctx.env.AFFILIATE_KV.delete(`deposit_flow:${userId}`);
      await ctx.reply('❌ Deposit recording cancelled.');
      return true;
    }

    switch (state.step) {
      case 'amount':
        const amount = parseFloat(text.trim());
        
        if (isNaN(amount) || amount <= 0) {
          await ctx.reply('❌ Invalid amount. Please enter a positive number:');
          return true;
        }

        if (amount < 10) {
          await ctx.reply('❌ Minimum deposit amount is $10. Please enter a valid amount:');
          return true;
        }

        state.amount = amount;
        state.step = 'confirm';
        
        await ctx.env.AFFILIATE_KV.put(
          `deposit_flow:${userId}`,
          JSON.stringify(state),
          { expirationTtl: 600 }
        );

        // Calculate commission preview
        const commissionService = new CommissionService(
          ctx.commissionRepository,
          ctx.userRepository,
          ctx.depositRepository
        );

        // Create temporary deposit ID for calculation
        const tempDepositId = `temp_${Date.now()}`;
        const calculations = await commissionService.calculateCommissions(
          tempDepositId,
          state.customerId!,
          amount,
          userId
        );

        let commissionPreview = '\n💵 *Commission Breakdown:*\n';
        calculations.forEach(calc => {
          commissionPreview += `  • Level ${calc.level}: $${calc.amount.toFixed(2)} (${(calc.rate * 100).toFixed(0)}%)\n`;
        });

        const totalCommission = calculations.reduce((sum, c) => c.amount, 0);
        commissionPreview += `  • *Your Earnings:* $${calculations[0]?.amount.toFixed(2) || '0.00'}`;

        const confirmationMessage =
          '✅ *Confirm Deposit*\n\n' +
          `👤 Customer: ${state.customerName}\n` +
          `💰 Amount: $${amount.toFixed(2)}\n` +
          commissionPreview +
          '\n\nRecord this deposit?';

        const keyboard = new InlineKeyboard()
          .text('✅ Confirm', 'confirm_deposit')
          .text('❌ Cancel', 'cancel_deposit');

        await ctx.reply(confirmationMessage, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
        break;
    }

    return true;

  } catch (error) {
    console.error('Deposit flow error:', error);
    await ctx.env.AFFILIATE_KV.delete(`deposit_flow:${userId}`);
    await ctx.reply('❌ Something went wrong. Please use /deposit to try again.');
    return true;
  }
}

/**
 * Handle deposit callbacks
 */
export async function depositCallbackHandler(ctx: WorkerContext) {
  const data = ctx.callbackQuery?.data;
  const userId = ctx.from?.id;
  
  if (!data || !userId) return false;

  await ctx.answerCallbackQuery();

  try {
    // Handle customer selection
    if (data.startsWith('select_customer_')) {
      const customerId = data.replace('select_customer_', '');
      
      // Get customer details
      const customer = await ctx.customerRepository.getById(customerId);
      if (!customer) {
        await ctx.reply('❌ Customer not found.');
        return true;
      }

      // Initialize deposit state
      const state: DepositState = {
        step: 'amount',
        customerId: customerId,
        customerName: customer.name,
      };

      await ctx.env.AFFILIATE_KV.put(
        `deposit_flow:${userId}`,
        JSON.stringify(state),
        { expirationTtl: 600 }
      );

      await ctx.reply(
        `💰 *Recording Deposit for ${customer.name}*\n\n` +
        '💵 Please enter the deposit amount (USD):\n\n' +
        '_Minimum: $10.00_',
        { parse_mode: 'Markdown' }
      );

      return true;
    }

    switch (data) {
      case 'record_deposit':
        await depositHandler(ctx);
        return true;

      case 'refresh_deposits':
        await listDepositsHandler(ctx);
        return true;

      case 'confirm_deposit':
        // Get state from KV
        const stateData = await ctx.env.AFFILIATE_KV.get(`deposit_flow:${userId}`);
        if (!stateData) {
          await ctx.reply('❌ Session expired. Please use /deposit to try again.');
          return true;
        }

        const state: DepositState = JSON.parse(stateData);
        
        if (!state.customerId || !state.amount) {
          await ctx.reply('❌ Missing deposit data. Please use /deposit to try again.');
          await ctx.env.AFFILIATE_KV.delete(`deposit_flow:${userId}`);
          return true;
        }

        // Create deposit
        const deposit = await ctx.depositRepository.create({
          customer_id: state.customerId,
          agent_id: userId,
          amount: state.amount,
          status: 'completed',
          currency: 'USD',
          payment_method: 'telegram_bot',
          external_id: null,
          transaction_hash: null,
        });

        // Calculate and create commissions
        const commissionService = new CommissionService(
          ctx.commissionRepository,
          ctx.userRepository,
          ctx.depositRepository
        );

        const calculations = await commissionService.calculateCommissions(
          deposit.deposit_id,
          state.customerId,
          state.amount,
          userId
        );

        const commissions = await commissionService.createCommissionsFromCalculations(
          calculations,
          deposit.deposit_id
        );

        // Clear state
        await ctx.env.AFFILIATE_KV.delete(`deposit_flow:${userId}`);

        // Success message
        const yourCommission = commissions.find(c => c.agent_id === userId);
        
        const keyboard = new InlineKeyboard()
          .text('💰 Record Another', 'record_deposit')
          .text('📋 View Deposits', 'refresh_deposits')
          .row()
          .text('💵 View Commissions', 'view_commissions');

        await ctx.reply(
          '🎉 *Deposit Recorded Successfully!*\n\n' +
          `👤 Customer: ${state.customerName}\n` +
          `💰 Amount: $${state.amount.toFixed(2)}\n` +
          `💵 Your Commission: $${yourCommission?.amount.toFixed(2) || '0.00'}\n` +
          `📊 Total Commissions: ${commissions.length} levels\n\n` +
          '_Commissions are pending approval_',
          { parse_mode: 'Markdown', reply_markup: keyboard }
        );

        return true;

      case 'cancel_deposit':
        await ctx.env.AFFILIATE_KV.delete(`deposit_flow:${userId}`);
        await ctx.reply('❌ Deposit recording cancelled.');
        return true;

      default:
        return false;
    }

  } catch (error) {
    console.error('Deposit callback error:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
    return true;
  }
}
