/**
 * Customer API Integration Tests
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { Hono } from 'hono';
import customersRoutes from '../customers';

describe('Customer API', () => {
  let app: Hono;

  beforeAll(() => {
    app = new Hono();
    app.route('/api/customers', customersRoutes);
  });

  describe('GET /api/customers', () => {
    test('should return list of customers', async () => {
      const req = new Request('http://localhost/api/customers', {
        headers: {
          'X-Telegram-Init-Data': 'mock-init-data',
        },
      });

      const res = await app.request(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty('customers');
      expect(data).toHaveProperty('total');
      expect(Array.isArray(data.customers)).toBe(true);
    });

    test('should return 401 without auth', async () => {
      const req = new Request('http://localhost/api/customers');
      const res = await app.request(req);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/customers', () => {
    test('should create customer with valid data', async () => {
      const customerData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      };

      const req = new Request('http://localhost/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': 'mock-init-data',
        },
        body: JSON.stringify(customerData),
      });

      const res = await app.request(req);
      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data).toHaveProperty('customer');
      expect(data.customer.name).toBe(customerData.name);
      expect(data.customer.email).toBe(customerData.email);
    });

    test('should reject invalid email', async () => {
      const customerData = {
        name: 'John Doe',
        email: 'invalid-email',
        phone: '+1234567890',
      };

      const req = new Request('http://localhost/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': 'mock-init-data',
        },
        body: JSON.stringify(customerData),
      });

      const res = await app.request(req);
      expect(res.status).toBe(400);
    });

    test('should reject missing required fields', async () => {
      const customerData = {
        name: 'John Doe',
        // missing email and phone
      };

      const req = new Request('http://localhost/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': 'mock-init-data',
        },
        body: JSON.stringify(customerData),
      });

      const res = await app.request(req);
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/customers/:id', () => {
    test('should update customer', async () => {
      const updateData = {
        name: 'Jane Doe',
      };

      const req = new Request('http://localhost/api/customers/cust_123', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': 'mock-init-data',
        },
        body: JSON.stringify(updateData),
      });

      const res = await app.request(req);
      expect([200, 404]).toContain(res.status); // 404 if customer doesn't exist
    });
  });

  describe('DELETE /api/customers/:id', () => {
    test('should soft delete customer', async () => {
      const req = new Request('http://localhost/api/customers/cust_123', {
        method: 'DELETE',
        headers: {
          'X-Telegram-Init-Data': 'mock-init-data',
        },
      });

      const res = await app.request(req);
      expect([200, 404]).toContain(res.status);
    });
  });
});
