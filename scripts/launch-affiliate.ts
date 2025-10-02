#!/usr/bin/env bun
/**
 * Launch Affiliate Empire
 * One-command startup for the entire affiliate system
 */

import { spawn } from 'bun';
import { logger } from '../src/utils/logger';

const BANNER = `
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 TELEGRAM AFFILIATE EMPIRE LAUNCHER 🚀           ║
║                                                       ║
║   Starting your money-printing machine...            ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
`;

interface ProcessInfo {
  name: string;
  command: string;
  cwd?: string;
  env?: Record<string, string>;
}

const processes: ProcessInfo[] = [
  {
    name: '🤖 Telegram Bot',
    command: 'bun run dev:bot',
    cwd: process.cwd(),
  },
  {
    name: '⚡ API Server',
    command: 'bun run dev:api',
    cwd: process.cwd(),
  },
  {
    name: '🎨 Dashboard',
    command: 'bun run dev:ui',
    cwd: process.cwd(),
  },
];

console.log(BANNER);

async function validateEnvironment(): Promise<boolean> {
  console.log('🔍 Validating environment...\n');

  const requiredVars = [
    'BOT_TOKEN',
  ];

  const missing: string[] = [];
  
  for (const varName of requiredVars) {
    if (!Bun.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\n💡 Please set these in your .env file\n');
    return false;
  }

  console.log('✅ Environment validated\n');
  return true;
}

async function checkDatabase(): Promise<boolean> {
  console.log('🗄️  Checking database...\n');

  const dbPath = Bun.env.DATABASE_PATH || './data/affiliate_system.db';
  
  try {
    const file = Bun.file(dbPath);
    const exists = await file.exists();
    
    if (exists) {
      console.log(`✅ Database found at ${dbPath}\n`);
      return true;
    } else {
      console.log(`⚠️  Database not found at ${dbPath}`);
      console.log('   Run: bun scripts/init-database.ts\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to check database:', error);
    return false;
  }
}

async function displaySystemInfo() {
  console.log('📊 System Information:\n');
  console.log(`   • Bun Version: ${Bun.version}`);
  console.log(`   • Node Environment: ${Bun.env.NODE_ENV || 'development'}`);
  console.log(`   • Bot Token: ${Bun.env.BOT_TOKEN ? '✓ Set' : '✗ Not set'}`);
  console.log(`   • Database: ${Bun.env.DATABASE_PATH || './data/affiliate_system.db'}`);
  console.log(`   • Server Port: ${Bun.env.PORT || '3000'}`);
  console.log('');
}

async function launchProcesses() {
  console.log('🚀 Starting all services...\n');

  const runningProcesses: any[] = [];

  for (const proc of processes) {
    console.log(`   ${proc.name}...`);
    
    try {
      const child = spawn({
        cmd: proc.command.split(' '),
        cwd: proc.cwd || process.cwd(),
        env: { ...process.env, ...proc.env },
        stdout: 'inherit',
        stderr: 'inherit',
        stdin: 'inherit',
      });

      runningProcesses.push({ name: proc.name, process: child });
      
      // Wait a bit between launches
      await Bun.sleep(1000);
    } catch (error) {
      console.error(`❌ Failed to start ${proc.name}:`, error);
    }
  }

  console.log('\n✅ All services started!\n');
  return runningProcesses;
}

function displayAccessInfo() {
  const apiPort = Bun.env.PORT || '3001';
  const dashboardPort = '5173';

  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  🎉 AFFILIATE EMPIRE IS LIVE!                        ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  console.log('📍 Access Points:\n');
  console.log(`   🤖 Telegram Bot:     https://t.me/${Bun.env.TELEGRAM_BOT_USERNAME || 'your_bot'}`);
  console.log(`   ⚡ API Server:        http://localhost:${apiPort}`);
  console.log(`   🎨 Dashboard:         http://localhost:${dashboardPort}`);
  console.log('');
  
  console.log('📚 Quick Commands:\n');
  console.log('   /start              - Start the bot (in Telegram)');
  console.log('   /dashboard          - View your earnings');
  console.log('   /qr                 - Generate QR code');
  console.log('   /withdraw           - Request withdrawal');
  console.log('   /super              - Super agent panel');
  console.log('');
  
  console.log('🔗 Affiliate Features:\n');
  console.log('   • QR Code Generation');
  console.log('   • Link Tracking & Analytics');
  console.log('   • Real-time Earnings Dashboard');
  console.log('   • USDT Withdrawals (TON/TRON)');
  console.log('   • Super Agent Override System');
  console.log('   • Broadcast to Downline');
  console.log('');
  
  console.log('💡 Press Ctrl+C to stop all services\n');
}

async function setupGracefulShutdown(processes: any[]) {
  const shutdown = async () => {
    console.log('\n\n🛑 Shutting down...\n');
    
    for (const { name, process } of processes) {
      console.log(`   Stopping ${name}...`);
      try {
        process.kill();
      } catch (error) {
        console.error(`   Failed to stop ${name}:`, error);
      }
    }
    
    console.log('\n✅ All services stopped. Goodbye! 👋\n');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function main() {
  try {
    // Display system info
    await displaySystemInfo();

    // Validate environment
    const envValid = await validateEnvironment();
    if (!envValid) {
      process.exit(1);
    }

    // Check database
    const dbValid = await checkDatabase();
    if (!dbValid) {
      console.log('❌ Please initialize the database first\n');
      process.exit(1);
    }

    // Launch all processes
    const runningProcesses = await launchProcesses();

    // Display access info
    displayAccessInfo();

    // Setup graceful shutdown
    await setupGracefulShutdown(runningProcesses);

    // Keep the process running
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Launch failed:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.main) {
  main();
}

