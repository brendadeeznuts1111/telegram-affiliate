# Feature Implementation Plan

**Created:** October 7, 2025  
**Status:** Planning Phase  
**Estimated Time:** 12-16 hours (3-4 sessions)

## 📊 Current Status Assessment

### ✅ Already Implemented

#### Bot Features
- ✅ Start command with referral tracking
- ✅ Admin menu and commands
- ✅ Agent promotion system
- ✅ QR code generation
- ✅ Referral link generation
- ✅ Admin statistics
- ✅ Broadcast messaging
- ✅ Payment processing
- ✅ Basic callback handlers

#### Dashboard Features
- ✅ Main dashboard with stats
- ✅ User authentication (Telegram WebApp)
- ✅ Super Agent Panel (partial)
- ✅ Responsive layout
- ✅ Dark mode support

### ⚠️ Partially Implemented (Placeholders)

- ⚠️ Agent Tree visualization
- ⚠️ Commission list table
- ⚠️ Customer management
- ⚠️ Deposit tracking
- ⚠️ Withdrawal tracking

### ❌ Not Implemented

- ❌ Complete customer onboarding flow
- ❌ Deposit recording workflow
- ❌ Withdrawal recording workflow
- ❌ Commission calculation triggers
- ❌ Real-time notifications
- ❌ Export/reporting features

---

## 🎯 Implementation Phases

### **Phase 1: Complete Telegram Bot Flows** (4-5 hours)

**Priority:** HIGH - Core functionality

#### 1.1 Customer Management Flow

**Files to Create/Update:**
- `src/api/handlers/customer.handler.ts` (NEW)
- Update `src/api/handlers/callback.handler.ts`

**Features:**
- Add customer command (`/addcustomer`)
- Multi-step conversation flow:
  1. Request customer name
  2. Request email
  3. Request phone
  4. Confirm and save
- Inline keyboard for quick actions
- Validation for email/phone
- Duplicate detection

**User Flow:**
```
Agent: /addcustomer
Bot: 👤 Please enter customer name:
Agent: John Doe
Bot: 📧 Please enter email:
Agent: john@example.com
Bot: 📱 Please enter phone:
Agent: +1234567890
Bot: ✅ Customer Added!
     Name: John Doe
     Email: john@example.com
     Phone: +1234567890
     [View Customers] [Add Another]
```

#### 1.2 Deposit Recording Flow

**Files to Create/Update:**
- `src/api/handlers/deposit.handler.ts` (NEW)
- Update `src/services/commission.service.ts`

**Features:**
- Record deposit command (`/deposit`)
- Two modes:
  - Select from customer list
  - Enter customer ID manually
- Amount input with validation
- Currency selection (USD default)
- Auto-trigger commission calculations
- Notifications to upline

**User Flow:**
```
Agent: /deposit
Bot: 💰 Select customer:
     [John Doe - ID: 1] [Jane Smith - ID: 2]
     Or enter customer ID:
Agent: [Clicks John Doe]
Bot: 💵 Enter deposit amount (USD):
Agent: 500
Bot: ✅ Deposit Recorded!
     Customer: John Doe
     Amount: $500.00
     Commission Earned: $75.00
     [Record Another] [View Commissions]
```

#### 1.3 Withdrawal Recording Flow

**Files to Create/Update:**
- `src/api/handlers/withdrawal.handler.ts` (NEW)
- Update commission calculations

**Features:**
- Record withdrawal command (`/withdraw`)
- Select customer
- Amount input with validation
- Impact on net deposits
- Commission adjustments

#### 1.4 Enhanced Dashboard Command

**Files to Update:**
- `src/api/handlers/affiliate.handler.ts`

**Features:**
- Show recent activities (last 5)
- Quick stats summary
- Pending commissions
- Action buttons

#### 1.5 Commission Tracking

**Files to Update:**
- `src/api/handlers/commission.handler.ts` (NEW)
- Update `src/services/commission.service.ts`

**Features:**
- View all commissions (`/commissions`)
- Filter by status (pending/paid)
- View by date range
- Export to CSV

---

### **Phase 2: Dashboard Frontend Implementation** (4-5 hours)

**Priority:** HIGH - User experience

#### 2.1 Agent Tree Visualization

**Files to Update:**
- `apps/dashboard/src/views/AgentTree.vue`
- `apps/dashboard/src/components/AgentTree.vue` (NEW)

**Features:**
- D3.js tree visualization
- Collapsible nodes
- Node click for details
- Level indicators
- Color coding by performance
- Search/filter functionality

**Libraries to Add:**
```bash
bun add d3 @types/d3
```

**Implementation:**
```vue
<template>
  <div class="tree-container">
    <svg ref="svgRef" :width="width" :height="height"></svg>
  </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import { ref, onMounted } from 'vue';

// D3 tree implementation
</script>
```

