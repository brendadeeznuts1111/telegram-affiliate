# GitHub Actions Automated Deployment Setup

This guide walks you through setting up automated CI/CD deployments to Cloudflare.

## 🎯 What This Enables

- ✅ Automatic dashboard deployments on every push to `main`
- ✅ Automatic API deployments on every push to `main`
- ✅ Deployment URLs posted as commit comments
- ✅ No manual deployment needed ever again

## 📋 Prerequisites

- GitHub repository (✅ you have this)
- Cloudflare account (free tier works)
- 10 minutes of setup time

## Step 1: Get Cloudflare API Token

### 1.1 Login to Cloudflare Dashboard

Go to: https://dash.cloudflare.com/

### 1.2 Navigate to API Tokens

1. Click your profile icon (top right)
2. Select **"My Profile"**
3. Go to **"API Tokens"** tab
4. Click **"Create Token"**

### 1.3 Create Custom Token

Click **"Create Custom Token"**

**Configure permissions:**

```
Token name: GitHub Actions Deploy

Permissions:
  Account - Cloudflare Pages - Edit
  Account - Workers Scripts - Edit
  Account - Workers KV Storage - Edit
  Account - D1 - Edit

Account Resources:
  Include - All accounts
  
Zone Resources:
  (Leave default or select specific zones)

Client IP Address Filtering:
  (Leave blank for now)

TTL:
  (Leave default or set expiration)
```

**Click "Continue to summary"** → **"Create Token"**

### 1.4 Copy Your Token

⚠️ **IMPORTANT:** Copy the token immediately! You won't be able to see it again.

```
Example: rJ8x...your-token-here...9k3L
```

**Save it temporarily** - you'll add it to GitHub in Step 2.

## Step 2: Get Cloudflare Account ID

### 2.1 Go to Workers & Pages

From Cloudflare Dashboard:
1. Click **"Workers & Pages"** in the left sidebar
2. Or go directly to: https://dash.cloudflare.com/?to=/:account/workers-and-pages

### 2.2 Find Account ID

Look at the URL in your browser:

```
https://dash.cloudflare.com/[ACCOUNT_ID]/workers-and-pages
                            ^^^^^^^^^^^
                            This is your Account ID
```

Or:

1. Click **"Overview"** in Workers & Pages
2. Scroll down to **"Account ID"** on the right sidebar
3. Click to copy

**Example Account ID:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

**Save it temporarily** - you'll add it to GitHub in Step 2.

## Step 3: Add Secrets to GitHub

### 3.1 Navigate to Repository Settings

1. Go to your GitHub repository
2. Click **"Settings"** tab
3. In left sidebar: **"Secrets and variables"** → **"Actions"**

### 3.2 Add Cloudflare API Token

Click **"New repository secret"**

```
Name: CLOUDFLARE_API_TOKEN
Secret: [paste your token from Step 1.4]
```

Click **"Add secret"**

### 3.3 Add Cloudflare Account ID

Click **"New repository secret"** again

```
Name: CLOUDFLARE_ACCOUNT_ID
Secret: [paste your account ID from Step 2.2]
```

Click **"Add secret"**

### 3.4 Verify Secrets

You should now see:
- ✅ `CLOUDFLARE_API_TOKEN`
- ✅ `CLOUDFLARE_ACCOUNT_ID`

## Step 4: Trigger First Deployment

### Option A: Make a Small Change

Edit any file in `apps/dashboard/` or `apps/api/`:

```bash
# Example: Add a comment to trigger deployment
cd apps/dashboard/src
echo "// Trigger deployment" >> App.vue

git add -A
git commit -m "chore: trigger initial deployment"
git push origin main
```

### Option B: Manually Trigger Workflow

1. Go to **"Actions"** tab in GitHub
2. Select **"Deploy Dashboard to Cloudflare Pages"** or **"Deploy API to Cloudflare Workers"**
3. Click **"Run workflow"** dropdown
4. Click **"Run workflow"** button

## Step 5: Monitor Deployment

### 5.1 Watch GitHub Actions

