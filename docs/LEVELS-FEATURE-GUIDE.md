# 🎖️ Multi-Level Agent System - Feature Guide

## Overview

The enhanced Telegram Affiliate Bot now includes a **4-tier agent level system** with dynamic commissions, agent tree tracking, and event-driven payouts.

---

## 🎯 Level System

### 4-Tier Hierarchy

| Level | Name | Net Deposits Required | Commission Boost |
|-------|------|-----------------------|------------------|
| 0 | Agent | $0 | +0% |
| 1 | Silver | $1,000 | +5% |
| 2 | Gold | $10,000 | +10% |
| 3 | Platinum | $50,000 | +20% |

### Features

- ✅ **Automatic Level Progression** - Level up as you accumulate net deposits
- ✅ **Overage Protection** - Once achieved, you never drop levels
- ✅ **Commission Boosts** - Higher levels earn more on every transaction
- ✅ **Real-time Tracking** - Net deposits and customers tracked live

---

## 💰 Event-Based Commissions

### Commission Events

| Event | Base Fixed | Base % | Description |
|-------|------------|---------|-------------|
| `new_user` | $5 | 0% | Customer registration |
| `first_deposit` | $20 | 15% | Customer's first deposit |
| `deposit` | $0 | 10% | Regular deposit |
| `withdrawal` | $0 | 2% | Customer withdrawal |

### How It Works

1. **Event Triggered** → Customer makes a deposit
2. **Base Commission Calculated** → 10% of deposit
3. **Level Boost Applied** → +5% for Silver, +10% for Gold, +20% for Platinum
4. **Parent Commission** → 50% goes to super-agent parent
5. **Level Recalculated** → Agent level updated if threshold reached

**Example:**
- Customer deposits $1,000
- Agent is Gold level (10% boost)
- Base: 10% = $100
- Boost: +10% = +$100
- **Total: $200 commission**
- Parent gets: $100 (50%)

---

## 🌳 Agent Tree System

### Closure Table

The system uses a **closure table** for efficient hierarchy queries:

- **Self-loops** (depth 0) for each agent
- **Ancestor-descendant** relationships at all depths
- **Fast tree traversal** without recursive queries

### Tree Features

- ✅ View your entire downline
- ✅ See each agent's level and performance
- ✅ Track network statistics (total deposits, customers)
- ✅ Unlimited depth (default display: 5 levels)

---

## 📊 New Bot Commands

### For Agents

#### `/level`
Show your current level and progress to next tier.

**Example output:**
```
🎖️ Your Agent Level

Level: Gold (2)
Commission Boost: +10%

📊 Statistics:
Net Deposits: $12,450.00
Total Customers: 45

📈 Progress to Platinum:
Current: $12,450.00
Target: $50,000.00
Remaining: $37,550.00
Progress: 31.1%
```

#### `/tree`
Visualize your agent downline network.

**Example output:**
```
🌳 Your Agent Tree

👑 John Doe
   Level: Gold | Deposits: $12,450 | Customers: 45

  👤 Jane Smith
     Level: Silver | Deposits: $2,100 | Customers: 12

    👤 Bob Johnson
       Level: Agent | Deposits: $450 | Customers: 3

  👤 Alice Brown
     Level: Silver | Deposits: $3,200 | Customers: 15

📊 Network Summary:
Total Agents: 3
Total Deposits: $18,200.00
Total Customers: 75
Max Depth: 2
```

#### `/stats`
Enhanced statistics with commission breakdown by event type.

**Example output:**
```
📊 Your Complete Statistics

🎖️ Level: Gold (+10% boost)

💰 Earnings:
Total Commission: $2,450.50

👥 Network:
Total Customers: 45
Sub-Agents: 3

💸 Deposits:
Total Deposits: $12,450.00
Deposit Count: 156

📈 Commission Breakdown:
• new_user: 45 ($225.00)
• first_deposit: 45 ($1,125.00)
• deposit: 156 ($1,100.50)
```

#### `/leaderboard`
See top 10 agents by level and performance.

**Example output:**
```
🏆 Top Agents Leaderboard

🥇 John Doe
   Level: Platinum | Deposits: $52,000 | Customers: 120

🥈 Jane Smith
   Level: Gold | Deposits: $15,400 | Customers: 67

🥉 Bob Johnson
   Level: Gold | Deposits: $12,300 | Customers: 54
```

#### `/projections`
Calculate commission earnings for next level.

**Example output:**
```
💡 Commission Projections

For a $1000 deposit:

Current Commission: $200.00
At Platinum: $300.00
Extra Earnings: $100.00

💪 Level up to earn more on every transaction!
```

---

## 🔌 Integration

### Recording Events

