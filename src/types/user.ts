/**
 * User and Agent type definitions
 */

export interface User {
  user_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  is_agent: boolean;
  is_super_agent: boolean;
  parent_agent_id: number | null;
  created_at: number;
  total_commission: number;
  total_customers: number;
}

export interface CreateUserInput {
  user_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
}

export interface AgentStats {
  customers: number;
  commission: number;
  sub_agents: number;
}

// Type guard to check if user is an agent
// Note: SQLite stores booleans as 0 or 1, so we use truthy check
export function isAgent(user: User | null): user is User & { is_agent: true } {
  return user ? Boolean(user.is_agent) : false;
}

// Type guard to check if user is a super agent
// Note: SQLite stores booleans as 0 or 1, so we use truthy check
export function isSuperAgent(user: User | null): user is User & { is_super_agent: true } {
  return user ? Boolean(user.is_super_agent) : false;
}

