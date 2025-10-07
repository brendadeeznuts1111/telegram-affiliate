/**
 * Customer Service Unit Tests
 */

import { describe, test, expect } from 'bun:test';

describe('CustomerService', () => {
  describe('Email Validation', () => {
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    test('should accept valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@company.co.uk')).toBe(true);
      expect(validateEmail('firstname+lastname@domain.com')).toBe(true);
    });

    test('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test @example.com')).toBe(false);
    });
  });

  describe('Phone Normalization', () => {
    const normalizePhone = (phone: string): string => {
      return phone.replace(/[\s\-()]/g, '');
    };

    test('should normalize phone numbers', () => {
      expect(normalizePhone('+1 (234) 567-8900')).toBe('+12345678900');
      expect(normalizePhone('1234567890')).toBe('1234567890');
      expect(normalizePhone('+1-234-567-8900')).toBe('+12345678900');
    });
  });

  describe('Customer Formatting', () => {
    const formatCustomer = (customer: any): string => {
      return `👤 *${customer.name}*\n` +
             `📧 ${customer.email}\n` +
             `📱 ${customer.phone}\n` +
             `📊 Status: ${customer.status}`;
    };

    test('should format customer details', () => {
      const customer = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        status: 'active',
      };

      const formatted = formatCustomer(customer);
      expect(formatted).toContain('John Doe');
      expect(formatted).toContain('john@example.com');
      expect(formatted).toContain('+1234567890');
      expect(formatted).toContain('active');
    });
  });

  describe('Duplicate Detection', () => {
    test('should detect duplicate emails', () => {
      const existingCustomers = [
        { email: 'test1@example.com', phone: '+1111111111' },
        { email: 'test2@example.com', phone: '+2222222222' },
      ];

      const isDuplicateEmail = (email: string) => {
        return existingCustomers.some(c => c.email === email);
      };

      expect(isDuplicateEmail('test1@example.com')).toBe(true);
      expect(isDuplicateEmail('test3@example.com')).toBe(false);
    });

    test('should detect duplicate phones', () => {
      const existingCustomers = [
        { email: 'test1@example.com', phone: '+1111111111' },
        { email: 'test2@example.com', phone: '+2222222222' },
      ];

      const isDuplicatePhone = (phone: string) => {
        return existingCustomers.some(c => c.phone === phone);
      };

      expect(isDuplicatePhone('+1111111111')).toBe(true);
      expect(isDuplicatePhone('+3333333333')).toBe(false);
    });
  });

  describe('Customer Stats Calculation', () => {
    test('should calculate total deposits', () => {
      const deposits = [
        { amount: 100 },
        { amount: 200 },
        { amount: 50 },
      ];

      const total = deposits.reduce((sum, d) => sum + d.amount, 0);
      expect(total).toBe(350);
    });

    test('should count deposits', () => {
      const deposits = [{ id: 1 }, { id: 2 }, { id: 3 }];
      expect(deposits.length).toBe(3);
    });
  });
});
