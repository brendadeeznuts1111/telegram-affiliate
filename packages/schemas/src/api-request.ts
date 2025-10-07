/**
 * API Request Schemas
 * Zod validation for HTTP API endpoints
 */

import { z } from 'zod';

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional(),
});

/**
 * Sort schema
 */
export const sortSchema = z.object({
  field: z.string(),
  order: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

/**
 * User registration request
 */
export const registerUserRequestSchema = z.object({
  telegram_id: z.number().int().positive(),
  username: z.string().max(32).optional(),
  first_name: z.string().min(1).max(64),
  last_name: z.string().max(64).optional(),
  referral_code: z.string().max(50).optional(),
});

/**
 * Generate QR code request
 */
export const generateQRRequestSchema = z.object({
  agent_id: z.number().int().positive(),
  campaign: z.string().max(50).optional(),
  size: z.number().int().min(100).max(1000).optional().default(300),
  format: z.enum(['png', 'svg']).optional().default('png'),
});

/**
 * Broadcast message request
 */
export const broadcastMessageRequestSchema = z.object({
  message: z.string()
    .min(1, 'Message is required')
    .max(4096, 'Message too long (max 4096 characters)'),
  
  target: z.enum(['all', 'agents', 'super_agents', 'customers'])
    .default('all'),
  
  schedule_at: z.string().datetime().optional(),
  
  include_preview: z.boolean().optional().default(true),
});

/**
 * Set commission rate request
 */
export const setCommissionRequestSchema = z.object({
  event_type: z.enum(['new_user', 'first_deposit', 'deposit', 'withdrawal']),
  
  fixed_amount: z.number()
    .nonnegative()
    .default(0),
  
  percentage: z.number()
    .min(0)
    .max(100)
    .default(0),
  
  level: z.enum(['agent', 'silver', 'gold', 'platinum']).optional(),
});

/**
 * Admin stats request
 */
export const adminStatsRequestSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year', 'all']).optional().default('month'),
  metrics: z.array(z.enum([
    'total_agents',
    'active_agents',
    'total_customers',
    'total_commission',
    'total_deposits',
    'avg_commission',
  ])).optional(),
});

/**
 * Telegram Web App init data schema
 */
export const telegramInitDataSchema = z.object({
  query_id: z.string().optional(),
  user: z.string().optional(), // JSON string
  auth_date: z.string(),
  hash: z.string(),
});

// Export types
export type Pagination = z.infer<typeof paginationSchema>;
export type Sort = z.infer<typeof sortSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type RegisterUserRequest = z.infer<typeof registerUserRequestSchema>;
export type GenerateQRRequest = z.infer<typeof generateQRRequestSchema>;
export type BroadcastMessageRequest = z.infer<typeof broadcastMessageRequestSchema>;
export type SetCommissionRequest = z.infer<typeof setCommissionRequestSchema>;
export type AdminStatsRequest = z.infer<typeof adminStatsRequestSchema>;
export type TelegramInitData = z.infer<typeof telegramInitDataSchema>;
