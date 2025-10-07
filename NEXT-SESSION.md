# 🚀 Next Session: Feature Implementation

**Created:** October 7, 2025  
**Status:** Ready to start Phase 1

## 📋 Quick Reference

- **Full Plan:** [docs/implementation/FEATURE-IMPLEMENTATION-PLAN.md](docs/implementation/FEATURE-IMPLEMENTATION-PLAN.md)
- **Branch:** `main` (or create `feature/complete-flows`)
- **Estimated Time:** 4 hours for Phase 1

---

## 🎯 Phase 1: Telegram Bot Flows (START HERE)

### Phase 1.1: Customer Management Flow (1 hour)

**What to build:**
- Multi-step conversation for adding customers
- Bot command: `/addcustomer`
- Steps: name → email → phone → confirm
- Validation for email/phone
- Duplicate detection

**Files to create:**
```
src/api/handlers/customer.handler.ts (NEW)
src/services/customer.service.ts (NEW)
```

**Files to update:**
```
src/index.ts (register new command)
src/api/handlers/callback.handler.ts (add customer actions)
```

**Testing:**
```bash
# 1. Start bot
bun run dev:bot

# 2. In Telegram:
/addcustomer
# Follow the prompts
# Test validation errors
# Test duplicate detection
```

---

### Phase 1.2: Deposit Recording Flow (1 hour)

**What to build:**
- Deposit recording with customer selection
- Bot command: `/deposit`
- Auto-trigger commission calculations
- Notify agent of earnings

**Files to create:**
```
src/api/handlers/deposit.handler.ts (NEW)
```

**Files to update:**
```
src/services/commission.service.ts (enhance auto-calculation)
src/index.ts (register command)
```

**User Flow:**
```
Agent: /deposit
Bot: 💰 Select customer:
     [Customer 1] [Customer 2] [Customer 3]
Agent: [Clicks Customer 1]
Bot: 💵 Enter amount (USD):
Agent: 500
Bot: ✅ Deposit Recorded!
     Customer: John Doe
     Amount: $500.00
     Commission Earned: $75.00 (15%)
```

---

### Phase 1.3: Withdrawal Recording Flow (30 min)

**What to build:**
- Withdrawal recording
- Impact on net deposits
- Commission adjustments

**Files to create:**
```
src/api/handlers/withdrawal.handler.ts (NEW)
```

---

### Phase 1.4: Enhanced Dashboard Command (30 min)

**What to build:**
- Better `/dashboard` output
- Recent activities (last 5)
- Quick stats
- Action buttons

**Files to update:**
```
src/api/handlers/affiliate.handler.ts
```

---

### Phase 1.5: Commission Tracking (1 hour)

**What to build:**
- `/commissions` command
- List all commissions
- Filter by status
- Pagination

**Files to create:**
```
src/api/handlers/commission.handler.ts (NEW)
```

---

## 🛠️ Setup Commands

### Install Dependencies (if needed)
```bash
# No new dependencies for Phase 1!
# We'll add D3.js, Chart.js in Phase 2
```

### Database Check
```bash
# Ensure database is up-to-date
bun run scripts/init-database.ts
```

### Start Dev Environment
```bash
# Terminal 1: Bot
bun run dev:bot

# Terminal 2: API (optional for Phase 1)
cd apps/api && bun run dev
```

---

## 📊 Progress Tracking

Use TODO list in IDE or check:
```bash
# View current todos
cat .cursor/todos.md
```

**Phase 1 Checklist:**
- [ ] Customer management flow
- [ ] Deposit recording flow
- [ ] Withdrawal recording flow
- [ ] Enhanced dashboard command
- [ ] Commission tracking

---

## 🧪 Testing Strategy

### Manual Testing (Primary for Phase 1)

1. **Start fresh database:**
   ```bash
   rm data/affiliate_system.db*
   bun run scripts/init-database.ts
   ```

2. **Test each command:**
   - `/start` - Should work as before
   - `/addcustomer` - Add 3-5 test customers
   - `/deposit` - Record deposits for each
   - `/withdraw` - Test withdrawal
   - `/commissions` - View earned commissions
   - `/dashboard` - See updated stats

3. **Test error cases:**
   - Invalid email format
   - Negative amounts
   - Non-existent customers
   - Duplicate customers

### Automated Testing (Optional)
```bash
# Unit tests for services
bun test src/services/customer.service.test.ts

# Run all tests
bun test
```

---

## 🎨 UI/UX Guidelines

### Bot Message Format

**Successful Action:**
```
✅ [Action Completed!]

[Summary Details]

[Next Steps or Actions]
```

**Error Message:**
```
❌ [Error Description]

[Helpful Guidance]

[How to Fix]
```

**Inline Keyboards:**
- Max 3 buttons per row
- Use emojis for visual clarity
- Add "Cancel" option
- Add "Back" for multi-step flows

---

## 🔍 Code Patterns to Follow

### Bot Handler Pattern
```typescript
export async function commandHandler(ctx: BotContext) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    // 1. Validate user
    const user = await userRepository.getById(userId);
    if (!user) {
      await ctx.reply('❌ User not found. Use /start first.');
      return;
    }

    // 2. Business logic
    const result = await service.doSomething();

    // 3. Format response
    const keyboard = new InlineKeyboard()
      .text('Action 1', 'callback_1')
      .text('Action 2', 'callback_2');

    await ctx.reply('✅ Success message', { reply_markup: keyboard });

    // 4. Log
    logger.info(`User ${userId} did something`);

  } catch (error) {
    logger.error('Handler error:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
}
```

### Multi-Step Conversation Pattern
```typescript
// Use Grammy conversations plugin
// Store state in conversation context
// Validate each step
// Provide "Cancel" option
```

---

## 💡 Tips

1. **Incremental Testing:** Test each feature immediately after building
2. **Console Logs:** Use `logger.info()` to debug
3. **Error Messages:** Make them helpful, not technical
4. **User Experience:** Keep flows simple and intuitive
5. **Validation:** Always validate user input
6. **Feedback:** Show progress indicators for long operations

---

## 🚧 Known Issues to Address

None yet for Phase 1! But watch out for:
- Long-running operations (deposits with many uplines)
- Race conditions (concurrent commands)
- Invalid UTF-8 in customer names
- Very long customer names

---

## 📚 Reference Documentation

- Grammy Docs: https://grammy.dev/
- Grammy Conversations: https://grammy.dev/plugins/conversations
- Our Config: `src/core/config.ts`
- Our Database: `src/core/database.ts`
- Commission Logic: `src/services/commission.service.ts`

---

## 🎯 Success Criteria for Phase 1

- ✅ All 5 bot commands work end-to-end
- ✅ No console errors
- ✅ Commissions calculate automatically
- ✅ Error handling for invalid inputs
- ✅ Clear user feedback
- ✅ Logged activities
- ✅ Ready to move to Phase 2

---

**Ready to code?** Start with Phase 1.1: Customer Management Flow! 🚀

```bash
# Start bot in dev mode
bun run dev:bot

# Open Telegram and test!
```
