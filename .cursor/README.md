# Cursor Rules for Telegram Affiliate Bot

This directory contains **9 comprehensive Cursor Rules** (60+ KB total) that guide AI-assisted development for this project.

## 📋 Available Rules

### 1. **documentation-structure.mdc** (3.5KB) ⭐ UPDATED
**Applies:** Always  
**Purpose:** Guidelines for organizing documentation files

- 📁 Where to place different types of documentation
- 🔗 How to link between docs correctly
- ✅ Keeps project root clean (only README.md & LICENSE)
- 📂 Defines 7 documentation categories (including .github/)
- 🆕 GitHub-specific file organization

### 2. **project-structure.mdc** (5.2KB) ⭐ UPDATED
**Applies:** Always  
**Purpose:** Monorepo organization and file placement

- 🗂️ Complete directory structure guide
- 📦 Bun workspace + TurboRepo setup
- 🎯 Where to add new features (bot/api/dashboard)
- 📝 File naming conventions
- 🔧 Configuration file locations
- 🆕 Root directory files explanation (what MUST stay in root)

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

### 7. **github-optimization.mdc** (12.5KB) 🆕 NEW
**Applies:** Always  
**Purpose:** GitHub repository optimization for discoverability

- 🎨 README professional structure with badges
- 📊 .gitattributes for language statistics
- 🏷️ Repository topics and metadata
- 📈 SEO optimization
- 🖼️ Social preview guidelines
- ⭐ Star graph optimization
- 📝 Example excellent READMEs

### 8. **package-metadata.mdc** (11.8KB) 🆕 NEW
**Applies:** Always  
**Purpose:** package.json metadata and organization standards

- 📦 Required metadata fields (description, keywords, repository)
- 🏗️ Scripts organization with consistent prefixes
- 📚 Dependencies categorization
- 🔧 Workspace configuration for monorepos
- ✅ Publishing configuration
- 📋 Validation checklist

### 9. **repository-hygiene.mdc** (10.2KB) 🆕 NEW
**Applies:** Always  
**Purpose:** Repository cleanliness and what NOT to move/delete

- ⚠️ Files that MUST stay in root (config files)
- ✅ Files you CAN move (docs, GitHub files)
- 🚫 Files to gitignore (never commit)
- 🧹 Good cleanup vs excessive cleanup
- 📋 Cleanup best practices
- 🎯 Why 25-30 root files is NORMAL for monorepos
- 💡 Use .gitattributes instead of moving config files

## 🎯 How Rules Are Applied

### Always Applied (8 rules)
These rules are **automatically included** in every AI conversation:
- `documentation-structure.mdc` ⭐ UPDATED
- `project-structure.mdc` ⭐ UPDATED
- `bun-first.mdc`
- `code-standards.mdc`
- `deployment.mdc`
- `github-optimization.mdc` 🆕 NEW
- `package-metadata.mdc` 🆕 NEW
- `repository-hygiene.mdc` 🆕 NEW

### Context-Specific (1 rule)
This rule applies **only when editing specific file types**:
- `markdown-links.mdc` → Applied to `*.md` files

### Manually Applied (0 rules)
No manual rules currently defined.

## 📊 Coverage Summary

| Category | Rules | Total Size | Status |
|----------|-------|------------|--------|
| **Documentation** | 3 | 19.8KB | 2 updated, 1 new |
| **Code Quality** | 2 | 12.1KB | - |
| **Project Setup** | 2 | 16.0KB | 1 updated, 1 new |
| **GitHub & Metadata** | 2 | 24.3KB | 2 new |
| **Total** | **9** | **60.4KB** | 🚀 Enhanced! |

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
✅ **GitHub Optimized** - Professional presentation and discoverability  
✅ **Repository Hygiene** - Avoid breaking changes during cleanup  
✅ **Package Standards** - Comprehensive metadata for all projects  

## 🎓 Learning Path

Recommended reading order for new developers:

### Phase 1: Project Understanding (Start Here)
1. **project-structure.mdc** - Understand the codebase layout
2. **repository-hygiene.mdc** - Learn what NOT to move/delete
3. **documentation-structure.mdc** - Where docs are organized

### Phase 2: Development Standards
4. **bun-first.mdc** - Learn the runtime and tools
5. **code-standards.mdc** - Follow development practices
6. **package-metadata.mdc** - Package.json structure

### Phase 3: Professional Polish
7. **github-optimization.mdc** - Repository presentation
8. **markdown-links.mdc** - Write docs correctly
9. **deployment.mdc** - Deploy to production

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

**Last Updated:** October 3, 2025  
**Total Rules:** 9 (60.4KB) - 50% larger!  
**Status:** ✅ Enhanced with GitHub optimization & repository hygiene  
**Project:** Telegram Affiliate Bot

## 🚀 What's New (October 3, 2025)

### 🆕 New Rules (3)
- **github-optimization.mdc** - Professional README, .gitattributes, SEO
- **package-metadata.mdc** - Comprehensive package.json standards
- **repository-hygiene.mdc** - What NOT to move/delete, cleanup best practices

### ⭐ Updated Rules (2)
- **documentation-structure.mdc** - Added .github/ directory organization
- **project-structure.mdc** - Added root directory files explanation

### 📈 Impact
- **Before:** 6 rules, 28.8KB - Basic project structure
- **After:** 9 rules, 60.4KB - Complete professional development guide
- **Growth:** +50% content, +3 critical topics

### 🎯 New Capabilities
- ✅ GitHub repository optimization for discoverability
- ✅ Professional README structure with badges and TOC
- ✅ Package.json metadata standards
- ✅ Repository cleanup guidelines (what NOT to move!)
- ✅ SEO and social preview optimization
- ✅ .gitattributes for cleaner GitHub language stats

**These rules now cover every aspect of professional TypeScript monorepo development!**

