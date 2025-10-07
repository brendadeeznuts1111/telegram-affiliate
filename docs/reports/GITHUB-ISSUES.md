# 🎫 GitHub Issues for Refactoring Plan

Copy and paste these into GitHub Issues to track the refactoring work.

---

## Issue #1: Phase 6 - Configuration Management

**Title**: `[REFACTOR] Phase 6: Configuration Management with Zod Validation`  
**Labels**: `refactoring`, `technical-debt`, `priority-high`  
**Estimated Time**: 1 hour

### Description

Create centralized configuration management with Zod validation to ensure all required environment variables are present and valid at startup.

### Goals

- Create shared config package with Zod schemas
- Validate all environment variables at startup
- Fail fast with clear error messages for missing config
- Share config between bot, API, and workers

### Tasks

- [ ] Create `packages/config/src/index.ts`
- [ ] Define Zod schema for all environment variables
- [ ] Implement `getConfig()` function with validation
- [ ] Update bot to use new config package
- [ ] Update API to use new config package
- [ ] Update workers to use new config package
- [ ] Test with missing environment variables (should fail gracefully)
- [ ] Update `.env.example` with all required variables

### Success Criteria

- [ ] All environment variables validated at startup
- [ ] Clear error messages for missing/invalid config
- [ ] Type-safe config access throughout codebase
- [ ] Tests pass
- [ ] Type check passes

### Files Modified

- `packages/config/src/index.ts` (new)
- `packages/config/package.json` (new)
- `src/core/config.ts` (update to use shared config)
- `apps/api/src/index.ts` (update to use shared config)
- `apps/api/src/index-worker.ts` (update to use shared config)
- `env.example` (update)

### References

