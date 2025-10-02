/**
 * Level System Types
 */

export interface AgentLevel {
  level: number;
  name: string;
  netDeposited: number;
  netCustomers: number;
  boost: number;
}

export interface Deposit {
  deposit_id: number;
  customer_id: number;
  amount: number;
  currency: string;
  created_at: number;
  agent_id: number;
}

export interface AgentTreeNode {
  ancestor_id: number;
  descendant_id: number;
  depth: number;
}

export interface AgentWithTree {
  user_id: number;
  first_name: string;
  level: number;
  level_name: string;
  depth: number;
  net_deposited: number;
  net_customers: number;
}