```typescript
import { enhancedCommissionService } from '@/services/commission-enhanced.service';

// When customer makes a deposit
await enhancedCommissionService.recordDeposit(
  agentId,      // Who referred the customer
  customerId,   // Who deposited
  1000          // Amount in USD
);

// When new user registers
await enhancedCommissionService.recordNewUser(
  agentId,
  customerId
);

// Generic event processing
await enhancedCommissionService.processEvent(
  'deposit',    // Event type
  agentId,
  customerId,
  1000
);
```

### Payment Webhook Example

```typescript
// src/api/webhooks/payment.webhook.ts
import { enhancedCommissionService } from '@/services/commission-enhanced.service';

export async function handleDepositWebhook(req: Request) {
  const { agent_id, customer_id, amount } = await req.json();

  // Automatically:
  // - Calculates commission with level boost
  // - Records deposit
  // - Updates net_deposited
  // - Recalculates level
  // - Pays parent commission
  await enhancedCommissionService.recordDeposit(
    agent_id,
    customer_id,
    amount
  );

  return new Response('OK');
}
```

---

## 🗄️ Database Schema

### New Tables

#### `deposits`
```sql
CREATE TABLE deposits (
  deposit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  agent_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  created_at INTEGER DEFAULT (unixepoch())
);
```

#### `agent_tree` (Closure Table)
```sql
CREATE TABLE agent_tree (
  ancestor_id INTEGER NOT NULL,
  descendant_id INTEGER NOT NULL,
  depth INTEGER NOT NULL,
  PRIMARY KEY (ancestor_id, descendant_id)
);
```

### Modified Tables

#### `users` - Added columns:
```sql
ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN net_deposited REAL DEFAULT 0;
ALTER TABLE users ADD COLUMN net_customers INTEGER DEFAULT 0;
```

#### `commissions` - Added column:
```sql
ALTER TABLE commissions ADD COLUMN event_type TEXT DEFAULT 'deposit';
```

---

## ⚙️ Configuration

All level settings are in `src/core/levels.config.ts`:

```typescript
export const LEVELS: LevelConfig = {
  names: ['Agent', 'Silver', 'Gold', 'Platinum'],
  thresholds: [0, 1000, 10000, 50000],
  boosts: [0, 5, 10, 20],
  overage: true,
};

export const EVENT_COMMISSIONS: Record<CommissionEvent, EventCommission> = {
  new_user: { fixed: 5, percent: 0 },
  deposit: { fixed: 0, percent: 10 },
  first_deposit: { fixed: 20, percent: 15 },
  withdrawal: { fixed: 0, percent: 2 },
};
```

**To customize:**
1. Edit `src/core/levels.config.ts`
2. Restart bot
3. Changes apply immediately

---

## 🚀 Usage

### Start Bot

```bash
# Initialize database with new tables
bun run db:init

# Start bot
bun run start
```

### Test Commands

```bash
# Check your level
/level

# View your tree
/tree

# See full stats
/stats

# View leaderboard
/leaderboard

# Calculate projections
/projections
```

---

## 🎯 Benefits

### For Agents
- ✅ **Higher Earnings** - Level up to earn +20% more on every transaction
- ✅ **Motivation** - Clear progression path with visible goals
- ✅ **Network Tracking** - See your downline performance in real-time
- ✅ **Transparency** - Understand exactly how commissions are calculated

### For Platform
- ✅ **Retention** - Overage protection keeps agents motivated
- ✅ **Growth** - Multi-tier system encourages network building
- ✅ **Flexibility** - Easy to add new commission events
- ✅ **Analytics** - Track performance by event type and level

---

## 📈 Performance

- **Agent Tree Queries:** O(1) depth lookup via closure table
- **Level Calculation:** Single SQL query, cached in agent record
- **Commission Processing:** Transaction-wrapped for atomicity
- **Scalability:** Indexed on agent_id, customer_id, event_type

---

## 🔒 Security

- ✅ All configurations in TypeScript (type-safe)
- ✅ Transaction-wrapped commission processing
- ✅ Input validation on all amounts
- ✅ SQL injection prevention via prepared statements
- ✅ Audit trail via event_type tracking

---

## 🎉 Summary

**What's New:**
- 🎖️ 4-tier level system (Agent → Platinum)
- 💰 Event-driven commissions (new_user, deposit, first_deposit, withdrawal)
- 🌳 Agent tree visualization
- 📊 Enhanced statistics and breakdowns
- 🏆 Leaderboard
- 💡 Commission projections

**Bun-Native Benefits:**
- ⚡ TypeScript type safety
- 🔒 Environment-based config (no YAML secrets)
- 🏗️ Clean architecture maintained
- 📦 Zero new dependencies
- 🚀 Production-ready

---

**The system is live and ready to use!** 🎉

All features follow the same best practices we established:
- ✅ Repository pattern
- ✅ Service layer
- ✅ Type safety
- ✅ Error handling
- ✅ Logging
- ✅ Validation

**Next steps:** Configure your levels in `levels.config.ts` and start using the new commands!

