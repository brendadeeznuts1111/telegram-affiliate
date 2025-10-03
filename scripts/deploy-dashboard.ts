#!/usr/bin/env bun

/**
 * Deploy Dashboard to Cloudflare Pages
 * 
 * This script builds and deploys the Vue 3 dashboard to Cloudflare Pages
 */

console.log("🚀 Deploying Dashboard to Cloudflare Pages...\n");

// Step 1: Build the dashboard
console.log("📦 Building dashboard...");
const buildResult = Bun.spawnSync(["bun", "run", "build:ui"], {
  cwd: import.meta.dir + "/..",
  stdout: "inherit",
  stderr: "inherit",
});

if (buildResult.exitCode !== 0) {
  console.error("❌ Build failed!");
  process.exit(1);
}

console.log("✅ Build complete!\n");

// Step 2: Deploy to Cloudflare Pages
console.log("☁️  Deploying to Cloudflare Pages...");

const env = process.argv[2] || "prod";
const deployScript = env === "staging" ? "deploy:staging" : "deploy:prod";

const deployResult = Bun.spawnSync(["bun", "run", deployScript], {
  cwd: import.meta.dir + "/../apps/dashboard",
  stdout: "inherit",
  stderr: "inherit",
});

if (deployResult.exitCode !== 0) {
  console.error("❌ Deployment failed!");
  console.log("\n💡 Make sure you have:");
  console.log("   1. Cloudflare account set up");
  console.log("   2. Wrangler authenticated: bun x wrangler login");
  console.log("   3. Created Pages project: telegram-affiliate-dashboard");
  process.exit(1);
}

console.log("\n✅ Deployment successful!");
console.log("\n🌐 Your dashboard should be available at:");
console.log(`   https://telegram-affiliate-dashboard.pages.dev\n`);
console.log("💡 Add this URL to your GitHub repository About section!");

