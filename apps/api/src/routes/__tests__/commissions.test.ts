/**
 * Commission API Integration Tests
 */

import { describe, test, expect } from 'bun:test';

describe('Commission API', () => {
  const baseUrl = 'http://localhost:3001/api';
  const mockAuth = 'mock-telegram-init-data';

  describe('GET /api/commissions', () => {
    test('should return list of commissions', async () => {
      const res = await fetch(`${baseUrl}/commissions`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('commissions');
      expect(data).toHaveProperty('total');
      expect(Array.isArray(data.commissions)).toBe(true);
    });

    test('should filter by status', async () => {
      const res = await fetch(`${baseUrl}/commissions?status=pending`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      
      if (data.commissions.length > 0) {
        data.commissions.forEach((c: any) => {
          expect(c.status).toBe('pending');
        });
      }
    });

    test('should filter by level', async () => {
      const res = await fetch(`${baseUrl}/commissions?level=1`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      
      if (data.commissions.length > 0) {
        data.commissions.forEach((c: any) => {
          expect(c.level).toBe(1);
        });
      }
    });

    test('should support pagination', async () => {
      const res = await fetch(`${baseUrl}/commissions?limit=5&offset=0`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.limit).toBe(5);
      expect(data.offset).toBe(0);
      expect(data.commissions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/commissions/stats', () => {
    test('should return commission statistics', async () => {
      const res = await fetch(`${baseUrl}/commissions/stats`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('stats');
      expect(data.stats).toHaveProperty('total_earned');
      expect(data.stats).toHaveProperty('paid_out');
      expect(data.stats).toHaveProperty('pending');
      expect(data.stats).toHaveProperty('this_month');
      expect(data).toHaveProperty('by_level');
    });

    test('stats should have valid number types', async () => {
      const res = await fetch(`${baseUrl}/commissions/stats`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      const data = await res.json();
      expect(typeof data.stats.total_earned).toBe('number');
      expect(typeof data.stats.paid_out).toBe('number');
      expect(typeof data.stats.pending).toBe('number');
      expect(data.stats.total_earned).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/commissions/export', () => {
    test('should export commissions as CSV', async () => {
      const res = await fetch(`${baseUrl}/commissions/export`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      expect([200, 404]).toContain(res.status); // 404 if no data
      
      if (res.status === 200) {
        expect(res.headers.get('content-type')).toBe('text/csv');
        expect(res.headers.get('content-disposition')).toContain('attachment');
        
        const csv = await res.text();
        expect(csv).toContain('Commission ID'); // Header row
      }
    });
  });

  describe('GET /api/commissions/:id', () => {
    test('should return 404 for non-existent commission', async () => {
      const res = await fetch(`${baseUrl}/commissions/comm_nonexistent`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      expect(res.status).toBe(404);
    });
  });
});
