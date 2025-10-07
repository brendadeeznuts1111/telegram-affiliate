/**
 * Agent Schemas
 * Zod validation for agent-related operations
 */

import { z } from 'zod';

/**
 * Agent level schema
 */
export const agentLevelSchema = z.enum([
  'agent',
  'silver',
  'gold',
  'platinum',
]);

/**
 * Agent creation schema
 */
export const createAgentSchema = z.object({
  user_id: z.number()
    .int('User ID must be an integer')
    .positive('User ID must be positive'),
  
  parent_agent_id: z.number()
    .int('Parent agent ID must be an integer')
    .positive('Parent agent ID must be positive')
    .optional(),
  
  level: agentLevelSchema.default('agent'),
  
  is_super_agent: z.boolean().default(false),
});

/**
 * Agent update schema
 */
export const updateAgentSchema = z.object({
  level: agentLevelSchema.optional(),
  is_super_agent: z.boolean().optional(),
  parent_agent_id: z.number().int().positive().optional(),
  total_commission: z.number().nonnegative().optional(),
  total_customers: z.number().int().nonnegative().optional(),
  active_customers: z.number().int().nonnegative().optional(),
});

/**
 * Agent promotion schema
 */
export const promoteAgentSchema = z.object({
  user_id: z.number()
    .int('User ID must be an integer')
    .positive('User ID must be positive'),
  
  to_super_agent: z.boolean().default(true),
});

/**
 * Agent stats query schema
 */
export const agentStatsQuerySchema = z.object({
  user_id: z.number()
    .int('User ID must be an integer')
    .positive('User ID must be positive'),
  
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  
  include_sub_agents: z.boolean().optional().default(false),
});

/**
 * Agent commission settings schema
 */
export const commissionSettingsSchema = z.object({
  event_type: z.enum(['new_user', 'first_deposit', 'deposit', 'withdrawal']),
  
  fixed_amount: z.number()
    .nonnegative('Fixed amount must be non-negative')
    .default(0),
  
  percentage: z.number()
    .min(0, 'Percentage must be at least 0')
    .max(100, 'Percentage must be at most 100')
    .default(0),
});

/**
 * Agent leaderboard query schema
 */
export const leaderboardQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year', 'all']).default('month'),
  metric: z.enum(['commission', 'customers', 'deposits', 'referrals']).default('commission'),
  limit: z.number().int().min(1).max(100).optional().default(10),
});

/**
 * Agent tree query schema
 */
export const agentTreeQuerySchema = z.object({
  user_id: z.number()
    .int('User ID must be an integer')
    .positive('User ID must be positive'),
  
  max_depth: z.number()
    .int('Max depth must be an integer')
    .min(1, 'Max depth must be at least 1')
    .max(10, 'Max depth must be at most 10')
    .optional()
    .default(5),
  
  include_inactive: z.boolean().optional().default(false),
});

// Export types
export type AgentLevel = z.infer<typeof agentLevelSchema>;
export type CreateAgent = z.infer<typeof createAgentSchema>;
export type UpdateAgent = z.infer<typeof updateAgentSchema>;
export type PromoteAgent = z.infer<typeof promoteAgentSchema>;
export type AgentStatsQuery = z.infer<typeof agentStatsQuerySchema>;
export type CommissionSettings = z.infer<typeof commissionSettingsSchema>;
export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;
export type AgentTreeQuery = z.infer<typeof agentTreeQuerySchema>;
