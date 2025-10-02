/**
 * Level Configuration
 * Multi-tier agent levels with thresholds
 */

export interface LevelConfig {
  names: string[];
  thresholds: number[];
  boosts: number[];
  overage: boolean;
}

// 4-level system: Agent → Silver → Gold → Platinum
export const LEVELS: LevelConfig = {
  names: ['Agent', 'Silver', 'Gold', 'Platinum'],
  
  // Net deposit thresholds to reach each level
  thresholds: [
    0,      // Agent (starting level)
    1000,   // Silver (at $1,000 net deposits)
    10000,  // Gold (at $10,000 net deposits)
    50000,  // Platinum (at $50,000 net deposits)
  ],
  
  // Commission boost % per level (added to base commission)
  boosts: [
    0,   // Agent: +0%
    5,   // Silver: +5%
    10,  // Gold: +10%
    20,  // Platinum: +20%
  ],
  
  // Once achieved, never drop (true = overage protection)
  overage: true,
};

// Commission events
export type CommissionEvent = 'new_user' | 'deposit' | 'withdrawal' | 'first_deposit';

export interface EventCommission {
  fixed: number;   // Flat amount
  percent: number; // Percentage of transaction
}

export const EVENT_COMMISSIONS: Record<CommissionEvent, EventCommission> = {
  new_user: {
    fixed: 5,    // $5 flat for new registration
    percent: 0,
  },
  deposit: {
    fixed: 0,
    percent: 10, // 10% of deposit amount
  },
  first_deposit: {
    fixed: 20,   // Bonus for first deposit
    percent: 15, // Higher % on first deposit
  },
  withdrawal: {
    fixed: 0,
    percent: 2,  // Small % on withdrawals
  },
};

