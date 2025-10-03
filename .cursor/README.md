# Cursor Rules for Telegram Affiliate Bot

This directory contains **6 comprehensive Cursor Rules** (28.8KB total) that guide AI-assisted development for this project.

## 📋 Available Rules

### 1. **documentation-structure.mdc** (2.5KB)
**Applies:** Always  
**Purpose:** Guidelines for organizing documentation files

- 📁 Where to place different types of documentation
- 🔗 How to link between docs correctly
- ✅ Keeps project root clean (only README.md)
- 📂 Defines 6 documentation categories

### 2. **project-structure.mdc** (3.9KB)
**Applies:** Always  
**Purpose:** Monorepo organization and file placement

- 🗂️ Complete directory structure guide
- 📦 Bun workspace + TurboRepo setup
- 🎯 Where to add new features (bot/api/dashboard)
- 📝 File naming conventions
- 🔧 Configuration file locations

### 3. **bun-first.mdc** (4.3KB)
**Applies:** Always  
**Purpose:** Bun-native development practices

- ⚡ Use Bun native APIs over Node.js packages
- 🔐 Built-in crypto, file system, testing
- 🚀 Performance optimization tips
- 🔧 Cloudflare Workers compatibility notes
- 📊 Debugging with Bun.inspect.table

### 4. **markdown-links.mdc** (4.0KB)
**Applies:** To `*.md` files only  
**Purpose:** Standards for markdown documentation linking

- 🔗 Relative path patterns for all scenarios
- 📍 Directory mapping reference
- ✅ Link verification checklist
- 📝 Best practices for link text
- 🔄 How to handle moved files

### 5. **code-standards.mdc** (7.3KB)
**Applies:** Always  
**Purpose:** Code quality and development standards

- 🎯 TypeScript strict typing guidelines
- 🗃️ Repository pattern for data access
- 🏗️ Service layer architecture
- 🔒 Security best practices
- ✅ Testing standards with Bun test
- 📐 Code formatting and Git practices
- ⚡ Performance optimization tips

### 6. **deployment.mdc** (6.8KB)
**Applies:** Always  
**Purpose:** Deployment and Cloudflare Workers guide

- ☁️ Cloudflare Workers compatibility
- 🗄️ D1 Database vs SQLite differences
- 🔐 Environment variable management
- 🚀 Deployment commands for all targets
- 🔧 Wrangler configuration guide
- 🏥 Health checks and monitoring
- 📋 Pre-deployment checklist

## 🎯 How Rules Are Applied

### Always Applied (4 rules)
These rules are **automatically included** in every AI conversation:
- `documentation-structure.mdc`
- `project-structure.mdc`
- `bun-first.mdc`
- `code-standards.mdc`
- `deployment.mdc`

### Context-Specific (1 rule)
This rule applies **only when editing specific file types**:
- `markdown-links.mdc` → Applied to `*.md` files

### Manually Applied (0 rules)
No manual rules currently defined.

## 📊 Coverage Summary

| Category | Rules | Total Size |
|----------|-------|------------|
| **Documentation** | 2 | 6.5KB |
| **Code Quality** | 2 | 12.1KB |
| **Project Setup** | 2 | 10.2KB |
| **Total** | **6** | **28.8KB** |

## 🔧 Adding New Rules

To create a new rule:

1. Create a file in `.cursor/rules/` with `.mdc` extension
2. Add frontmatter metadata:
   ```markdown
   ---
   alwaysApply: true
   description: "What this rule helps with"
   globs: "*.ts,*.tsx"  # optional: specific file types
   ---
   ```
3. Write content in Markdown format
4. Reference project files using: `[filename.ext](mdc:filename.ext)`

## 📚 Rule Benefits

✅ **Consistent Documentation** - All docs follow same organization  
✅ **No Broken Links** - Clear linking standards prevent issues  
✅ **Bun-First Development** - Leverage native APIs for performance  
✅ **Type Safety** - Strict TypeScript and Zod validation  
✅ **Clean Architecture** - Repository and service patterns  
✅ **Production Ready** - Cloudflare Workers best practices  
✅ **Security First** - Path validation and token generation  
✅ **Fast Onboarding** - New developers understand structure quickly  

## 🎓 Learning Path

Recommended reading order for new developers:

1. **project-structure.mdc** - Understand the codebase layout
2. **bun-first.mdc** - Learn the runtime and tools
3. **code-standards.mdc** - Follow development practices
4. **deployment.mdc** - Deploy to production
5. **documentation-structure.mdc** - Contribute documentation
6. **markdown-links.mdc** - Write docs correctly

## 📖 Related Documentation

- [README.md](mdc:../README.md) - Project overview
- [ARCHITECTURE-FLOWS.md](mdc:../docs/architecture/ARCHITECTURE-FLOWS.md) - System architecture
- [PHASE-2-DEPLOYMENT-GUIDE.md](mdc:../docs/deployment/PHASE-2-DEPLOYMENT-GUIDE.md) - Deployment steps

## 🚀 Quick Reference

```bash
# View all rules
ls -lh .cursor/rules/

# Search rules for a topic
grep -r "KV Namespace" .cursor/rules/

# Edit a rule
cursor .cursor/rules/code-standards.mdc
```

---

**Generated:** October 3, 2025  
**Total Rules:** 6 (28.8KB)  
**Project:** Telegram Affiliate Bot

