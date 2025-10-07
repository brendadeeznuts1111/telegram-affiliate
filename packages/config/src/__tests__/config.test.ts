/**
 * Configuration Tests
 * Tests the configuration management
 */

import { describe, test, expect } from 'bun:test';
import { getConfig } from '../index';

describe('Configuration', () => {
  describe('getConfig', () => {
    test('should parse valid environment variables', () => {
      const env = {
        BOT_TOKEN: 'test_bot_token_123',
        ADMIN_IDS: '123456789,987654321',
        DB_PATH: './test.db',
        API_PORT: '3001',
        ENVIRONMENT: 'development',
      };

      const config = getConfig(env);

      expect(config.bot.token).toBe('test_bot_token_123');
      expect(config.bot.adminIds).toEqual([123456789, 987654321]);
      expect(config.database.path).toBe('./test.db');
      expect(config.api.port).toBe(3001);
      expect(config.env).toBe('development');
    });

    test('should use default values for optional fields', () => {
      const env = {
        BOT_TOKEN: 'test_token',
      };

      const config = getConfig(env);

      expect(config.env).toBe('development');
      expect(config.api.port).toBe(3001);
      expect(config.database.path).toBeDefined();
      expect(config.commission.directRate).toBe(0.05);
    });

    test('should throw error for missing required fields', () => {
      const env = {};

      expect(() => getConfig(env)).toThrow();
    });

    test('should parse commission rates', () => {
      const env = {
        BOT_TOKEN: 'test_token',
        COMMISSION_DIRECT: '0.10',
        COMMISSION_SUPER: '0.03',
      };

      const config = getConfig(env);

      expect(config.commission.directRate).toBe(0.10);
      expect(config.commission.superAgentRate).toBe(0.03);
    });

    test('should parse CORS origins', () => {
      const env = {
        BOT_TOKEN: 'test_token',
        CORS_ORIGINS: 'http://localhost:3000,http://localhost:5173',
      };

      const config = getConfig(env);

      expect(config.api.corsOrigins).toEqual([
        'http://localhost:3000',
        'http://localhost:5173',
      ]);
    });
  });
});
