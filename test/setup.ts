/**
 * Global test setup
 */

import { afterEach, beforeEach } from 'vitest';

beforeEach(() => {
  // Setup test environment
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  // Cleanup after each test
  // Clear any mocks or test data
});

