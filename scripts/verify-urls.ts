#!/usr/bin/env bun

/**
 * Verify all deployment URLs in documentation
 * 
 * This script checks that all documented URLs are actually accessible
 * Run this before updating README or GitHub About
 */

interface URLCheck {
  name: string;
  url: string;
  required: boolean;
}

const urls: URLCheck[] = [
  {
    name: "Dashboard (Production)",
    url: "https://telegram-affiliate-dashboard.pages.dev",
    required: false, // Optional until deployed
  },
  {
    name: "API (Production)",
    url: "https://telegram-affiliate-api.workers.dev",
    required: false, // Optional until deployed
  },
  {
    name: "GitHub Repository",
    url: "https://github.com/brendadeeznuts1111/telegram-affiliate",
    required: true, // Should always work
  },
];

console.log("🔍 Verifying deployment URLs...\n");

let allPassed = true;
const results: Array<{ name: string; status: string; code?: number }> = [];

for (const { name, url, required } of urls) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const passed = response.ok;
    const status = passed ? "✅ OK" : "❌ FAILED";
    
    results.push({
      name,
      status,
      code: response.status,
    });

    if (!passed && required) {
      allPassed = false;
    }

    console.log(`${status} ${name}`);
    console.log(`   ${url} (${response.status})`);
    
    if (!passed && required) {
      console.log(`   ⚠️  REQUIRED URL is not accessible!`);
    }
  } catch (error) {
    const status = "❌ ERROR";
    results.push({ name, status });
    
    console.log(`${status} ${name}`);
    console.log(`   ${url}`);
    console.log(`   Error: ${error instanceof Error ? error.message : "Failed to fetch"}`);
    
    if (required) {
      allPassed = false;
      console.log(`   ⚠️  REQUIRED URL is not accessible!`);
    }
  }
  console.log();
}

// Summary
console.log("━".repeat(60));
console.log("\n📊 Summary:\n");

Bun.inspect.table(results);

if (!allPassed) {
  console.log("\n❌ Some required URLs failed verification!");
  console.log("\n💡 Action required:");
  console.log("   1. Do not update README or GitHub About with broken URLs");
  console.log("   2. Deploy missing services first");
  console.log("   3. Re-run this script to verify");
  process.exit(1);
}

console.log("\n✅ All required URLs are accessible!");
console.log("\n💡 Optional URLs (not deployed) can be added after deployment");
console.log("   Run this script again after deploying to verify");

process.exit(0);

