/**
 * Schema Validation Tests
 * Tests Zod schemas for validation
 */

import { describe, test, expect } from 'bun:test';
import {
  userSchema,
  createUserSchema,
  customerSchema,
  commissionSchema,
  depositSchema,
} from '../index';

describe('Schemas', () => {
  describe('userSchema', () => {
    test('should validate correct user data', () => {
      const validUser = {
        user_id: 123456789,
        username: 'john_doe',
        first_name: 'John',
        last_name: 'Doe',
        is_agent: 1,
        is_super_agent: 0,
        parent_agent_id: null,
        created_at: 1704067200,
      };

      const result = userSchema.safeParse(validUser);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user_id).toBe(123456789);
        expect(result.data.username).toBe('john_doe');
      }
    });

    test('should reject invalid user data', () => {
      const invalidUser = {
        user_id: 'not a number', // Wrong type
        first_name: '', // Empty string
      };

      const result = userSchema.safeParse(invalidUser);

      expect(result.success).toBe(false);
    });
  });

  describe('createUserSchema', () => {
    test('should validate create user input', () => {
      const input = {
        user_id: 123,
        username: 'test',
        first_name: 'Test',
        last_name: 'User',
      };

      const result = createUserSchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });

  describe('customerSchema', () => {
    test('should validate customer data', () => {
      const customer = {
        customer_id: 1,
        customer_name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+1234567890',
        agent_id: 123,
        status: 'active',
        created_at: 1704067200,
      };

      const result = customerSchema.safeParse(customer);

      expect(result.success).toBe(true);
    });
  });

  describe('commissionSchema', () => {
    test('should validate commission data', () => {
      const commission = {
        commission_id: 1,
        agent_id: 123,
        customer_id: 456,
        amount: 50.00,
        percentage: 0.05,
        status: 'pending',
        created_at: 1704067200,
        paid_at: null,
      };

      const result = commissionSchema.safeParse(commission);

      expect(result.success).toBe(true);
    });
  });

  describe('depositSchema', () => {
    test('should validate deposit data', () => {
      const deposit = {
        deposit_id: 1,
        agent_id: 123,
        customer_id: 456,
        amount: 1000.00,
        currency: 'USD',
        created_at: 1704067200,
      };

      const result = depositSchema.safeParse(deposit);

      expect(result.success).toBe(true);
    });
  });
});
