# ✅ Next Session Checklist

**Last Updated**: 2025-10-07  
**Session**: 2  
**Continue**: Phase 2 Repository Consolidation

---

## 🚀 Quick Start

```bash
# 1. Navigate to project
cd /Users/nolarose/projects/telegram-affiliate

# 2. Checkout branch
git checkout refactor/tech-debt-elimination
git pull origin refactor/tech-debt-elimination

# 3. Install dependencies
bun install

# 4. Review progress
cat docs/reports/SESSION-1-SUMMARY.md
```

---

## 📋 Phase 2 Continuation Tasks

### Immediate Next Steps

#### 1. Customer Repository (~30 min)
```bash
# Read existing implementations
cat src/repositories/customer.repository.ts

# Create consolidated version
# File: packages/database/src/repositories/customer.repository.ts
```

**Methods to implement:**
- `getById(customerId)` - Get customer by ID
- `create(input)` - Create new customer
- `getByReferrer(agentId)` - Get customers by agent
- `existsByEmail(email)` - Check duplicate email
- `getTotalCount()` - Count all customers
- `update(customerId, data)` - Update customer
- `updateStatus(customerId, status)` - Update status

#### 2. Commission Repository (~30 min)
```bash
# Read existing
cat src/repositories/commission.repository.ts

# Create consolidated
# File: packages/database/src/repositories/commission.repository.ts
```

**Methods to implement:**
- `create(agentId, customerId, amount, percentage)` - Create commission
- `getById(commissionId)` - Get by ID
- `getByAgent(agentId)` - Get agent's commissions
- `getPendingByAgent(agentId)` - Get unpaid commissions
- `markAsPaid(commissionId)` - Mark as paid
- `getTotalByAgent(agentId)` - Sum commissions
- `getAll()` - Get all commissions

#### 3. Deposit Repository (~20 min)
```bash
# Read existing
cat src/repositories/deposit.repository.ts

# Create consolidated
# File: packages/database/src/repositories/deposit.repository.ts
```

**Methods to implement:**
- `create(agentId, customerId, amount, currency)` - Record deposit
- `getById(depositId)` - Get by ID
- `getByAgent(agentId)` - Get agent's deposits
- `getByCustomer(customerId)` - Get customer's deposits
- `getTotalByAgent(agentId)` - Sum deposits

#### 4. Export from Index (~5 min)
```bash
# File: packages/database/src/repositories/index.ts
```

Export all repositories:
```typescript
export * from './base.repository';
export * from './user.repository';
export * from './customer.repository';
export * from './commission.repository';
export * from './deposit.repository';
```

#### 5. Update Imports (~30 min)

**Files to update:**
- `src/api/handlers/*.ts` (7 files)
- `src/services/*.ts` (3 files)
- `apps/api/src/routes/*.ts` (5 files)

**Change:**
```typescript
// OLD:
import { userRepository } from '@/repositories/user.repository';

// NEW:
import { UserRepository } from '@affiliate/database';
const userRepository = new UserRepository(db);
```

#### 6. Delete Old Files (~5 min)
```bash
# Delete duplicates
rm -rf src/repositories/
rm -rf apps/api/src/bot/repositories/
```

#### 7. Test Integration (~20 min)
```bash
# Test bot still works
bun run dev:bot

# Test API still works
bun run dev:api

# Run type check
bun run type-check
```

---

## ⏱️ Time Estimate

| Task | Duration |
|------|----------|
| Customer Repository | 30 min |
| Commission Repository | 30 min |
| Deposit Repository | 20 min |
| Export from Index | 5 min |
| Update Imports | 30 min |
| Delete Old Files | 5 min |
| Test Integration | 20 min |
| **Total** | **~2.5 hours** |

---

## ✅ Completion Criteria

Phase 2 is complete when:
- [ ] All 4 repositories consolidated (User ✅, Customer, Commission, Deposit)
- [ ] All repositories exported from index
- [ ] All imports updated throughout codebase
- [ ] Old duplicate files deleted
- [ ] Type check passes
- [ ] Bot runs successfully
- [ ] API runs successfully
- [ ] Commit and push changes

---

## 📝 Commit Message Template

```
feat(database): Phase 2 (Complete) - Repository consolidation

Consolidated all repositories to use unified database interface,
eliminating ~600 lines of duplicate code.

Repositories consolidated:
- ✅ UserRepository (Part 1)
- ✅ CustomerRepository (Part 2)
- ✅ CommissionRepository (Part 2)
- ✅ DepositRepository (Part 2)

Changes:
- Created Customer, Commission, Deposit repositories with async methods
- Exported all repositories from packages/database/src/repositories/index.ts
- Updated all imports in handlers, services, and routes
- Deleted old duplicate repository files:
  * src/repositories/* (SQLite versions)
  * apps/api/src/bot/repositories/* (D1 versions)

Benefits:
✅ ~600 lines of duplicate code eliminated
✅ Single repository implementation (no SQLite vs D1 split)
✅ All methods are async (consistent interface)
✅ Works with both local SQLite and production D1
✅ Type-safe with proper error handling

Testing:
✅ Bot runs successfully with new repositories
✅ API runs successfully with new repositories
✅ Type check passes
✅ All CRUD operations verified

Phase 2 complete: ~2.5 hours
Next: Phase 3 - API Entry Point Consolidation
```

---

## 🔗 References

- **Session Summary**: `docs/reports/SESSION-1-SUMMARY.md`
- **Refactoring Plan**: `docs/reports/REFACTORING-PLAN.md`
- **GitHub Branch**: https://github.com/brendadeeznuts1111/telegram-affiliate/tree/refactor/tech-debt-elimination

---

## 💡 Tips

1. **Reference UserRepository**: Look at how it's implemented as a template
2. **Keep Methods Simple**: Most are just thin wrappers around SQL
3. **Test Incrementally**: Don't wait until all repositories are done
4. **Use BaseRepository**: Leverage helpers like `findById`, `count`, `exists`
5. **Check Types**: Run `bun run type-check` frequently

---

**Ready to continue? Start with Customer Repository!** 🚀
