import { z } from 'zod';

export const CommissionEventSchema = z.enum([
  'new_user',
  'first_deposit',
  'deposit',
  'withdrawal',
]);

export const CommissionSchema = z.object({
  commission_id: z.number().int().positive(),
  agent_id: z.number().int().positive(),
  customer_id: z.number().int().positive(),
  amount: z.number(),
  percentage: z.number(),
  status: z.enum(['pending', 'paid']),
  event_type: CommissionEventSchema,
  created_at: z.number().int().positive(),
  paid_at: z.number().int().positive().nullable(),
});

export type Commission = z.infer<typeof CommissionSchema>;
export type CommissionEvent = z.infer<typeof CommissionEventSchema>;

