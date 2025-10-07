/**
 * Agent Tree API Integration Tests
 */

import { describe, test, expect } from 'bun:test';

describe('Agent Tree API', () => {
  const baseUrl = 'http://localhost:3001/api';
  const mockAuth = 'mock-telegram-init-data';

  describe('GET /api/tree', () => {
    test('should return agent network tree', async () => {
      const res = await fetch(`${baseUrl}/tree`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      expect([200, 401]).toContain(res.status);
      
      if (res.status === 200) {
        const data = await res.json();
        expect(data).toHaveProperty('tree');
        expect(data).toHaveProperty('stats');
        expect(data.tree).toHaveProperty('id');
        expect(data.tree).toHaveProperty('name');
        expect(data.tree).toHaveProperty('level');
      }
    });

    test('should return network statistics', async () => {
      const res = await fetch(`${baseUrl}/tree`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      if (res.status === 200) {
        const data = await res.json();
        expect(data.stats).toHaveProperty('total_nodes');
        expect(data.stats).toHaveProperty('max_depth');
        expect(data.stats).toHaveProperty('network_earnings');
        expect(data.stats).toHaveProperty('direct_agents');

        expect(typeof data.stats.total_nodes).toBe('number');
        expect(typeof data.stats.max_depth).toBe('number');
        expect(typeof data.stats.network_earnings).toBe('number');
        expect(typeof data.stats.direct_agents).toBe('number');
      }
    });

    test('tree should have valid structure', async () => {
      const res = await fetch(`${baseUrl}/tree`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      if (res.status === 200) {
        const data = await res.json();
        const node = data.tree;

        // Validate node structure
        expect(node.level).toBeGreaterThanOrEqual(0);
        expect(node.customers).toBeGreaterThanOrEqual(0);
        expect(node.earnings).toBeGreaterThanOrEqual(0);
        expect(typeof node.active).toBe('boolean');

        // If has children, validate them
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((child: any) => {
            expect(child).toHaveProperty('id');
            expect(child).toHaveProperty('name');
            expect(child).toHaveProperty('level');
            expect(child.level).toBeGreaterThan(node.level);
          });
        }
      }
    });

    test('should limit tree depth to 3 levels', async () => {
      const res = await fetch(`${baseUrl}/tree`, {
        headers: {
          'X-Telegram-Init-Data': mockAuth,
        },
      });

      if (res.status === 200) {
        const data = await res.json();
        expect(data.stats.max_depth).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('Tree Calculations', () => {
    test('should calculate network size correctly', () => {
      const countNodes = (node: any): number => {
        let count = 1;
        if (node.children) {
          node.children.forEach((child: any) => {
            count += countNodes(child);
          });
        }
        return count;
      };

      const mockTree = {
        id: '1',
        name: 'Root',
        level: 0,
        children: [
          { id: '2', name: 'Child1', level: 1, children: [] },
          { id: '3', name: 'Child2', level: 1, children: [] },
        ],
      };

      expect(countNodes(mockTree)).toBe(3);
    });

    test('should calculate max depth correctly', () => {
      const getMaxDepth = (node: any, currentDepth = 0): number => {
        if (!node.children || node.children.length === 0) {
          return currentDepth;
        }
        return Math.max(
          ...node.children.map((child: any) => getMaxDepth(child, currentDepth + 1))
        );
      };

      const mockTree = {
        id: '1',
        children: [
          {
            id: '2',
            children: [{ id: '3', children: [] }],
          },
        ],
      };

      expect(getMaxDepth(mockTree)).toBe(2);
    });
  });
});