- [Refactoring Plan Phase 6](../docs/reports/REFACTORING-PLAN.md#phase-6-configuration-management-1-hour)
- Related: None (foundation phase)

---

## Issue #2: Phase 7 - Zod Schema Library

**Title**: `[REFACTOR] Phase 7: Comprehensive Zod Schema Library`  
**Labels**: `refactoring`, `technical-debt`, `priority-high`  
**Estimated Time**: 1 hour

### Description

Expand the shared Zod schemas package to cover all API inputs, enabling consistent validation across the entire application.

### Goals

- Create schemas for all data types (customer, deposit, agent, webhook)
- Replace manual validation with Zod schemas
- Enable type inference from schemas
- Improve error messages for validation failures

### Tasks

- [ ] Create `packages/schemas/src/customer.ts`
- [ ] Create `packages/schemas/src/deposit.ts`
- [ ] Create `packages/schemas/src/agent.ts`
- [ ] Create `packages/schemas/src/webhook.ts`
- [ ] Create `packages/schemas/src/api-request.ts`
- [ ] Create helper `formatZodError()` for user-friendly errors
- [ ] Update bot handlers to use new schemas
- [ ] Update API routes to use new schemas
- [ ] Remove manual validation code
- [ ] Add tests for schema validation

### Success Criteria

- [ ] All API inputs validated with Zod
- [ ] Manual validation code removed
- [ ] Better error messages for users
- [ ] Type inference working
- [ ] Tests pass with valid and invalid data

### Files Modified

- `packages/schemas/src/customer.ts` (new)
- `packages/schemas/src/deposit.ts` (new)
- `packages/schemas/src/agent.ts` (new)
- `packages/schemas/src/webhook.ts` (new)
- `packages/schemas/src/api-request.ts` (new)
- `packages/schemas/src/index.ts` (update exports)
- `src/api/handlers/message.handler.ts` (use schemas)
- `src/utils/validation.ts` (refactor to use Zod)
- `apps/api/src/routes/*` (use schemas)

### References

- [Refactoring Plan Phase 7](../docs/reports/REFACTORING-PLAN.md#phase-7-zod-schema-library-1-hour)
- Depends on: #1 (Phase 6)

---

## Issue #3: Phase 8 - Error Handling Standardization

**Title**: `[REFACTOR] Phase 8: Standardize Error Handling`  
**Labels**: `refactoring`, `technical-debt`, `priority-high`  
**Estimated Time**: 1 hour

### Description

Create custom error classes and standardize error handling throughout the application for consistent error responses and better debugging.

### Goals

- Create custom error classes (AppError, ValidationError, NotFoundError, etc.)
- Standardize error handler in API
- Consistent error response format
- Structured error logging

### Tasks

- [ ] Create `packages/errors/src/index.ts`
- [ ] Define `AppError` base class
- [ ] Define `ValidationError` class
- [ ] Define `NotFoundError` class
- [ ] Define `UnauthorizedError` class
- [ ] Define `DatabaseError` class
- [ ] Update `apps/api/src/utils/error-handling.ts`
- [ ] Replace all `throw new Error()` with custom errors
- [ ] Add error boundaries in bot handlers
- [ ] Test error responses in API
- [ ] Update error logging

### Success Criteria

- [ ] All errors use custom error classes
- [ ] Consistent JSON error responses
- [ ] Proper HTTP status codes
- [ ] Structured error logging
- [ ] User-friendly error messages
- [ ] Tests pass

### Files Modified

- `packages/errors/src/index.ts` (new)
- `packages/errors/package.json` (new)
- `apps/api/src/utils/error-handling.ts` (update)
- All handlers and routes (use new errors)
- All repositories (use new errors)
- All services (use new errors)

### References

- [Refactoring Plan Phase 8](../docs/reports/REFACTORING-PLAN.md#phase-8-error-handling-standardization-1-hour)
- Depends on: #2 (Phase 7)

---

## Issue #4: Phase 1 - Database Abstraction Layer

**Title**: `[REFACTOR] Phase 1: Create Database Abstraction Layer`  
**Labels**: `refactoring`, `technical-debt`, `priority-critical`  
**Estimated Time**: 4-5 hours

### Description

Create a unified database interface that works with both SQLite (local) and Cloudflare D1 (production), enabling code reuse and easier testing.

### Goals

- Define database interface (IDatabaseAdapter)
- Implement SQLite adapter for local development
- Implement D1 adapter for production
- Create database factory
- Enable dependency injection for testing

### Tasks

- [ ] Create `packages/database/` workspace package
- [ ] Define `IDatabaseAdapter` interface
- [ ] Implement `SqliteAdapter` class
- [ ] Implement `D1Adapter` class
- [ ] Create `createDatabase()` factory function
- [ ] Add migration runner
- [ ] Add transaction support
- [ ] Create mock adapter for testing
- [ ] Write adapter tests
- [ ] Update documentation

### Success Criteria

- [ ] SQLite adapter works with bun:sqlite
- [ ] D1 adapter works with Cloudflare D1
- [ ] Both adapters implement same interface
- [ ] Transactions work correctly
- [ ] Migration runner functional
- [ ] Tests pass for both adapters
- [ ] Type check passes

### Files Modified

- `packages/database/src/interface.ts` (new)
- `packages/database/src/adapters/sqlite.ts` (new)
- `packages/database/src/adapters/d1.ts` (new)
- `packages/database/src/adapters/mock.ts` (new)
- `packages/database/src/factory.ts` (new)
- `packages/database/src/migrations/runner.ts` (new)
- `packages/database/package.json` (new)
- `packages/database/tsconfig.json` (new)

### References

- [Refactoring Plan Phase 1](../docs/reports/REFACTORING-PLAN.md#phase-1-database-abstraction-layer-4-5-hours)
- Depends on: #1, #3 (Phases 6, 8)

---

## Issue #5: Phase 2 - Repository Consolidation

**Title**: `[REFACTOR] Phase 2: Consolidate Repository Implementations`  
**Labels**: `refactoring`, `technical-debt`, `priority-critical`, `code-deduplication`  
**Estimated Time**: 3-4 hours

### Description

Eliminate ~600 lines of duplicate repository code by consolidating SQLite and D1 repository implementations into a single shared codebase.

### Goals

- Create shared repository base class
- Consolidate User, Customer, Commission, and Deposit repositories
- Use database abstraction layer
- Make all repository methods async
- Delete duplicate repository files

### Tasks

- [ ] Create `packages/database/src/repositories/base.repository.ts`
- [ ] Consolidate `user.repository.ts` (use IDatabaseAdapter)
- [ ] Consolidate `customer.repository.ts`
- [ ] Consolidate `commission.repository.ts`
- [ ] Consolidate `deposit.repository.ts`
- [ ] Update all repository consumers (handlers, services)
- [ ] Delete old SQLite-only repositories
- [ ] Delete `apps/api/src/bot/repositories/user.repository.d1.ts`
- [ ] Write repository tests
- [ ] Update import paths throughout codebase

### Success Criteria

- [ ] Single repository implementation per entity
- [ ] Works with both SQLite and D1
- [ ] All methods are async
- [ ] ~600 lines of code eliminated
- [ ] All tests pass
- [ ] Type check passes
- [ ] Bot works with SQLite locally
- [ ] API works with D1 in Workers

### Files Modified

- `packages/database/src/repositories/base.repository.ts` (new)
- `packages/database/src/repositories/user.repository.ts` (consolidate)
- `packages/database/src/repositories/customer.repository.ts` (consolidate)
- `packages/database/src/repositories/commission.repository.ts` (consolidate)
- `packages/database/src/repositories/deposit.repository.ts` (consolidate)
- `packages/database/src/repositories/index.ts` (new)
- Delete: `apps/api/src/bot/repositories/user.repository.d1.ts`
- Delete: `src/repositories/*.ts` (moved to packages/database)
- All handlers and services (update imports)

### References

- [Refactoring Plan Phase 2](../docs/reports/REFACTORING-PLAN.md#phase-2-repository-consolidation-3-4-hours)
- Depends on: #4 (Phase 1)

---

## Issue #6: Phase 3 - API Entry Point Consolidation

**Title**: `[REFACTOR] Phase 3: Consolidate API Entry Points`  
**Labels**: `refactoring`, `technical-debt`, `priority-high`, `code-deduplication`  
**Estimated Time**: 2-3 hours

### Description

Eliminate duplicate Hono app configuration by creating a single app factory that works in both Bun and Cloudflare Workers environments.

### Goals

- Create single Hono app factory
- Environment-specific only where needed
- Eliminate ~150 lines of duplicate code
- Consistent middleware and routes

### Tasks

- [ ] Create `apps/api/src/app.ts` (app factory)
- [ ] Extract middleware configuration
- [ ] Extract route registration
- [ ] Update `apps/api/src/index.ts` (Bun entry point)
- [ ] Update `apps/api/src/index-worker.ts` (Workers entry point)
- [ ] Test locally with Bun server
- [ ] Test with `wrangler dev`
- [ ] Verify all routes work in both environments
- [ ] Update CORS configuration

### Success Criteria

- [ ] Single source of truth for app configuration
- [ ] Works in both Bun and Workers
- [ ] All routes functional
- [ ] ~150 lines eliminated
- [ ] Tests pass
- [ ] Local dev works
- [ ] Workers dev works

### Files Modified

- `apps/api/src/app.ts` (new - core app factory)
- `apps/api/src/index.ts` (simplified - Bun wrapper)
- `apps/api/src/index-worker.ts` (simplified - Workers wrapper)
- `apps/api/src/middleware/cors.ts` (new - extracted)

### References

- [Refactoring Plan Phase 3](../docs/reports/REFACTORING-PLAN.md#phase-3-api-entry-point-consolidation-2-3-hours)
- Depends on: #5 (Phase 2)

---

## Issue #7: Phase 4 - Complete D1 Migration

**Title**: `[REFACTOR] Phase 4: Complete D1 Migration for All Routes`  
**Labels**: `refactoring`, `technical-debt`, `priority-critical`, `cloudflare`  
**Estimated Time**: 2 hours

### Description

Enable all API routes in production by completing the migration to Cloudflare D1 and removing all TODO comments and commented-out code.

### Goals

- Migrate user routes to use new repositories
- Migrate agent routes to use new repositories
- Remove all TODO comments
- Enable all routes in Workers
- Test all endpoints with D1

### Tasks

- [ ] Update `apps/api/src/routes/user.ts` to use new repositories
- [ ] Update `apps/api/src/routes/agent.ts` to use new repositories
- [ ] Remove commented imports from `index-worker.ts`
- [ ] Remove all TODO comments related to D1 migration
- [ ] Test user endpoints with D1 locally (`wrangler dev`)
- [ ] Test agent endpoints with D1 locally
- [ ] Deploy to staging and test
- [ ] Verify all endpoints return correct data

### Success Criteria

- [ ] All routes uncommented and working
- [ ] Zero TODO comments about D1 migration
- [ ] User endpoints functional in Workers
- [ ] Agent endpoints functional in Workers
- [ ] Tests pass with D1
- [ ] Production deployment ready

### Files Modified

- `apps/api/src/routes/user.ts` (migrate to new repos)
- `apps/api/src/routes/agent.ts` (migrate to new repos)
- `apps/api/src/index-worker.ts` (uncomment routes, remove TODOs)
- `apps/api/src/routes/affiliate/broadcast.ts` (remove TODOs)
- `apps/api/src/routes/affiliate/withdraw.ts` (remove TODOs)

### References

- [Refactoring Plan Phase 4](../docs/reports/REFACTORING-PLAN.md#phase-4-complete-d1-migration-2-hours)
- Depends on: #6 (Phase 3)

---

## Issue #8: Phase 5 - Webhook Implementation

**Title**: `[REFACTOR] Phase 5: Implement Functional Webhook Handler`  
**Labels**: `refactoring`, `technical-debt`, `priority-high`, `production`, `telegram`  
**Estimated Time**: 1-2 hours

### Description

Implement a functional webhook handler to enable scalable production deployment without polling.

### Goals

- Implement webhook handler using Grammy
- Create bot factory for webhook mode
- Share handler logic between polling and webhook
- Test webhook flow end-to-end

### Tasks

- [ ] Create `apps/api/src/bot/factory.ts` (bot factory)
- [ ] Implement webhook handler in `apps/api/src/routes/telegram.ts`
- [ ] Use `webhookCallback` from Grammy
- [ ] Initialize repositories with D1
- [ ] Share handlers between polling bot and webhook bot
- [ ] Set up webhook URL in Telegram
- [ ] Test webhook with sample updates
- [ ] Verify database changes from webhook
- [ ] Add error handling for webhook failures
- [ ] Document webhook setup process

### Success Criteria

- [ ] Webhook endpoint functional
- [ ] Bot responds via webhook
- [ ] Database operations work
- [ ] Error handling robust
- [ ] No more empty TODO comments
- [ ] Production ready
- [ ] Documentation updated

### Files Modified

- `apps/api/src/bot/factory.ts` (new)
- `apps/api/src/bot/worker-bot.ts` (update to use factory)
- `apps/api/src/routes/telegram.ts` (implement webhook)
- `docs/deployment/BOT-READY.md` (update with webhook setup)

### References

- [Refactoring Plan Phase 5](../docs/reports/REFACTORING-PLAN.md#phase-5-webhook-implementation-1-2-hours)
- Depends on: #7 (Phase 4)

---

## Issue #9: Phase 9 - Testing Infrastructure

**Title**: `[REFACTOR] Phase 9: Build Comprehensive Test Suite`  
**Labels**: `refactoring`, `testing`, `priority-medium`  
**Estimated Time**: 2-3 hours

### Description

Build a comprehensive test suite to achieve 70%+ code coverage and prevent regressions.

### Goals

- Create test infrastructure
- Add repository tests
- Add service tests
- Add API route tests
- Achieve 70%+ coverage

### Tasks

- [ ] Set up test database (in-memory mock)
- [ ] Add tests for `user.repository.ts`
- [ ] Add tests for `customer.repository.ts`
- [ ] Add tests for `commission.repository.ts`
- [ ] Add tests for `deposit.repository.ts`
- [ ] Add tests for `commission.service.ts`
- [ ] Add tests for `level.service.ts`
- [ ] Add tests for API routes (user, agent, affiliate)
- [ ] Add tests for error handling
- [ ] Add tests for validation schemas
- [ ] Configure coverage reporting
- [ ] Run coverage report and verify 70%+

### Success Criteria

- [ ] 70%+ code coverage
- [ ] All critical paths tested
- [ ] Tests run fast (<10s)
- [ ] CI/CD runs tests automatically
- [ ] Coverage report generated
- [ ] All tests passing

### Files Created

- `packages/database/src/repositories/__tests__/user.repository.test.ts`
- `packages/database/src/repositories/__tests__/customer.repository.test.ts`
- `packages/database/src/repositories/__tests__/commission.repository.test.ts`
- `packages/database/src/repositories/__tests__/deposit.repository.test.ts`
- `src/services/__tests__/commission.service.test.ts`
- `src/services/__tests__/level.service.test.ts`
- `apps/api/src/routes/__tests__/user.test.ts`
- `apps/api/src/routes/__tests__/agent.test.ts`
- `apps/api/src/routes/__tests__/affiliate.test.ts`

### References

- [Refactoring Plan Phase 9](../docs/reports/REFACTORING-PLAN.md#phase-9-testing-infrastructure-2-3-hours)
- Depends on: #8 (Phase 5)

---

## Issue #10: Phase 10 - Documentation Updates

**Title**: `[REFACTOR] Phase 10: Update Documentation and Remove TODOs`  
**Labels**: `refactoring`, `documentation`, `priority-low`  
**Estimated Time**: 1 hour

### Description

Final cleanup pass to update all documentation, remove TODO comments, and create migration guides.

### Goals

- Remove all remaining TODO comments
- Update architecture documentation
- Create migration guide for developers
- Update README with new patterns
- Clean up outdated docs

### Tasks

- [ ] Scan all files for TODO comments
- [ ] Resolve or create issues for remaining TODOs
- [ ] Update `docs/architecture/ARCHITECTURE-FLOWS.md`
- [ ] Create `docs/guides/MIGRATION-GUIDE.md`
- [ ] Update `README.md` with new patterns
- [ ] Update `docs/deployment/BOT-READY.md`
- [ ] Archive outdated documentation
- [ ] Update code examples in documentation
- [ ] Review all docs for accuracy
- [ ] Add troubleshooting section

### Success Criteria

- [ ] Zero TODO comments in code
- [ ] All docs accurate and up-to-date
- [ ] Migration guide complete
- [ ] README reflects new architecture
- [ ] Troubleshooting guide added
- [ ] Outdated docs archived

### Files Modified

- `docs/architecture/ARCHITECTURE-FLOWS.md` (update)
- `docs/guides/MIGRATION-GUIDE.md` (new)
- `docs/deployment/BOT-READY.md` (update)
- `README.md` (update)
- `docs/guides/TROUBLESHOOTING.md` (new)
- All files with TODO comments (remove)

### References

- [Refactoring Plan Phase 10](../docs/reports/REFACTORING-PLAN.md#phase-10-documentation-updates-1-hour)
- Depends on: #9 (Phase 9)

---

## 📊 Summary

**Total Issues**: 10  
**Total Estimated Time**: 18-26 hours  
**Priority Distribution**:
- 🔴 Critical: 4 issues (Phases 1, 2, 4, 7)
- 🟡 High: 5 issues (Phases 3, 5, 6, 8)
- 🟢 Medium/Low: 2 issues (Phases 9, 10)

**Dependency Chain**:
```
Phase 6 (Config) → Phase 7 (Schemas) → Phase 8 (Errors) → 
Phase 1 (DB Layer) → Phase 2 (Repos) → Phase 3 (API) → 
Phase 4 (D1) → Phase 5 (Webhook) → Phase 9 (Tests) → 
Phase 10 (Docs)
```

---

## 🚀 Quick Start

1. Create these issues in GitHub (copy/paste each section)
2. Add labels: `refactoring`, `technical-debt`, `priority-*`
3. Create a project board to track progress
4. Start with Issue #1 (Phase 6 - Configuration)

---

**Note**: These issues are generated from the comprehensive refactoring plan at `docs/reports/REFACTORING-PLAN.md`.
