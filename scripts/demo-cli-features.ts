#!/usr/bin/env bun

/**
 * Demo script showcasing all CLI utilities
 * Demonstrates best practices for Cursor rules compliance
 */

import {
  setupSignalHandlers,
  formatTable,
  debug,
  parseArgs,
  Spinner,
  showProgress,
  formatError,
  success,
  warning,
  info,
  box,
} from '../src/utils/cli-helpers';
import {
  generateSecureHash,
  verifySecureHash,
  generateSecureToken,
  generateApiKey,
} from '../src/utils/secure-tokens';
import {
  validatePath,
  resolveProjectPath,
  safeFileExists,
} from '../src/utils/safe-paths';

// Setup signal handlers for graceful shutdown
setupSignalHandlers(async () => {
  console.log('🧹 Cleaning up...');
  await new Promise((resolve) => setTimeout(resolve, 500));
});

// Parse CLI arguments
const args = parseArgs(process.argv.slice(2));
debug('Parsed arguments:', args);

async function main() {
  box(
    'CLI Utilities Demo\nShowcasing Bun-native best practices',
    '🎯 Cursor Rules Compliance'
  );

  // 1. Demonstrate formatTable with Bun.inspect.table
  console.log('\n1️⃣  Data Formatting with Bun.inspect.table:');
  const users = [
    { id: 1, name: 'Alice', commission: 1250.5, customers: 10 },
    { id: 2, name: 'Bob', commission: 890.25, customers: 7 },
    { id: 3, name: 'Charlie', commission: 2100.0, customers: 15 },
  ];
  formatTable(users, ['id', 'name', 'commission', 'customers']);

  // 2. Demonstrate Bun.password.hash for secure tokens
  console.log('\n2️⃣  Secure Token Generation with Bun.password.hash:');
  const spinner1 = new Spinner('Generating secure API key...');
  spinner1.start();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  const { key, hash } = await generateApiKey('tgaf');
  spinner1.success('API key generated!');
  info(`Key: ${key.slice(0, 20)}...`);
  debug(`Hash: ${hash.slice(0, 40)}...`);

  // 3. Demonstrate import.meta.resolve for path validation
  console.log('\n3️⃣  Safe Path Validation with import.meta.resolve:');
  const testPaths = [
    'package.json',
    '../../../etc/passwd', // Should fail
    'data/affiliate_system.db',
    './script/../../../etc/hosts', // Should fail
  ];

  for (const testPath of testPaths) {
    const validation = validatePath(testPath);
    if (validation.safe) {
      success(`✓ Safe: ${testPath}`);
    } else {
      warning(`✗ Unsafe: ${testPath} - ${validation.error}`);
    }
  }

  // 4. Demonstrate signal handling and progress
  console.log('\n4️⃣  Progress Tracking:');
  const total = 50;
  for (let i = 0; i <= total; i++) {
    showProgress(i, total, 'Processing');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  success('Processing complete!');

  // 5. Demonstrate debug logging (only shows if --debug or -g flag)
  console.log('\n5️⃣  Debug Logging (use --debug or -g to see):');
  debug('This is a debug message - only visible with --debug flag');
  debug('Current args:', args);
  info('Normal info messages always show');

  // 6. Demonstrate error formatting
  console.log('\n6️⃣  Error Formatting:');
  try {
    throw new Error('Demo error for formatting');
  } catch (error) {
    console.log(formatError(error as Error, 'demo function'));
  }

  // 7. Demonstrate secure hash verification
  console.log('\n7️⃣  Password Hash Verification:');
  const password = 'SecurePassword123!';
  const spinner2 = new Spinner('Hashing password...');
  spinner2.start();
  const passwordHash = await generateSecureHash(password);
  spinner2.success('Password hashed!');

  const isValid = await verifySecureHash(passwordHash, password);
  const isInvalid = await verifySecureHash(passwordHash, 'WrongPassword');

  success(`Correct password verification: ${isValid}`);
  warning(`Wrong password verification: ${isInvalid}`);

  // 8. Demonstrate file operations
  console.log('\n8️⃣  Safe File Operations:');
  const packagePath = resolveProjectPath('package.json');
  if (packagePath) {
    const exists = await safeFileExists(packagePath);
    success(`package.json exists: ${exists}`);
  }

  // Summary
  box(
    'All features demonstrated!\n\n' +
      '✅ Bun.inspect.table for data formatting\n' +
      '✅ Bun.password.hash for secure tokens\n' +
      '✅ import.meta.resolve for safe paths\n' +
      '✅ Signal handling for graceful shutdown\n' +
      '✅ Progress tracking and spinners\n' +
      '✅ Debug logging with --debug/-g flag',
    '🎉 Demo Complete'
  );

  console.log('\n💡 Try running with --debug or -g flag to see debug output!\n');
}

// Run the demo
main().catch((error) => {
  console.error(formatError(error, 'main'));
  process.exit(1);
});

