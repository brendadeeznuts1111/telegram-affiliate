/**
 * Commission type definitions
 */

export interface Commission {
  commission_id: number;
  agent_id: number;
  customer_id: number;
  amount: number;
  percentage: number;
  created_at: number;
  status: 'pending' | 'paid' | 'cancelled';
}

export interface CommissionSplit {
  agent: number;
  super: number;
}

export interface RecordCommissionInput {
  agent_id: number;
  customer_id: number;
  amount: number;
}

export interface CommissionStats {
  total_pending: number;
  total_paid: number;
  count_pending: number;
  count_paid: number;
}

