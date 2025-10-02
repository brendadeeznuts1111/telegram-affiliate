import { z } from 'zod';

export const UserSchema = z.object({
  user_id: z.number().int().positive(),
  username: z.string().nullable(),
  first_name: z.string().min(1),
  last_name: z.string().nullable(),
  is_agent: z.boolean(),
  is_super_agent: z.boolean(),
  parent_agent_id: z.number().int().positive().nullable(),
  created_at: z.number().int().positive(),
  total_commission: z.number().nonnegative(),
  total_customers: z.number().int().nonnegative(),
  level: z.number().int().min(0).max(3),
  net_deposited: z.number().nonnegative(),
});

export const CreateUserSchema = UserSchema.pick({
  user_id: true,
  username: true,
  first_name: true,
  last_name: true,
});

export const AgentStatsSchema = z.object({
  customers: z.number().int().nonnegative(),
  commission: z.number().nonnegative(),
  sub_agents: z.number().int().nonnegative(),
  net_deposited: z.number().nonnegative(),
  level: z.number().int().min(0).max(3),
});

export const AgentTreeNodeSchema = z.object({
  user_id: z.number(),
  first_name: z.string(),
  username: z.string().nullable(),
  level: z.number(),
  total_customers: z.number(),
  total_commission: z.number(),
  children: z.array(z.lazy(() => AgentTreeNodeSchema)).optional(),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type AgentStats = z.infer<typeof AgentStatsSchema>;
export type AgentTreeNode = z.infer<typeof AgentTreeNodeSchema>;

