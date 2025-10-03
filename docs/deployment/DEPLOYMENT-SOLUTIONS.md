# 🚀 Dashboard Deployment Solutions

Current Status: Dashboard is **built** but not deployed.

---

## 🎯 3 Ways to Deploy the Dashboard

### **Option 1: Update Wrangler & Deploy (Recommended)**

Your Wrangler is outdated (v3.114.14, latest is v4.41.0). This might be causing the hang.

```bash
# Update Wrangler globally
bun install -g wrangler@latest

# Then deploy
cd apps/dashboard
wrangler pages deploy dist --project-name=telegram-affiliate-dashboard
```

---

### **Option 2: Deploy via Cloudflare Dashboard (GUI - Easiest)**

**Step-by-step:**

1. **Go to Cloudflare Dashboard:**
   - https://dash.cloudflare.com/
   - Login with your account

2. **Navigate to Pages:**
   - Click **"Workers & Pages"** in left sidebar
   - Click **"Create Application"**
   - Select **"Pages"** tab
   - Click **"Upload assets"**

3. **Upload Files:**
   - Project name: `telegram-affiliate-dashboard`
   - Drag and drop: `apps/dashboard/dist` folder
   - Or zip it: `cd apps/dashboard && zip -r dashboard.zip dist/*`

4. **Deploy:**
   - Click **"Deploy site"**
   - Wait for deployment (30-60 seconds)
   - Your URL will be: `https://telegram-affiliate-dashboard.pages.dev`

5. **Environment Variables (Optional):**
   - Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://telegram-affiliate-api.nolarose1968-806.workers.dev/api`
   - (Already set in build, but good to have)

---

### **Option 3: Deploy via GitHub Actions (Automated)**

We already have GitHub Actions configured, but let's ensure it works:

**Setup:**

1. **Add Cloudflare API Token to GitHub Secrets:**
   ```bash
   # Go to: https://dash.cloudflare.com/profile/api-tokens
   # Create token with "Cloudflare Pages - Edit" permissions
   # Copy the token
   
   # Then go to GitHub repo:
   # Settings → Secrets and Variables → Actions
   # New repository secret:
   #   Name: CLOUDFLARE_API_TOKEN
   #   Value: <your-token>
   ```

2. **Trigger Deployment:**
   ```bash
   # Just push to main
   git add .
   git commit -m "Trigger dashboard deployment"
   git push
   
   # GitHub Actions will:
   # 1. Build dashboard
   # 2. Deploy to Cloudflare Pages
   # 3. Report status
   ```

---

## 🔗 Integration After Deployment

Once deployed, update the bot to use the dashboard URL:

### Update Bot Command Handler

**File:** `src/api/handlers/affiliate.handler.ts`

```typescript
// Update dashboard button URL
bot.command('dashboard', async (ctx) => {
  await ctx.reply('📊 Open your Affiliate Dashboard:', {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '📊 Open Dashboard',
          url: 'https://telegram-affiliate-dashboard.pages.dev', // ← Update this
        },
      ]],
    },
  });
});
```

---

## 🎯 Current File Structure

```
apps/dashboard/
├── dist/                    ← READY TO DEPLOY
│   ├── index.html          (0.51 KB)
│   └── assets/
│       ├── index-xxx.css   (19.09 KB)
│       └── index-xxx.js    (161.69 KB)
│   Total: 242.69 KB (gzipped: 89.84 KB)
│
├── src/                     ← Source code
├── vite.config.ts          ← ✅ Updated with Worker API URL
└── package.json
```

---

## ✅ What's Already Configured

1. **API Integration:**
   - Dashboard points to: `https://telegram-affiliate-api.nolarose1968-806.workers.dev/api`
   - Set in `vite.config.ts`

2. **Telegram WebApp SDK:**
   - Authentication ready
   - `initData` passed to API

3. **Build Optimized:**
   - Code splitting
   - Gzip compression
   - Source maps

---

## 🐛 Troubleshooting Wrangler Hang

If Wrangler still hangs after update:

**Check logs:**
```bash
# Check for errors
cat ~/.wrangler/logs/wrangler-*.log | tail -n 50
```

**Try with more verbose output:**
```bash
cd apps/dashboard
WRANGLER_LOG=debug wrangler pages deploy dist --project-name=telegram-affiliate-dashboard
```

**Create project first:**
```bash
# Create the Pages project
wrangler pages project create telegram-affiliate-dashboard

# Then deploy
wrangler pages deploy dist --project-name=telegram-affiliate-dashboard
```

---

## 📊 Expected Result

After successful deployment:

```
✨ Success! Uploaded X files (Y seconds)

✨ Deployment complete! Take a peek over at
   https://telegram-affiliate-dashboard.pages.dev
```

**Then test:**
1. Open: https://telegram-affiliate-dashboard.pages.dev
2. Should see Vue dashboard
3. Open in Telegram: https://t.me/Firesupportcs_bot
4. Send: `/dashboard`
5. Click button → Opens Mini App

---

## 💡 My Recommendation

**Start with Option 2 (GUI Upload)** because:
- ✅ Fastest (5 minutes)
- ✅ No CLI issues
- ✅ Visual confirmation
- ✅ Can see deployment logs in UI

Then set up Option 3 (GitHub Actions) for future updates.

---

## 📝 Next Steps

1. Choose deployment method above
2. Deploy dashboard
3. Get the Pages URL
4. Update bot commands with URL
5. Test in Telegram
6. Celebrate! 🎉

---

**Current Status:**
- ✅ API: Deployed & Working
- ✅ Bot: Live & Responding
- ⚠️ Dashboard: Built, waiting for deployment
- 📊 Architecture: Complete with Mermaid flows
- 📖 Documentation: Comprehensive

**Missing:** Just the dashboard deployment! Pick an option above and let's get it live! 🚀

