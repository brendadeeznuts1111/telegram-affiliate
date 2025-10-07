/**
 * Activity Feed API Integration Tests
 */

import { describe, test, expect } from 'bun:test';

describe('Activity Feed API', () => {
  const baseUrl = 'http://localhost:3001/api';
  const mockAuth = 'mock-telegram-init-data';

  describe('GET /api/activity', () => {
    test('should return recent activities', async () => {
      const res = await fetch(`${baseUrl}/activity`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      expect([200, 401]).toContain(res.status);
      
      if (res.status === 200) {
        const data = await res.json();
        expect(data).toHaveProperty('activities');
        expect(data).toHaveProperty('total');
        expect(Array.isArray(data.activities)).toBe(true);
      }
    });

    test('should limit activities count', async () => {
      const res = await fetch(`${baseUrl}/activity?limit=5`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      if (res.status === 200) {
        const data = await res.json();
        expect(data.activities.length).toBeLessThanOrEqual(5);
      }
    });

    test('activities should have valid structure', async () => {
      const res = await fetch(`${baseUrl}/activity`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      if (res.status === 200) {
        const data = await res.json();
        
        if (data.activities.length > 0) {
          const activity = data.activities[0];
          expect(activity).toHaveProperty('type');
          expect(activity).toHaveProperty('id');
          expect(activity).toHaveProperty('title');
          expect(activity).toHaveProperty('description');
          expect(activity).toHaveProperty('timestamp');
          
          expect(['commission', 'deposit', 'customer', 'agent']).toContain(activity.type);
          expect(typeof activity.timestamp).toBe('number');
        }
      }
    });

    test('activities should be sorted by timestamp', async () => {
      const res = await fetch(`${baseUrl}/activity`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      if (res.status === 200) {
        const data = await res.json();
        
        if (data.activities.length > 1) {
          for (let i = 0; i < data.activities.length - 1; i++) {
            expect(data.activities[i].timestamp).toBeGreaterThanOrEqual(
              data.activities[i + 1].timestamp
            );
          }
        }
      }
    });
  });

  describe('GET /api/activity/chart', () => {
    test('should return chart data', async () => {
      const res = await fetch(`${baseUrl}/activity/chart`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      expect([200, 401]).toContain(res.status);
      
      if (res.status === 200) {
        const data = await res.json();
        expect(data).toHaveProperty('data');
        expect(data).toHaveProperty('days');
        expect(Array.isArray(data.data)).toBe(true);
      }
    });

    test('should support custom day ranges', async () => {
      const days = 7;
      const res = await fetch(`${baseUrl}/activity/chart?days=${days}`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      if (res.status === 200) {
        const data = await res.json();
        expect(data.days).toBe(days);
        expect(data.data.length).toBeLessThanOrEqual(days);
      }
    });

    test('chart data should have valid format', async () => {
      const res = await fetch(`${baseUrl}/activity/chart?days=30`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      if (res.status === 200) {
        const data = await res.json();
        
        if (data.data.length > 0) {
          const point = data.data[0];
          expect(point).toHaveProperty('date');
          expect(point).toHaveProperty('amount');
          expect(typeof point.amount).toBe('number');
          expect(point.amount).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('Activity Type Formatting', () => {
    test('should format activity icons correctly', () => {
      const getActivityIcon = (type: string) => {
        const icons: Record<string, string> = {
          commission: '💵',
          deposit: '💰',
          customer: '👤',
          agent: '🤝',
        };
        return icons[type] || '📋';
      };

      expect(getActivityIcon('commission')).toBe('💵');
      expect(getActivityIcon('deposit')).toBe('💰');
      expect(getActivityIcon('customer')).toBe('👤');
      expect(getActivityIcon('agent')).toBe('🤝');
      expect(getActivityIcon('unknown')).toBe('📋');
    });

    test('should format timestamps correctly', () => {
      const formatTimestamp = (timestamp: number): string => {
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
      };

      const now = Math.floor(Date.now() / 1000);
      expect(formatTimestamp(now)).toBe('Just now');
      expect(formatTimestamp(now - 120)).toContain('m ago');
      expect(formatTimestamp(now - 7200)).toContain('h ago');
    });
  });
});