#### 2.2 Commission List Table

**Files to Update:**
- `apps/dashboard/src/views/Commissions.vue`

**Features:**
- Sortable table (by date, amount, status)
- Pagination
- Status filters
- Date range picker
- Total earnings display
- Export button

**Table Columns:**
- Date
- Customer Name
- Event Type (deposit/withdrawal/first_deposit)
- Amount
- Commission
- Status (pending/paid)
- Actions

#### 2.3 Customer Management Page

**Files to Create:**
- `apps/dashboard/src/views/Customers.vue` (NEW)

**Features:**
- Customer list table
- Search by name/email
- Add customer form
- Edit customer details
- View customer activity
- Customer stats (total deposits, commissions generated)

#### 2.4 Activity Feed

**Files to Create:**
- `apps/dashboard/src/components/ActivityFeed.vue` (NEW)

**Features:**
- Recent activities list
- Real-time updates (polling or WebSocket)
- Activity types:
  - New customer added
  - Deposit recorded
  - Withdrawal recorded
  - Commission earned
  - Level upgrade
  - New sub-agent
- Time ago formatting

#### 2.5 Enhanced Dashboard Charts

**Files to Update:**
- `apps/dashboard/src/components/EarningsChart.vue`

**Features:**
- Multiple chart types:
  - Line chart (earnings over time)
  - Bar chart (monthly comparison)
  - Pie chart (commission breakdown)
- Date range selector
- Export chart as image

**Libraries to Add:**
```bash
bun add chart.js vue-chartjs
```

---

### **Phase 3: API Endpoints** (2-3 hours)

**Priority:** HIGH - Backend integration

#### 3.1 Customer Endpoints

**Files to Create:**
- `apps/api/src/routes/customer.ts` (NEW)

**Endpoints:**
```typescript
GET    /api/customer                    // List all customers
GET    /api/customer/:id                // Get customer details
POST   /api/customer                    // Create customer
PUT    /api/customer/:id                // Update customer
DELETE /api/customer/:id                // Delete customer
GET    /api/customer/:id/deposits       // Get customer deposits
GET    /api/customer/:id/activity       // Get customer activity
```

#### 3.2 Commission Endpoints

**Files to Update:**
- `apps/api/src/routes/affiliate/commissions.ts` (NEW)

**Endpoints:**
```typescript
GET    /api/affiliate/commissions       // List commissions
GET    /api/affiliate/commissions/stats // Commission statistics
GET    /api/affiliate/commissions/:id   // Get commission details
POST   /api/affiliate/commissions/export // Export commissions
```

#### 3.3 Deposit Endpoints

**Files to Create:**
- `apps/api/src/routes/deposit.ts` (NEW)

**Endpoints:**
```typescript
GET    /api/deposit                     // List deposits
POST   /api/deposit                     // Record deposit
GET    /api/deposit/:id                 // Get deposit details
PUT    /api/deposit/:id                 // Update deposit
DELETE /api/deposit/:id                 // Delete deposit
```

#### 3.4 Agent Tree Endpoint

**Files to Create:**
- `apps/api/src/routes/agent/tree.ts` (NEW)

**Endpoints:**
```typescript
GET    /api/agent/tree                  // Get agent tree data
GET    /api/agent/tree/:id              // Get subtree for specific agent
GET    /api/agent/downline              // Get all downline agents
```

#### 3.5 Activity Feed Endpoint

**Files to Create:**
- `apps/api/src/routes/activity.ts` (NEW)

**Endpoints:**
```typescript
GET    /api/activity                    // Get recent activity
GET    /api/activity/feed               // Real-time feed (SSE)
```

---

### **Phase 4: Database & Services** (2-3 hours)

**Priority:** MEDIUM - Backend logic

#### 4.1 Activity Tracking Service

**Files to Create:**
- `src/services/activity.service.ts` (NEW)

**Features:**
- Log all user activities
- Activity types enum
- Activity formatting
- Activity retrieval
- Activity aggregation

#### 4.2 Enhanced Commission Service

**Files to Update:**
- `src/services/commission.service.ts`

**Features:**
- Automatic commission calculation on deposit
- Handle withdrawal impact
- First deposit bonus logic
- Multi-level commission calculation
- Commission status management

#### 4.3 Customer Service

**Files to Create:**
- `src/services/customer.service.ts` (NEW)

**Features:**
- Customer CRUD operations
- Duplicate detection
- Customer validation
- Customer statistics
- Customer activity tracking

#### 4.4 Agent Tree Service

**Files to Update:**
- `src/services/agent-hierarchy.service.ts`

**Features:**
- Build tree data structure
- Calculate subtree statistics
- Find upline path
- Count downline levels
- Performance metrics

---

### **Phase 5: Real-time Features & Polish** (2-3 hours)

**Priority:** LOW - Enhancements

