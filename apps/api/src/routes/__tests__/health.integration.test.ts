/**
 * Health API Integration Tests
 * Tests the health check endpoint
 */

import { describe, test, expect } from 'bun:test';
import { createApp } from '../../app';

describe('Health API', () => {
  const app = createApp();

  describe('GET /health', () => {
    test('should return health status', async () => {
      const res = await app.request('/health');

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('GET /health/ready', () => {
    test('should return readiness status', async () => {
      const res = await app.request('/health/ready');

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.ready).toBe(true);
    });
  });

  describe('GET /health/live', () => {
    test('should return liveness status', async () => {
      const res = await app.request('/health/live');

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.alive).toBe(true);
    });
  });
});
