#!/usr/bin/env bun
/**
 * 🚀 One-Command Ship
 * 
 * Runs the complete deployment pipeline:
 * 1. Type check
 * 2. Lint
 * 3. Test
 * 4. Build
 * 5. Deploy staging
 * 6. Run E2E tests
 * 7. Deploy production
 * 
 * Usage: bun run ship [--skip-tests] [--staging-only]
 */

const args = process.argv.slice(2);
const skipTests = args.includes('--skip-tests');
const stagingOnly = args.includes('--staging-only');

interface StepResult {
  name: string;
  duration: number;
  success: boolean;
  output?: string;
}

const results: StepResult[] = [];

async function runStep(name: string, command: string): Promise<boolean> {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀 ${name}`);
  console.log(`${'='.repeat(70)}\n`);

  const start = Date.now();
  
  try {
    const proc = Bun.spawn(command.split(' '), {
      stdout: 'inherit',
      stderr: 'inherit',
    });

    const exitCode = await proc.exited;
    const duration = Date.now() - start;
    const success = exitCode === 0;

    results.push({ name, duration, success });

    if (success) {
      console.log(`\n✅ ${name} completed in ${(duration / 1000).toFixed(2)}s`);
    } else {
      console.error(`\n❌ ${name} failed after ${(duration / 1000).toFixed(2)}s`);
    }

    return success;
  } catch (error) {
    const duration = Date.now() - start;
    results.push({ name, duration, success: false });
    console.error(`\n❌ ${name} errored:`, error);
    return false;
  }
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║                    🚀 ONE-COMMAND SHIP 🚀                             ║
╚═══════════════════════════════════════════════════════════════════════╝

Starting deployment pipeline...
`);

  const startTime = Date.now();

  // Step 1: Type Check
  if (!await runStep('Type Check', 'bun run type-check')) {
    console.error('\n💥 Type check failed. Fix errors and try again.');
    process.exit(1);
  }

  // Step 2: Lint
  if (!await runStep('Lint', 'bun run lint')) {
    console.error('\n💥 Linting failed. Run `bun run format` to fix.');
    process.exit(1);
  }

  // Step 3: Tests
  if (!skipTests) {
    if (!await runStep('Unit Tests', 'bun run test')) {
      console.error('\n💥 Tests failed. Fix tests and try again.');
      process.exit(1);
    }
  } else {
    console.log('\n⚠️  Skipping tests (--skip-tests flag)');
  }

  // Step 4: Build
  if (!await runStep('Build', 'bun run build')) {
    console.error('\n💥 Build failed.');
    process.exit(1);
  }

  // Step 5: Deploy Staging
  if (!await runStep('Deploy Staging', 'bun run deploy:staging')) {
    console.error('\n💥 Staging deployment failed.');
    process.exit(1);
  }

  console.log('\n✅ Staging deployed successfully!');
  console.log('   API: https://telegram-affiliate-api-staging.workers.dev');
  console.log('   Dashboard: https://telegram-affiliate-dashboard-staging.pages.dev');

  if (stagingOnly) {
    console.log('\n🎯 Staging-only deployment complete!');
    printSummary(startTime);
    process.exit(0);
  }

  // Step 6: E2E Tests on Staging
  if (!skipTests) {
    console.log('\n⏳ Waiting 10s for staging to warm up...');
    await Bun.sleep(10000);

    if (!await runStep('E2E Tests (Staging)', 'bun run test:e2e')) {
      console.error('\n💥 E2E tests failed. Staging is live but not deploying to production.');
      process.exit(1);
    }
  }

  // Step 7: Deploy Production
  console.log('\n⚠️  Ready to deploy to PRODUCTION. Continue? (yes/no)');
  
  // In CI, auto-continue. In local, prompt.
  if (process.env.CI !== 'true') {
    const answer = prompt('Type "yes" to continue: ');
    if (answer?.toLowerCase() !== 'yes') {
      console.log('\n🛑 Production deployment cancelled.');
      process.exit(0);
    }
  }

  if (!await runStep('Deploy Production', 'bun run deploy:prod')) {
    console.error('\n💥 Production deployment failed.');
    process.exit(1);
  }

  console.log('\n✅ Production deployed successfully!');
  console.log('   API: https://telegram-affiliate-api.workers.dev');
  console.log('   Dashboard: https://telegram-affiliate-dashboard.pages.dev');

  printSummary(startTime);
}

function printSummary(startTime: number) {
  const totalDuration = Date.now() - startTime;

  console.log(`
${'='.repeat(70)}
📊 DEPLOYMENT SUMMARY
${'='.repeat(70)}
`);

  results.forEach(({ name, duration, success }) => {
    const icon = success ? '✅' : '❌';
    const time = (duration / 1000).toFixed(2);
    console.log(`${icon} ${name.padEnd(30)} ${time}s`);
  });

  console.log(`\n⏱️  Total Time: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`✅ Successful: ${results.filter(r => r.success).length}/${results.length}`);
  
  if (results.every(r => r.success)) {
    console.log(`\n🎉 ALL SYSTEMS GO! Deployment complete!`);
  }

  console.log(`\n${'='.repeat(70)}\n`);
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

