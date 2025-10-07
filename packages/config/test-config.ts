#!/usr/bin/env bun
/**
 * Test script to verify configuration validation
 */

import { getConfig, validateConfig, printConfig } from './src/index';

console.log('🧪 Testing Configuration System\n');

// Test 1: Missing required variables
console.log('Test 1: Missing BOT_TOKEN (should fail)');
try {
  const validation = validateConfig({});
  if (!validation.valid) {
    console.log('✅ Correctly rejected invalid config');
    console.log('   Errors:', validation.errors[0].split('\n')[0]);
  }
} catch (error) {
  console.log('❌ Unexpected error:', error);
}

// Test 2: Valid configuration
console.log('\nTest 2: Valid configuration (should pass)');
try {
  const config = getConfig({
    BOT_TOKEN: 'test_bot_token_123',
    ADMIN_IDS: '123456789,987654321',
  });
  console.log('✅ Configuration validated successfully');
  console.log('   Environment:', config.env);
  console.log('   Bot admins:', config.bot.admins);
  console.log('   Commission rates:', `${config.commission.direct}% / ${config.commission.super}%`);
} catch (error) {
  console.log('❌ Failed:', error);
}

// Test 3: Print safe configuration
console.log('\nTest 3: Safe configuration output');
try {
  const config = getConfig({
    BOT_TOKEN: '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789',
    ADMIN_IDS: '123456789',
    PORT: '3002',
  });
  console.log('✅ Configuration (secrets hidden):');
  console.log(printConfig(config));
} catch (error) {
  console.log('❌ Failed:', error);
}

console.log('\n✨ Configuration system tests complete!\n');