#### 5.1 Notifications System

**Files to Create:**
- `src/services/notification.service.ts` (NEW)

**Features:**
- Send notifications to agents
- Notification types:
  - New customer
  - Deposit received
  - Commission earned
  - Level upgrade
  - Payment processed
- Telegram message formatting
- Batch notifications

#### 5.2 Export/Reporting

**Files to Create:**
- `src/utils/export.ts` (NEW)

**Features:**
- Export commissions to CSV
- Export customers to CSV
- Export agent tree
- Generate PDF reports
- Email reports (future)

#### 5.3 Dashboard Enhancements

**Features:**
- Loading skeletons
- Error boundaries
- Offline support
- Pull-to-refresh
- Toast notifications
- Modal dialogs

#### 5.4 Performance Optimizations

**Features:**
- API response caching
- Lazy loading routes
- Virtual scrolling for large lists
- Debounced search
- Optimistic UI updates

---

## 📦 New Dependencies Needed

### Frontend
```bash
cd apps/dashboard
bun add d3 @types/d3                    # Agent tree visualization
bun add chart.js vue-chartjs            # Charts
bun add date-fns                         # Date formatting
bun add vue-virtual-scroller            # Virtual scrolling
bun add @vueuse/core                    # Vue utilities
```

### Backend
```bash
cd apps/api
bun add csv-writer                      # CSV export
bun add date-fns                        # Date utilities
```

---

## 🗂️ File Structure (New Files)

```
telegram-affiliate/
├── src/
│   ├── api/handlers/
│   │   ├── customer.handler.ts         # NEW - Customer management
│   │   ├── deposit.handler.ts          # NEW - Deposit recording
│   │   ├── withdrawal.handler.ts       # NEW - Withdrawal recording
│   │   └── commission.handler.ts       # NEW - Commission viewing
│   ├── services/
│   │   ├── activity.service.ts         # NEW - Activity tracking
│   │   ├── customer.service.ts         # NEW - Customer operations
│   │   └── notification.service.ts     # NEW - Notifications
│   └── utils/
│       └── export.ts                   # NEW - Export utilities
│
├── apps/api/src/routes/
│   ├── customer.ts                     # NEW - Customer endpoints
│   ├── deposit.ts                      # NEW - Deposit endpoints
│   ├── activity.ts                     # NEW - Activity endpoints
│   └── agent/
│       └── tree.ts                     # NEW - Agent tree endpoint
│
└── apps/dashboard/src/
    ├── views/
    │   └── Customers.vue               # NEW - Customer management page
    └── components/
        ├── ActivityFeed.vue            # NEW - Activity feed widget
        └── CommissionTable.vue         # NEW - Commission table component
```

---

## 🎯 Implementation Order (Recommended)

### Session 1 (4 hours)
1. ✅ Customer management bot flow
2. ✅ Deposit recording bot flow
3. ✅ Customer API endpoints
4. ✅ Deposit API endpoints

### Session 2 (4 hours)
1. ✅ Commission list table (dashboard)
2. ✅ Customer management page (dashboard)
3. ✅ Enhanced commission service
4. ✅ Activity tracking service

### Session 3 (4 hours)
1. ✅ Agent tree visualization
2. ✅ Activity feed component
3. ✅ Dashboard charts enhancement
4. ✅ Export/reporting features

### Session 4 (Optional - Polish)
1. ✅ Real-time notifications
2. ✅ Performance optimizations
3. ✅ Error handling improvements
4. ✅ E2E testing

---

## 🧪 Testing Strategy

### Bot Testing
- Manual testing in Telegram
- Test each conversation flow
- Test error cases
- Test concurrent users

### Dashboard Testing
- Component unit tests (Vitest)
- E2E tests (Playwright)
- Visual regression tests
- Performance testing (Lighthouse)

### API Testing
- Unit tests for services
- Integration tests for endpoints
- Load testing
- Error scenario testing

---

## 📊 Success Metrics

- ✅ All bot commands functional
- ✅ All dashboard pages complete
- ✅ <2s page load time
- ✅ <500ms API response time
- ✅ 90%+ test coverage
- ✅ Zero console errors
- ✅ Mobile responsive
- ✅ Cross-browser compatible

---

## 🚦 Next Steps

1. **Review this plan** - Adjust priorities as needed
2. **Start with Session 1** - Customer & deposit flows
3. **Test incrementally** - Don't wait until the end
4. **Deploy frequently** - Push working features to production
5. **Gather feedback** - Test with real agents

---

## 📝 Notes

- All features should work offline-first where possible
- Maintain consistency with existing design
- Follow TypeScript strict mode
- Use existing repository patterns
- Keep services thin, move logic to services
- Document complex business logic
- Add inline comments for clarity

---

**Ready to start?** Let's begin with **Phase 1.1: Customer Management Flow** 🚀
