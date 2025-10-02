/**
 * Message Handler
 * Handles text messages (mainly for customer data input)
 */

import type { BotContext } from '@/types/context';
import { customerRepository } from '@/repositories/customer.repository';
import { Validator } from '@/utils/validation';
import { logger } from '@/utils/logger';

export async function messageHandler(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Check if we're expecting customer data
  if (!ctx.session.expecting_customer) {
    return; // Ignore other messages
  }

  const text = ctx.message?.text;
  if (!text) return;

  try {
    // Parse customer data
    const customerData = Validator.parseCustomerData(text);

    // Validate data
    const validation = Validator.validateCustomerData(customerData);

    if (!validation.valid) {
      await ctx.reply(
        `❌ Invalid data:\n\n` +
        validation.errors.map(e => `• ${e}`).join('\n') +
        `\n\nPlease provide the data in this format:\n\n` +
        `Name: [Customer Name]\n` +
        `Phone: [Phone Number]\n` +
        `Email: [Email Address]`
      );
      return;
    }

    // Check for duplicates
    if (customerRepository.existsByEmail(customerData.email!)) {
      await ctx.reply(
        `⚠️ A customer with this email already exists.\n\n` +
        `Please use a different email or check your records.`
      );
      return;
    }

    // Create customer
    const customer = customerRepository.create({
      referred_by: userId,
      customer_name: customerData.name!,
      customer_phone: customerData.phone!,
      customer_email: customerData.email!,
    });

    // Clear session flag
    ctx.session.expecting_customer = false;

    await ctx.reply(
      `✅ *Customer added successfully!*\n\n` +
      `📝 Details:\n` +
      `Name: ${customer.customer_name}\n` +
      `Phone: ${customer.customer_phone}\n` +
      `Email: ${customer.customer_email}\n\n` +
      `Customer ID: \`${customer.customer_id}\`\n\n` +
      `💡 You can now record commissions for this customer using /customerpaid`,
      { parse_mode: 'Markdown' }
    );

    logger.info(`Customer ${customer.customer_id} added by agent ${userId}`);

  } catch (error) {
    logger.error('Message handler error:', error);
    await ctx.reply(
      `❌ Failed to add customer. Please try again.\n\n` +
      `Make sure to use the correct format:\n\n` +
      `Name: [Customer Name]\n` +
      `Phone: [Phone Number]\n` +
      `Email: [Email Address]`
    );
  }
}