1. Go to **"Actions"** tab
2. Click on the running workflow
3. Watch the deployment progress (takes 2-5 minutes)

### 5.2 Check for Success

Look for:
- ✅ Green checkmark next to workflow
- ✅ Comment on commit with deployment URL
- ✅ "Deploy to Cloudflare Pages" step completed

### 5.3 Get Deployment URL

**Dashboard URL pattern:**
```
https://telegram-affiliate-dashboard.pages.dev
```

**API URL pattern:**
```
https://telegram-affiliate-api.[your-subdomain].workers.dev
```

Check the workflow logs or commit comment for the exact URL.

## Step 6: Verify Deployment

### 6.1 Run URL Verification Script

```bash
bun run scripts/verify-urls.ts
```

**Expected output:**
```
✅ OK Dashboard (Production)
   https://telegram-affiliate-dashboard.pages.dev (200)
```

### 6.2 Visit Your Dashboard

Open the dashboard URL in your browser and verify it loads.

### 6.3 Update README Status Table

Edit `README.md`:

```markdown
## 🌐 Deployment Status

| Service | Status | URL | Notes |
|---------|--------|-----|-------|
| **Dashboard** | ✅ Deployed | https://telegram-affiliate-dashboard.pages.dev | Auto-deploys on push |
| **API** | ✅ Deployed | https://telegram-affiliate-api.workers.dev | Auto-deploys on push |
```

Commit and push the changes.

## Step 7: Update GitHub About

### 7.1 Add Website to Repository

1. Go to your GitHub repository
2. Click ⚙️ gear next to **"About"**
3. Add:
   - **Website:** `https://telegram-affiliate-dashboard.pages.dev`
   - **Description:** Keep existing
   - **Topics:** Add any you haven't added yet
4. Click **"Save changes"**

### 7.2 Update package.json

```json
{
  "homepage": "https://telegram-affiliate-dashboard.pages.dev"
}
```

Commit and push.

## 🎉 Done! Automated Deployments Active

From now on:

✅ **Every push to `main`** automatically deploys  
✅ **Dashboard changes** → Auto-deploy to Pages  
✅ **API changes** → Auto-deploy to Workers  
✅ **Deployment URLs** posted as commit comments  
✅ **Preview deployments** for pull requests (Cloudflare automatic)  

## 🔧 Troubleshooting

### Workflow Fails with "Authentication Error"

**Problem:** API token is invalid or expired

**Solution:**
1. Generate new API token in Cloudflare
2. Update `CLOUDFLARE_API_TOKEN` secret in GitHub
3. Re-run workflow

### Workflow Fails with "Project not found"

**Problem:** Cloudflare Pages project doesn't exist yet

**Solution:**
First deployment creates the project automatically. Check that:
- Project name matches: `telegram-affiliate-dashboard`
- Account ID is correct
- API token has Pages permissions

### Deployment Succeeds but URL 404s

**Problem:** Build output directory incorrect

**Solution:**
Check `wrangler.toml`:
```toml
pages_build_output_dir = "dist"
```

Make sure `apps/dashboard/dist/` exists after build.

### Can't Access Deployment URL

**Problem:** DNS not propagated or build failed

**Solution:**
1. Wait 2-3 minutes for DNS propagation
2. Check workflow logs for build errors
3. Verify in Cloudflare Dashboard → Pages

## 🚀 Advanced: Preview Deployments

Cloudflare automatically creates preview URLs for pull requests:

**Format:** `https://[commit-hash].telegram-affiliate-dashboard.pages.dev`

**To use:**
1. Create a branch: `git checkout -b feature/my-feature`
2. Make changes and push
3. Open pull request
4. Cloudflare comments with preview URL
5. Test on preview before merging

## 📚 Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [GitHub Actions Docs](https://docs.github.com/actions)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## 🆘 Need Help?

1. Check workflow logs in GitHub Actions tab
2. Check Cloudflare Dashboard for deployment status
3. Review this guide's troubleshooting section
4. Check [Cloudflare Community](https://community.cloudflare.com/)

