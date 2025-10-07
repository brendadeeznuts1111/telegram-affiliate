/**
 * Webhook Schemas
 * Zod validation for Telegram webhook payloads and external webhooks
 */

import { z } from 'zod';

/**
 * Telegram user schema
 */
export const telegramUserSchema = z.object({
  id: z.number().int().positive(),
  is_bot: z.boolean(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
});

/**
 * Telegram chat schema
 */
export const telegramChatSchema = z.object({
  id: z.number().int(),
  type: z.enum(['private', 'group', 'supergroup', 'channel']),
  title: z.string().optional(),
  username: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

/**
 * Telegram message schema (simplified)
 */
export const telegramMessageSchema = z.object({
  message_id: z.number().int().positive(),
  from: telegramUserSchema.optional(),
  chat: telegramChatSchema,
  date: z.number().int().positive(),
  text: z.string().optional(),
  entities: z.array(z.any()).optional(),
});

/**
 * Telegram callback query schema
 */
export const telegramCallbackQuerySchema = z.object({
  id: z.string(),
  from: telegramUserSchema,
  message: telegramMessageSchema.optional(),
  data: z.string().optional(),
  chat_instance: z.string(),
});

/**
 * Telegram update schema
 */
export const telegramUpdateSchema = z.object({
  update_id: z.number().int().positive(),
  message: telegramMessageSchema.optional(),
  edited_message: telegramMessageSchema.optional(),
  callback_query: telegramCallbackQuerySchema.optional(),
});

/**
 * Payment webhook schema (for external payment processors)
 */
export const paymentWebhookSchema = z.object({
  event: z.enum(['payment.success', 'payment.failed', 'payment.pending']),
  
  transaction_id: z.string()
    .min(1, 'Transaction ID is required')
    .max(255, 'Transaction ID too long'),
  
  amount: z.number()
    .positive('Amount must be positive'),
  
  currency: z.string()
    .length(3, 'Currency must be 3 characters')
    .toUpperCase(),
  
  customer_id: z.string()
    .max(255)
    .optional(),
  
  metadata: z.record(z.string(), z.any()).optional(),
  
  timestamp: z.number()
    .int()
    .positive(),
  
  signature: z.string()
    .min(1, 'Signature is required')
    .max(500, 'Signature too long'),
});

/**
 * Webhook verification schema
 */
export const webhookVerificationSchema = z.object({
  signature: z.string().min(1, 'Signature is required'),
  timestamp: z.number().int().positive(),
  payload: z.string().min(1, 'Payload is required'),
});

// Export types
export type TelegramUser = z.infer<typeof telegramUserSchema>;
export type TelegramChat = z.infer<typeof telegramChatSchema>;
export type TelegramMessage = z.infer<typeof telegramMessageSchema>;
export type TelegramCallbackQuery = z.infer<typeof telegramCallbackQuerySchema>;
export type TelegramUpdate = z.infer<typeof telegramUpdateSchema>;
export type PaymentWebhook = z.infer<typeof paymentWebhookSchema>;
export type WebhookVerification = z.infer<typeof webhookVerificationSchema>;
