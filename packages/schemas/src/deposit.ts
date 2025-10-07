/**
 * Deposit Schemas
 * Zod validation for deposit-related operations
 */

import { z } from 'zod';

/**
 * Supported currencies
 */
export const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'TON', 'USDT', 'TRON']);

/**
 * Deposit creation schema
 */
export const createDepositSchema = z.object({
  agent_id: z.number()
    .int('Agent ID must be an integer')
    .positive('Agent ID must be positive'),
  
  customer_id: z.number()
    .int('Customer ID must be an integer')
    .positive('Customer ID must be positive'),
  
  amount: z.number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount too large'),
  
  currency: currencySchema.default('USD'),
  
  transaction_id: z.string()
    .max(255)
    .optional(),
  
  notes: z.string()
    .max(500)
    .optional(),
});

/**
 * Withdrawal creation schema
 */
export const createWithdrawalSchema = z.object({
  agent_id: z.number()
    .int('Agent ID must be an integer')
    .positive('Agent ID must be positive'),
  
  amount: z.number()
    .positive('Amount must be positive')
    .min(10, 'Minimum withdrawal amount is $10')
    .max(100000, 'Maximum withdrawal amount is $100,000'),
  
  address: z.string()
    .min(10, 'Invalid wallet address')
    .max(255, 'Address too long'),
  
  chain: z.enum(['ton', 'tron', 'ethereum', 'bitcoin'])
    .default('ton'),
  
  notes: z.string()
    .max(500)
    .optional(),
});

/**
 * Withdrawal status schema
 */
export const withdrawalStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled'
]);

/**
 * Deposit event type schema
 */
export const depositEventSchema = z.enum([
  'new_user',
  'first_deposit',
  'deposit',
  'withdrawal',
]);

/**
 * Deposit event data schema
 */
export const depositEventDataSchema = z.object({
  event: depositEventSchema,
  agent_id: z.number().int().positive(),
  customer_id: z.number().int().positive(),
  amount: z.number().positive(),
  currency: currencySchema.optional().default('USD'),
  timestamp: z.number().int().positive().optional(),
});

/**
 * Deposit query params schema
 */
export const depositQuerySchema = z.object({
  agent_id: z.number().int().positive().optional(),
  customer_id: z.number().int().positive().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  currency: currencySchema.optional(),
});

// Export types
export type Currency = z.infer<typeof currencySchema>;
export type CreateDeposit = z.infer<typeof createDepositSchema>;
export type CreateWithdrawal = z.infer<typeof createWithdrawalSchema>;
export type WithdrawalStatus = z.infer<typeof withdrawalStatusSchema>;
export type DepositEvent = z.infer<typeof depositEventSchema>;
export type DepositEventData = z.infer<typeof depositEventDataSchema>;
export type DepositQuery = z.infer<typeof depositQuerySchema>;
