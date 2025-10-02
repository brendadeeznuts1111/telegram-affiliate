# 🔐 Authentication Guide - Local vs GitHub Actions

**Status:** ✅ You're already authenticated for local development!

---

## 🎯 Two Types of Authentication

### 1. **Local Development** ✅ ALREADY WORKING
**What you have:** OAuth Token (via `wrangler login`)  
**Email:** nolarose1968@gmail.com  
**Accounts:** 2 accounts available  

```
✅ Brendawill2233@gmail.com's Account: 5e5d2b2fa037e9924a50619c08f9f442
✅ Nolarose1968@gmail.com's Account:   80693377f3abb78e00820aa69a415ce4 (ACTIVE)
```

**What this means:**
- ✅ You can deploy from your local machine
- ✅ You can use `bunx wrangler deploy`
- ✅ You can create D1 databases
- ✅ You can set secrets
- ✅ NO API TOKEN NEEDED for local work!

### 2. **GitHub Actions** ⏳ NEEDS API TOKEN
**Why:** GitHub Actions can't use OAuth (no browser)  
**Solution:** Create an API Token for automation  

---

## 🚀 Quick Deploy (Local - Works NOW!)

You can deploy RIGHT NOW without any API token:

```bash
cd /Users/nolarose/projects/telegram-affiliate/apps/api

# Deploy to production (uses your OAuth login)
bunx wrangler deploy

# That's it! No token needed! ✨
```

---

## 🤖 For GitHub Actions Only

**Only needed if you want automated deployments from GitHub.**

### Required Permissions for API Token:

When you create an API token at https://dash.cloudflare.com/profile/api-tokens:

**Template:** Use "Edit Cloudflare Workers" template, then add:

| Permission | Resource | Why |
|------------|----------|-----|
| **Workers Scripts:Edit** | All accounts | Deploy Workers |
| **Workers KV Storage:Edit** | All accounts | Manage KV namespaces |
| **Workers Routes:Edit** | All accounts | Configure routes |
| **D1:Edit** | All accounts | Database operations |
| **Account Settings:Read** | All accounts | Verify account access |

### Create API Token Steps:

1. **Go to:** https://dash.cloudflare.com/profile/api-tokens
2. **Click:** "Create Token"
3. **Choose:** "Edit Cloudflare Workers" template
4. **Add D1 permission:**
   - Service: D1
   - Permission: Edit
5. **Account Resources:** Include → Nolarose1968@gmail.com's Account
6. **Zone Resources:** Include → All zones (or specific zones)
7. **TTL:** Optional (leave blank for no expiration)
8. **Create Token**
9. **COPY IT!** (You'll only see it once)

### Set as GitHub Secret:

```bash
# After copying your token:
gh secret set CLOUDFLARE_API_TOKEN --body "YOUR_TOKEN_HERE"
```

---

## 🎯 What You Can Do RIGHT NOW

### Local Deployment (No Token Needed!)

```bash
cd /Users/nolarose/projects/telegram-affiliate/apps/api

# 1. Create D1 Database
bunx wrangler d1 create affiliate-system
# Copy the database_id from output

# 2. Update wrangler.toml with the database_id

# 3. Run migrations
bunx wrangler d1 execute affiliate-system \
  --file=../src/db/migrations/001_initial.sql

# 4. Set secrets
echo "8039557687:AAGMloT2l10NsnRFJXzUtIcSX_kSPTzKY2E" | bunx wrangler secret put BOT_TOKEN
echo "8013171035" | bunx wrangler secret put ADMIN_IDS
openssl rand -hex 32 | bunx wrangler secret put WEBHOOK_SECRET

# 5. Deploy!
bunx wrangler deploy

# 6. Set webhook
curl "https://api.telegram.org/bot8039557687:AAGMloT2l10NsnRFJXzUtIcSX_kSPTzKY2E/setWebhook?url=https://telegram-affiliate-api.workers.dev/telegram"

# 7. Test!
curl https://telegram-affiliate-api.workers.dev/health
```

**No API token needed for any of this!** Your OAuth login handles everything! ✨

---

## 🔍 Verify Your Authentication

```bash
# Check who you're logged in as
bunx wrangler whoami

# List your Workers
bunx wrangler deployments list

# List your D1 databases
bunx wrangler d1 list

# List your KV namespaces
bunx wrangler kv namespace list
```

---

## 📊 Authentication Comparison

| Task | OAuth (Local) | API Token (GitHub) |
|------|---------------|-------------------|
| **Setup** | `wrangler login` once | Create token + set secret |
| **Expiration** | Refresh automatically | Optional TTL |
| **Scope** | Full account access | Specific permissions |
| **Use Case** | Local dev | CI/CD automation |
| **Security** | Browser-based | Copy/paste risk |
| **Revocation** | Logout anytime | Delete token |

---

## 🎯 Recommended Workflow

### Option A: Local Deployment First (EASIEST)
1. ✅ Deploy from your machine (you're ready NOW!)
2. ✅ Test everything works
3. ⏳ Create API token for GitHub Actions later

### Option B: GitHub Actions Only
1. ⏳ Create API token
2. ⏳ Set as GitHub secret
3. ⏳ Push to trigger deployment

---

## 🚨 Important Notes

### For Local Development:
- ✅ **You're authenticated!** - No action needed
- ✅ **OAuth is MORE secure** - No token to leak
- ✅ **Easier to use** - Just `wrangler deploy`

### For GitHub Actions:
- ⚠️ **API Token required** - No way around it
- 🔒 **Store as GitHub Secret** - Never commit it
- 🔄 **Can rotate** - Generate new token anytime
- ⏱️ **Set expiration** - Optional but recommended

---

## 🎉 TL;DR

**For YOU right now:**

```bash
# You can literally deploy RIGHT NOW:
cd apps/api
bunx wrangler deploy

# That's it! You're authenticated! 🚀
```

**For GitHub Actions later:**
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Create token with: Workers:Edit + D1:Edit + KV:Edit
3. Set as secret: `gh secret set CLOUDFLARE_API_TOKEN --body "TOKEN"`

---

## 🔧 Troubleshooting

### "Not authenticated"
```bash
bunx wrangler login
```

### "Multiple accounts, which one?"
Already set in `wrangler.toml`:
```toml
account_id = "80693377f3abb78e00820aa69a415ce4"  # Nolarose account
```

### "Permission denied"
Check account access:
```bash
bunx wrangler whoami
```

---

## 📚 Additional Resources

- [Wrangler Auth Docs](https://developers.cloudflare.com/workers/wrangler/commands/#login)
- [API Token Permissions](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Last Updated:** October 2, 2025  
**Your Status:** ✅ Authenticated via OAuth - Ready to deploy!

