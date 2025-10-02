#!/usr/bin/env bun

/**
 * Comprehensive Setup Verification Script
 * Verifies all systems are ready for deployment
 */

import { logger } from '../src/utils/logger';
import { formatTable, setupSignalHandlers } from '../src/utils/cli-helpers';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: CheckResult[] = [];

// Helper functions
const info = (msg: string) => console.log(`ℹ️  ${msg}`);
const success = (msg: string) => console.log(`✅ ${msg}`);
const error = (msg: string) => console.log(`❌ ${msg}`);
const warn = (msg: string) => console.log(`⚠️  ${msg}`);

function addCheck(name: string, status: 'pass' | 'fail' | 'warn', message: string) {
  results.push({ name, status, message });
  
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${message}`);
}

async function verifyDependencies() {
  info('\n📦 Checking Dependencies...');
  
  try {
    const { execa } = await import('execa');
    
    // Check Bun version
    const bunVersion = Bun.version;
    addCheck('Bun Runtime', 'pass', `v${bunVersion}`);
    
    // Check node_modules (check for directory, not specific file, due to workspace symlinks)
    const { stat } = await import('node:fs/promises');
    
    try {
      await stat('/Users/nolarose/projects/telegram-affiliate/apps/api/node_modules');
      addCheck('API Dependencies', 'pass', 'Installed');
    } catch {
      addCheck('API Dependencies', 'fail', 'Missing - run: cd apps/api && bun install');
    }
    
    try {
      await stat('/Users/nolarose/projects/telegram-affiliate/apps/dashboard/node_modules');
      addCheck('Dashboard Dependencies', 'pass', 'Installed');
    } catch {
      addCheck('Dashboard Dependencies', 'warn', 'Missing - run: cd apps/dashboard && bun install');
    }
    
  } catch (e: any) {
    addCheck('Dependencies', 'fail', e.message);
  }
}

async function verifyConfiguration() {
  info('\n⚙️ Checking Configuration...');
  
  try {
    // Check wrangler.toml
    const wranglerToml = await Bun.file('/Users/nolarose/projects/telegram-affiliate/apps/api/wrangler.toml').text();
    
    const hasAccountId = wranglerToml.includes('account_id =');
    addCheck('Wrangler Account ID', hasAccountId ? 'pass' : 'warn', hasAccountId ? 'Configured' : 'Not set');
    
    const hasKvNamespace = wranglerToml.includes('AFFILIATE_KV');
    addCheck('KV Namespace', hasKvNamespace ? 'pass' : 'fail', hasKvNamespace ? 'Configured' : 'Missing');
    
    const hasNodejsCompat = wranglerToml.includes('nodejs_compat');
    addCheck('Node.js Compatibility', hasNodejsCompat ? 'pass' : 'fail', hasNodejsCompat ? 'Enabled' : 'Missing');
    
    // Check .env existence
    const envExists = await Bun.file('/Users/nolarose/projects/telegram-affiliate/.env').exists();
    addCheck('Environment File', envExists ? 'pass' : 'warn', envExists ? 'Found' : 'Missing - copy env.example');
    
  } catch (e: any) {
    addCheck('Configuration', 'fail', e.message);
  }
}

async function verifyDatabase() {
  info('\n🗄️ Checking Database...');
  
  try {
    const dbPath = '/Users/nolarose/projects/telegram-affiliate/data/affiliate_system.db';
    const dbExists = await Bun.file(dbPath).exists();
    
    if (dbExists) {
      const { Database } = await import('bun:sqlite');
      const db = new Database(dbPath);
      
      // Check tables
      const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all();
      addCheck('Database File', 'pass', `Found with ${tables.length} tables`);
      
      db.close();
    } else {
      addCheck('Database File', 'warn', 'Not found - run: bun scripts/init-database.ts');
    }
  } catch (e: any) {
    addCheck('Database', 'fail', e.message);
  }
}

async function verifyAPIStructure() {
  info('\n🔌 Checking API Structure...');
  
  try {
    // Check critical files
    const files = [
      { path: 'apps/api/src/index.ts', name: 'Local Entry Point' },
      { path: 'apps/api/src/index-worker.ts', name: 'Worker Entry Point' },
      { path: 'apps/api/src/routes/affiliate/index.ts', name: 'Affiliate Routes' },
      { path: 'apps/api/src/routes/affiliate/qr.ts', name: 'QR Routes' },
      { path: 'apps/api/src/middleware/telegram.ts', name: 'Auth Middleware' },
      { path: 'apps/api/src/utils/error-handling.ts', name: 'Error Handler' },
    ];
    
    for (const file of files) {
      const exists = await Bun.file(`/Users/nolarose/projects/telegram-affiliate/${file.path}`).exists();
      addCheck(file.name, exists ? 'pass' : 'fail', exists ? 'Found' : 'Missing');
    }
  } catch (e: any) {
    addCheck('API Structure', 'fail', e.message);
  }
}

async function verifyCLIUtilities() {
  info('\n🛠️ Checking CLI Utilities (Cursor Rules)...');
  
  try {
    const files = [
      { path: 'src/utils/cli-helpers.ts', name: 'CLI Helpers (Bun.inspect.table, signal handling)' },
      { path: 'src/utils/secure-tokens.ts', name: 'Secure Tokens (Bun.password.hash)' },
      { path: 'src/utils/safe-paths.ts', name: 'Safe Paths (import.meta.resolve)' },
      { path: 'scripts/demo-cli-features.ts', name: 'CLI Demo Script' },
    ];
    
    for (const file of files) {
      const exists = await Bun.file(`/Users/nolarose/projects/telegram-affiliate/${file.path}`).exists();
      addCheck(file.name, exists ? 'pass' : 'fail', exists ? '✅' : 'Missing');
    }
  } catch (e: any) {
    addCheck('CLI Utilities', 'fail', e.message);
  }
}

async function verifyGitHubSetup() {
  info('\n🚀 Checking GitHub Setup...');
  
  try {
    const workflows = [
      'bun-ci.yml',
      'docker.yml',
      'cloudflare-deploy.yml',
      'codeql.yml',
      'release.yml',
    ];
    
    for (const workflow of workflows) {
      const exists = await Bun.file(`/Users/nolarose/projects/telegram-affiliate/.github/workflows/${workflow}`).exists();
      addCheck(`Workflow: ${workflow}`, exists ? 'pass' : 'warn', exists ? 'Found' : 'Missing');
    }
    
    const dependabotExists = await Bun.file('/Users/nolarose/projects/telegram-affiliate/.github/dependabot.yml').exists();
    addCheck('Dependabot', dependabotExists ? 'pass' : 'warn', dependabotExists ? 'Configured' : 'Missing');
    
  } catch (e: any) {
    addCheck('GitHub Setup', 'fail', e.message);
  }
}

async function generateSummary() {
  info('\n📊 Summary Report:');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warned = results.filter(r => r.status === 'warn').length;
  const total = results.length;
  
  console.log(`\n┌─────────────────────────────────────┐`);
  console.log(`│  Total Checks: ${total.toString().padEnd(19)} │`);
  console.log(`│  ✅ Passed: ${passed.toString().padEnd(22)} │`);
  console.log(`│  ❌ Failed: ${failed.toString().padEnd(22)} │`);
  console.log(`│  ⚠️  Warnings: ${warned.toString().padEnd(19)} │`);
  console.log(`└─────────────────────────────────────┘`);
  
  const score = Math.round((passed / total) * 100);
  console.log(`\n🎯 Setup Score: ${score}%`);
  
  if (score === 100) {
    success('\n🏆 Perfect! All checks passed!');
  } else if (score >= 80) {
    success('\n✅ Good! System is mostly ready.');
  } else if (score >= 60) {
    warn('\n⚠️  Some issues need attention.');
  } else {
    error('\n❌ Critical issues found. Please fix before deploying.');
  }
  
  // Show failed checks
  if (failed > 0) {
    error('\n❌ Failed Checks:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`   • ${r.name}: ${r.message}`);
    });
  }
  
  // Show warnings
  if (warned > 0) {
    warn('\n⚠️  Warnings:');
    results.filter(r => r.status === 'warn').forEach(r => {
      console.log(`   • ${r.name}: ${r.message}`);
    });
  }
}

async function main() {
  console.log(`
┌───────────────────────────────────────────┐
│  🔍 Telegram Affiliate Setup Verifier     │
├───────────────────────────────────────────┤
│  Checking all systems...                  │
└───────────────────────────────────────────┘
  `);
  
  await verifyDependencies();
  await verifyConfiguration();
  await verifyDatabase();
  await verifyAPIStructure();
  await verifyCLIUtilities();
  await verifyGitHubSetup();
  await generateSummary();
  
  console.log(`\n💡 For detailed documentation, see:`);
  console.log(`   • FINAL-SUMMARY.md`);
  console.log(`   • CURSOR-RULES-100-PERCENT.md`);
  console.log(`   • GITHUB-SETUP-COMPLETE.md`);
  console.log(``);
}

// Signal handling
setupSignalHandlers(async () => {
  console.log('\n🛑 Verification cancelled.');
  process.exit(0);
});

main().catch((e) => {
  error(`\n❌ Verification failed: ${e.message}`);
  process.exit(1);
});

